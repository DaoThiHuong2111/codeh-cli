/**
 * useStreamChat hook
 * Manages streaming chat interactions with AI providers
 */

import {useState, useCallback, useRef} from 'react';
import type {
	IApiClient,
	ApiRequest,
	ApiResponse,
	StreamChunk,
} from '../../../../core/domain/interfaces/IApiClient';

export interface UseStreamChatOptions {
	/** API client instance */
	apiClient: IApiClient;
	/** Default request options */
	defaultRequest?: Partial<ApiRequest>;
	/** Callback when chunk is received */
	onChunkReceived?: (chunk: StreamChunk) => void;
	/** Callback when streaming completes */
	onComplete?: (response: ApiResponse) => void;
	/** Callback when error occurs */
	onError?: (error: Error) => void;
}

export interface UseStreamChatReturn {
	/** Whether currently streaming */
	isStreaming: boolean;
	/** Accumulated streaming content */
	streamingContent: string;
	/** Error if any */
	error: Error | null;
	/** Final response after streaming completes */
	finalResponse: ApiResponse | null;
	/** Send a message and start streaming */
	sendMessage: (
		content: string,
		options?: Partial<ApiRequest>,
	) => Promise<void>;
	/** Cancel ongoing stream */
	cancelStream: () => void;
	/** Reset state */
	reset: () => void;
}

/**
 * Hook for managing streaming chat with AI providers
 */
export function useStreamChat(
	options: UseStreamChatOptions,
): UseStreamChatReturn {
	const {apiClient, defaultRequest, onChunkReceived, onComplete, onError} =
		options;

	const [isStreaming, setIsStreaming] = useState(false);
	const [streamingContent, setStreamingContent] = useState('');
	const [error, setError] = useState<Error | null>(null);
	const [finalResponse, setFinalResponse] = useState<ApiResponse | null>(null);

	const cancelledRef = useRef(false);

	/**
	 * Send message and start streaming
	 */
	const sendMessage = useCallback(
		async (content: string, requestOptions?: Partial<ApiRequest>) => {
			setIsStreaming(true);
			setStreamingContent('');
			setError(null);
			setFinalResponse(null);
			cancelledRef.current = false;

			try {
				const request: ApiRequest = {
					messages: [{role: 'user', content}],
					stream: true,
					...defaultRequest,
					...requestOptions,
				};

				const response = await apiClient.streamChat(request, chunk => {
					if (cancelledRef.current) return;

					if (chunk.content) {
						setStreamingContent(prev => prev + chunk.content);
					}

					onChunkReceived?.(chunk);
				});

				if (cancelledRef.current) {
					return;
				}

				setFinalResponse(response);
				setIsStreaming(false);
				onComplete?.(response);
			} catch (err) {
				if (cancelledRef.current) {
					return;
				}

				const error = err instanceof Error ? err : new Error(String(err));
				setError(error);
				setIsStreaming(false);
				onError?.(error);
			}
		},
		[apiClient, defaultRequest, onChunkReceived, onComplete, onError],
	);

	/**
	 * Cancel ongoing stream
	 */
	const cancelStream = useCallback(() => {
		cancelledRef.current = true;
		setIsStreaming(false);
	}, []);

	/**
	 * Reset all state
	 */
	const reset = useCallback(() => {
		setIsStreaming(false);
		setStreamingContent('');
		setError(null);
		setFinalResponse(null);
		cancelledRef.current = false;
	}, []);

	return {
		isStreaming,
		streamingContent,
		error,
		finalResponse,
		sendMessage,
		cancelStream,
		reset,
	};
}
