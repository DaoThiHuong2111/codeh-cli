/**
 * Interface for AI API clients
 * All API providers must implement this interface
 */

export interface ApiRequest {
  messages: Message[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  tools?: Tool[];
  systemPrompt?: string;
}

export interface ApiResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: 'stop' | 'length' | 'tool_calls' | 'error';
  toolCalls?: ToolCall[];
}

export interface Message {
  role: 'user' | 'assistant' | 'system' | 'error';
  content: string;
  toolCalls?: ToolCall[];
}

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface StreamChunk {
  content?: string;
  done: boolean;
  usage?: ApiResponse['usage'];
}

/**
 * Main API Client interface
 */
export interface IApiClient {
  /**
   * Send a request to the AI API
   */
  chat(request: ApiRequest): Promise<ApiResponse>;

  /**
   * Stream responses from the AI API
   */
  streamChat(
    request: ApiRequest,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<ApiResponse>;

  /**
   * Check if the API is available
   */
  healthCheck(): Promise<boolean>;

  /**
   * Get provider name
   */
  getProviderName(): string;

  /**
   * Get available models
   */
  getAvailableModels(): Promise<string[]>;
}
