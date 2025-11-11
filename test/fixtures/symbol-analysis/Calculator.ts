/**
 * Calculator - Performs arithmetic operations
 */

export class Calculator {
	private history: string[] = [];

	/**
	 * Add two numbers
	 */
	add(a: number, b: number): number {
		const result = a + b;
		this.recordOperation(`${a} + ${b} = ${result}`);
		return result;
	}

	/**
	 * Subtract two numbers
	 */
	subtract(a: number, b: number): number {
		const result = a - b;
		this.recordOperation(`${a} - ${b} = ${result}`);
		return result;
	}

	/**
	 * Multiply two numbers
	 */
	multiply(a: number, b: number): number {
		const result = a * b;
		this.recordOperation(`${a} * ${b} = ${result}`);
		return result;
	}

	/**
	 * Divide two numbers
	 */
	divide(a: number, b: number): number {
		if (b === 0) {
			throw new Error('Division by zero');
		}
		const result = a / b;
		this.recordOperation(`${a} / ${b} = ${result}`);
		return result;
	}

	/**
	 * Get calculation history
	 */
	getHistory(): string[] {
		return [...this.history];
	}

	/**
	 * Clear history
	 */
	clearHistory(): void {
		this.history = [];
	}

	/**
	 * Record operation in history
	 */
	private recordOperation(operation: string): void {
		this.history.push(operation);
	}
}
