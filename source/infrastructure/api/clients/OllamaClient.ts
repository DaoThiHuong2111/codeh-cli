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
import { HttpClient } from '../HttpClient';

export class OllamaClient implements IApiClient {
  private httpClient: HttpClient;

  constructor(private baseUrl: string = 'http://localhost:11434') {
    this.httpClient = new HttpClient();
    this.httpClient.setTimeout(120000); // 2 minutes for local models
  }

  async chat(request: ApiRequest): Promise<ApiResponse> {
    const requestBody = {
      model: request.model || 'llama3.1',
      messages: request.messages.map((m) => ({
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
      (key) =>
        (requestBody.options as any)[key] === undefined &&
        delete (requestBody.options as any)[key]
    );

    const url = this.baseUrl.replace(/\/$/, '') + '/api/chat';
    const response = await this.httpClient.post<any>(url, requestBody);

    if (response.status !== 200) {
      throw new Error(
        `Ollama API error: ${response.status} - ${
          response.data.error || response.statusText
        }`
      );
    }

    return this.normalizeResponse(response.data, request);
  }

  async streamChat(
    request: ApiRequest,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<ApiResponse> {
    // TODO: Implement streaming for Ollama
    throw new Error('Streaming not implemented yet for Ollama');
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
      return (
        response.data.models?.map((m: any) => m.name) || [
          'llama3.1',
          'llama3',
          'mistral',
        ]
      );
    } catch (error) {
      // Return default models if API call fails
      return ['llama3.1', 'llama3', 'mistral'];
    }
  }

  private normalizeResponse(
    response: any,
    request: ApiRequest
  ): ApiResponse {
    return {
      content: response.message?.content || '',
      model: response.model || request.model || 'llama3.1',
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
