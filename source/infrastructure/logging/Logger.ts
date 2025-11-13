/**
 * Structured Logging System
 * Provides consistent, structured logging across the application
 */

import * as fs from 'fs';
import * as path from 'path';

export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3,
}

export interface LogEntry {
	timestamp: string;
	level: string;
	message: string;
	context?: Record<string, any>;
	sessionId?: string;
	error?: {
		message: string;
		stack?: string;
		code?: string;
		name?: string;
	};
}

/**
 * Logger interface
 */
export interface ILogger {
	debug(message: string, context?: Record<string, any>): void;
	info(message: string, context?: Record<string, any>): void;
	warn(message: string, context?: Record<string, any>): void;
	error(message: string, error?: Error, context?: Record<string, any>): void;
	setContext(key: string, value: any): void;
	getContext(): Record<string, any>;
}

/**
 * Log output interface
 */
export interface LogOutput {
	write(entry: LogEntry): void;
}

/**
 * Console output for logs
 */
export class ConsoleOutput implements LogOutput {
	write(entry: LogEntry): void {
		const color = this.getColor(entry.level);
		const reset = '\x1b[0m';
		const formatted = `${color}[${entry.timestamp}] ${entry.level}: ${entry.message}${reset}`;

		console.log(formatted);

		if (entry.context && Object.keys(entry.context).length > 0) {
			console.log('  Context:', JSON.stringify(entry.context, null, 2));
		}

		if (entry.error) {
			console.log('  Error:', entry.error.message);
			if (entry.error.stack) {
				console.log(entry.error.stack);
			}
		}
	}

	private getColor(level: string): string {
		switch (level) {
			case 'DEBUG':
				return '\x1b[36m'; // Cyan
			case 'INFO':
				return '\x1b[32m'; // Green
			case 'WARN':
				return '\x1b[33m'; // Yellow
			case 'ERROR':
				return '\x1b[31m'; // Red
			default:
				return '';
		}
	}
}

/**
 * File output for logs
 */
export class FileOutput implements LogOutput {
	constructor(private filePath: string) {
		// Ensure directory exists
		const dir = path.dirname(filePath);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, {recursive: true});
		}
	}

	write(entry: LogEntry): void {
		const line = JSON.stringify(entry) + '\n';

		try {
			fs.appendFileSync(this.filePath, line);
		} catch (error) {
			console.error('Failed to write to log file:', error);
		}
	}
}

/**
 * Structured logger implementation
 */
export class StructuredLogger implements ILogger {
	private globalContext: Record<string, any> = {};

	constructor(
		private level: LogLevel = LogLevel.INFO,
		private outputs: LogOutput[] = [new ConsoleOutput()],
	) {}

	setContext(key: string, value: any): void {
		this.globalContext[key] = value;
	}

	getContext(): Record<string, any> {
		return {...this.globalContext};
	}

	clearContext(): void {
		this.globalContext = {};
	}

	debug(message: string, context?: Record<string, any>): void {
		this.log(LogLevel.DEBUG, message, context);
	}

	info(message: string, context?: Record<string, any>): void {
		this.log(LogLevel.INFO, message, context);
	}

	warn(message: string, context?: Record<string, any>): void {
		this.log(LogLevel.WARN, message, context);
	}

	error(message: string, error?: Error, context?: Record<string, any>): void {
		const errorInfo = error
			? {
					message: error.message,
					stack: error.stack,
					code: (error as any).code,
					name: error.name,
				}
			: undefined;

		this.log(LogLevel.ERROR, message, {
			...context,
			error: errorInfo,
		});
	}

	private log(
		level: LogLevel,
		message: string,
		context?: Record<string, any>,
	): void {
		if (level < this.level) {
			return;
		}

		const entry: LogEntry = {
			timestamp: new Date().toISOString(),
			level: LogLevel[level],
			message,
			context: {...this.globalContext, ...context},
			sessionId: this.globalContext.sessionId,
		};

		// Extract error from context if present
		if (context?.error) {
			entry.error = context.error;
			delete entry.context!.error;
		}

		this.outputs.forEach(output => {
			try {
				output.write(entry);
			} catch (error) {
				console.error('Failed to write log:', error);
			}
		});
	}

	/**
	 * Add a new output to the logger
	 */
	addOutput(output: LogOutput): void {
		this.outputs.push(output);
	}

	/**
	 * Set minimum log level
	 */
	setLevel(level: LogLevel): void {
		this.level = level;
	}

	/**
	 * Get current log level
	 */
	getLevel(): LogLevel {
		return this.level;
	}
}

/**
 * Create a default logger instance
 */
export function createLogger(options?: {
	level?: LogLevel;
	outputs?: LogOutput[];
}): ILogger {
	return new StructuredLogger(
		options?.level || LogLevel.INFO,
		options?.outputs || [new ConsoleOutput()],
	);
}

/**
 * Null logger (does nothing)
 */
export class NullLogger implements ILogger {
	debug(): void {}
	info(): void {}
	warn(): void {}
	error(): void {}
	setContext(): void {}
	getContext(): Record<string, any> {
		return {};
	}
}
