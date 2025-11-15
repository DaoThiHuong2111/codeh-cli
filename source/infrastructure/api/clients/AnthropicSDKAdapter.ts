/**
 * Anthropic SDK Adapter
 * Wraps official @anthropic-ai/sdk to implement IApiClient interface
 */

import Anthropic from '@anthropic-ai/sdk';
import {
	IApiClient,
	ApiRequest,
	ApiResponse,
	StreamChunk,
	ToolCall,
} from '../../../core/domain/interfaces/IApiClient.js';
import {getLogger} from '../../logging/Logger.js';

const logger = getLogger();

export class AnthropicSDKAdapter implements IApiClient {
	private sdk: Anthropic;

	constructor(
		apiKey: string,
		baseURL: string = 'https://api.anthropic.com',
	) {
		logger.info('AnthropicSDKAdapter', 'constructor', 'Initializing Anthropic adapter', {
			baseURL,
			has_api_key: !!apiKey,
		});

		this.sdk = new Anthropic({
			apiKey,
			baseURL,
		});

		logger.debug('AnthropicSDKAdapter', 'constructor', 'Anthropic SDK initialized');
	}

	async chat(request: ApiRequest): Promise<ApiResponse> {
		const start = Date.now();
		const model = request.model || 'claude-3-5-sonnet-20241022';

		logger.debug('AnthropicSDKAdapter', 'chat', 'API request starting', {
			model,
			messages_count: request.messages.length,
			has_tools: !!request.tools,
		});

		try {
			// Transform ApiRequest to Anthropic format
			const anthropicRequest: Anthropic.MessageCreateParams = {
				model,
				max_tokens: request.maxTokens || 128000,
				messages: request.messages.map((m) => ({
					role: m.role === 'user' || m.role === 'assistant' ? m.role : 'user',
					content: m.content,
				})),
				temperature: request.temperature,
				system: request.systemPrompt,
				tools: request.tools
					? request.tools.map((tool) => ({
							name: tool.name,
							description: tool.description,
							input_schema: {
								type: 'object' as const,
								properties: tool.parameters.properties,
								required: tool.parameters.required,
							},
						}))
					: undefined,
			};

			// Remove undefined fields
			Object.keys(anthropicRequest).forEach((key) => {
				if (anthropicRequest[key as keyof typeof anthropicRequest] === undefined) {
					delete anthropicRequest[key as keyof typeof anthropicRequest];
				}
			});

			const response = await this.sdk.messages.create(anthropicRequest);
			const duration = Date.now() - start;

			logger.info('AnthropicSDKAdapter', 'chat', 'API request completed', {
				duration_ms: duration,
				model: response.model,
				prompt_tokens: response.usage?.input_tokens || 0,
				completion_tokens: response.usage?.output_tokens || 0,
				finish_reason: response.stop_reason,
			});

			return this.normalizeResponse(response);
		} catch (error) {
			const duration = Date.now() - start;
			logger.error('AnthropicSDKAdapter', 'chat', 'API request failed', {
				duration_ms: duration,
				model,
				error: error instanceof Error ? error.message : String(error),
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
		const model = request.model || 'claude-3-5-sonnet-20241022';

		logger.info('AnthropicSDKAdapter', 'streamChat', 'Starting stream chat request', {
			model,
			message_count: request.messages.length,
			has_system_prompt: !!request.systemPrompt,
			has_tools: !!request.tools,
			tools_count: request.tools?.length || 0,
			temperature: request.temperature,
			max_tokens: request.maxTokens || 128000,
		});

		try {
			// Transform ApiRequest to Anthropic streaming format
			const anthropicRequest: Anthropic.MessageCreateParams = {
				model: request.model || 'claude-3-5-sonnet-20241022',
				max_tokens: request.maxTokens || 128000,
				messages: request.messages.map((m) => ({
					role: m.role === 'user' || m.role === 'assistant' ? m.role : 'user',
					content: m.content,
				})),
				temperature: request.temperature,
				system: request.systemPrompt,
				tools: request.tools
					? request.tools.map((tool) => ({
							name: tool.name,
							description: tool.description,
							input_schema: {
								type: 'object' as const,
								properties: tool.parameters.properties,
								required: tool.parameters.required,
							},
						}))
					: undefined,
				stream: true,
			};

			// Remove undefined fields
			Object.keys(anthropicRequest).forEach((key) => {
				if (anthropicRequest[key as keyof typeof anthropicRequest] === undefined) {
					delete anthropicRequest[key as keyof typeof anthropicRequest];
				}
			});

			let fullContent = '';
			let usage: any = undefined;
			let stopReason: string | undefined;
			let modelName = request.model || 'claude-3-5-sonnet-20241022';
			const toolCalls: ToolCall[] = [];
			const toolCallsInProgress = new Map<
				number,
				{id: string; name: string; inputJson: string}
			>();

			logger.debug('AnthropicSDKAdapter', 'streamChat', 'Creating stream');
			const stream = await this.sdk.messages.create(anthropicRequest);
			logger.debug('AnthropicSDKAdapter', 'streamChat', 'Stream created, waiting for events');

			for await (const event of stream) {
				if (event.type === 'message_start') {
					usage = event.message?.usage;
					modelName = event.message?.model || modelName;
					logger.debug('AnthropicSDKAdapter', 'streamChat', 'Message started', {
						model: modelName,
						initial_usage: usage,
					});
				} else if (event.type === 'content_block_start') {
					const block = event.content_block;
					if (block?.type === 'tool_use') {
						logger.debug('AnthropicSDKAdapter', 'streamChat', 'Tool use started', {
							tool_id: block.id,
							tool_name: block.name,
						});
						toolCallsInProgress.set(event.index, {
							id: block.id,
							name: block.name,
							inputJson: '',
						});
					}
				} else if (event.type === 'content_block_delta') {
					const delta = event.delta;
					if (delta?.type === 'text_delta' && delta.text) {
						if (chunkCount === 0) {
							firstChunkTime = Date.now();
							logger.info('AnthropicSDKAdapter', 'streamChat', 'First chunk received (TTFT)', {
								ttft_ms: firstChunkTime - start,
							});
						}

						chunkCount++;
						fullContent += delta.text;
						onChunk({
							content: delta.text,
							done: false,
						});

						if (chunkCount % 10 === 0) {
							logger.debug('AnthropicSDKAdapter', 'streamChat', 'Chunk milestone', {
								chunks_received: chunkCount,
								content_length: fullContent.length,
							});
						}
					} else if (delta?.type === 'input_json_delta' && delta.partial_json) {
						const toolCall = toolCallsInProgress.get(event.index);
						if (toolCall) {
							toolCall.inputJson += delta.partial_json;
						}
					}
				} else if (event.type === 'content_block_stop') {
					const toolCall = toolCallsInProgress.get(event.index);
					if (toolCall) {
						try {
							const inputArgs = JSON.parse(toolCall.inputJson);
							toolCalls.push({
								id: toolCall.id,
								name: toolCall.name,
								arguments: inputArgs,
							});
						} catch (error) {
							toolCalls.push({
								id: toolCall.id,
								name: toolCall.name,
								arguments: {},
							});
						}
						toolCallsInProgress.delete(event.index);
					}
				} else if (event.type === 'message_delta') {
					if (event.usage) {
						usage = {
							...usage,
							...event.usage,
						};
					}
					stopReason = event.delta?.stop_reason ?? undefined;
				} else if (event.type === 'message_stop') {
					onChunk({
						done: true,
						usage: usage
							? {
									promptTokens: usage.input_tokens || 0,
									completionTokens: usage.output_tokens || 0,
									totalTokens:
										(usage.input_tokens || 0) + (usage.output_tokens || 0),
								}
							: undefined,
					});
				}
			}

			const duration = Date.now() - start;

			logger.info('AnthropicSDKAdapter', 'streamChat', 'Stream completed successfully', {
				duration_ms: duration,
				ttft_ms: firstChunkTime ? firstChunkTime - start : null,
				chunks_received: chunkCount,
				content_length: fullContent.length,
				tool_calls_count: toolCalls.length,
				model: modelName,
				stop_reason: stopReason,
				usage: usage,
			});

			return {
				content: fullContent,
				model: modelName,
				usage: {
					promptTokens: usage?.input_tokens || 0,
					completionTokens: usage?.output_tokens || 0,
					totalTokens: (usage?.input_tokens || 0) + (usage?.output_tokens || 0),
				},
				finishReason: this.mapStopReason(stopReason),
				toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
			};
		} catch (error) {
			const duration = Date.now() - start;
			logger.error('AnthropicSDKAdapter', 'streamChat', 'Stream failed', {
				duration_ms: duration,
				ttft_ms: firstChunkTime ? firstChunkTime - start : null,
				chunks_received: chunkCount,
				model,
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
			});
			throw this.transformError(error);
		}
	}

	async healthCheck(): Promise<boolean> {
		logger.debug('AnthropicSDKAdapter', 'healthCheck', 'Starting health check');

		try {
			await this.chat({
				messages: [{role: 'user', content: 'ping'}],
				maxTokens: 10,
			});
			logger.info('AnthropicSDKAdapter', 'healthCheck', 'Health check passed');
			return true;
		} catch (error) {
			logger.warn('AnthropicSDKAdapter', 'healthCheck', 'Health check failed', {
				error: error instanceof Error ? error.message : String(error),
			});
			return false;
		}
	}

	getProviderName(): string {
		logger.debug('AnthropicSDKAdapter', 'getProviderName', 'Returning provider name', {
			provider: 'anthropic',
		});
		return 'anthropic';
	}

	async getAvailableModels(): Promise<string[]> {
		logger.debug('AnthropicSDKAdapter', 'getAvailableModels', 'Getting available models');
		// Anthropic SDK doesn't provide a models endpoint
		// Return empty array - models come from user configuration
		logger.debug('AnthropicSDKAdapter', 'getAvailableModels', 'Returning empty array', {
			reason: 'Anthropic SDK does not provide models endpoint',
		});
		return [];
	}

	private normalizeResponse(response: Anthropic.Message): ApiResponse {
		logger.debug('AnthropicSDKAdapter', 'normalizeResponse', 'Normalizing response', {
			content_blocks: response.content?.length || 0,
		});
		const contentBlocks = response.content || [];
		let textContent = '';
		const toolCalls: ToolCall[] = [];

		for (const block of contentBlocks) {
			if (block.type === 'text') {
				textContent += block.text;
			} else if (block.type === 'tool_use') {
				toolCalls.push({
					id: block.id,
					name: block.name,
					arguments: block.input as Record<string, any>,
				});
			}
		}

		return {
			content: textContent,
			model: response.model,
			usage: {
				promptTokens: response.usage?.input_tokens || 0,
				completionTokens: response.usage?.output_tokens || 0,
				totalTokens:
					(response.usage?.input_tokens || 0) +
					(response.usage?.output_tokens || 0),
			},
			finishReason: this.mapStopReason(response.stop_reason),
			toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
		};
	}

	private mapStopReason(
		stopReason: string | null | undefined,
	): ApiResponse['finishReason'] {
		logger.debug('AnthropicSDKAdapter', 'mapStopReason', 'Mapping stop reason', {
			input: stopReason,
		});

		let mapped: ApiResponse['finishReason'];
		switch (stopReason) {
			case 'end_turn':
				mapped = 'stop';
				break;
			case 'max_tokens':
				mapped = 'length';
				break;
			case 'tool_use':
				mapped = 'tool_calls';
				break;
			default:
				mapped = 'stop';
		}

		logger.debug('AnthropicSDKAdapter', 'mapStopReason', 'Stop reason mapped', {
			output: mapped,
		});

		return mapped;
	}

	private transformError(error: unknown): Error {
		logger.debug('AnthropicSDKAdapter', 'transformError', 'Transforming error', {
			error_type: error instanceof Error ? error.constructor.name : typeof error,
		});

		let transformed: Error;

		if (error instanceof Anthropic.APIError) {
			transformed = new Error(
				`Anthropic API Error (${error.status}): ${error.message}`,
			);
			logger.error('AnthropicSDKAdapter', 'transformError', 'Anthropic API Error', {
				status: error.status,
				message: error.message,
			});
		} else if (error instanceof Error) {
			transformed = error;
			logger.error('AnthropicSDKAdapter', 'transformError', 'Generic Error', {
				message: error.message,
				stack: error.stack,
			});
		} else {
			transformed = new Error(String(error));
			logger.error('AnthropicSDKAdapter', 'transformError', 'Unknown Error', {
				error: String(error),
			});
		}

		return transformed;
	}
}
