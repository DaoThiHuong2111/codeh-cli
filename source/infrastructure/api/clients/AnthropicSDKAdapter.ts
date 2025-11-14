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

export class AnthropicSDKAdapter implements IApiClient {
	private sdk: Anthropic;

	constructor(
		apiKey: string,
		baseURL: string = 'https://api.anthropic.com',
	) {
		this.sdk = new Anthropic({
			apiKey,
			baseURL,
		});
	}

	async chat(request: ApiRequest): Promise<ApiResponse> {
		try {
			// Transform ApiRequest to Anthropic format
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
			};

			// Remove undefined fields
			Object.keys(anthropicRequest).forEach((key) => {
				if (anthropicRequest[key as keyof typeof anthropicRequest] === undefined) {
					delete anthropicRequest[key as keyof typeof anthropicRequest];
				}
			});

			const response = await this.sdk.messages.create(anthropicRequest);

			return this.normalizeResponse(response);
		} catch (error) {
			throw this.transformError(error);
		}
	}

	async streamChat(
		request: ApiRequest,
		onChunk: (chunk: StreamChunk) => void,
	): Promise<ApiResponse> {
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

			const stream = await this.sdk.messages.create(anthropicRequest);

			for await (const event of stream) {
				if (event.type === 'message_start') {
					usage = event.message?.usage;
					modelName = event.message?.model || modelName;
				} else if (event.type === 'content_block_start') {
					const block = event.content_block;
					if (block?.type === 'tool_use') {
						toolCallsInProgress.set(event.index, {
							id: block.id,
							name: block.name,
							inputJson: '',
						});
					}
				} else if (event.type === 'content_block_delta') {
					const delta = event.delta;
					if (delta?.type === 'text_delta' && delta.text) {
						fullContent += delta.text;
						onChunk({
							content: delta.text,
							done: false,
						});
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
			throw this.transformError(error);
		}
	}

	async healthCheck(): Promise<boolean> {
		try {
			await this.chat({
				messages: [{role: 'user', content: 'ping'}],
				maxTokens: 10,
			});
			return true;
		} catch (error) {
			return false;
		}
	}

	getProviderName(): string {
		return 'anthropic';
	}

	async getAvailableModels(): Promise<string[]> {
		// Anthropic SDK doesn't provide a models endpoint
		// Return empty array - models come from user configuration
		return [];
	}

	private normalizeResponse(response: Anthropic.Message): ApiResponse {
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
		switch (stopReason) {
			case 'end_turn':
				return 'stop';
			case 'max_tokens':
				return 'length';
			case 'tool_use':
				return 'tool_calls';
			default:
				return 'stop';
		}
	}

	private transformError(error: unknown): Error {
		if (error instanceof Anthropic.APIError) {
			return new Error(
				`Anthropic API Error (${error.status}): ${error.message}`,
			);
		}
		if (error instanceof Error) {
			return error;
		}
		return new Error(String(error));
	}
}
