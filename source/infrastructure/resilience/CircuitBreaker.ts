/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by temporarily blocking requests to failing services
 */

export enum CircuitState {
	/** Normal operation - requests are allowed */
	CLOSED = 'closed',
	/** Service is failing - requests are blocked */
	OPEN = 'open',
	/** Testing if service recovered - limited requests allowed */
	HALF_OPEN = 'half-open',
}

export interface CircuitBreakerOptions {
	/** Number of failures before opening circuit */
	failureThreshold: number;
	/** Time in ms to wait before attempting recovery */
	resetTimeoutMs: number;
	/** Number of successful calls needed to close circuit from half-open */
	successThreshold: number;
	/** Optional callback when circuit state changes */
	onStateChange?: (
		oldState: CircuitState,
		newState: CircuitState,
		reason: string,
	) => void;
}

export interface CircuitBreakerStats {
	state: CircuitState;
	failureCount: number;
	successCount: number;
	totalAttempts: number;
	lastFailureTime: number | null;
	lastSuccessTime: number | null;
}

/**
 * CircuitBreaker implements the circuit breaker pattern to prevent
 * cascading failures and provide fast failure responses
 *
 * States:
 * - CLOSED: Normal operation, all requests allowed
 * - OPEN: Too many failures, all requests blocked
 * - HALF_OPEN: Testing recovery, limited requests allowed
 *
 * @example
 * ```typescript
 * const breaker = new CircuitBreaker({
 *   failureThreshold: 5,
 *   resetTimeoutMs: 60000,
 *   successThreshold: 2,
 * });
 *
 * try {
 *   const result = await breaker.execute(() => apiCall());
 * } catch (error) {
 *   if (error.message.includes('Circuit breaker is OPEN')) {
 *     // Service is down, fail fast
 *   }
 * }
 * ```
 */
export class CircuitBreaker {
	private state: CircuitState = CircuitState.CLOSED;
	private failureCount = 0;
	private successCount = 0;
	private totalAttempts = 0;
	private lastFailureTime: number | null = null;
	private lastSuccessTime: number | null = null;

	private readonly failureThreshold: number;
	private readonly resetTimeoutMs: number;
	private readonly successThreshold: number;
	private readonly onStateChange?: (
		oldState: CircuitState,
		newState: CircuitState,
		reason: string,
	) => void;

	constructor(options: CircuitBreakerOptions) {
		this.failureThreshold = options.failureThreshold;
		this.resetTimeoutMs = options.resetTimeoutMs;
		this.successThreshold = options.successThreshold;
		this.onStateChange = options.onStateChange;
	}

	/**
	 * Execute a function with circuit breaker protection
	 *
	 * @param fn - Async function to execute
	 * @returns Promise with function result
	 * @throws Error if circuit is open or function fails
	 */
	async execute<T>(fn: () => Promise<T>): Promise<T> {
		// Check if circuit should transition to HALF_OPEN
		if (this.state === CircuitState.OPEN) {
			if (this.shouldAttemptReset()) {
				this.transitionTo(
					CircuitState.HALF_OPEN,
					'Reset timeout elapsed, attempting recovery',
				);
			} else {
				const waitTime = this.getRemainingWaitTime();
				throw new Error(
					`Circuit breaker is OPEN. Service unavailable. Retry in ${Math.ceil(waitTime / 1000)}s`,
				);
			}
		}

		this.totalAttempts++;

		try {
			const result = await fn();
			this.onSuccess();
			return result;
		} catch (error) {
			this.onFailure();
			throw error;
		}
	}

	/**
	 * Handle successful execution
	 */
	private onSuccess(): void {
		this.lastSuccessTime = Date.now();
		this.failureCount = 0;

		if (this.state === CircuitState.HALF_OPEN) {
			this.successCount++;

			if (this.successCount >= this.successThreshold) {
				this.transitionTo(
					CircuitState.CLOSED,
					`${this.successCount} successful calls, service recovered`,
				);
			}
		}
	}

	/**
	 * Handle failed execution
	 */
	private onFailure(): void {
		this.lastFailureTime = Date.now();
		this.failureCount++;

		if (this.state === CircuitState.HALF_OPEN) {
			// Any failure in HALF_OPEN immediately opens the circuit
			this.transitionTo(CircuitState.OPEN, 'Failure during recovery attempt');
		} else if (
			this.state === CircuitState.CLOSED &&
			this.failureCount >= this.failureThreshold
		) {
			this.transitionTo(
				CircuitState.OPEN,
				`Failure threshold reached (${this.failureCount} failures)`,
			);
		}
	}

	/**
	 * Transition to a new circuit state
	 */
	private transitionTo(newState: CircuitState, reason: string): void {
		const oldState = this.state;

		if (oldState === newState) {
			return;
		}

		this.state = newState;

		// Reset counters on state change
		if (newState === CircuitState.CLOSED) {
			this.failureCount = 0;
			this.successCount = 0;
		} else if (newState === CircuitState.HALF_OPEN) {
			this.successCount = 0;
		}

		// Notify state change
		this.onStateChange?.(oldState, newState, reason);

		// Log state change
		console.log(`[CircuitBreaker] ${oldState} → ${newState}: ${reason}`);
	}

	/**
	 * Check if enough time has passed to attempt reset
	 */
	private shouldAttemptReset(): boolean {
		if (!this.lastFailureTime) {
			return false;
		}

		return Date.now() - this.lastFailureTime >= this.resetTimeoutMs;
	}

	/**
	 * Get remaining wait time before reset attempt
	 */
	private getRemainingWaitTime(): number {
		if (!this.lastFailureTime) {
			return 0;
		}

		const elapsed = Date.now() - this.lastFailureTime;
		return Math.max(0, this.resetTimeoutMs - elapsed);
	}

	/**
	 * Get current circuit breaker state
	 */
	getState(): CircuitState {
		return this.state;
	}

	/**
	 * Get circuit breaker statistics
	 */
	getStats(): CircuitBreakerStats {
		return {
			state: this.state,
			failureCount: this.failureCount,
			successCount: this.successCount,
			totalAttempts: this.totalAttempts,
			lastFailureTime: this.lastFailureTime,
			lastSuccessTime: this.lastSuccessTime,
		};
	}

	/**
	 * Manually reset circuit breaker to CLOSED state
	 */
	reset(): void {
		this.transitionTo(CircuitState.CLOSED, 'Manual reset');
		this.failureCount = 0;
		this.successCount = 0;
		this.lastFailureTime = null;
	}

	/**
	 * Manually open circuit breaker
	 */
	open(reason = 'Manual open'): void {
		this.transitionTo(CircuitState.OPEN, reason);
	}
}

