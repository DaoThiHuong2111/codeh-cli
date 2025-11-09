/**
 * Anthropic API Client
 * Implements IApiClient for Anthropic (Claude) API
 */

import {
	IApiClient,
	ApiRequest,
	ApiResponse,
	StreamChunk,
} from '../../../core/domain/interfaces/IApiClient';
import {HttpClient} from '../HttpClient';

export class AnthropicClient implements IApiClient {
	private httpClient: HttpClient;

	constructor(
		private apiKey: string,
		private baseUrl: string = 'https://api.anthropic.com',
	) {
		this.httpClient = new HttpClient({
			'x-api-key': apiKey,
			'anthropic-version': '2023-06-01',
		});
	}

	async chat(request: ApiRequest): Promise<ApiResponse> {
		const requestBody = {
			model: request.model,
			max_tokens: request.maxTokens || 4096,
			messages: request.messages.map(m => ({
				role: m.role,
				content: m.content,
			})),
			temperature: request.temperature,
			system: request.systemPrompt,
		};

		// Remove undefined values
		Object.keys(requestBody).forEach(
			key =>
				(requestBody as any)[key] === undefined &&
				delete (requestBody as any)[key],
		);

		const response = await this.httpClient.post<any>(
			`${this.baseUrl}/v1/messages`,
			requestBody,
		);

		if (response.status !== 200) {
			throw new Error(
				`Anthropic API error: ${response.status} - ${
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
		const requestBody = {
			model: request.model,
			max_tokens: request.maxTokens || 4096,
			messages: request.messages.map(m => ({
				role: m.role,
				content: m.content,
			})),
			temperature: request.temperature,
			system: request.systemPrompt,
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
		let stopReason: string | undefined;
		let modelName = request.model;

		await this.httpClient.streamPost(
			`${this.baseUrl}/v1/messages`,
			requestBody,
			(event: any) => {
				// Anthropic streaming events:
				// - message_start: contains usage info
				// - content_block_start: start of content
				// - content_block_delta: actual content chunks
				// - content_block_stop: end of content
				// - message_delta: final message metadata
				// - message_stop: end of stream

				if (event.type === 'message_start') {
					usage = event.message?.usage;
					modelName = event.message?.model || modelName;
				} else if (event.type === 'content_block_delta') {
					const delta = event.delta;
					if (delta?.type === 'text_delta' && delta.text) {
						fullContent += delta.text;
						onChunk({
							content: delta.text,
							done: false,
						});
					}
				} else if (event.type === 'message_delta') {
					// Update usage with final values
					if (event.usage) {
						usage = {
							...usage,
							...event.usage,
						};
					}
					stopReason = event.delta?.stop_reason;
				} else if (event.type === 'message_stop') {
					// Stream completed
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
			},
		);

		return {
			content: fullContent,
			model: modelName || request.model || 'unknown',
			usage: {
				promptTokens: usage?.input_tokens || 0,
				completionTokens: usage?.output_tokens || 0,
				totalTokens: (usage?.input_tokens || 0) + (usage?.output_tokens || 0),
			},
			finishReason: this.mapStopReason(stopReason),
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
		return 'anthropic';
	}

	async getAvailableModels(): Promise<string[]> {
		// Models should be configured by user, not hardcoded
		// Return empty array - actual models come from user configuration
		return [];
	}

	private normalizeResponse(response: any, request: ApiRequest): ApiResponse {
		return {
			content: response.content?.[0]?.text || '',
			model: response.model,
			usage: {
				promptTokens: response.usage?.input_tokens || 0,
				completionTokens: response.usage?.output_tokens || 0,
				totalTokens:
					(response.usage?.input_tokens || 0) +
					(response.usage?.output_tokens || 0),
			},
			finishReason: this.mapStopReason(response.stop_reason),
		};
	}

	private mapStopReason(
		stopReason: string | undefined,
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
}
