/**
 * File System Operations
 * Provides safe file system operations
 */

import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  unlinkSync,
} from 'fs';
import { join, dirname, resolve, relative, extname } from 'path';

export interface FileInfo {
  path: string;
  name: string;
  size: number;
  isDirectory: boolean;
  isFile: boolean;
  extension: string;
  modifiedAt: Date;
}

export class FileOperations {
  /**
   * Read file content
   */
  readFile(filePath: string, encoding: BufferEncoding = 'utf8'): string {
    try {
      const absolutePath = resolve(filePath);
      return readFileSync(absolutePath, encoding);
    } catch (error: any) {
      throw new Error(`Failed to read file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Write file content
   */
  writeFile(
    filePath: string,
    content: string,
    encoding: BufferEncoding = 'utf8'
  ): void {
    try {
      const absolutePath = resolve(filePath);
      const dir = dirname(absolutePath);

      // Ensure directory exists
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      writeFileSync(absolutePath, content, encoding);
    } catch (error: any) {
      throw new Error(`Failed to write file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Check if file/directory exists
   */
  exists(path: string): boolean {
    try {
      return existsSync(resolve(path));
    } catch (error) {
      return false;
    }
  }

  /**
   * Get file info
   */
  getFileInfo(filePath: string): FileInfo | null {
    try {
      const absolutePath = resolve(filePath);

      if (!existsSync(absolutePath)) {
        return null;
      }

      const stats = statSync(absolutePath);
      const name = filePath.split('/').pop() || '';

      return {
        path: absolutePath,
        name,
        size: stats.size,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        extension: extname(name),
        modifiedAt: stats.mtime,
      };
    } catch (error: any) {
      throw new Error(
        `Failed to get file info for ${filePath}: ${error.message}`
      );
    }
  }

  /**
   * List directory contents
   */
  listDirectory(dirPath: string): FileInfo[] {
    try {
      const absolutePath = resolve(dirPath);

      if (!existsSync(absolutePath)) {
        throw new Error(`Directory does not exist: ${dirPath}`);
      }

      const files = readdirSync(absolutePath);

      return files
        .map((file) => {
          const filePath = join(absolutePath, file);
          return this.getFileInfo(filePath);
        })
        .filter((info): info is FileInfo => info !== null);
    } catch (error: any) {
      throw new Error(
        `Failed to list directory ${dirPath}: ${error.message}`
      );
    }
  }

  /**
   * Create directory
   */
  createDirectory(dirPath: string): void {
    try {
      const absolutePath = resolve(dirPath);

      if (!existsSync(absolutePath)) {
        mkdirSync(absolutePath, { recursive: true });
      }
    } catch (error: any) {
      throw new Error(
        `Failed to create directory ${dirPath}: ${error.message}`
      );
    }
  }

  /**
   * Delete file
   */
  deleteFile(filePath: string): void {
    try {
      const absolutePath = resolve(filePath);

      if (existsSync(absolutePath)) {
        unlinkSync(absolutePath);
      }
    } catch (error: any) {
      throw new Error(`Failed to delete file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Check if path is absolute
   */
  isAbsolutePath(path: string): boolean {
    return resolve(path) === path;
  }

  /**
   * Get relative path
   */
  getRelativePath(from: string, to: string): string {
    return relative(from, to);
  }

  /**
   * Join paths
   */
  joinPaths(...paths: string[]): string {
    return join(...paths);
  }

  /**
   * Get directory name
   */
  getDirName(path: string): string {
    return dirname(path);
  }

  /**
   * Resolve path
   */
  resolvePath(...paths: string[]): string {
    return resolve(...paths);
  }

  /**
   * Get file extension
   */
  getExtension(filePath: string): string {
    return extname(filePath);
  }

  /**
   * Read JSON file
   */
  readJsonFile<T = any>(filePath: string): T {
    try {
      const content = this.readFile(filePath);
      return JSON.parse(content);
    } catch (error: any) {
      throw new Error(
        `Failed to read JSON file ${filePath}: ${error.message}`
      );
    }
  }

  /**
   * Write JSON file
   */
  writeJsonFile(filePath: string, data: any, pretty: boolean = true): void {
    try {
      const content = pretty
        ? JSON.stringify(data, null, 2)
        : JSON.stringify(data);
      this.writeFile(filePath, content);
    } catch (error: any) {
      throw new Error(
        `Failed to write JSON file ${filePath}: ${error.message}`
      );
    }
  }

  /**
   * Check if file is readable
   */
  isReadable(filePath: string): boolean {
    try {
      const absolutePath = resolve(filePath);
      readFileSync(absolutePath, { encoding: 'utf8', flag: 'r' });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get file size in bytes
   */
  getFileSize(filePath: string): number {
    const info = this.getFileInfo(filePath);
    return info?.size || 0;
  }
}
