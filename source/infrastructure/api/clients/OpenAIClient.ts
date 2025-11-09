/**
 * OpenAI API Client
 * Implements IApiClient for OpenAI (GPT) API
 */

import {
	IApiClient,
	ApiRequest,
	ApiResponse,
	StreamChunk,
} from '../../../core/domain/interfaces/IApiClient';
import {HttpClient} from '../HttpClient';

export class OpenAIClient implements IApiClient {
	private httpClient: HttpClient;

	constructor(
		private apiKey: string,
		private baseUrl: string = 'https://api.openai.com/v1',
	) {
		this.httpClient = new HttpClient({
			Authorization: `Bearer ${apiKey}`,
		});
	}

	async chat(request: ApiRequest): Promise<ApiResponse> {
		if (!request.model) {
			throw new Error(
				'Model is required and should be provided by user configuration',
			);
		}

		const requestBody = {
			model: request.model,
			max_tokens: request.maxTokens || 4096,
			messages: request.messages.map(m => ({
				role: m.role,
				content: m.content,
			})),
			temperature: request.temperature,
			tools: request.tools,
			stream: false,
		};

		// Remove undefined values
		Object.keys(requestBody).forEach(
			key =>
				(requestBody as any)[key] === undefined &&
				delete (requestBody as any)[key],
		);

		const response = await this.httpClient.post<any>(
			`${this.baseUrl}/chat/completions`,
			requestBody,
		);

		if (response.status !== 200) {
			throw new Error(
				`OpenAI API error: ${response.status} - ${
					response.data.error?.message || response.statusText
				}`,
			);
		}

		return this.normalizeResponse(response.data);
	}

	async streamChat(
		request: ApiRequest,
		onChunk: (chunk: StreamChunk) => void,
	): Promise<ApiResponse> {
		if (!request.model) {
			throw new Error(
				'Model is required and should be provided by user configuration',
			);
		}

		const requestBody = {
			model: request.model,
			max_tokens: request.maxTokens || 4096,
			messages: request.messages.map(m => ({
				role: m.role,
				content: m.content,
			})),
			temperature: request.temperature,
			tools: request.tools,
			stream: true,
		};

		// Remove undefined values
		Object.keys(requestBody).forEach(
			key =>
				(requestBody as any)[key] === undefined &&
				delete (requestBody as any)[key],
		);

		let fullContent = '';
		let usage: any = undefined;
		let finishReason: string | undefined;
		let modelName = request.model;
		const toolCalls: any[] = [];
		const toolCallsInProgress = new Map<
			number,
			{id: string; name: string; argsJson: string}
		>();

		await this.httpClient.streamPost(
			`${this.baseUrl}/chat/completions`,
			requestBody,
			(chunk: any) => {
				// OpenAI streaming format:
				// - choices[0].delta.content: content chunks
				// - choices[0].delta.tool_calls: tool call chunks
				// - choices[0].finish_reason: completion reason
				// - usage: token usage (only in final chunk for some models)

				const choice = chunk.choices?.[0];
				if (!choice) return;

				// Handle content
				if (choice.delta?.content) {
					const content = choice.delta.content;
					fullContent += content;
					onChunk({
						content,
						done: false,
					});
				}

				// Handle tool calls
				if (choice.delta?.tool_calls) {
					for (const tcDelta of choice.delta.tool_calls) {
						const index = tcDelta.index;
						let toolCall = toolCallsInProgress.get(index);

						if (!toolCall) {
							// New tool call
							toolCall = {
								id: tcDelta.id || '',
								name: tcDelta.function?.name || '',
								argsJson: '',
							};
							toolCallsInProgress.set(index, toolCall);
						}

						// Accumulate function arguments
						if (tcDelta.function?.arguments) {
							toolCall.argsJson += tcDelta.function.arguments;
						}
					}
				}

				if (choice.finish_reason) {
					finishReason = choice.finish_reason;
				}

				if (chunk.usage) {
					usage = chunk.usage;
				}

				if (chunk.model) {
					modelName = chunk.model;
				}

				// Check if stream is done
				if (choice.finish_reason) {
					// Complete all tool calls
					for (const toolCall of toolCallsInProgress.values()) {
						toolCalls.push({
							id: toolCall.id,
							name: toolCall.name,
							arguments: this.parseArguments(toolCall.argsJson),
						});
					}

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
				}
			},
		);

		return {
			content: fullContent,
			model: modelName,
			usage: {
				promptTokens: usage?.prompt_tokens || 0,
				completionTokens: usage?.completion_tokens || 0,
				totalTokens: usage?.total_tokens || 0,
			},
			finishReason: finishReason as ApiResponse['finishReason'],
			toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
		};
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
		// Models should be configured by user, not hardcoded
		// Return empty array - actual models come from user configuration
		return [];
	}

	private normalizeResponse(response: any): ApiResponse {
		const choice = response.choices?.[0];
		const message = choice?.message;

		// Parse tool calls (OpenAI format)
		const toolCalls: any[] = [];
		if (message?.tool_calls) {
			for (const tc of message.tool_calls) {
				toolCalls.push({
					id: tc.id,
					name: tc.function?.name || '',
					arguments: this.parseArguments(tc.function?.arguments),
				});
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
			finishReason: choice?.finish_reason as ApiResponse['finishReason'],
			toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
		};
	}

	private parseArguments(argsString: string): Record<string, any> {
		if (!argsString) return {};
		try {
			return JSON.parse(argsString);
		} catch (error) {
			return {};
		}
	}
}
