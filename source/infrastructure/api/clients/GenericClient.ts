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
import { HttpClient } from '../HttpClient';

export class GenericClient implements IApiClient {
  private httpClient: HttpClient;

  constructor(
    private baseUrl: string,
    private apiKey?: string
  ) {
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    this.httpClient = new HttpClient(headers);
  }

  async chat(request: ApiRequest): Promise<ApiResponse> {
    if (!request.model) {
      throw new Error('Model is required and should be provided by user configuration');
    }

    const requestBody = {
      model: request.model,
      messages: request.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: request.maxTokens,
      temperature: request.temperature,
      stream: false,
    };

    // Remove undefined values
    Object.keys(requestBody).forEach(
      (key) =>
        (requestBody as any)[key] === undefined &&
        delete (requestBody as any)[key]
    );

    // Try OpenAI-compatible endpoint
    const url = this.baseUrl.replace(/\/$/, '') + '/chat/completions';
    const response = await this.httpClient.post<any>(url, requestBody);

    if (response.status !== 200) {
      throw new Error(
        `Generic API error: ${response.status} - ${
          response.data.error?.message || response.statusText
        }`
      );
    }

    return this.normalizeResponse(response.data, request);
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
      messages: request.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: request.maxTokens,
      temperature: request.temperature,
      stream: true, // Enable streaming
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

    // OpenAI-compatible streaming endpoint
    const url = this.baseUrl.replace(/\/$/, '') + '/chat/completions';

    await this.httpClient.streamPost(
      url,
      requestBody,
      (chunk: any) => {
        // Generic streaming format (OpenAI-compatible):
        // - choices[0].delta.content: content chunks
        // - choices[0].finish_reason: completion reason
        // - usage: token usage (may be in final chunk)

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

        // Signal completion
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
    return 'generic-chat-completion-api';
  }

  async getAvailableModels(): Promise<string[]> {
    // Models should be configured by user, not hardcoded
    // Return empty array - actual models come from user configuration
    return [];
  }

  private normalizeResponse(
    response: any,
    request: ApiRequest
  ): ApiResponse {
    // Try OpenAI format first
    if (response.choices && response.choices[0]?.message?.content) {
      return {
        content: response.choices[0].message.content,
        model: response.model || request.model,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
        finishReason: response.choices[0]
          .finish_reason as ApiResponse['finishReason'],
      };
    }

    // Try Anthropic-like format
    if (response.content) {
      return {
        content:
          typeof response.content === 'string'
            ? response.content
            : response.content[0]?.text || '',
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
      };
    }

    // Fallback: return raw response as content
    if (!request.model) {
      throw new Error('Model is required and should be provided by user configuration');
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
}
