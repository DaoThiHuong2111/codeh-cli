/**
 * Stream Response Use Case
 * Handles streaming AI responses with callbacks
 */

import {IApiClient, StreamChunk} from '../../domain/interfaces/IApiClient';
import {Message} from '../../domain/models/Message';
import {Turn} from '../../domain/models/Turn';

export interface StreamResponseRequest {
	messages: Message[];
	onChunk: (chunk: string) => void;
	onComplete?: (turn: Turn) => void;
	onError?: (error: Error) => void;
}

export interface StreamResponseResponse {
	turn: Turn;
	totalChunks: number;
	totalCharacters: number;
	duration: number;
}

export class StreamResponse {
	constructor(private apiClient: IApiClient) {}

	async execute(
		request: StreamResponseRequest,
	): Promise<StreamResponseResponse> {
		const {messages, onChunk, onComplete, onError} = request;
		const startTime = Date.now();

		let fullContent = '';
		let chunkCount = 0;
		let usage: any = undefined;

		try {
			// Convert messages to API format
			const apiMessages = messages.map(m => ({
				role: m.role,
				content: m.content,
				toolCalls: m.toolCalls,
			}));

			// Stream the response
			const apiResponse = await this.apiClient.streamChat(
				{messages: apiMessages},
				(chunk: StreamChunk) => {
					if (chunk.content) {
						fullContent += chunk.content;
						chunkCount++;
						onChunk(chunk.content);
					}

					if (chunk.done && chunk.usage) {
						usage = chunk.usage;
					}
				},
			);

			// Create response message
			const requestMsg = messages[messages.length - 1]; // Last message is user's
			const responseMsg = Message.assistant(apiResponse.content);

			// Create turn with metadata
			const turn = Turn.create(requestMsg)
				.withResponse(responseMsg)
				.withMetadata({
					duration: Date.now() - startTime,
					tokenUsage:
						usage || apiResponse.usage
							? {
									prompt:
										usage?.promptTokens || apiResponse.usage?.promptTokens || 0,
									completion:
										usage?.completionTokens ||
										apiResponse.usage?.completionTokens ||
										0,
									total:
										usage?.totalTokens || apiResponse.usage?.totalTokens || 0,
								}
							: undefined,
					model: apiResponse.model,
					finishReason: apiResponse.finishReason,
				});

			// Callback on complete
			if (onComplete) {
				onComplete(turn);
			}

			return {
				turn,
				totalChunks: chunkCount,
				totalCharacters: fullContent.length,
				duration: Date.now() - startTime,
			};
		} catch (error) {
			// Callback on error
			if (onError && error instanceof Error) {
				onError(error);
			}

			throw error;
		}
	}
}
