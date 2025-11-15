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
		this.sdk = new OpenAI({
			apiKey,
			baseURL,
		});
	}

	async chat(request: ApiRequest): Promise<ApiResponse> {
		try {
			// Transform messages - add system prompt as first message if exists
			const messages = this.transformMessages(request);

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

			const response = await this.sdk.chat.completions.create(openaiRequest);

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
			// Transform messages - add system prompt as first message if exists
			const messages = this.transformMessages(request);

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

			const stream = await this.sdk.chat.completions.create(openaiRequest);

			for await (const chunk of stream) {
				const choice = chunk.choices?.[0];
				if (!choice) continue;

				modelName = chunk.model || modelName;

				// Handle content delta
				if (choice.delta?.content) {
					fullContent += choice.delta.content;
					onChunk({
						content: choice.delta.content,
						done: false,
					});
				}

				// Handle tool calls
				if (choice.delta?.tool_calls) {
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
				}

				// Handle usage (available at the end with stream_options)
				if (chunk.usage) {
					usage = chunk.usage;
				}
			}

			// Parse accumulated tool call arguments
			const finalToolCalls: ToolCall[] = [];
			for (const [_, toolCall] of toolCalls) {
				try {
					const args =
						typeof toolCall.arguments === 'string'
							? JSON.parse(toolCall.arguments)
							: toolCall.arguments;
					finalToolCalls.push({
						id: toolCall.id,
						name: toolCall.name,
						arguments: args,
					});
				} catch (error) {
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
		return 'openai';
	}

	async getAvailableModels(): Promise<string[]> {
		try {
			const response = await this.sdk.models.list();
			return response.data.map((model) => model.id);
		} catch (error) {
			return [];
		}
	}

	private transformMessages(
		request: ApiRequest,
	): OpenAI.ChatCompletionMessageParam[] {
		const messages: OpenAI.ChatCompletionMessageParam[] = [];

		// Add system prompt as first message if exists
		if (request.systemPrompt) {
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
			} else if (msg.role === 'system') {
				messages.push({
					role: 'system',
					content: msg.content,
				});
			}
		}

		return messages;
	}

	private normalizeResponse(
		response: OpenAI.ChatCompletion,
	): ApiResponse {
		const choice = response.choices[0];
		const message = choice?.message;

		const toolCalls: ToolCall[] = [];
		if (message?.tool_calls) {
			for (const toolCall of message.tool_calls) {
				if (toolCall.type === 'function') {
					try {
						toolCalls.push({
							id: toolCall.id,
							name: toolCall.function.name,
							arguments: JSON.parse(toolCall.function.arguments),
						});
					} catch (error) {
						toolCalls.push({
							id: toolCall.id,
							name: toolCall.function.name,
							arguments: {},
						});
					}
				}
			}
		}

		return {
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
	}

	private mapFinishReason(
		finishReason: string | undefined,
	): ApiResponse['finishReason'] {
		switch (finishReason) {
			case 'stop':
				return 'stop';
			case 'length':
				return 'length';
			case 'tool_calls':
				return 'tool_calls';
			default:
				return 'stop';
		}
	}

	private transformError(error: unknown): Error {
		if (error instanceof OpenAI.APIError) {
			return new Error(`OpenAI API Error (${error.status}): ${error.message}`);
		}
		if (error instanceof Error) {
			return error;
		}
		return new Error(String(error));
	}
}
