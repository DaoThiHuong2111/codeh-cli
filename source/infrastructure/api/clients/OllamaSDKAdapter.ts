/**
 * Ollama SDK Adapter
 * Wraps official ollama SDK to implement IApiClient interface
 */

import {Ollama} from 'ollama';
import {
	IApiClient,
	ApiRequest,
	ApiResponse,
	StreamChunk,
	ToolCall,
} from '../../../core/domain/interfaces/IApiClient.js';
import {getLogger} from '../../logging/Logger.js';

const logger = getLogger();

export class OllamaSDKAdapter implements IApiClient {
	private sdk: Ollama;

	constructor(baseURL: string = 'http://localhost:11434') {
		logger.info('OllamaSDKAdapter', 'constructor', 'Initializing Ollama adapter', {
			baseURL,
		});

		// Extract host from baseURL
		const host = baseURL.replace(/\/$/, ''); // Remove trailing slash
		this.sdk = new Ollama({host});

		logger.debug('OllamaSDKAdapter', 'constructor', 'Ollama SDK initialized', {
			host,
		});
	}

	async chat(request: ApiRequest): Promise<ApiResponse> {
		const start = Date.now();
		logger.info('OllamaSDKAdapter', 'chat', 'Starting chat request', {
			model: request.model || 'llama2',
			message_count: request.messages.length,
			has_system_prompt: !!request.systemPrompt,
			has_tools: !!request.tools,
			tools_count: request.tools?.length || 0,
			temperature: request.temperature,
			max_tokens: request.maxTokens,
		});

		// Log full input messages for conversation tracking
		logger.info('OllamaSDKAdapter', 'chat', 'Input messages', {
			messages: request.messages,
			system_prompt: request.systemPrompt,
		});

		try {
			// Transform messages - add system prompt as first message if exists
			const messages = this.transformMessages(request);

			logger.debug('OllamaSDKAdapter', 'chat', 'Messages transformed', {
				transformed_count: messages.length,
			});

			const ollamaRequest: any = {
				model: request.model || 'llama2',
				messages,
				stream: false,
				options: {
					temperature: request.temperature,
					num_predict: request.maxTokens,
				},
				tools: request.tools
					? request.tools.map((tool) => ({
							type: 'function',
							function: {
								name: tool.name,
								description: tool.description,
								parameters: tool.parameters,
							},
						}))
					: undefined,
			};

			// Remove undefined fields
			Object.keys(ollamaRequest).forEach((key) => {
				if (ollamaRequest[key] === undefined) {
					delete ollamaRequest[key];
				}
			});

			logger.debug('OllamaSDKAdapter', 'chat', 'Sending request to Ollama');

			const response = await this.sdk.chat(ollamaRequest);

			const duration = Date.now() - start;
			logger.info('OllamaSDKAdapter', 'chat', 'Ollama response received', {
				duration_ms: duration,
				model: (response as any).model,
				prompt_tokens: (response as any).prompt_eval_count || 0,
				completion_tokens: (response as any).eval_count || 0,
			});

			// Normalize response to get content
			const normalizedResponse = this.normalizeResponse(response as any, request);

			// Log full response content for conversation tracking
			logger.info('OllamaSDKAdapter', 'chat', 'Response content', {
				content: normalizedResponse.content,
				tool_calls: normalizedResponse.toolCalls,
				finish_reason: normalizedResponse.finishReason,
			});

			return normalizedResponse;
		} catch (error) {
			const duration = Date.now() - start;
			logger.error('OllamaSDKAdapter', 'chat', 'Chat request failed', {
				duration_ms: duration,
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
			});
			throw this.transformError(error);
		}
	}

	async streamChat(
		request: ApiRequest,
		onChunk: (chunk: StreamChunk) => void,
	): Promise<ApiResponse> {
		const start = Date.now();
		let firstChunkTime: number | null = null;
		let chunkCount = 0;

		logger.info('OllamaSDKAdapter', 'streamChat', 'Starting stream chat request', {
			model: request.model || 'llama2',
			message_count: request.messages.length,
			has_system_prompt: !!request.systemPrompt,
			has_tools: !!request.tools,
			tools_count: request.tools?.length || 0,
			temperature: request.temperature,
			max_tokens: request.maxTokens,
		});

		try {
			// Transform messages - add system prompt as first message if exists
			const messages = this.transformMessages(request);

			logger.debug('OllamaSDKAdapter', 'streamChat', 'Messages transformed', {
				transformed_count: messages.length,
			});

			const ollamaRequest: any = {
				model: request.model || 'llama2',
				messages,
				stream: true,
				options: {
					temperature: request.temperature,
					num_predict: request.maxTokens,
				},
				tools: request.tools
					? request.tools.map((tool) => ({
							type: 'function',
							function: {
								name: tool.name,
								description: tool.description,
								parameters: tool.parameters,
							},
						}))
					: undefined,
			};

			// Remove undefined fields
			Object.keys(ollamaRequest).forEach((key) => {
				if (ollamaRequest[key] === undefined) {
					delete ollamaRequest[key];
				}
			});

			let fullContent = '';
			let modelName = request.model || 'llama2';
			let totalDuration = 0;
			let promptEvalCount = 0;
			let evalCount = 0;
			const toolCalls: ToolCall[] = [];

			logger.debug('OllamaSDKAdapter', 'streamChat', 'Creating stream');
			const stream = await this.sdk.chat(ollamaRequest);
			logger.debug('OllamaSDKAdapter', 'streamChat', 'Stream created, waiting for chunks');

			for await (const chunk of stream) {
				if (chunk.message?.content) {
					if (chunkCount === 0) {
						firstChunkTime = Date.now();
						logger.info('OllamaSDKAdapter', 'streamChat', 'First chunk received (TTFT)', {
							ttft_ms: firstChunkTime - start,
						});
					}

					chunkCount++;
					fullContent += chunk.message.content;
					onChunk({
						content: chunk.message.content,
						done: false,
					});

					if (chunkCount % 10 === 0) {
						logger.debug('OllamaSDKAdapter', 'streamChat', 'Chunk milestone', {
							chunks_received: chunkCount,
							content_length: fullContent.length,
						});
					}
				}

				// Handle tool calls
				if (chunk.message?.tool_calls) {
					logger.debug('OllamaSDKAdapter', 'streamChat', 'Tool calls received', {
						tool_calls_count: chunk.message.tool_calls.length,
					});

					for (const toolCall of chunk.message.tool_calls) {
						toolCalls.push({
							id: `ollama-${Date.now()}-${Math.random()}`,
							name: toolCall.function.name,
							arguments: toolCall.function.arguments,
						});
					}
				}

				if (chunk.model) {
					modelName = chunk.model;
				}

				if (chunk.done) {
					totalDuration = chunk.total_duration || 0;
					promptEvalCount = chunk.prompt_eval_count || 0;
					evalCount = chunk.eval_count || 0;

					logger.debug('OllamaSDKAdapter', 'streamChat', 'Stream done', {
						total_duration_ns: totalDuration,
						prompt_tokens: promptEvalCount,
						completion_tokens: evalCount,
					});

					onChunk({
						done: true,
						usage: {
							promptTokens: promptEvalCount,
							completionTokens: evalCount,
							totalTokens: promptEvalCount + evalCount,
						},
					});
				}
			}

			const duration = Date.now() - start;
			logger.info('OllamaSDKAdapter', 'streamChat', 'Stream completed successfully', {
				duration_ms: duration,
				ttft_ms: firstChunkTime ? firstChunkTime - start : null,
				chunks_received: chunkCount,
				content_length: fullContent.length,
				tool_calls_count: toolCalls.length,
				model: modelName,
			});

			return {
				content: fullContent,
				model: modelName,
				usage: {
					promptTokens: promptEvalCount,
					completionTokens: evalCount,
					totalTokens: promptEvalCount + evalCount,
				},
				finishReason: 'stop',
				toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
			};
		} catch (error) {
			const duration = Date.now() - start;
			logger.error('OllamaSDKAdapter', 'streamChat', 'Stream failed', {
				duration_ms: duration,
				ttft_ms: firstChunkTime ? firstChunkTime - start : null,
				chunks_received: chunkCount,
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
			});
			throw this.transformError(error);
		}
	}

	async healthCheck(): Promise<boolean> {
		const start = Date.now();
		logger.info('OllamaSDKAdapter', 'healthCheck', 'Running health check');

		try {
			// Use tags endpoint to check if Ollama is running
			await this.sdk.list();

			const duration = Date.now() - start;
			logger.info('OllamaSDKAdapter', 'healthCheck', 'Health check passed', {
				duration_ms: duration,
			});

			return true;
		} catch (error) {
			const duration = Date.now() - start;
			logger.error('OllamaSDKAdapter', 'healthCheck', 'Health check failed', {
				duration_ms: duration,
				error: error instanceof Error ? error.message : String(error),
			});
			return false;
		}
	}

	getProviderName(): string {
		logger.debug('OllamaSDKAdapter', 'getProviderName', 'Returning provider name', {
			provider: 'ollama',
		});
		return 'ollama';
	}

	async getAvailableModels(): Promise<string[]> {
		const start = Date.now();
		logger.info('OllamaSDKAdapter', 'getAvailableModels', 'Fetching available models');

		try {
			const response = await this.sdk.list();
			const models = response.models.map((model) => model.name);

			const duration = Date.now() - start;
			logger.info('OllamaSDKAdapter', 'getAvailableModels', 'Models fetched', {
				duration_ms: duration,
				model_count: models.length,
			});

			return models;
		} catch (error) {
			const duration = Date.now() - start;
			logger.error('OllamaSDKAdapter', 'getAvailableModels', 'Failed to fetch models', {
				duration_ms: duration,
				error: error instanceof Error ? error.message : String(error),
			});
			return [];
		}
	}

	private transformMessages(request: ApiRequest): any[] {
		logger.debug('OllamaSDKAdapter', 'transformMessages', 'Transforming messages', {
			input_count: request.messages.length,
			has_system_prompt: !!request.systemPrompt,
		});

		const messages: any[] = [];

		// Add system prompt as first message if exists
		if (request.systemPrompt) {
			logger.debug('OllamaSDKAdapter', 'transformMessages', 'Adding system prompt');
			messages.push({
				role: 'system',
				content: request.systemPrompt,
			});
		}

		// Transform request messages
		for (const msg of request.messages) {
			messages.push({
				role: msg.role === 'error' ? 'user' : msg.role,
				content: msg.content,
				...(msg.toolCalls && {
					tool_calls: msg.toolCalls.map((tc) => ({
						function: {
							name: tc.name,
							arguments: tc.arguments,
						},
					})),
				}),
			});

			if (msg.toolCalls) {
				logger.debug('OllamaSDKAdapter', 'transformMessages', 'Message with tool calls', {
					role: msg.role,
					tool_calls_count: msg.toolCalls.length,
				});
			}
		}

		logger.debug('OllamaSDKAdapter', 'transformMessages', 'Messages transformed', {
			output_count: messages.length,
		});

		return messages;
	}

	private normalizeResponse(response: any, request: ApiRequest): ApiResponse {
		logger.debug('OllamaSDKAdapter', 'normalizeResponse', 'Normalizing response', {
			has_message: !!response.message,
		});

		const message = response.message;
		const toolCalls: ToolCall[] = [];

		if (message?.tool_calls) {
			logger.debug('OllamaSDKAdapter', 'normalizeResponse', 'Processing tool calls', {
				tool_calls_count: message.tool_calls.length,
			});

			for (const toolCall of message.tool_calls) {
				toolCalls.push({
					id: `ollama-${Date.now()}-${Math.random()}`,
					name: toolCall.function.name,
					arguments: toolCall.function.arguments,
				});
			}
		}

		const normalized: ApiResponse = {
			content: message?.content || '',
			model: response.model || request.model || 'llama2',
			usage: {
				promptTokens: response.prompt_eval_count || 0,
				completionTokens: response.eval_count || 0,
				totalTokens:
					(response.prompt_eval_count || 0) + (response.eval_count || 0),
			},
			finishReason: response.done ? 'stop' : 'length',
			toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
		};

		logger.debug('OllamaSDKAdapter', 'normalizeResponse', 'Response normalized', {
			content_length: normalized.content.length,
			tool_calls_count: toolCalls.length,
			total_tokens: normalized.usage?.totalTokens || 0,
		});

		return normalized;
	}

	private transformError(error: unknown): Error {
		logger.debug('OllamaSDKAdapter', 'transformError', 'Transforming error', {
			error_type: error instanceof Error ? error.constructor.name : typeof error,
		});

		let transformed: Error;

		if (error instanceof Error) {
			transformed = new Error(`Ollama Error: ${error.message}`);
			logger.error('OllamaSDKAdapter', 'transformError', 'Ollama Error', {
				message: error.message,
				stack: error.stack,
			});
		} else {
			transformed = new Error(String(error));
			logger.error('OllamaSDKAdapter', 'transformError', 'Unknown Error', {
				error: String(error),
			});
		}

		return transformed;
	}
}
