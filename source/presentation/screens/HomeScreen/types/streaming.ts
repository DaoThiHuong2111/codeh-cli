/**
 * Streaming-related types
 */

import type {StreamChunk} from '../../../../core/domain/interfaces/IApiClient';

/**
 * Streaming state
 */
export interface StreamState {
	isStreaming: boolean;
	content: string;
	error: Error | null;
}

/**
 * Chunk handler callback type
 */
export type StreamChunkHandler = (chunk: StreamChunk) => void;

/**
 * Streaming completion callback
 */
export type StreamCompleteHandler = (finalContent: string) => void;

/**
 * Streaming error callback
 */
export type StreamErrorHandler = (error: Error) => void;

/**
 * Streaming options
 */
export interface StreamingOptions {
	onChunkReceived?: StreamChunkHandler;
	onComplete?: StreamCompleteHandler;
	onError?: StreamErrorHandler;
	debounceDelay?: number;
}

/**
 * Stream control methods
 */
export interface StreamControl {
	isStreaming: boolean;
	streamingContent: string;
	error: Error | null;
	cancelStream: () => void;
}
