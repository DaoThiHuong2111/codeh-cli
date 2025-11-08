/**
 * File Operations Tool
 * Performs file system operations
 */

import { Tool } from './base/Tool';
import {
  ToolDefinition,
  ToolExecutionResult,
} from '../domain/interfaces/IToolExecutor';

export class FileOpsTool extends Tool {
  constructor(private fileOps: any) {
    // FileOperations will be injected
    super('file_ops', 'Perform file system operations');
  }

  getDefinition(): ToolDefinition {
    return {
      name: 'file_ops',
      description: 'Read, write, and manipulate files',
      parameters: [
        {
          name: 'operation',
          type: 'string',
          description: 'Operation: read, write, list, exists',
          required: true,
        },
        {
          name: 'path',
          type: 'string',
          description: 'File or directory path',
          required: true,
        },
        {
          name: 'content',
          type: 'string',
          description: 'Content to write (for write operation)',
          required: false,
        },
      ],
    };
  }

  validateParameters(parameters: Record<string, any>): boolean {
    const { operation, path } = parameters;

    if (!operation || !path) {
      return false;
    }

    const validOperations = ['read', 'write', 'list', 'exists'];
    return validOperations.includes(operation);
  }

  async execute(
    parameters: Record<string, any>
  ): Promise<ToolExecutionResult> {
    const { operation, path, content } = parameters;

    try {
      switch (operation) {
        case 'read':
          const fileContent = this.fileOps.readFile(path);
          return this.createSuccessResult(fileContent);

        case 'write':
          if (!content) {
            return this.createErrorResult(
              'Content parameter required for write operation'
            );
          }
          this.fileOps.writeFile(path, content);
          return this.createSuccessResult(`File written: ${path}`);

        case 'list':
          const files = this.fileOps.listDirectory(path);
          const fileList = files
            .map((f: any) => `${f.isDirectory ? '📁' : '📄'} ${f.name}`)
            .join('\n');
          return this.createSuccessResult(fileList);

        case 'exists':
          const exists = this.fileOps.exists(path);
          return this.createSuccessResult(
            exists ? 'File exists' : 'File does not exist',
            { exists }
          );

        default:
          return this.createErrorResult(`Unknown operation: ${operation}`);
      }
    } catch (error: any) {
      return this.createErrorResult(error.message);
    }
  }
}
