/**
 * ChatContext - Global chat state management
 */

import React, {createContext, useContext, useCallback, ReactNode} from 'react';
import {useHistory} from '../hooks/useHistory';
import {useStreamChat} from '../hooks/useStreamChat';
import type {
	IApiClient,
	ApiRequest,
} from '../../../../core/domain/interfaces/IApiClient';
import type {HistoryItem, PendingItem, Provider} from '../types';

/**
 * Chat context value
 */
export interface ChatContextValue {
	/** Chat history */
	history: HistoryItem[];
	/** Currently pending/streaming item */
	pendingItem: PendingItem | null;
	/** Whether currently streaming */
	isStreaming: boolean;
	/** Error if any */
	error: Error | null;
	/** Current provider */
	provider: Provider;
	/** Send a message */
	sendMessage: (content: string) => Promise<void>;
	/** Cancel ongoing stream */
	cancelStream: () => void;
	/** Clear chat history */
	clearHistory: () => void;
}

/**
 * Chat context
 */
const ChatContext = createContext<ChatContextValue | undefined>(undefined);

/**
 * Chat provider props
 */
export interface ChatProviderProps {
	/** API client instance */
	apiClient: IApiClient;
	/** Current provider */
	provider: Provider;
	/** Default request options */
	defaultRequest?: Partial<ApiRequest>;
	/** Children components */
	children: ReactNode;
}

/**
 * ChatProvider - Provides chat state and methods
 */
export const ChatProvider: React.FC<ChatProviderProps> = ({
	apiClient,
	provider,
	defaultRequest,
	children,
}) => {
	// History management
	const {
		history,
		pendingItem,
		addUserMessage,
		setPendingItem,
		updatePendingContent,
		completePending,
		clearHistory,
	} = useHistory({
		enablePersistence: false,
		maxItems: 100,
	});

	// Streaming management
	const {
		isStreaming,
		streamingContent,
		error,
		finalResponse,
		sendMessage: sendStreamMessage,
		cancelStream: cancelStreamInternal,
	} = useStreamChat({
		apiClient,
		defaultRequest,
		onChunkReceived: chunk => {
			// Update pending content as chunks arrive
			if (chunk.content) {
				updatePendingContent(streamingContent + chunk.content);
			}
		},
		onComplete: response => {
			// Complete pending and add to history
			completePending(response.content, response.usage);
		},
		onError: err => {
			// Keep error in streaming state
			console.error('Streaming error:', err);
		},
	});

	/**
	 * Send message handler
	 */
	const sendMessage = useCallback(
		async (content: string) => {
			// Add user message to history
			addUserMessage(content, provider);

			// Create pending item for streaming
			setPendingItem({
				type: 'message',
				userMessage: content,
				streamingContent: '',
				isStreaming: true,
				provider,
				timestamp: new Date(),
			});

			// Start streaming
			await sendStreamMessage(content);
		},
		[provider, addUserMessage, setPendingItem, sendStreamMessage],
	);

	/**
	 * Cancel stream handler
	 */
	const cancelStream = useCallback(() => {
		cancelStreamInternal();
		setPendingItem(null);
	}, [cancelStreamInternal, setPendingItem]);

	const value: ChatContextValue = {
		history,
		pendingItem,
		isStreaming,
		error,
		provider,
		sendMessage,
		cancelStream,
		clearHistory,
	};

	return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

/**
 * useChat hook - Access chat context
 */
export function useChat(): ChatContextValue {
	const context = useContext(ChatContext);

	if (!context) {
		throw new Error('useChat must be used within ChatProvider');
	}

	return context;
}
