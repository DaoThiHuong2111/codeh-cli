/**
 * Generic SDK Adapter
 * Uses OpenAI SDK with custom baseURL for OpenAI-compatible APIs
 * This adapter is designed for providers that implement OpenAI-compatible endpoints
 * Examples: LiteLLM, Google Gemini OpenAI compatibility, LM Studio, ai.megallm.io, etc.
 */

import OpenAI from 'openai';
import {
	IApiClient,
	ApiRequest,
	ApiResponse,
	StreamChunk,
	ToolCall,
} from '../../../core/domain/interfaces/IApiClient.js';
import {getLogger} from '../../logging/Logger.js';

const logger = getLogger();

export class GenericSDKAdapter implements IApiClient {
	private sdk: OpenAI;

	constructor(baseURL: string, apiKey?: string) {
		logger.info('GenericSDKAdapter', 'constructor', 'Initializing Generic adapter', {
			baseURL,
			has_api_key: !!apiKey,
		});

		this.sdk = new OpenAI({
			apiKey: apiKey || 'dummy-key', // Some providers don't require API key
			baseURL: baseURL,
		});

		logger.debug('GenericSDKAdapter', 'constructor', 'Generic SDK initialized');
	}

	async chat(request: ApiRequest): Promise<ApiResponse> {
		const start = Date.now();
		logger.info('GenericSDKAdapter', 'chat', 'Starting chat request', {
			model: request.model || 'default',
			message_count: request.messages.length,
			has_system_prompt: !!request.systemPrompt,
			has_tools: !!request.tools,
			tools_count: request.tools?.length || 0,
			temperature: request.temperature,
			max_tokens: request.maxTokens,
		});

		// Log full input messages for conversation tracking
		logger.info('GenericSDKAdapter', 'chat', 'Input messages', {
			messages: request.messages,
			system_prompt: request.systemPrompt,
		});

		try {
			// Transform messages - add system prompt as first message if exists
			const messages = this.transformMessages(request);

			logger.debug('GenericSDKAdapter', 'chat', 'Messages transformed', {
				transformed_count: messages.length,
			});

			const openaiRequest: OpenAI.ChatCompletionCreateParams = {
				model: request.model || 'default',
				messages,
				temperature: request.temperature,
				max_tokens: request.maxTokens,
				tools: request.tools
					? request.tools.map((tool) => ({
							type: 'function' as const,
							function: {
								name: tool.name,
								description: tool.description,
								parameters: tool.parameters,
							},
						}))
					: undefined,
			};

			// Remove undefined fields
			Object.keys(openaiRequest).forEach((key) => {
				if (openaiRequest[key as keyof typeof openaiRequest] === undefined) {
					delete openaiRequest[key as keyof typeof openaiRequest];
				}
			});

			logger.debug('GenericSDKAdapter', 'chat', 'Sending request to Generic API');

			const response = await this.sdk.chat.completions.create(openaiRequest);

			const duration = Date.now() - start;
			logger.info('GenericSDKAdapter', 'chat', 'Generic API response received', {
				duration_ms: duration,
				model: response.model,
				prompt_tokens: response.usage?.prompt_tokens || 0,
				completion_tokens: response.usage?.completion_tokens || 0,
				finish_reason: response.choices[0]?.finish_reason,
			});

			// Normalize response to get content
			const normalizedResponse = this.normalizeResponse(response);

			// Log full response content for conversation tracking
			logger.info('GenericSDKAdapter', 'chat', 'Response content', {
				content: normalizedResponse.content,
				tool_calls: normalizedResponse.toolCalls,
				finish_reason: normalizedResponse.finishReason,
			});

			return normalizedResponse;
		} catch (error) {
			const duration = Date.now() - start;
			logger.error('GenericSDKAdapter', 'chat', 'Chat request failed', {
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

		logger.info('GenericSDKAdapter', 'streamChat', 'Starting stream chat request', {
			model: request.model || 'default',
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

			logger.debug('GenericSDKAdapter', 'streamChat', 'Messages transformed', {
				transformed_count: messages.length,
			});

			const openaiRequest: OpenAI.ChatCompletionCreateParams = {
				model: request.model || 'default',
				messages,
				temperature: request.temperature,
				max_tokens: request.maxTokens,
				tools: request.tools
					? request.tools.map((tool) => ({
							type: 'function' as const,
							function: {
								name: tool.name,
								description: tool.description,
								parameters: tool.parameters,
							},
						}))
					: undefined,
				stream: true,
				stream_options: {
					include_usage: true,
				},
			};

			// Remove undefined fields
			Object.keys(openaiRequest).forEach((key) => {
				if (openaiRequest[key as keyof typeof openaiRequest] === undefined) {
					delete openaiRequest[key as keyof typeof openaiRequest];
				}
			});

			let fullContent = '';
			let usage: any = undefined;
			let finishReason: string | undefined;
			let modelName = request.model || 'default';
			const toolCalls: Map<number, ToolCall> = new Map();

			logger.debug('GenericSDKAdapter', 'streamChat', 'Creating stream');
			const stream = await this.sdk.chat.completions.create(openaiRequest);
			logger.debug('GenericSDKAdapter', 'streamChat', 'Stream created, waiting for chunks');

			for await (const chunk of stream) {
				const choice = chunk.choices?.[0];
				if (!choice) continue;

				modelName = chunk.model || modelName;

				// Handle content delta
				if (choice.delta?.content) {
					if (chunkCount === 0) {
						firstChunkTime = Date.now();
						logger.info('GenericSDKAdapter', 'streamChat', 'First chunk received (TTFT)', {
							ttft_ms: firstChunkTime - start,
						});
					}

					chunkCount++;
					fullContent += choice.delta.content;
					onChunk({
						content: choice.delta.content,
						done: false,
					});

					if (chunkCount % 10 === 0) {
						logger.debug('GenericSDKAdapter', 'streamChat', 'Chunk milestone', {
							chunks_received: chunkCount,
							content_length: fullContent.length,
						});
					}
				}

				// Handle tool calls
				if (choice.delta?.tool_calls) {
					logger.debug('GenericSDKAdapter', 'streamChat', 'Tool calls delta received', {
						tool_calls_count: choice.delta.tool_calls.length,
					});

					for (const toolCall of choice.delta.tool_calls) {
						const index = toolCall.index;
						const existing = toolCalls.get(index);

						if (!existing) {
							// New tool call
							toolCalls.set(index, {
								id: toolCall.id || '',
								name: toolCall.function?.name || '',
								arguments: {},
							});
						}

						// Accumulate function arguments
						if (toolCall.function?.arguments) {
							const current = toolCalls.get(index);
							if (current) {
								const argsStr =
									(typeof current.arguments === 'string'
										? current.arguments
										: JSON.stringify(current.arguments)) +
									toolCall.function.arguments;
								current.arguments = argsStr as any; // Store as string temporarily
							}
						}
					}
				}

				// Handle finish reason
				if (choice.finish_reason) {
					finishReason = choice.finish_reason;
					logger.debug('GenericSDKAdapter', 'streamChat', 'Finish reason received', {
						finish_reason: finishReason,
					});
				}

				// Handle usage (available at the end with stream_options)
				if (chunk.usage) {
					usage = chunk.usage;
					logger.debug('GenericSDKAdapter', 'streamChat', 'Usage received', {
						prompt_tokens: usage.prompt_tokens,
						completion_tokens: usage.completion_tokens,
						total_tokens: usage.total_tokens,
					});
				}
			}

			// Parse accumulated tool call arguments
			const finalToolCalls: ToolCall[] = [];
			for (const [_, toolCall] of toolCalls) {
				try {
					logger.debug('GenericSDKAdapter', 'streamChat', 'Parsing tool call arguments', {
						tool_name: toolCall.name,
						tool_id: toolCall.id,
						arguments_type: typeof toolCall.arguments,
						arguments_value: toolCall.arguments,
					});

					const args =
						typeof toolCall.arguments === 'string'
							? JSON.parse(toolCall.arguments)
							: toolCall.arguments;
					finalToolCalls.push({
						id: toolCall.id,
						name: toolCall.name,
						arguments: args,
					});

					logger.debug('GenericSDKAdapter', 'streamChat', 'Tool call parsed successfully', {
						tool_name: toolCall.name,
						parsed_args: args,
					});
				} catch (error) {
					logger.warn('GenericSDKAdapter', 'streamChat', 'Failed to parse tool call arguments - using empty object', {
						tool_name: toolCall.name,
						tool_id: toolCall.id,
						arguments_raw: toolCall.arguments,
						error: error instanceof Error ? error.message : String(error),
					});
					// If JSON parse fails, use empty object
					finalToolCalls.push({
						id: toolCall.id,
						name: toolCall.name,
						arguments: {},
					});
				}
			}

			// Send final chunk with usage
			onChunk({
				done: true,
				usage: usage
					? {
							promptTokens: usage.prompt_tokens || 0,
							completionTokens: usage.completion_tokens || 0,
							totalTokens: usage.total_tokens || 0,
						}
					: undefined,
			});

			const duration = Date.now() - start;
			logger.info('GenericSDKAdapter', 'streamChat', 'Stream completed successfully', {
				duration_ms: duration,
				ttft_ms: firstChunkTime ? firstChunkTime - start : null,
				chunks_received: chunkCount,
				content_length: fullContent.length,
				tool_calls_count: finalToolCalls.length,
				model: modelName,
				finish_reason: finishReason,
				usage: usage,
			});

			return {
				content: fullContent,
				model: modelName,
				usage: usage
					? {
							promptTokens: usage.prompt_tokens || 0,
							completionTokens: usage.completion_tokens || 0,
							totalTokens: usage.total_tokens || 0,
						}
					: {
							promptTokens: 0,
							completionTokens: 0,
							totalTokens: 0,
						},
				finishReason: this.mapFinishReason(finishReason),
				toolCalls: finalToolCalls.length > 0 ? finalToolCalls : undefined,
			};
		} catch (error) {
			const duration = Date.now() - start;
			logger.error('GenericSDKAdapter', 'streamChat', 'Stream failed', {
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
		logger.info('GenericSDKAdapter', 'healthCheck', 'Running health check');

		try {
			await this.chat({
				messages: [{role: 'user', content: 'ping'}],
				maxTokens: 10,
			});

			const duration = Date.now() - start;
			logger.info('GenericSDKAdapter', 'healthCheck', 'Health check passed', {
				duration_ms: duration,
			});

			return true;
		} catch (error) {
			const duration = Date.now() - start;
			logger.error('GenericSDKAdapter', 'healthCheck', 'Health check failed', {
				duration_ms: duration,
				error: error instanceof Error ? error.message : String(error),
			});
			return false;
		}
	}

	getProviderName(): string {
		logger.debug('GenericSDKAdapter', 'getProviderName', 'Returning provider name', {
			provider: 'generic',
		});
		return 'generic';
	}

	async getAvailableModels(): Promise<string[]> {
		const start = Date.now();
		logger.info('GenericSDKAdapter', 'getAvailableModels', 'Fetching available models');

		try {
			const response = await this.sdk.models.list();
			const models = response.data.map((model) => model.id);

			const duration = Date.now() - start;
			logger.info('GenericSDKAdapter', 'getAvailableModels', 'Models fetched', {
				duration_ms: duration,
				model_count: models.length,
			});

			return models;
		} catch (error) {
			const duration = Date.now() - start;
			logger.error('GenericSDKAdapter', 'getAvailableModels', 'Failed to fetch models', {
				duration_ms: duration,
				error: error instanceof Error ? error.message : String(error),
			});
			// Some providers may not implement models endpoint
			return [];
		}
	}

	private transformMessages(
		request: ApiRequest,
	): OpenAI.ChatCompletionMessageParam[] {
		logger.debug('GenericSDKAdapter', 'transformMessages', 'Transforming messages', {
			input_count: request.messages.length,
			has_system_prompt: !!request.systemPrompt,
		});

		const messages: OpenAI.ChatCompletionMessageParam[] = [];

		// Add system prompt as first message if exists
		if (request.systemPrompt) {
			logger.debug('GenericSDKAdapter', 'transformMessages', 'Adding system prompt');
			messages.push({
				role: 'system',
				content: request.systemPrompt,
			});
		}

		// Transform request messages
		for (const msg of request.messages) {
			if (msg.role === 'user' || msg.role === 'assistant') {
				messages.push({
					role: msg.role,
					content: msg.content,
					...(msg.toolCalls && {
						tool_calls: msg.toolCalls.map((tc) => ({
							id: tc.id,
							type: 'function' as const,
							function: {
								name: tc.name,
								arguments: JSON.stringify(tc.arguments),
							},
						})),
					}),
				});

				if (msg.toolCalls) {
					logger.debug('GenericSDKAdapter', 'transformMessages', 'Message with tool calls', {
						role: msg.role,
						tool_calls_count: msg.toolCalls.length,
					});
				}
			} else if (msg.role === 'system') {
				messages.push({
					role: 'system',
					content: msg.content,
				});
			}
		}

		logger.debug('GenericSDKAdapter', 'transformMessages', 'Messages transformed', {
			output_count: messages.length,
		});

		return messages;
	}

	private normalizeResponse(response: OpenAI.ChatCompletion): ApiResponse {
		logger.debug('GenericSDKAdapter', 'normalizeResponse', 'Normalizing response', {
			has_choices: !!response.choices?.[0],
		});

		const choice = response.choices[0];
		const message = choice?.message;

		const toolCalls: ToolCall[] = [];
		if (message?.tool_calls) {
			logger.debug('GenericSDKAdapter', 'normalizeResponse', 'Processing tool calls', {
				tool_calls_count: message.tool_calls.length,
			});

			for (const toolCall of message.tool_calls) {
				if (toolCall.type === 'function') {
					try {
						logger.debug('GenericSDKAdapter', 'normalizeResponse', 'Parsing tool call arguments', {
							tool_name: toolCall.function.name,
							tool_id: toolCall.id,
							arguments_raw: toolCall.function.arguments,
						});

						const parsedArgs = JSON.parse(toolCall.function.arguments);
						toolCalls.push({
							id: toolCall.id,
							name: toolCall.function.name,
							arguments: parsedArgs,
						});

						logger.debug('GenericSDKAdapter', 'normalizeResponse', 'Tool call parsed successfully', {
							tool_name: toolCall.function.name,
							parsed_args: parsedArgs,
						});
					} catch (error) {
						logger.warn('GenericSDKAdapter', 'normalizeResponse', 'Failed to parse tool call arguments - using empty object', {
							tool_name: toolCall.function.name,
							tool_id: toolCall.id,
							arguments_raw: toolCall.function.arguments,
							error: error instanceof Error ? error.message : String(error),
						});
						toolCalls.push({
							id: toolCall.id,
							name: toolCall.function.name,
							arguments: {},
						});
					}
				}
			}
		}

		const normalized: ApiResponse = {
			content: message?.content || '',
			model: response.model,
			usage: {
				promptTokens: response.usage?.prompt_tokens || 0,
				completionTokens: response.usage?.completion_tokens || 0,
				totalTokens: response.usage?.total_tokens || 0,
			},
			finishReason: this.mapFinishReason(choice?.finish_reason),
			toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
		};

		logger.debug('GenericSDKAdapter', 'normalizeResponse', 'Response normalized', {
			content_length: normalized.content.length,
			tool_calls_count: toolCalls.length,
			total_tokens: normalized.usage?.totalTokens || 0,
		});

		return normalized;
	}

	private mapFinishReason(
		finishReason: string | undefined,
	): ApiResponse['finishReason'] {
		logger.debug('GenericSDKAdapter', 'mapFinishReason', 'Mapping finish reason', {
			input: finishReason,
		});

		let mapped: ApiResponse['finishReason'];
		switch (finishReason) {
			case 'stop':
				mapped = 'stop';
				break;
			case 'length':
				mapped = 'length';
				break;
			case 'tool_calls':
				mapped = 'tool_calls';
				break;
			default:
				mapped = 'stop';
		}

		logger.debug('GenericSDKAdapter', 'mapFinishReason', 'Finish reason mapped', {
			output: mapped,
		});

		return mapped;
	}

	private transformError(error: unknown): Error {
		logger.debug('GenericSDKAdapter', 'transformError', 'Transforming error', {
			error_type: error instanceof Error ? error.constructor.name : typeof error,
		});

		let transformed: Error;

		if (error instanceof OpenAI.APIError) {
			transformed = new Error(
				`Generic Provider API Error (${error.status}): ${error.message}`,
			);
			logger.error('GenericSDKAdapter', 'transformError', 'Generic API Error', {
				status: error.status,
				message: error.message,
			});
		} else if (error instanceof Error) {
			transformed = error;
			logger.error('GenericSDKAdapter', 'transformError', 'Generic Error', {
				message: error.message,
				stack: error.stack,
			});
		} else {
			transformed = new Error(String(error));
			logger.error('GenericSDKAdapter', 'transformError', 'Unknown Error', {
				error: String(error),
			});
		}

		return transformed;
	}
}
