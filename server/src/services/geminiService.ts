import { GoogleGenerativeAI, Part, Tool } from '@google/generative-ai';
import pdf from 'pdf-parse';
import fs from 'fs';
import path from 'path';
import { FilesystemMcp } from '../mcp/filesystem.service';
import { FetchMcp } from '../mcp/fetch.service';
import { MemoryMcp } from '../mcp/memory.service';
import { SequentialThinkingMcp } from '../mcp/sequentialThinking.service'; // <-- Import the final MCP

// --- Initialize the AI Client and All Tools ---
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY is missing.");

const genAI = new GoogleGenerativeAI(apiKey);

// Add all MCP tools to the agent's toolbox
const agentTools: Tool[] = [{
  functionDeclarations: [
    ...FilesystemMcp.getToolSpec(),
    FetchMcp.getToolSpec(),
    MemoryMcp.getToolSpec(),
    SequentialThinkingMcp.getToolSpec() // <-- Add the new tool
  ]
}];

const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// --- Checklist Generation (Unchanged) ---
export const generateChecklistFromSrs = async (files: Express.Multer.File[]): Promise<any[]> => {
  let combinedSrsText = '';
  for (const file of files) {
    const dataBuffer = fs.readFileSync(file.path);
    if (file.mimetype === 'application/pdf') {
      const pdfData = await pdf(dataBuffer);
      combinedSrsText += pdfData.text + '\n\n';
    } else if (file.mimetype === 'text/plain') {
      combinedSrsText += dataBuffer.toString('utf8') + '\n\n';
    }
  }

  if (!combinedSrsText || combinedSrsText.trim().length < 100) {
    throw new Error("The provided documents do not contain enough readable text.");
  }

  const prompt = `
    You are a senior software quality assurance analyst. Your task is to analyze the following Software Requirements Specification (SRS) text and generate a compliance checklist of the 10 most important requirements.
    The output MUST be a valid JSON object with a single key "checklist", holding an array of objects. Each object must have the following structure:
    { "id": <unique integer>, "text": "<the requirement text>", "compliant": false }
    Set "compliant" to false by default for all items. Do NOT include explanations or markdown formatting.
    SRS text:
    ---
    ${combinedSrsText.substring(0, 30000)}
    ---
  `;

  try {
    const generationModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await generationModel.generateContent(prompt);
    const rawText = result.response.text();
    const jsonStartIndex = rawText.indexOf('{');
    const jsonEndIndex = rawText.lastIndexOf('}') + 1;
    const jsonString = rawText.substring(jsonStartIndex, jsonEndIndex);
    const parsedResult = JSON.parse(jsonString);

    if (!parsedResult.checklist || !Array.isArray(parsedResult.checklist)) {
      throw new Error("The AI response did not contain a valid 'checklist' array.");
    }
    return parsedResult.checklist;
  } catch (error: any) {
    console.error("!!! CRITICAL ERROR in generateChecklistFromSrs !!!", error);
    throw error;
  }
};

// --- Main Agent-Based Analysis Function (Updated) ---
export const analyzeProjectWithAgent = async (filesystemMcp: FilesystemMcp, checklist: any[]) => {
  const fileIssues: Record<string, any> = {};
  const fetchMcp = new FetchMcp();
  const memoryMcp = new MemoryMcp(filesystemMcp);

  await memoryMcp.buildMemory();

  for (const item of checklist) {
    if (!item || !item.text) continue;
    const requirementText = item.text;
    console.log(`[Agent] Analyzing requirement: "${requirementText}"`);

    const chat = model.startChat({ tools: agentTools });

    // Updated prompt to encourage planning for complex tasks
    const prompt = `
      Your goal is to determine if the codebase complies with the requirement: "${requirementText}".
      You have access to a toolbox: 'listFiles', 'readFile', 'fetchContent', 'queryCodebaseMemory', and 'createPlan'.

      If the requirement is simple, use the tools directly.
      If the requirement is complex (involves multiple files, steps, or concepts), you MUST use the 'createPlan' tool first to outline your steps. I will then execute your plan for you.
      
      After completing your plan (or direct tool use), provide your final analysis in the required JSON format.
      JSON output format:
      {
        "isCompliant": <boolean>,
        "filePath": "<string>",
        "issue": "<string>",
        "originalCode": "<string>",
        "suggestedCode": "<string>"
      }
    `;

    let result = await chat.sendMessage(prompt);

    for (let i = 0; i < 10; i++) { // Max 10 steps in a plan
      const call = result.response.functionCalls()?.[0];
      if (!call) break;

      console.log(`[Agent] AI wants to call tool: ${call.name}`, call.args);
      let toolResult: Part | undefined;
      const args = call.args as { path?: string; url?: string; filePath?: string; plan?: string[] };

      try {
        if (call.name === 'createPlan') {
          // The AI has created a plan. We will now execute it.
          const plan = args.plan || [];
          console.log(`[Agent] AI created a plan with ${plan.length} steps. Executing...`);
          let planContext = "Executing plan. Here are the results of each step:\n";

          for (const step of plan) {
            // Ask the model how to execute a single step of its own plan
            const stepResult = await chat.sendMessage(`Now execute this step: "${step}"`);
            const stepCall = stepResult.response.functionCalls()?.[0];
            if (stepCall) {
              // Execute the tool for the current step and gather the result
              // (This is a simplified execution loop; a real implementation would be recursive)
              const stepArgs = stepCall.args as { path?: string; url?: string; filePath?: string; };
              if (stepCall.name === 'readFile') {
                  const content = await filesystemMcp.readFile(stepArgs.path || '');
                  planContext += `- Read file ${stepArgs.path}: ${content.substring(0, 200)}...\n`;
              } // ... handle other tools similarly
            }
          }
          toolResult = { functionResponse: { name: 'createPlan', response: { summary: planContext } } };

        } else if (call.name === 'listFiles') {
          const files = await filesystemMcp.listFiles(args.path || '.');
          toolResult = { functionResponse: { name: 'listFiles', response: { files } } };
        } else if (call.name === 'readFile') {
          const content = await filesystemMcp.readFile(args.path || '');
          toolResult = { functionResponse: { name: 'readFile', response: { content } } };
        } else if (call.name === 'fetchContent') {
          const content = await fetchMcp.fetchAndParseContent(args.url || '');
          toolResult = { functionResponse: { name: 'fetchContent', response: { content } } };
        } else if (call.name === 'queryCodebaseMemory') {
          const summary = await memoryMcp.queryMemory(args.filePath || '');
          toolResult = { functionResponse: { name: 'queryCodebaseMemory', response: { summary } } };
        }
      } catch (error: any) {
        toolResult = { functionResponse: { name: call.name, response: { error: error.message } } };
      }

      if (toolResult) {
        result = await chat.sendMessage([toolResult]);
      } else {
        break;
      }
    }

    const rawText = result.response.text();
    const jsonMatch = rawText.match(/{[\s\S]*}/);
    if (jsonMatch) {
      const analysisJson = JSON.parse(jsonMatch[0]);
      if (analysisJson && !analysisJson.isCompliant) {
        const filePath = analysisJson.filePath;
        if (filePath) {
          fileIssues[filePath] = {
            issue: analysisJson.issue,
            language: path.extname(filePath).substring(1),
            original: analysisJson.originalCode,
            suggestion: analysisJson.suggestedCode,
          };
        }
      }
    }
  }

  const fileContents = await filesystemMcp.getAllFileContents();
  return { checklist, fileIssues, fileContents };
};

// --- Chatbot Conversation Handler (Unchanged) ---
export const getChatResponse = async (userMessage: string, history: any[]) => {
  const chatModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const chat = chatModel.startChat({
    history: history,
    generationConfig: { maxOutputTokens: 200 },
  });

  try {
    const result = await chat.sendMessage(userMessage);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('[geminiService] Chatbot error:', error);
    return "I'm sorry, I encountered an error and can't respond right now.";
  }
};