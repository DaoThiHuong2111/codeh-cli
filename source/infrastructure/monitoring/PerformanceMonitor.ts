/**
 * Performance Monitoring System
 * Tracks operation performance and provides statistics
 */

export interface Metric {
	operation: string;
	duration: number;
	success: boolean;
	error?: string;
	context?: Record<string, any>;
	timestamp: number;
}

export interface PerformanceStats {
	count: number;
	avgDuration: number;
	minDuration: number;
	maxDuration: number;
	p50: number;
	p95: number;
	p99: number;
	successRate: number;
	errorRate: number;
	totalDuration: number;
}

/**
 * Performance monitor for tracking operation metrics
 *
 * @example
 * ```typescript
 * const monitor = new PerformanceMonitor();
 *
 * const result = await monitor.measure(
 *   'api_call',
 *   () => apiClient.sendMessage(messages),
 *   { endpoint: '/chat' }
 * );
 *
 * const stats = monitor.getStats('api_call');
 * console.log(`Average duration: ${stats.avgDuration}ms`);
 * console.log(`Success rate: ${stats.successRate * 100}%`);
 * ```
 */
export class PerformanceMonitor {
	private metrics = new Map<string, Metric[]>();
	private maxMetricsPerOperation: number;

	constructor(maxMetricsPerOperation = 1000) {
		this.maxMetricsPerOperation = maxMetricsPerOperation;
	}

	/**
	 * Measure the performance of an async operation
	 *
	 * @param operationName - Name of the operation
	 * @param fn - Async function to measure
	 * @param context - Additional context for the metric
	 * @returns Result of the function
	 */
	async measure<T>(
		operationName: string,
		fn: () => Promise<T>,
		context?: Record<string, any>,
	): Promise<T> {
		const start = performance.now();

		try {
			const result = await fn();
			const duration = performance.now() - start;

			this.recordMetric({
				operation: operationName,
				duration,
				success: true,
				context,
				timestamp: Date.now(),
			});

			return result;
		} catch (error) {
			const duration = performance.now() - start;

			this.recordMetric({
				operation: operationName,
				duration,
				success: false,
				error: (error as Error).message,
				context,
				timestamp: Date.now(),
			});

			throw error;
		}
	}

	/**
	 * Measure a synchronous operation
	 */
	measureSync<T>(
		operationName: string,
		fn: () => T,
		context?: Record<string, any>,
	): T {
		const start = performance.now();

		try {
			const result = fn();
			const duration = performance.now() - start;

			this.recordMetric({
				operation: operationName,
				duration,
				success: true,
				context,
				timestamp: Date.now(),
			});

			return result;
		} catch (error) {
			const duration = performance.now() - start;

			this.recordMetric({
				operation: operationName,
				duration,
				success: false,
				error: (error as Error).message,
				context,
				timestamp: Date.now(),
			});

			throw error;
		}
	}

	/**
	 * Record a metric
	 */
	private recordMetric(metric: Metric): void {
		const metrics = this.metrics.get(metric.operation) || [];
		metrics.push(metric);

		// Keep only recent metrics
		if (metrics.length > this.maxMetricsPerOperation) {
			metrics.shift();
		}

		this.metrics.set(metric.operation, metrics);
	}

	/**
	 * Get statistics for a specific operation
	 */
	getStats(operationName: string): PerformanceStats | null {
		const metrics = this.metrics.get(operationName);

		if (!metrics || metrics.length === 0) {
			return null;
		}

		const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
		const successCount = metrics.filter(m => m.success).length;
		const totalDuration = durations.reduce((sum, d) => sum + d, 0);

		return {
			count: metrics.length,
			avgDuration: totalDuration / metrics.length,
			minDuration: durations[0],
			maxDuration: durations[durations.length - 1],
			p50: this.percentile(durations, 0.5),
			p95: this.percentile(durations, 0.95),
			p99: this.percentile(durations, 0.99),
			successRate: successCount / metrics.length,
			errorRate: (metrics.length - successCount) / metrics.length,
			totalDuration,
		};
	}

	/**
	 * Get statistics for all operations
	 */
	getAllStats(): Record<string, PerformanceStats | null> {
		const allStats: Record<string, PerformanceStats | null> = {};

		for (const [operation] of this.metrics) {
			allStats[operation] = this.getStats(operation);
		}

		return allStats;
	}

	/**
	 * Get recent metrics for an operation
	 */
	getRecentMetrics(operationName: string, limit = 10): Metric[] {
		const metrics = this.metrics.get(operationName) || [];
		return metrics.slice(-limit);
	}

	/**
	 * Clear metrics for an operation
	 */
	clear(operationName?: string): void {
		if (operationName) {
			this.metrics.delete(operationName);
		} else {
			this.metrics.clear();
		}
	}

	/**
	 * Get list of all tracked operations
	 */
	getOperations(): string[] {
		return Array.from(this.metrics.keys());
	}

	/**
	 * Calculate percentile
	 */
	private percentile(sortedValues: number[], p: number): number {
		if (sortedValues.length === 0) {
			return 0;
		}

		const index = Math.ceil(sortedValues.length * p) - 1;
		return sortedValues[Math.max(0, index)];
	}

	/**
	 * Format stats as a readable string
	 */
	formatStats(stats: PerformanceStats): string {
		return `
Performance Stats:
  Count: ${stats.count}
  Average: ${stats.avgDuration.toFixed(2)}ms
  Min: ${stats.minDuration.toFixed(2)}ms
  Max: ${stats.maxDuration.toFixed(2)}ms
  P50: ${stats.p50.toFixed(2)}ms
  P95: ${stats.p95.toFixed(2)}ms
  P99: ${stats.p99.toFixed(2)}ms
  Success Rate: ${(stats.successRate * 100).toFixed(1)}%
  Error Rate: ${(stats.errorRate * 100).toFixed(1)}%
`.trim();
	}

	/**
	 * Print stats to console
	 */
	printStats(operationName?: string): void {
		if (operationName) {
			const stats = this.getStats(operationName);
			if (stats) {
				console.log(`\n=== ${operationName} ===`);
				console.log(this.formatStats(stats));
			} else {
				console.log(`No metrics found for: ${operationName}`);
			}
		} else {
			const allStats = this.getAllStats();
			for (const [operation, stats] of Object.entries(allStats)) {
				if (stats) {
					console.log(`\n=== ${operation} ===`);
					console.log(this.formatStats(stats));
				}
			}
		}
	}
}

/**
 * Global performance monitor instance
 */
export const globalPerformanceMonitor = new PerformanceMonitor();

/**
 * Decorator for measuring method performance
 */
export function Measure(operationName?: string) {
	return function (
		target: any,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) {
		const originalMethod = descriptor.value;
		const opName = operationName || `${target.constructor.name}.${propertyKey}`;

		descriptor.value = async function (...args: any[]) {
			return globalPerformanceMonitor.measure(opName, () =>
				originalMethod.apply(this, args),
			);
		};

		return descriptor;
	};
}
