/**
 * OpenAI SDK Adapter
 * Wraps official openai SDK to implement IApiClient interface
 */

import OpenAI from 'openai';
import {
	IApiClient,
	ApiRequest,
	ApiResponse,
	StreamChunk,
	ToolCall,
	Message,
} from '../../../core/domain/interfaces/IApiClient.js';
import {getLogger} from '../../logging/Logger.js';

const logger = getLogger();

export class OpenAISDKAdapter implements IApiClient {
	private sdk: OpenAI;

	constructor(apiKey: string, baseURL: string = 'https://api.openai.com/v1') {
		logger.info('OpenAISDKAdapter', 'constructor', 'Initializing OpenAI adapter', {
			baseURL,
			has_api_key: !!apiKey,
		});

		this.sdk = new OpenAI({
			apiKey,
			baseURL,
		});

		logger.debug('OpenAISDKAdapter', 'constructor', 'OpenAI SDK initialized');
	}

	async chat(request: ApiRequest): Promise<ApiResponse> {
		const start = Date.now();
		logger.info('OpenAISDKAdapter', 'chat', 'Starting chat request', {
			model: request.model || 'gpt-4o',
			message_count: request.messages.length,
			has_system_prompt: !!request.systemPrompt,
			has_tools: !!request.tools,
			tools_count: request.tools?.length || 0,
			temperature: request.temperature,
			max_tokens: request.maxTokens,
		});

		// Log full input messages for conversation tracking
		logger.info('OpenAISDKAdapter', 'chat', 'Input messages', {
			messages: request.messages,
			system_prompt: request.systemPrompt,
		});

		try {
			// Transform messages - add system prompt as first message if exists
			const messages = this.transformMessages(request);

			logger.debug('OpenAISDKAdapter', 'chat', 'Messages transformed', {
				transformed_count: messages.length,
			});

			const openaiRequest: OpenAI.ChatCompletionCreateParams = {
				model: request.model || 'gpt-4o',
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

			logger.debug('OpenAISDKAdapter', 'chat', 'Sending request to OpenAI API');

			const response = await this.sdk.chat.completions.create(openaiRequest);

			const duration = Date.now() - start;
			logger.info('OpenAISDKAdapter', 'chat', 'OpenAI API response received', {
				duration_ms: duration,
				model: response.model,
				finish_reason: response.choices[0]?.finish_reason,
				usage: response.usage,
			});

			// Normalize response to get content
			const normalizedResponse = this.normalizeResponse(response);

			// Log full response content for conversation tracking
			logger.info('OpenAISDKAdapter', 'chat', 'Response content', {
				content: normalizedResponse.content,
				tool_calls: normalizedResponse.toolCalls,
				finish_reason: normalizedResponse.finishReason,
			});

			return normalizedResponse;
		} catch (error) {
			const duration = Date.now() - start;
			logger.error('OpenAISDKAdapter', 'chat', 'Chat request failed', {
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

		logger.info('OpenAISDKAdapter', 'streamChat', 'Starting stream chat request', {
			model: request.model || 'gpt-4o',
			message_count: request.messages.length,
			has_system_prompt: !!request.systemPrompt,
			has_tools: !!request.tools,
			tools_count: request.tools?.length || 0,
			temperature: request.temperature,
			max_tokens: request.maxTokens,
		});

		// Log full input messages for conversation tracking
		logger.info('OpenAISDKAdapter', 'streamChat', 'Input messages', {
			messages: request.messages,
			system_prompt: request.systemPrompt,
		});

		try {
			// Transform messages - add system prompt as first message if exists
			const messages = this.transformMessages(request);

			logger.debug('OpenAISDKAdapter', 'streamChat', 'Messages transformed', {
				transformed_count: messages.length,
			});

			const openaiRequest: OpenAI.ChatCompletionCreateParams = {
				model: request.model || 'gpt-4o',
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
			let modelName = request.model || 'gpt-4o';
			const toolCalls: Map<number, ToolCall> = new Map();

			logger.debug('OpenAISDKAdapter', 'streamChat', 'Creating stream');
			const stream = await this.sdk.chat.completions.create(openaiRequest);
			logger.debug('OpenAISDKAdapter', 'streamChat', 'Stream created, waiting for chunks');

			for await (const chunk of stream) {
				const choice = chunk.choices?.[0];
				if (!choice) continue;

				modelName = chunk.model || modelName;

				// Handle content delta
				if (choice.delta?.content) {
					if (chunkCount === 0) {
						firstChunkTime = Date.now();
						logger.info('OpenAISDKAdapter', 'streamChat', 'First chunk received (TTFT)', {
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
						logger.debug('OpenAISDKAdapter', 'streamChat', 'Chunk milestone', {
							chunks_received: chunkCount,
							content_length: fullContent.length,
						});
					}
				}

				// Handle tool calls
				if (choice.delta?.tool_calls) {
					logger.debug('OpenAISDKAdapter', 'streamChat', 'Tool calls received', {
						tool_calls_count: choice.delta.tool_calls.length,
					});

					for (const toolCall of choice.delta.tool_calls) {
						const index = toolCall.index;
						const existing = toolCalls.get(index);

						if (!existing) {
							// New tool call
							logger.debug('OpenAISDKAdapter', 'streamChat', 'New tool call started', {
								index,
								id: toolCall.id,
								name: toolCall.function?.name,
							});

							toolCalls.set(index, {
								id: toolCall.id || '',
								name: toolCall.function?.name || '',
								arguments: '' as any, // Initialize as empty string for streaming accumulation
							});
						}

						// Accumulate function arguments
						if (toolCall.function?.arguments) {
							const current = toolCalls.get(index);
							if (current) {
								// Accumulate as string (current.arguments is initialized as '')
								const argsStr = (current.arguments as unknown as string) + toolCall.function.arguments;
								current.arguments = argsStr as any; // Store as string temporarily
							}
						}
					}
				}

				// Handle finish reason
				if (choice.finish_reason) {
					logger.debug('OpenAISDKAdapter', 'streamChat', 'Finish reason received', {
						finish_reason: choice.finish_reason,
					});
					finishReason = choice.finish_reason;
				}

				// Handle usage (available at the end with stream_options)
				if (chunk.usage) {
					logger.debug('OpenAISDKAdapter', 'streamChat', 'Usage info received', {
						usage: chunk.usage,
					});
					usage = chunk.usage;
				}
			}

			logger.debug('OpenAISDKAdapter', 'streamChat', 'Stream completed, processing tool calls');

			// Parse accumulated tool call arguments
			const finalToolCalls: ToolCall[] = [];
			for (const [_, toolCall] of toolCalls) {
				try {
					logger.debug('OpenAISDKAdapter', 'streamChat', 'Parsing tool call arguments', {
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
					logger.debug('OpenAISDKAdapter', 'streamChat', 'Tool call parsed successfully', {
						tool_name: toolCall.name,
						tool_id: toolCall.id,
						parsed_args: args,
					});
				} catch (error) {
					logger.warn('OpenAISDKAdapter', 'streamChat', 'Failed to parse tool call arguments - using empty object', {
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

			logger.debug('OpenAISDKAdapter', 'streamChat', 'Sending final chunk with usage');

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
			logger.info('OpenAISDKAdapter', 'streamChat', 'Stream completed successfully', {
				duration_ms: duration,
				ttft_ms: firstChunkTime ? firstChunkTime - start : null,
				chunks_received: chunkCount,
				content_length: fullContent.length,
				tool_calls_count: finalToolCalls.length,
				model: modelName,
				finish_reason: finishReason,
				usage: usage,
			});

			const response = {
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

			// Log full response content for conversation tracking
			logger.info('OpenAISDKAdapter', 'streamChat', 'Response content', {
				content: response.content,
				tool_calls: response.toolCalls,
				finish_reason: response.finishReason,
			});

			return response;
		} catch (error) {
			const duration = Date.now() - start;
			logger.error('OpenAISDKAdapter', 'streamChat', 'Stream failed', {
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
		logger.info('OpenAISDKAdapter', 'healthCheck', 'Running health check');

		try {
			await this.chat({
				messages: [{role: 'user', content: 'ping'}],
				maxTokens: 10,
			});

			const duration = Date.now() - start;
			logger.info('OpenAISDKAdapter', 'healthCheck', 'Health check passed', {
				duration_ms: duration,
			});

			return true;
		} catch (error) {
			const duration = Date.now() - start;
			logger.error('OpenAISDKAdapter', 'healthCheck', 'Health check failed', {
				duration_ms: duration,
				error: error instanceof Error ? error.message : String(error),
			});
			return false;
		}
	}

	getProviderName(): string {
		logger.debug('OpenAISDKAdapter', 'getProviderName', 'Returning provider name', {
			provider: 'openai',
		});
		return 'openai';
	}

	async getAvailableModels(): Promise<string[]> {
		const start = Date.now();
		logger.info('OpenAISDKAdapter', 'getAvailableModels', 'Fetching available models');

		try {
			const response = await this.sdk.models.list();
			const models = response.data.map((model) => model.id);

			const duration = Date.now() - start;
			logger.info('OpenAISDKAdapter', 'getAvailableModels', 'Models fetched', {
				duration_ms: duration,
				model_count: models.length,
			});

			return models;
		} catch (error) {
			const duration = Date.now() - start;
			logger.error('OpenAISDKAdapter', 'getAvailableModels', 'Failed to fetch models', {
				duration_ms: duration,
				error: error instanceof Error ? error.message : String(error),
			});
			return [];
		}
	}

	private transformMessages(
		request: ApiRequest,
	): OpenAI.ChatCompletionMessageParam[] {
		logger.debug('OpenAISDKAdapter', 'transformMessages', 'Transforming messages', {
			input_count: request.messages.length,
			has_system_prompt: !!request.systemPrompt,
		});

		const messages: OpenAI.ChatCompletionMessageParam[] = [];

		// Add system prompt as first message if exists
		if (request.systemPrompt) {
			logger.debug('OpenAISDKAdapter', 'transformMessages', 'Adding system prompt');
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
					logger.debug('OpenAISDKAdapter', 'transformMessages', 'Message with tool calls', {
						role: msg.role,
						tool_calls_count: msg.toolCalls.length,
					});
				}
			} else if (msg.role === 'system') {
				logger.debug('OpenAISDKAdapter', 'transformMessages', 'Adding system message');
				messages.push({
					role: 'system',
					content: msg.content,
				});
			}
		}

		logger.debug('OpenAISDKAdapter', 'transformMessages', 'Messages transformed', {
			output_count: messages.length,
		});

		return messages;
	}

	private normalizeResponse(
		response: OpenAI.ChatCompletion,
	): ApiResponse {
		logger.debug('OpenAISDKAdapter', 'normalizeResponse', 'Normalizing response', {
			model: response.model,
			choices_count: response.choices.length,
		});

		const choice = response.choices[0];
		const message = choice?.message;

		const toolCalls: ToolCall[] = [];
		if (message?.tool_calls) {
			logger.debug('OpenAISDKAdapter', 'normalizeResponse', 'Processing tool calls', {
				tool_calls_count: message.tool_calls.length,
			});

			for (const toolCall of message.tool_calls) {
				if (toolCall.type === 'function') {
					try {
						logger.debug('OpenAISDKAdapter', 'normalizeResponse', 'Parsing tool call arguments', {
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
						logger.debug('OpenAISDKAdapter', 'normalizeResponse', 'Tool call parsed successfully', {
							tool_name: toolCall.function.name,
							parsed_args: parsedArgs,
						});
					} catch (error) {
						logger.warn('OpenAISDKAdapter', 'normalizeResponse', 'Failed to parse tool call arguments - using empty object', {
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

		logger.debug('OpenAISDKAdapter', 'normalizeResponse', 'Response normalized', {
			content_length: normalized.content.length,
			tool_calls_count: toolCalls.length,
			total_tokens: normalized.usage?.totalTokens || 0,
		});

		return normalized;
	}

	private mapFinishReason(
		finishReason: string | undefined,
	): ApiResponse['finishReason'] {
		logger.debug('OpenAISDKAdapter', 'mapFinishReason', 'Mapping finish reason', {
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

		logger.debug('OpenAISDKAdapter', 'mapFinishReason', 'Finish reason mapped', {
			output: mapped,
		});

		return mapped;
	}

	private transformError(error: unknown): Error {
		logger.debug('OpenAISDKAdapter', 'transformError', 'Transforming error', {
			error_type: error instanceof Error ? error.constructor.name : typeof error,
		});

		let transformed: Error;

		if (error instanceof OpenAI.APIError) {
			transformed = new Error(`OpenAI API Error (${error.status}): ${error.message}`);
			logger.error('OpenAISDKAdapter', 'transformError', 'OpenAI API Error', {
				status: error.status,
				message: error.message,
				type: error.type,
			});
		} else if (error instanceof Error) {
			transformed = error;
			logger.error('OpenAISDKAdapter', 'transformError', 'Generic Error', {
				message: error.message,
				stack: error.stack,
			});
		} else {
			transformed = new Error(String(error));
			logger.error('OpenAISDKAdapter', 'transformError', 'Unknown Error', {
				error: String(error),
			});
		}

		return transformed;
	}
}
