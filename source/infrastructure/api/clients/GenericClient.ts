/**
 * Generic API Client
 * Implements IApiClient for any OpenAI-compatible API
 */

import {
	IApiClient,
	ApiRequest,
	ApiResponse,
	StreamChunk,
} from '../../../core/domain/interfaces/IApiClient';
import {HttpClient} from '../HttpClient';

export class GenericClient implements IApiClient {
	private httpClient: HttpClient;

	constructor(
		private baseUrl: string,
		private apiKey?: string,
	) {
		const headers: Record<string, string> = {};
		if (apiKey) {
			headers['Authorization'] = `Bearer ${apiKey}`;
		}
		this.httpClient = new HttpClient(headers);
	}

	async chat(request: ApiRequest): Promise<ApiResponse> {
		if (!request.model) {
			throw new Error(
				'Model is required and should be provided by user configuration',
			);
		}

		const requestBody = {
			model: request.model,
			messages: request.messages.map(m => ({
				role: m.role,
				content: m.content,
			})),
			max_tokens: request.maxTokens,
			temperature: request.temperature,
			stream: false,
		};

		// Remove undefined values
		Object.keys(requestBody).forEach(
			key =>
				(requestBody as any)[key] === undefined &&
				delete (requestBody as any)[key],
		);

		// Try OpenAI-compatible endpoint
		const url = this.baseUrl.replace(/\/$/, '') + '/chat/completions';
		const response = await this.httpClient.post<any>(url, requestBody);

		if (response.status !== 200) {
			throw new Error(
				`Generic API error: ${response.status} - ${
					response.data.error?.message || response.statusText
				}`,
			);
		}

		return this.normalizeResponse(response.data, request);
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
			messages: request.messages.map(m => ({
				role: m.role,
				content: m.content,
			})),
			max_tokens: request.maxTokens,
			temperature: request.temperature,
			stream: true, // Enable streaming
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

		// OpenAI-compatible streaming endpoint
		const url = this.baseUrl.replace(/\/$/, '') + '/chat/completions';

		await this.httpClient.streamPost(url, requestBody, (chunk: any) => {
			// Generic streaming format (OpenAI-compatible):
			// - choices[0].delta.content: content chunks
			// - choices[0].delta.tool_calls: tool call chunks
			// - choices[0].finish_reason: completion reason
			// - usage: token usage (may be in final chunk)

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

			// Handle tool calls (OpenAI format)
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

			// Signal completion
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
		});

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
		return 'generic-chat-completion-api';
	}

	async getAvailableModels(): Promise<string[]> {
		// Models should be configured by user, not hardcoded
		// Return empty array - actual models come from user configuration
		return [];
	}

	private normalizeResponse(response: any, request: ApiRequest): ApiResponse {
		// Try OpenAI format first
		if (response.choices && response.choices[0]?.message) {
			const message = response.choices[0].message;
			const toolCalls: any[] = [];

			// Parse OpenAI tool calls
			if (message.tool_calls) {
				for (const tc of message.tool_calls) {
					toolCalls.push({
						id: tc.id,
						name: tc.function?.name || '',
						arguments: this.parseArguments(tc.function?.arguments),
					});
				}
			}

			return {
				content: message.content || '',
				model: response.model || request.model,
				usage: {
					promptTokens: response.usage?.prompt_tokens || 0,
					completionTokens: response.usage?.completion_tokens || 0,
					totalTokens: response.usage?.total_tokens || 0,
				},
				finishReason: response.choices[0]
					.finish_reason as ApiResponse['finishReason'],
				toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
			};
		}

		// Try Anthropic-like format
		if (response.content) {
			const contentBlocks = Array.isArray(response.content)
				? response.content
				: [{type: 'text', text: response.content}];
			let textContent = '';
			const toolCalls: any[] = [];

			for (const block of contentBlocks) {
				if (block.type === 'text') {
					textContent += block.text || '';
				} else if (block.type === 'tool_use') {
					toolCalls.push({
						id: block.id,
						name: block.name,
						arguments: block.input || {},
					});
				}
			}

			return {
				content: textContent,
				model: response.model || request.model,
				usage: {
					promptTokens: response.usage?.input_tokens || 0,
					completionTokens: response.usage?.output_tokens || 0,
					totalTokens:
						(response.usage?.input_tokens || 0) +
						(response.usage?.output_tokens || 0),
				},
				finishReason: (response.stop_reason ||
					'stop') as ApiResponse['finishReason'],
				toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
			};
		}

		// Fallback: return raw response as content
		if (!request.model) {
			throw new Error(
				'Model is required and should be provided by user configuration',
			);
		}

		return {
			content: JSON.stringify(response),
			model: request.model,
			usage: {
				promptTokens: 0,
				completionTokens: 0,
				totalTokens: 0,
			},
			finishReason: 'stop',
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
