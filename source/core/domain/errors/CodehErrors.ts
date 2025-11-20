/**
 * Custom Error Types for Codeh CLI
 * Provides structured error handling across the application
 */

/**
 * Base error class for all Codeh-specific errors
 */
export class CodehError extends Error {
	constructor(
		message: string,
		public code: string,
		public context?: Record<string, any>,
	) {
		super(message);
		this.name = 'CodehError';
		Error.captureStackTrace?.(this, this.constructor);
	}

	toJSON(): Record<string, any> {
		return {
			name: this.name,
			message: this.message,
			code: this.code,
			context: this.context,
			stack: this.stack,
		};
	}
}

/**
 * Error thrown when tool execution fails
 */
export class ToolExecutionError extends CodehError {
	constructor(
		public toolName: string,
		public originalError: Error,
	) {
		super(`Tool execution failed: ${toolName}`, 'TOOL_EXECUTION_FAILED', {
			toolName,
			originalError: {
				message: originalError.message,
				name: originalError.name,
			},
		});
		this.name = 'ToolExecutionError';
	}
}

/**
 * Error thrown when API client calls fail
 */
export class ApiClientError extends CodehError {
	constructor(
		public provider: string,
		public statusCode?: number,
		message?: string,
	) {
		super(message || `API call failed: ${provider}`, 'API_CLIENT_ERROR', {
			provider,
			statusCode,
		});
		this.name = 'ApiClientError';
	}
}

/**
 * Error thrown for configuration issues
 */
export class ConfigurationError extends CodehError {
	constructor(message: string, context?: Record<string, any>) {
		super(message, 'CONFIGURATION_ERROR', context);
		this.name = 'ConfigurationError';
	}
}

/**
 * Error thrown when a symbol is not found
 */
export class SymbolNotFoundError extends CodehError {
	constructor(
		public symbolName: string,
		public filePath: string,
	) {
		super(`Symbol not found: ${symbolName}`, 'SYMBOL_NOT_FOUND', {
			symbolName,
			filePath,
		});
		this.name = 'SymbolNotFoundError';
	}
}

/**
 * Error thrown for file operation failures
 */
export class FileOperationError extends CodehError {
	constructor(
		public operation: string,
		public filePath: string,
		public originalError?: Error,
	) {
		super(
			`File operation failed: ${operation} on ${filePath}`,
			'FILE_OPERATION_ERROR',
			{
				operation,
				filePath,
				originalError: originalError
					? {
							message: originalError.message,
							name: originalError.name,
						}
					: undefined,
			},
		);
		this.name = 'FileOperationError';
	}
}

/**
 * Error thrown for validation failures
 */
export class ValidationError extends CodehError {
	constructor(
		message: string,
		public field?: string,
		public value?: any,
	) {
		super(message, 'VALIDATION_ERROR', {field, value});
		this.name = 'ValidationError';
	}
}

/**
 * Error thrown for security violations
 */
export class SecurityError extends CodehError {
	constructor(message: string, code?: string) {
		super(message, code || 'SECURITY_ERROR');
		this.name = 'SecurityError';
	}
}

/**
 * Error thrown when rate limit is exceeded
 */
export class RateLimitError extends CodehError {
	constructor(
		message: string,
		public waitTimeMs: number,
	) {
		super(message, 'RATE_LIMIT_EXCEEDED', {waitTimeMs});
		this.name = 'RateLimitError';
	}
}

/**
 * Error thrown for timeout issues
 */
export class TimeoutError extends CodehError {
	constructor(
		public operation: string,
		public timeoutMs: number,
	) {
		super(
			`Operation timed out: ${operation} after ${timeoutMs}ms`,
			'TIMEOUT_ERROR',
			{operation, timeoutMs},
		);
		this.name = 'TimeoutError';
	}
}

