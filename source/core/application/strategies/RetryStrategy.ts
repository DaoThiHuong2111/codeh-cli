/**
 * Retry Strategy with Exponential Backoff
 * Provides resilient retry logic for transient failures
 */

export interface RetryOptions {
	/** Maximum number of retry attempts */
	maxRetries: number;
	/** Initial backoff delay in milliseconds */
	initialBackoffMs: number;
	/** Maximum backoff delay in milliseconds */
	maxBackoffMs: number;
	/** Function to determine if error is retryable */
	shouldRetry: (error: Error, attempt: number) => boolean;
	/** Callback called before each retry attempt */
	onRetry?: (error: Error, attempt: number, delayMs: number) => void;
}

export interface RetryResult<T> {
	/** Result of the operation if successful */
	result?: T;
	/** Whether the operation succeeded */
	success: boolean;
	/** Total number of attempts made */
	attempts: number;
	/** Total time taken in milliseconds */
	totalTimeMs: number;
	/** Last error encountered (if failed) */
	error?: Error;
}

/**
 * RetryStrategy implements exponential backoff retry logic
 *
 * @example
 * ```typescript
 * const retry = new RetryStrategy();
 * const result = await retry.execute(
 *   () => apiClient.sendMessage(messages),
 *   {
 *     maxRetries: 3,
 *     initialBackoffMs: 1000,
 *     maxBackoffMs: 10000,
 *     shouldRetry: (error) => error instanceof ApiClientError && error.statusCode >= 500,
 *   }
 * );
 * ```
 */
export class RetryStrategy {
	/**
	 * Execute a function with retry logic
	 *
	 * @param fn - Async function to execute
	 * @param options - Retry configuration options
	 * @returns Promise with retry result
	 */
	async execute<T>(
		fn: () => Promise<T>,
		options: RetryOptions,
	): Promise<RetryResult<T>> {
		const startTime = Date.now();
		let lastError: Error | undefined;
		let backoff = options.initialBackoffMs;
		let attempts = 0;

		for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
			attempts++;

			try {
				const result = await fn();

				return {
					result,
					success: true,
					attempts,
					totalTimeMs: Date.now() - startTime,
				};
			} catch (error) {
				lastError = error as Error;

				// Check if we should retry this error
				if (!options.shouldRetry(lastError, attempt)) {
					// Error is not retryable, fail immediately
					return {
						success: false,
						attempts,
						totalTimeMs: Date.now() - startTime,
						error: lastError,
					};
				}

				// Last attempt, don't retry
				if (attempt === options.maxRetries) {
					return {
						success: false,
						attempts,
						totalTimeMs: Date.now() - startTime,
						error: new Error(
							`Failed after ${options.maxRetries} retries: ${lastError.message}`,
						),
					};
				}

				// Calculate delay with exponential backoff
				const delay = Math.min(backoff, options.maxBackoffMs);

				// Call onRetry callback if provided
				options.onRetry?.(lastError, attempt, delay);

				// Wait before retry
				await this.delay(delay);

				// Exponential backoff with jitter
				backoff = this.calculateNextBackoff(backoff, options.maxBackoffMs);
			}
		}

		// Should never reach here, but TypeScript needs it
		return {
			success: false,
			attempts,
			totalTimeMs: Date.now() - startTime,
			error: lastError,
		};
	}

	/**
	 * Simplified execute that throws on failure
	 */
	async executeOrThrow<T>(
		fn: () => Promise<T>,
		options: RetryOptions,
	): Promise<T> {
		const result = await this.execute(fn, options);

		if (!result.success) {
			throw result.error || new Error('Retry failed');
		}

		return result.result!;
	}

	/**
	 * Calculate next backoff with exponential growth and jitter
	 */
	private calculateNextBackoff(
		currentBackoff: number,
		maxBackoff: number,
	): number {
		// Exponential: double the backoff
		let nextBackoff = currentBackoff * 2;

		// Add jitter (±20% randomness) to avoid thundering herd
		const jitter = nextBackoff * 0.2 * (Math.random() * 2 - 1);
		nextBackoff += jitter;

		// Cap at max backoff
		return Math.min(nextBackoff, maxBackoff);
	}

	/**
	 * Delay execution for specified milliseconds
	 */
	private delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
}

/**
 * Common retry configurations
 */
export const RetryPresets = {
	/** Quick retry for fast operations */
	FAST: {
		maxRetries: 2,
		initialBackoffMs: 100,
		maxBackoffMs: 1000,
	},

	/** Standard retry for most operations */
	STANDARD: {
		maxRetries: 3,
		initialBackoffMs: 1000,
		maxBackoffMs: 10000,
	},

	/** Aggressive retry for critical operations */
	AGGRESSIVE: {
		maxRetries: 5,
		initialBackoffMs: 2000,
		maxBackoffMs: 30000,
	},
} as const;

/**
 * Common retry predicates
 */
export const RetryPredicates = {
	/** Retry on network errors */
	networkErrors: (error: Error) => {
		return (
			error.message.includes('ECONNREFUSED') ||
			error.message.includes('ETIMEDOUT') ||
			error.message.includes('ENOTFOUND') ||
			error.message.includes('network')
		);
	},

	/** Retry on server errors (5xx) */
	serverErrors: (error: any) => {
		return error.statusCode >= 500 && error.statusCode < 600;
	},

	/** Retry on rate limit (429) */
	rateLimitErrors: (error: any) => {
		return error.statusCode === 429;
	},

	/** Retry on transient errors */
	transientErrors: (error: any) => {
		return (
			RetryPredicates.networkErrors(error) ||
			RetryPredicates.serverErrors(error) ||
			RetryPredicates.rateLimitErrors(error)
		);
	},

	/** Never retry */
	never: () => false,

	/** Always retry */
	always: () => true,
} as const;
