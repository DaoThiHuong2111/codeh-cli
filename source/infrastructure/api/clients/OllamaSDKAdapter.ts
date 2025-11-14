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

export class OllamaSDKAdapter implements IApiClient {
	private sdk: Ollama;

	constructor(baseURL: string = 'http://localhost:11434') {
		// Extract host from baseURL
		const host = baseURL.replace(/\/$/, ''); // Remove trailing slash
		this.sdk = new Ollama({host});
	}

	async chat(request: ApiRequest): Promise<ApiResponse> {
		try {
			// Transform messages - add system prompt as first message if exists
			const messages = this.transformMessages(request);

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

			const response = await this.sdk.chat(ollamaRequest);

			return this.normalizeResponse(response, request);
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

			const stream = await this.sdk.chat(ollamaRequest);

			for await (const chunk of stream) {
				if (chunk.message?.content) {
					fullContent += chunk.message.content;
					onChunk({
						content: chunk.message.content,
						done: false,
					});
				}

				// Handle tool calls
				if (chunk.message?.tool_calls) {
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
			throw this.transformError(error);
		}
	}

	async healthCheck(): Promise<boolean> {
		try {
			// Use tags endpoint to check if Ollama is running
			await this.sdk.list();
			return true;
		} catch (error) {
			return false;
		}
	}

	getProviderName(): string {
		return 'ollama';
	}

	async getAvailableModels(): Promise<string[]> {
		try {
			const response = await this.sdk.list();
			return response.models.map((model) => model.name);
		} catch (error) {
			return [];
		}
	}

	private transformMessages(request: ApiRequest): any[] {
		const messages: any[] = [];

		// Add system prompt as first message if exists
		if (request.systemPrompt) {
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
		}

		return messages;
	}

	private normalizeResponse(response: any, request: ApiRequest): ApiResponse {
		const message = response.message;
		const toolCalls: ToolCall[] = [];

		if (message?.tool_calls) {
			for (const toolCall of message.tool_calls) {
				toolCalls.push({
					id: `ollama-${Date.now()}-${Math.random()}`,
					name: toolCall.function.name,
					arguments: toolCall.function.arguments,
				});
			}
		}

		return {
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
	}

	private transformError(error: unknown): Error {
		if (error instanceof Error) {
			return new Error(`Ollama Error: ${error.message}`);
		}
		return new Error(String(error));
	}
}
