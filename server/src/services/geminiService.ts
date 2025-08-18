import { GoogleGenerativeAI } from '@google/generative-ai';
import pdf from 'pdf-parse';
import fs from 'fs';
import { parseJsonFromText } from '../utils/jsonUtils';

// --- Initialize the AI Client ---
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY is missing.");

const genAI = new GoogleGenerativeAI(apiKey);
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
    const result = await model.generateContent(prompt);
    const rawText = result.response.text();
    const parsedResult = parseJsonFromText(rawText);

    if (!parsedResult || !parsedResult.checklist || !Array.isArray(parsedResult.checklist)) {
      throw new Error("The AI response did not contain a valid 'checklist' array.");
    }
    return parsedResult.checklist;
  } catch (error: any) {
    console.error("!!! CRITICAL ERROR in generateChecklistFromSrs !!!", error);
    throw error;
  }
};

// --- Main Analysis Function (Updated with more forceful prompts) ---
export const analyzeProject = async (
  fileContents: Record<string, string>,
  checklist: any[]
) => {
  const fileIssues: Record<string, any> = {};

  let fullCodeContext = '';
  for (const filePath in fileContents) {
    fullCodeContext += `\n--- File: ${filePath} ---\n${fileContents[filePath]}\n`;
  }

  console.log('[Agent] Starting comprehensive code audit...');
  const combinedRequirements = checklist.map(item => `- ${item.text}`).join('\n');

  const analysisPrompt = `
    You are a world-class code auditor. Your primary goal is to find bugs and compliance issues. Be extremely critical.

    **ANALYSIS TASKS (Perform BOTH):**

    **Task 1: SRS Compliance Audit**
    Verify the entire codebase against the following requirements:
    ${combinedRequirements}

    **Task 2: General Code Quality Audit**
    Independently scrutinize the entire codebase for common errors: null pointer exceptions, security vulnerabilities (like hardcoded secrets), inefficient code, and lack of error handling.

    **OUTPUT INSTRUCTIONS:**
    Your final answer MUST be a single JSON object with a key "issues", containing an array of all problems you found. For each issue, you must provide the complete file content for both the original and suggested code.

    **JSON OUTPUT FORMAT (VERY IMPORTANT):**
    {
      "issues": [
        {
          "filePath": "<string, the full path to the problematic file>",
          "issue": "<string, a concise description of the bug or compliance violation>",
          "originalCode": "<string, the ENTIRE, UNCHANGED content of the problematic file>",
          "suggestedCode": "<string, the ENTIRE content of the file with the fix APPLIED. Do not add comments like '// fix for issue'. Just provide the complete, corrected code.>"
        }
      ]
    }
  `;

  try {
    const result = await model.generateContent([analysisPrompt, fullCodeContext]);
    const rawText = result.response.text();
    const analysisJson = parseJsonFromText(rawText);
    
    if (analysisJson && analysisJson.issues && Array.isArray(analysisJson.issues)) {
      for (const issue of analysisJson.issues) {
        if (issue.filePath && fileContents[issue.filePath]) {
          // Because the AI now provides the full original code, we don't need to add it ourselves.
          // We only care about the issue description and the full suggested code.
          fileIssues[issue.filePath] = {
            issue: issue.issue,
            suggestion: issue.suggestedCode,
          };
        }
      }
    }
  } catch(error) {
      console.error(`Error during comprehensive analysis:`, error);
  }

  const updatedChecklist = checklist.map(item => {
      const isCompliant = !Object.values(fileIssues).some((issue: any) => 
          item.text.split(' ').some((keyword: string) => keyword.length > 3 && issue.issue.includes(keyword))
      );
      return { ...item, compliant: isCompliant };
  });

  return { checklist: updatedChecklist, fileIssues, fileContents };
};


// --- Chatbot Conversation Handler (Unchanged) ---
export const getChatResponse = async (userMessage: string, history: any[]) => {
  const chatModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
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