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
import { HttpClient } from '../HttpClient';

export class OpenAIClient implements IApiClient {
  private httpClient: HttpClient;

  constructor(
    private apiKey: string,
    private baseUrl: string = 'https://api.openai.com/v1'
  ) {
    this.httpClient = new HttpClient({
      Authorization: `Bearer ${apiKey}`,
    });
  }

  async chat(request: ApiRequest): Promise<ApiResponse> {
    if (!request.model) {
      throw new Error('Model is required and should be provided by user configuration');
    }

    const requestBody = {
      model: request.model,
      max_tokens: request.maxTokens || 4096,
      messages: request.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: request.temperature,
      stream: false,
    };

    // Remove undefined values
    Object.keys(requestBody).forEach(
      (key) =>
        (requestBody as any)[key] === undefined &&
        delete (requestBody as any)[key]
    );

    const response = await this.httpClient.post<any>(
      `${this.baseUrl}/chat/completions`,
      requestBody
    );

    if (response.status !== 200) {
      throw new Error(
        `OpenAI API error: ${response.status} - ${
          response.data.error?.message || response.statusText
        }`
      );
    }

    return this.normalizeResponse(response.data);
  }

  async streamChat(
    request: ApiRequest,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<ApiResponse> {
    if (!request.model) {
      throw new Error('Model is required and should be provided by user configuration');
    }

    const requestBody = {
      model: request.model,
      max_tokens: request.maxTokens || 4096,
      messages: request.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: request.temperature,
      stream: true,
    };

    // Remove undefined values
    Object.keys(requestBody).forEach(
      (key) =>
        (requestBody as any)[key] === undefined &&
        delete (requestBody as any)[key]
    );

    let fullContent = '';
    let usage: any = undefined;
    let finishReason: string | undefined;
    let modelName = request.model;

    await this.httpClient.streamPost(
      `${this.baseUrl}/chat/completions`,
      requestBody,
      (chunk: any) => {
        // OpenAI streaming format:
        // - choices[0].delta.content: content chunks
        // - choices[0].finish_reason: completion reason
        // - usage: token usage (only in final chunk for some models)

        const choice = chunk.choices?.[0];
        if (!choice) return;

        if (choice.delta?.content) {
          const content = choice.delta.content;
          fullContent += content;
          onChunk({
            content,
            done: false,
          });
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
      }
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
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.chat({
        messages: [{ role: 'user', content: 'ping' }],
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

    return {
      content: choice?.message?.content || '',
      model: response.model,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
      finishReason: choice?.finish_reason as ApiResponse['finishReason'],
    };
  }
}
