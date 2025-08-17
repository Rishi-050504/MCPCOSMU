// server/src/mcp/filesystem.service.ts
import fs from 'fs/promises';
import path from 'path';
import fsExtra from 'fs-extra';
// Corrected: Import SchemaType which holds the actual enum values
import { FunctionDeclaration, SchemaType } from '@google/generative-ai';

export class FilesystemMcp {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = path.resolve(basePath);
  }

  // Tool 1: Reads a single file
  async readFile(relativePath: string): Promise<string> {
    const safePath = this.getSafePath(relativePath);
    console.log(`[FilesystemMCP] Reading file: ${safePath}`);
    return fs.readFile(safePath, 'utf-8');
  }

  // Tool 2: Lists files in a directory
  async listFiles(directoryPath: string = '.'): Promise<string[]> {
    const safePath = this.getSafePath(directoryPath);
    console.log(`[FilesystemMCP] Listing files in: ${safePath}`);
    return fs.readdir(safePath);
  }

  // Method for the controller to use
  async writeFile(relativePath: string, content: string): Promise<void> {
    const safePath = this.getSafePath(relativePath);
    await fs.writeFile(safePath, content, 'utf-8');
  }

  // Method to get all file contents for the frontend editor
  async getAllFileContents(): Promise<Record<string, string>> {
    const fileContents: Record<string, string> = {};
    const files = await fsExtra.readdir(this.basePath, { recursive: true });
    for (const file of files) {
      const filePath = path.join(this.basePath, file as string);
      const stats = await fsExtra.stat(filePath);
      if (stats.isFile()) {
        fileContents[file as string] = await fsExtra.readFile(filePath, 'utf-8');
      }
    }
    return fileContents;
  }

  // Security check to prevent path traversal attacks
  private getSafePath(relativePath: string): string {
    const absolutePath = path.resolve(this.basePath, relativePath);
    if (!absolutePath.startsWith(this.basePath)) {
      throw new Error('Access denied: Cannot access files outside the project directory.');
    }
    return absolutePath;
  }

  // Defines the tool specifications for the Gemini API
  static getToolSpec(): FunctionDeclaration[] {
    return [
      {
        name: 'readFile',
        description: 'Reads the content of a specific file within the project.',
        parameters: {
          // Corrected: Use the SchemaType enum directly
          type: SchemaType.OBJECT,
          properties: {
            path: {
              type: SchemaType.STRING,
              description: 'The relative path to the file.',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'listFiles',
        description: 'Lists the files and directories in a given project path.',
        parameters: {
          // Corrected: Use the SchemaType enum directly
          type: SchemaType.OBJECT,
          properties: {
            path: {
              type: SchemaType.STRING,
              description: 'The relative path to the directory.',
            },
          },
          required: ['path'],
        },
      },
    ];
  }
}