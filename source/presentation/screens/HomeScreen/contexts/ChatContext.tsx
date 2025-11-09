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

	const accumulatedContentRef = React.useRef('');

	const {
		isStreaming,
		error,
		sendMessage: sendStreamMessage,
		cancelStream: cancelStreamInternal,
	} = useStreamChat({
		apiClient,
		defaultRequest,
		onChunkReceived: chunk => {
			if (chunk.content) {
				accumulatedContentRef.current += chunk.content;
				updatePendingContent(accumulatedContentRef.current);
			}
		},
		onComplete: response => {
			completePending(response.content, response.usage);
			accumulatedContentRef.current = '';
		},
		onError: err => {
			console.error('Streaming error:', err);
			accumulatedContentRef.current = '';
		},
	});

	/**
	 * Send message handler
	 */
	const sendMessage = useCallback(
		async (content: string) => {
			accumulatedContentRef.current = '';

			addUserMessage(content, provider);

			setPendingItem({
				type: 'message',
				userMessage: content,
				streamingContent: '',
				isStreaming: true,
				provider,
				timestamp: new Date(),
			});

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
		accumulatedContentRef.current = '';
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
