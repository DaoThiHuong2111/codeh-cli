/**
 * Input History Service
 * Manages command/input history for up/down arrow navigation
 */

import {getLogger} from '../../../infrastructure/logging/Logger.js';

const logger = getLogger();

export interface NavigationResult {
	input: string;
	index: number;
}

export class InputHistoryService {
	private history: string[] = [];
	private currentIndex: number = -1;
	private readonly maxHistorySize: number;

	constructor(maxHistorySize: number = 50) {
		logger.debug('InputHistoryService', 'constructor', 'Initializing history service', {
			max_history_size: maxHistorySize,
		});
		this.maxHistorySize = maxHistorySize;
	}

	/**
	 * Add input to history
	 * Ignores empty inputs and duplicates
	 */
	add(input: string): void {
		logger.debug('InputHistoryService', 'add', 'Adding input to history', {
			input_length: input.length,
		});

		// Don't add empty or duplicate inputs
		if (!input.trim()) {
			logger.debug('InputHistoryService', 'add', 'Skipping empty input');
			return;
		}
		if (this.history[0] === input) {
			logger.debug('InputHistoryService', 'add', 'Skipping duplicate input');
			return;
		}

		// Add to beginning of history
		this.history.unshift(input);

		// Limit to max size
		if (this.history.length > this.maxHistorySize) {
			this.history = this.history.slice(0, this.maxHistorySize);
		}

		// Reset index
		this.currentIndex = -1;

		logger.debug('InputHistoryService', 'add', 'Input added to history', {
			history_size: this.history.length,
		});
	}

	/**
	 * Navigate up (to older inputs)
	 * Returns input string if navigation successful, null otherwise
	 */
	navigateUp(): string | null {
		logger.debug('InputHistoryService', 'navigateUp', 'Navigating up', {
			current_index: this.currentIndex,
			history_size: this.history.length,
		});

		if (this.history.length === 0) return null;

		if (this.currentIndex < this.history.length - 1) {
			this.currentIndex++;
			const result = this.history[this.currentIndex];
			logger.debug('InputHistoryService', 'navigateUp', 'Navigation successful', {
				new_index: this.currentIndex,
			});
			return result;
		}

		logger.debug('InputHistoryService', 'navigateUp', 'At end of history');
		return null;
	}

	/**
	 * Navigate down (to newer inputs)
	 * Returns input string if navigation successful, empty string if back to start, null if no change
	 */
	navigateDown(): string | null {
		logger.debug('InputHistoryService', 'navigateDown', 'Navigating down', {
			current_index: this.currentIndex,
			history_size: this.history.length,
		});

		if (this.history.length === 0) return null;

		if (this.currentIndex > 0) {
			this.currentIndex--;
			const result = this.history[this.currentIndex];
			logger.debug('InputHistoryService', 'navigateDown', 'Navigation successful', {
				new_index: this.currentIndex,
			});
			return result;
		} else if (this.currentIndex === 0) {
			// Go back to empty input
			this.currentIndex = -1;
			logger.debug('InputHistoryService', 'navigateDown', 'Back to empty input');
			return '';
		}

		logger.debug('InputHistoryService', 'navigateDown', 'Already at start');
		return null;
	}

	/**
	 * Get current history array (read-only)
	 */
	getHistory(): readonly string[] {
		logger.debug('InputHistoryService', 'getHistory', 'Getting history', {
			history_size: this.history.length,
		});
		return this.history;
	}

	/**
	 * Get current index
	 */
	getCurrentIndex(): number {
		logger.debug('InputHistoryService', 'getCurrentIndex', 'Getting current index', {
			current_index: this.currentIndex,
		});
		return this.currentIndex;
	}

	/**
	 * Clear all history
	 */
	clear(): void {
		logger.info('InputHistoryService', 'clear', 'Clearing history', {
			items_cleared: this.history.length,
		});
		this.history = [];
		this.currentIndex = -1;
	}

	/**
	 * Get history size
	 */
	size(): number {
		const size = this.history.length;
		logger.debug('InputHistoryService', 'size', 'Getting history size', {
			size,
		});
		return size;
	}
}
