/**
 * useHistory hook
 * Manages chat history with optional persistence
 */

import {useState, useCallback, useEffect} from 'react';
import {
	saveHistoryToFile,
	loadHistoryFromFile,
	clearHistoryFile,
} from '../utils/storage';
import type {
	HistoryItem,
	PendingItem,
	Provider,
	UsageStats,
	HistoryItemType,
} from '../types';

export interface UseHistoryOptions {
	/** Enable persistence to storage */
	enablePersistence?: boolean;
	/** Storage key for persistence */
	storageKey?: string;
	/** Maximum history items to keep */
	maxItems?: number;
}

export interface UseHistoryReturn {
	/** Chat history items */
	history: HistoryItem[];
	/** Currently pending/streaming item */
	pendingItem: PendingItem | null;
	/** Add user message to history */
	addUserMessage: (message: string, provider: Provider) => void;
	/** Add assistant message to history */
	addAssistantMessage: (
		message: string,
		provider: Provider,
		usage?: UsageStats,
	) => void;
	/** Add system message to history */
	addSystemMessage: (message: string, type?: HistoryItemType) => void;
	/** Set pending item (for streaming) */
	setPendingItem: (item: PendingItem | null) => void;
	/** Update pending item's streaming content */
	updatePendingContent: (content: string) => void;
	/** Complete pending item and add to history */
	completePending: (finalMessage: string, usage?: UsageStats) => void;
	/** Clear all history */
	clearHistory: () => void;
}

/**
 * Hook for managing chat history
 */
export function useHistory(
	options: UseHistoryOptions = {},
): UseHistoryReturn {
	const {
		enablePersistence = false,
		storageKey = 'chat-history',
		maxItems = 100,
	} = options;

	const [history, setHistory] = useState<HistoryItem[]>([]);
	const [pendingItem, setPendingItemState] = useState<PendingItem | null>(
		null,
	);
	const [nextId, setNextId] = useState(1);

	// Load history from storage on mount
	useEffect(() => {
		if (enablePersistence) {
			loadHistory();
		}
	}, [enablePersistence]);

	// Save history to storage when it changes
	useEffect(() => {
		if (enablePersistence && history.length > 0) {
			saveHistory();
		}
	}, [history, enablePersistence]);

	/**
	 * Add user message
	 */
	const addUserMessage = useCallback(
		(message: string, provider: Provider) => {
			const item: HistoryItem = {
				id: nextId,
				type: 'message',
				userMessage: message,
				provider,
				timestamp: new Date(),
			};

			setHistory(prev => limitHistory([...prev, item]));
			setNextId(prev => prev + 1);
		},
		[nextId, maxItems],
	);

	/**
	 * Add assistant message
	 */
	const addAssistantMessage = useCallback(
		(message: string, provider: Provider, usage?: UsageStats) => {
			const item: HistoryItem = {
				id: nextId,
				type: 'message',
				assistantMessage: message,
				provider,
				timestamp: new Date(),
				usage,
				finishReason: 'stop',
			};

			setHistory(prev => limitHistory([...prev, item]));
			setNextId(prev => prev + 1);
		},
		[nextId, maxItems],
	);

	/**
	 * Add system message
	 */
	const addSystemMessage = useCallback(
		(message: string, type: HistoryItemType = 'system') => {
			const item: HistoryItem = {
				id: nextId,
				type,
				systemMessage: message,
				provider: 'generic',
				timestamp: new Date(),
			};

			setHistory(prev => limitHistory([...prev, item]));
			setNextId(prev => prev + 1);
		},
		[nextId, maxItems],
	);

	/**
	 * Set pending item
	 */
	const setPendingItem = useCallback((item: PendingItem | null) => {
		setPendingItemState(item);
	}, []);

	/**
	 * Update pending item's streaming content
	 */
	const updatePendingContent = useCallback((content: string) => {
		setPendingItemState(prev =>
			prev
				? {
						...prev,
						streamingContent: content,
					}
				: null,
		);
	}, []);

	/**
	 * Complete pending item and add to history
	 */
	const completePending = useCallback(
		(finalMessage: string, usage?: UsageStats) => {
			if (!pendingItem) return;

			const item: HistoryItem = {
				id: nextId,
				type: 'message',
				userMessage: pendingItem.userMessage,
				assistantMessage: finalMessage,
				provider: pendingItem.provider,
				timestamp: new Date(),
				usage,
				finishReason: 'stop',
			};

			setHistory(prev => limitHistory([...prev, item]));
			setNextId(prev => prev + 1);
			setPendingItemState(null);
		},
		[pendingItem, nextId, maxItems],
	);

	/**
	 * Clear all history
	 */
	const clearHistory = useCallback(() => {
		setHistory([]);
		setPendingItemState(null);
		setNextId(1);

		if (enablePersistence) {
			clearHistoryFile(storageKey);
		}
	}, [enablePersistence, storageKey]);

	/**
	 * Load history from storage
	 */
	const loadHistory = useCallback(() => {
		try {
			const loaded = loadHistoryFromFile(storageKey);
			if (loaded.length > 0) {
				setHistory(limitHistory(loaded));
				// Update nextId based on loaded history
				const maxId = Math.max(...loaded.map(item => item.id), 0);
				setNextId(maxId + 1);
			}
		} catch (error) {
			console.error('Failed to load history:', error);
		}
	}, [storageKey, maxItems]);

	/**
	 * Save history to storage
	 */
	const saveHistory = useCallback(() => {
		try {
			saveHistoryToFile(storageKey, history);
		} catch (error) {
			console.error('Failed to save history:', error);
		}
	}, [storageKey, history]);

	/**
	 * Limit history to max items
	 */
	function limitHistory(items: HistoryItem[]): HistoryItem[] {
		if (items.length <= maxItems) return items;
		return items.slice(items.length - maxItems);
	}

	return {
		history,
		pendingItem,
		addUserMessage,
		addAssistantMessage,
		addSystemMessage,
		setPendingItem,
		updatePendingContent,
		completePending,
		clearHistory,
	};
}
