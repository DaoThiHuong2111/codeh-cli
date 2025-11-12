/**
 * Sandboxed Shell Executor
 * Provides safe shell command execution with whitelist and validation
 */

import {
	ShellExecutor,
	CommandResult,
	CommandOptions,
} from './ShellExecutor.js';
import {SecurityError} from '../../core/domain/errors/CodehErrors.js';

export interface SandboxConfig {
	/** Commands allowed to execute */
	allowedCommands?: Set<string>;
	/** Maximum output size in bytes */
	maxOutputSize?: number;
	/** Maximum execution time in milliseconds */
	maxExecutionTime?: number;
	/** Enable dangerous pattern detection */
	detectDangerousPatterns?: boolean;
}

/**
 * Sandboxed shell executor with security constraints
 */
export class SandboxedShellExecutor extends ShellExecutor {
	private readonly ALLOWED_COMMANDS: Set<string>;
	private readonly DANGEROUS_PATTERNS: RegExp[];
	private readonly MAX_OUTPUT_SIZE: number;
	private readonly MAX_EXECUTION_TIME: number;
	private readonly detectDangerousPatterns: boolean;

	constructor(config?: SandboxConfig) {
		super();

		// Default allowed commands (safe, read-only operations)
		this.ALLOWED_COMMANDS =
			config?.allowedCommands ||
			new Set([
				'ls',
				'cat',
				'grep',
				'find',
				'git',
				'npm',
				'node',
				'tsc',
				'echo',
				'pwd',
				'mkdir',
				'touch',
				'mv',
				'cp',
				'which',
				'whoami',
				'date',
				'head',
				'tail',
				'wc',
				'sort',
				'uniq',
				'diff',
			]);

		// Dangerous patterns to block
		this.DANGEROUS_PATTERNS = [
			/rm\s+-rf\s+\//i, // rm -rf /
			/>\s*\/dev\/sda/i, // Write to disk device
			/curl.*\|\s*sh/i, // Curl pipe to shell
			/wget.*\|\s*sh/i, // Wget pipe to shell
			/eval\s*\(/i, // eval
			/exec\s*\(/i, // exec
			/;\s*rm\s+-rf/i, // Command injection with rm
			/&&\s*rm\s+-rf/i, // Command chaining with rm
			/\|\s*rm\s+-rf/i, // Pipe to rm
			/mkfs\./i, // Format filesystem
			/dd\s+if=/i, // Disk duplication (can be dangerous)
			/:(){:|:&};:/i, // Fork bomb
		];

		this.MAX_OUTPUT_SIZE = config?.maxOutputSize || 10 * 1024 * 1024; // 10MB
		this.MAX_EXECUTION_TIME = config?.maxExecutionTime || 30000; // 30 seconds
		this.detectDangerousPatterns =
			config?.detectDangerousPatterns !== false; // Default true
	}

	/**
	 * Execute command with sandbox constraints
	 */
	async execute(
		command: string,
		options?: CommandOptions,
	): Promise<CommandResult> {
		// Validate command
		this.validateCommand(command);

		// Execute with timeout
		try {
			const result = await Promise.race([
				super.execute(command, options),
				this.createTimeout(this.MAX_EXECUTION_TIME),
			]);

			// Check output size
			const totalOutput = result.stdout.length + result.stderr.length;
			if (totalOutput > this.MAX_OUTPUT_SIZE) {
				throw new SecurityError(
					`Output size (${totalOutput} bytes) exceeds maximum (${this.MAX_OUTPUT_SIZE} bytes)`,
					'OUTPUT_SIZE_EXCEEDED',
				);
			}

			return result;
		} catch (error) {
			if (error instanceof SecurityError) {
				throw error;
			}

			throw new Error(`Command execution failed: ${(error as Error).message}`);
		}
	}

	/**
	 * Validate command for security issues
	 */
	private validateCommand(command: string): void {
		const trimmedCommand = command.trim();

		if (!trimmedCommand) {
			throw new SecurityError('Empty command not allowed', 'EMPTY_COMMAND');
		}

		// Check dangerous patterns first
		if (this.detectDangerousPatterns) {
			for (const pattern of this.DANGEROUS_PATTERNS) {
				if (pattern.test(command)) {
					throw new SecurityError(
						`Dangerous command pattern detected: ${command}`,
						'DANGEROUS_COMMAND_PATTERN',
					);
				}
			}
		}

		// Extract base command (first word)
		const baseCommand = this.extractBaseCommand(trimmedCommand);

		// Check whitelist
		if (!this.ALLOWED_COMMANDS.has(baseCommand)) {
			throw new SecurityError(
				`Command not in whitelist: ${baseCommand}`,
				'COMMAND_NOT_ALLOWED',
			);
		}

		// Check for command injection attempts
		if (this.hasCommandInjection(command)) {
			throw new SecurityError(
				'Potential command injection detected',
				'COMMAND_INJECTION',
			);
		}
	}

	/**
	 * Extract base command from command string
	 */
	private extractBaseCommand(command: string): string {
		// Handle complex cases like "npm run build" -> "npm"
		const parts = command.split(/\s+/);
		return parts[0];
	}

	/**
	 * Check for command injection patterns
	 */
	private hasCommandInjection(command: string): boolean {
		// Check for dangerous injection characters
		const injectionChars = [';', '&', '\n', '\r'];

		// Safe patterns (allowed pipes and redirects)
		const safePatterns = [
			/\|\s*grep/i, // Pipe to grep
			/\|\s*head/i, // Pipe to head
			/\|\s*tail/i, // Pipe to tail
			/\|\s*wc/i, // Pipe to wc
			/\|\s*sort/i, // Pipe to sort
			/>\s*[\w\-./]+/i, // Redirect to file (alphanumeric path)
			/2>&1/i, // Stderr to stdout
		];

		for (const char of injectionChars) {
			if (command.includes(char)) {
				// Check if it's a safe usage
				const isSafe = safePatterns.some(pattern => pattern.test(command));
				if (!isSafe) {
					return true;
				}
			}
		}

		// Check for $() or `` (command substitution)
		if (/\$\(|\`/.test(command)) {
			return true;
		}

		return false;
	}

	/**
	 * Create timeout promise
	 */
	private createTimeout(ms: number): Promise<never> {
		return new Promise((_, reject) => {
			setTimeout(() => {
				reject(
					new SecurityError(
						`Command execution timeout after ${ms}ms`,
						'EXECUTION_TIMEOUT',
					),
				);
			}, ms);
		});
	}

	/**
	 * Add command to whitelist
	 */
	addAllowedCommand(command: string): void {
		this.ALLOWED_COMMANDS.add(command);
	}

	/**
	 * Remove command from whitelist
	 */
	removeAllowedCommand(command: string): void {
		this.ALLOWED_COMMANDS.delete(command);
	}

	/**
	 * Get current whitelist
	 */
	getAllowedCommands(): string[] {
		return Array.from(this.ALLOWED_COMMANDS);
	}

	/**
	 * Check if command is allowed
	 */
	isCommandAllowed(command: string): boolean {
		const baseCommand = this.extractBaseCommand(command);
		return this.ALLOWED_COMMANDS.has(baseCommand);
	}
}
