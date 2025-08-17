import { FunctionDeclaration, SchemaType } from '@google/generative-ai';

export class SequentialThinkingMcp {
  // This MCP's primary job is to define the "createPlan" tool.
  // The actual execution of the plan happens in the geminiService orchestrator.
  
  static getToolSpec(): FunctionDeclaration {
    return {
      name: 'createPlan',
      description: 'Breaks down a complex requirement into a sequence of simple, executable steps using other available tools (like readFile, fetchContent). Use this for any requirement that involves multiple files or concepts.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          plan: {
            type: SchemaType.ARRAY,
            description: 'An array of strings, where each string is a clear, single step to be executed in order.',
            items: {
              type: SchemaType.STRING,
            }
          },
        },
        required: ['plan'],
      },
    };
  }
}