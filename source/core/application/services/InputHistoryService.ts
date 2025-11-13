/**
 * Input History Service
 * Manages command/input history for up/down arrow navigation
 */

export interface NavigationResult {
	input: string;
	index: number;
}

export class InputHistoryService {
	private history: string[] = [];
	private currentIndex: number = -1;
	private readonly maxHistorySize: number;

	constructor(maxHistorySize: number = 50) {
		this.maxHistorySize = maxHistorySize;
	}

	/**
	 * Add input to history
	 * Ignores empty inputs and duplicates
	 */
	add(input: string): void {
		// Don't add empty or duplicate inputs
		if (!input.trim()) return;
		if (this.history[0] === input) return;

		// Add to beginning of history
		this.history.unshift(input);

		// Limit to max size
		if (this.history.length > this.maxHistorySize) {
			this.history = this.history.slice(0, this.maxHistorySize);
		}

		// Reset index
		this.currentIndex = -1;
	}

	/**
	 * Navigate up (to older inputs)
	 * Returns input string if navigation successful, null otherwise
	 */
	navigateUp(): string | null {
		if (this.history.length === 0) return null;

		if (this.currentIndex < this.history.length - 1) {
			this.currentIndex++;
			return this.history[this.currentIndex];
		}

		return null;
	}

	/**
	 * Navigate down (to newer inputs)
	 * Returns input string if navigation successful, empty string if back to start, null if no change
	 */
	navigateDown(): string | null {
		if (this.history.length === 0) return null;

		if (this.currentIndex > 0) {
			this.currentIndex--;
			return this.history[this.currentIndex];
		} else if (this.currentIndex === 0) {
			// Go back to empty input
			this.currentIndex = -1;
			return '';
		}

		return null;
	}

	/**
	 * Get current history array (read-only)
	 */
	getHistory(): readonly string[] {
		return this.history;
	}

	/**
	 * Get current index
	 */
	getCurrentIndex(): number {
		return this.currentIndex;
	}

	/**
	 * Clear all history
	 */
	clear(): void {
		this.history = [];
		this.currentIndex = -1;
	}

	/**
	 * Get history size
	 */
	size(): number {
		return this.history.length;
	}
}
