/**
 * Enhanced Logging System
 * - Text-only format (no emojis/icons)
 * - Only logs when CODEH_LOGGING=true
 * - Buffered file writes
 * - Log rotation
 * - Correlation ID support
 * - Function entry/exit tracking
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {isLoggingEnabled} from '../config/EnvUtils';

export interface LogEntry {
	timestamp: string;
	level: string;
	component: string;
	function: string;
	requestId?: string;
	message: string;
	context?: Record<string, any>;
}

/**
 * Logger interface
 */
export interface ILogger {
	debug(component: string, func: string, message: string, context?: Record<string, any>): void;
	info(component: string, func: string, message: string, context?: Record<string, any>): void;
	warn(component: string, func: string, message: string, context?: Record<string, any>): void;
	error(component: string, func: string, message: string, context?: Record<string, any>): void;
	setRequestId(requestId: string): void;
	getRequestId(): string | undefined;
	setSessionId?(sessionId: string): void;
	getSessionId?(): string | undefined;
	flush(): void;
	logFunctionEntry(component: string, func: string, params?: any): void;
	logFunctionExit(component: string, func: string, duration: number, success?: boolean): void;
}

/**
 * Generate unique request ID
 */
export function generateRequestId(): string {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let i = 0; i < 12; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return `req_${result}`;
}

/**
 * Format timestamp to session format: YYYYMMDD_HHMMSS
 */
function formatSessionTimestamp(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	const seconds = String(date.getSeconds()).padStart(2, '0');
	return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

/**
 * Buffered file output for logs
 */
class BufferedFileOutput {
	private buffer: LogEntry[] = [];
	private readonly bufferSize = 100;
	private flushTimer: NodeJS.Timeout | null = null;
	private readonly flushInterval = 5000; // 5 seconds

	constructor(private filePath: string) {
		// Ensure directory exists
		const dir = path.dirname(filePath);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, {recursive: true});
		}

		// Setup flush timer
		this.flushTimer = setInterval(() => this.flush(), this.flushInterval);

		// Flush on process exit
		process.on('exit', () => this.flush());
		process.on('SIGINT', () => {
			this.flush();
			process.exit(0);
		});
		process.on('SIGTERM', () => {
			this.flush();
			process.exit(0);
		});
	}

	write(entry: LogEntry): void {
		this.buffer.push(entry);

		if (this.buffer.length >= this.bufferSize) {
			this.flush();
		}
	}

	flush(): void {
		if (this.buffer.length === 0) {
			return;
		}

		try {
			const lines = this.buffer.map(entry => JSON.stringify(entry)).join('\n') + '\n';
			fs.appendFileSync(this.filePath, lines);
			this.buffer = [];
		} catch (error) {
			// Silent fail - can't use console.log in Ink
		}
	}

	destroy(): void {
		this.flush();
		if (this.flushTimer) {
			clearInterval(this.flushTimer);
			this.flushTimer = null;
		}
	}
}

/**
 * Enhanced logger implementation
 */
export class EnhancedLogger implements ILogger {
	private requestId?: string;
	private fileOutput?: BufferedFileOutput;
	private sessionId?: string;

	constructor(sessionId?: string) {
		// Store session ID
		this.sessionId = sessionId;

		// Don't create file output here - lazy init on first log
		// This prevents creating multiple files when sessionId is set later
	}

	/**
	 * Check if logging is enabled (lazy evaluation)
	 * This ensures env vars are loaded before checking
	 */
	private isEnabled(): boolean {
		return isLoggingEnabled();
	}

	private createFileOutput(): void {
		const logDir = path.join(os.homedir(), '.codeh', 'logs');
		let logFileName: string;

		if (this.sessionId) {
			// Use session ID in filename
			const sanitized = this.sessionId.replace(/[^a-zA-Z0-9-_]/g, '_');
			logFileName = `logs_${sanitized}.json`;
		} else {
			// Fallback to timestamp
			const sessionTime = formatSessionTimestamp(new Date());
			logFileName = `logs_session_${sessionTime}.json`;
		}

		const logFile = path.join(logDir, logFileName);
		this.fileOutput = new BufferedFileOutput(logFile);
	}

	setRequestId(requestId: string): void {
		this.requestId = requestId;
	}

	getRequestId(): string | undefined {
		return this.requestId;
	}

	debug(component: string, func: string, message: string, context?: Record<string, any>): void {
		this.log('DEBUG', component, func, message, context);
	}

	info(component: string, func: string, message: string, context?: Record<string, any>): void {
		this.log('INFO', component, func, message, context);
	}

	warn(component: string, func: string, message: string, context?: Record<string, any>): void {
		this.log('WARN', component, func, message, context);
	}

	error(component: string, func: string, message: string, context?: Record<string, any>): void {
		this.log('ERROR', component, func, message, context);
	}

	logFunctionEntry(component: string, func: string, params?: any): void {
		const context: Record<string, any> = {};

		if (params !== undefined) {
			// Safely serialize params
			if (typeof params === 'object' && params !== null) {
				if (Array.isArray(params)) {
					context.params_length = params.length;
				} else if (typeof params === 'string') {
					context.params_length = params.length;
				} else {
					// For objects, include summary
					context.params = this.summarizeObject(params);
				}
			} else {
				context.params = params;
			}
		}

		this.debug(component, func, 'Entering function', context);
	}

	logFunctionExit(component: string, func: string, duration: number, success: boolean = true): void {
		const context: Record<string, any> = {
			duration_ms: duration,
			success,
		};

		// Warn if slow
		if (duration > 1000) {
			this.warn(component, func, 'Slow function execution', context);
		} else {
			this.debug(component, func, 'Exiting function', context);
		}
	}

	flush(): void {
		if (this.fileOutput) {
			this.fileOutput.flush();
		}
	}

	private log(
		level: string,
		component: string,
		func: string,
		message: string,
		context?: Record<string, any>,
	): void {
		// Skip if disabled (check at runtime, not at construction time)
		if (!this.isEnabled()) {
			return;
		}

		// Lazy initialization - create file output on first log
		if (!this.fileOutput) {
			this.createFileOutput();
		}

		const entry: LogEntry = {
			timestamp: new Date().toISOString(),
			level,
			component,
			function: func,
			message,
			context,
		};

		if (this.requestId) {
			entry.requestId = this.requestId;
		}

		if (this.fileOutput) {
			this.fileOutput.write(entry);
		}
	}

	private summarizeObject(obj: any, maxKeys: number = 5): any {
		try {
			const keys = Object.keys(obj);
			if (keys.length <= maxKeys) {
				return obj;
			}

			const summary: any = {};
			keys.slice(0, maxKeys).forEach(key => {
				const value = obj[key];
				if (typeof value === 'string' && value.length > 100) {
					summary[key] = `${value.substring(0, 100)}...`;
				} else {
					summary[key] = value;
				}
			});
			summary._truncated = `${keys.length - maxKeys} more keys`;
			return summary;
		} catch {
			return '[Object]';
		}
	}

	/**
	 * Set session ID and recreate log file on next log
	 * NOTE: Can only be called ONCE. Subsequent calls are ignored to prevent multiple log files.
	 */
	setSessionId(sessionId: string): void {
		// CRITICAL FIX: Only allow setting sessionId ONCE
		// This prevents creating multiple log files when user creates new sessions
		if (this.sessionId) {
			// SessionId already set, ignore this call
			return;
		}

		// Set session ID (first time only)
		this.sessionId = sessionId;

		// Don't create file immediately - lazy init on next log
		// This ensures we only create one file with the correct session ID
	}

	/**
	 * Get current session ID
	 */
	getSessionId(): string | undefined {
		return this.sessionId;
	}

	destroy(): void {
		if (this.fileOutput) {
			this.fileOutput.destroy();
		}
	}
}

/**
 * Singleton logger instance
 */
let globalLogger: ILogger | null = null;

/**
 * Get global logger instance
 * Always returns EnhancedLogger - it will check isLoggingEnabled() at runtime
 */
export function getLogger(): ILogger {
	if (!globalLogger) {
		// Always create EnhancedLogger - it checks isLoggingEnabled() lazily
		globalLogger = new EnhancedLogger();
	}
	return globalLogger;
}

/**
 * Log rotation - cleanup old log files
 */
export function cleanupOldLogs(maxFiles: number = 7): void {
	try {
		const logDir = path.join(os.homedir(), '.codeh', 'logs');

		if (!fs.existsSync(logDir)) {
			return;
		}

		const files = fs.readdirSync(logDir)
			.filter(f => f.startsWith('logs_session_') && f.endsWith('.json'))
			.map(f => ({
				name: f,
				path: path.join(logDir, f),
				mtime: fs.statSync(path.join(logDir, f)).mtime,
			}))
			.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

		// Keep only the most recent maxFiles
		const filesToDelete = files.slice(maxFiles);

		filesToDelete.forEach(file => {
			try {
				fs.unlinkSync(file.path);
			} catch {
				// Ignore errors
			}
		});
	} catch {
		// Ignore errors
	}
}

