/**
 * Shell Command Executor
 * Safely executes shell commands
 */

import { exec, execSync, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
  duration: number;
}

export interface CommandOptions {
  cwd?: string;
  timeout?: number;
  env?: Record<string, string>;
  shell?: string;
  maxBuffer?: number;
}

export class ShellExecutor {
  private defaultTimeout: number = 30000; // 30 seconds
  private defaultMaxBuffer: number = 1024 * 1024 * 10; // 10MB

  /**
   * Execute command asynchronously
   */
  async execute(
    command: string,
    options: CommandOptions = {}
  ): Promise<CommandResult> {
    const startTime = Date.now();

    try {
      const execOptions = {
        cwd: options.cwd || process.cwd(),
        timeout: options.timeout || this.defaultTimeout,
        env: { ...process.env, ...options.env },
        shell: options.shell || undefined,
        maxBuffer: options.maxBuffer || this.defaultMaxBuffer,
      };

      const { stdout, stderr } = await execAsync(command, execOptions);

      return {
        stdout: stdout.toString(),
        stderr: stderr.toString(),
        exitCode: 0,
        success: true,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        stdout: error.stdout?.toString() || '',
        stderr: error.stderr?.toString() || error.message,
        exitCode: error.code || 1,
        success: false,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Execute command synchronously
   */
  executeSync(
    command: string,
    options: CommandOptions = {}
  ): CommandResult {
    const startTime = Date.now();

    try {
      const execOptions = {
        cwd: options.cwd || process.cwd(),
        timeout: options.timeout || this.defaultTimeout,
        env: { ...process.env, ...options.env },
        shell: options.shell || undefined,
        maxBuffer: options.maxBuffer || this.defaultMaxBuffer,
      };

      const stdout = execSync(command, execOptions);

      return {
        stdout: stdout.toString(),
        stderr: '',
        exitCode: 0,
        success: true,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        stdout: error.stdout?.toString() || '',
        stderr: error.stderr?.toString() || error.message,
        exitCode: error.status || 1,
        success: false,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Execute command with streaming output
   */
  executeStream(
    command: string,
    onStdout: (data: string) => void,
    onStderr: (data: string) => void,
    options: CommandOptions = {}
  ): Promise<CommandResult> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const args = command.split(' ');
      const cmd = args.shift()!;

      const child = spawn(cmd, args, {
        cwd: options.cwd || process.cwd(),
        env: { ...process.env, ...options.env },
        shell: options.shell !== undefined ? options.shell : true,
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        const text = data.toString();
        stdout += text;
        onStdout(text);
      });

      child.stderr.on('data', (data) => {
        const text = data.toString();
        stderr += text;
        onStderr(text);
      });

      child.on('close', (code) => {
        resolve({
          stdout,
          stderr,
          exitCode: code || 0,
          success: code === 0,
          duration: Date.now() - startTime,
        });
      });

      child.on('error', (error) => {
        resolve({
          stdout,
          stderr: stderr + error.message,
          exitCode: 1,
          success: false,
          duration: Date.now() - startTime,
        });
      });

      // Handle timeout
      if (options.timeout) {
        setTimeout(() => {
          child.kill();
          resolve({
            stdout,
            stderr: stderr + '\nCommand timed out',
            exitCode: 124, // Timeout exit code
            success: false,
            duration: Date.now() - startTime,
          });
        }, options.timeout);
      }
    });
  }

  /**
   * Check if command is available
   */
  async isCommandAvailable(command: string): Promise<boolean> {
    try {
      const result = await this.execute(`which ${command}`);
      return result.success;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get command version
   */
  async getCommandVersion(command: string): Promise<string | null> {
    try {
      const result = await this.execute(`${command} --version`);
      return result.success ? result.stdout.trim() : null;
    } catch (error) {
      return null;
    }
  }

  setDefaultTimeout(timeout: number): void {
    this.defaultTimeout = timeout;
  }

  setDefaultMaxBuffer(maxBuffer: number): void {
    this.defaultMaxBuffer = maxBuffer;
  }
}
