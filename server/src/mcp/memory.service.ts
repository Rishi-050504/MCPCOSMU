import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { FilesystemMcp } from './filesystem.service';

// Interface for our structured memory
interface CodeSummary {
  exports: string[];
  // In a more advanced version, you could add imports, function signatures, etc.
}

export class MemoryMcp {
  private memory: Map<string, CodeSummary> = new Map();
  private isBuilt: boolean = false;

  constructor(private filesystemMcp: FilesystemMcp) {}

  /**
   * Builds the initial memory map by reading all files and creating summaries.
   * This should be called once per analysis session.
   */
  async buildMemory(): Promise<void> {
    if (this.isBuilt) return;

    console.log('[MemoryMCP] Building project memory map...');
    const allFiles = await this.filesystemMcp.getAllFileContents();
    
    for (const filePath in allFiles) {
      const content = allFiles[filePath];
      // A simple parser to find exported functions/classes/variables
      const exports = (content.match(/export (const|function|class) (\w+)/g) || [])
        .map(line => line.split(' ')[2]);
      
      this.memory.set(filePath, { exports });
    }
    
    this.isBuilt = true;
    console.log('[MemoryMCP] Memory map built successfully.');
  }

  /**
   * Allows the AI to query the memory map to get context about the codebase.
   * @param filePath The file path to query for information.
   * @returns A summary of the requested file.
   */
  async queryMemory(filePath: string): Promise<CodeSummary | { error: string }> {
    if (!this.isBuilt) {
      await this.buildMemory();
    }

    if (this.memory.has(filePath)) {
      console.log(`[MemoryMCP] AI queried memory for: ${filePath}`);
      return this.memory.get(filePath)!;
    } else {
      return { error: `File path '${filePath}' not found in memory.` };
    }
  }

  static getToolSpec(): FunctionDeclaration {
    return {
      name: 'queryCodebaseMemory',
      description: 'Retrieves a summary of a specific file from the codebase memory, such as its exported functions or classes. Use this to understand the overall project structure before analyzing a file in detail.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          filePath: {
            type: SchemaType.STRING,
            description: 'The relative path of the file to query.',
          },
        },
        required: ['filePath'],
      },
    };
  }
}