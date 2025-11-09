/**
 * Ollama API Client
 * Implements IApiClient for Ollama (Local LLM) API
 */

import {
	IApiClient,
	ApiRequest,
	ApiResponse,
	StreamChunk,
} from '../../../core/domain/interfaces/IApiClient';
import {HttpClient} from '../HttpClient';

export class OllamaClient implements IApiClient {
	private httpClient: HttpClient;

	constructor(private baseUrl: string = 'http://localhost:11434') {
		this.httpClient = new HttpClient();
		this.httpClient.setTimeout(120000); // 2 minutes for local models
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
			stream: false,
			options: {
				temperature: request.temperature,
				num_predict: request.maxTokens,
			},
		};

		// Remove undefined values from options
		Object.keys(requestBody.options).forEach(
			key =>
				(requestBody.options as any)[key] === undefined &&
				delete (requestBody.options as any)[key],
		);

		const url = this.baseUrl.replace(/\/$/, '') + '/api/chat';
		const response = await this.httpClient.post<any>(url, requestBody);

		if (response.status !== 200) {
			throw new Error(
				`Ollama API error: ${response.status} - ${
					response.data.error || response.statusText
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
			stream: true,
			options: {
				temperature: request.temperature,
				num_predict: request.maxTokens,
			},
		};

		// Remove undefined values from options
		Object.keys(requestBody.options).forEach(
			key =>
				(requestBody.options as any)[key] === undefined &&
				delete (requestBody.options as any)[key],
		);

		let fullContent = '';
		let usage: any = undefined;
		let modelName = request.model;
		let isDone = false;

		const url = this.baseUrl.replace(/\/$/, '') + '/api/chat';

		await this.httpClient.streamPost(url, requestBody, (chunk: any) => {
			// Ollama streaming format:
			// - message.content: content chunks
			// - done: boolean indicating completion
			// - prompt_eval_count, eval_count: token usage

			if (chunk.message?.content) {
				const content = chunk.message.content;
				fullContent += content;
				onChunk({
					content,
					done: false,
				});
			}

			if (chunk.done) {
				isDone = true;
				usage = {
					prompt_eval_count: chunk.prompt_eval_count || 0,
					eval_count: chunk.eval_count || 0,
				};
				modelName = chunk.model || modelName;

				onChunk({
					done: true,
					usage: {
						promptTokens: chunk.prompt_eval_count || 0,
						completionTokens: chunk.eval_count || 0,
						totalTokens:
							(chunk.prompt_eval_count || 0) + (chunk.eval_count || 0),
					},
				});
			}
		});

		return {
			content: fullContent,
			model: modelName,
			usage: {
				promptTokens: usage?.prompt_eval_count || 0,
				completionTokens: usage?.eval_count || 0,
				totalTokens: (usage?.prompt_eval_count || 0) + (usage?.eval_count || 0),
			},
			finishReason: isDone ? 'stop' : 'length',
		};
	}

	async healthCheck(): Promise<boolean> {
		try {
			const response = await this.httpClient.get(this.baseUrl);
			return response.status === 200;
		} catch (error) {
			return false;
		}
	}

	getProviderName(): string {
		return 'ollama';
	}

	async getAvailableModels(): Promise<string[]> {
		try {
			const url = this.baseUrl.replace(/\/$/, '') + '/api/tags';
			const response = await this.httpClient.get<any>(url);
			return response.data.models?.map((m: any) => m.name) || [];
		} catch (error) {
			// Models should be configured by user, not hardcoded
			// Return empty array if API call fails
			return [];
		}
	}

	private normalizeResponse(response: any, request: ApiRequest): ApiResponse {
		return {
			content: response.message?.content || '',
			model: response.model || request.model,
			usage: {
				promptTokens: response.prompt_eval_count || 0,
				completionTokens: response.eval_count || 0,
				totalTokens:
					(response.prompt_eval_count || 0) + (response.eval_count || 0),
			},
			finishReason: response.done ? 'stop' : 'length',
		};
	}
}
