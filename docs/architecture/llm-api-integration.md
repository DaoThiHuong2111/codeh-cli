# LLM API Integration

Tài liệu kỹ thuật về việc tích hợp 4 nhà cung cấp LLM API trong CODEH CLI: Anthropic (Claude), OpenAI, Ollama, và OpenAI-Compatible providers.

## Mục lục

- [1. Tổng quan](#1-tổng-quan)
- [2. Kiến trúc chung](#2-kiến-trúc-chung)
- [3. Anthropic (Claude) Integration](#3-anthropic-claude-integration)
- [4. OpenAI Integration](#4-openai-integration)
- [5. Ollama Integration](#5-ollama-integration)
- [6. OpenAI-Compatible (Generic) Integration](#6-openai-compatible-generic-integration)
- [7. Streaming Implementation](#7-streaming-implementation)
- [8. Error Handling](#8-error-handling)
- [9. Best Practices](#9-best-practices)
- [10. Testing](#10-testing)

---

## 1. Tổng quan

CODEH CLI hỗ trợ 4 nhà cung cấp LLM API khác nhau, mỗi provider có cách thức authentication, endpoint, và response format riêng biệt. Tất cả đều được chuẩn hóa thông qua interface `IApiClient`.

### 1.1. Supported Providers

| Provider | Type | Auth Method | Endpoint | Local/Cloud |
|----------|------|-------------|----------|-------------|
| **Anthropic** | Claude Models | API Key | `/v1/messages` | Cloud |
| **OpenAI** | GPT Models | Bearer Token | `/chat/completions` | Cloud |
| **Ollama** | Local LLMs | None | `/api/chat` | Local |
| **Generic** | OpenAI-compatible | Optional API Key | `/chat/completions` | Both |

### 1.2. Key Features

- ✅ **Unified Interface**: Tất cả providers implement `IApiClient`
- ✅ **Streaming Support**: Real-time word-by-word responses
- ✅ **Error Handling**: Graceful degradation và retry mechanisms
- ✅ **Type Safety**: Full TypeScript support
- ✅ **Provider-Agnostic**: Dễ dàng switch giữa các providers

---

## 2. Kiến trúc chung

### 2.1. IApiClient Interface

Interface chuẩn cho tất cả API clients:

```typescript
// File: source/core/domain/interfaces/IApiClient.ts

export interface IApiClient {
  /**
   * Gửi request và nhận response complete
   */
  chat(request: ApiRequest): Promise<ApiResponse>;

  /**
   * Stream responses theo real-time
   */
  streamChat(
    request: ApiRequest,
    onChunk: (chunk: StreamChunk) => void,
  ): Promise<ApiResponse>;

  /**
   * Kiểm tra API availability
   */
  healthCheck(): Promise<boolean>;

  /**
   * Lấy tên provider
   */
  getProviderName(): string;

  /**
   * Lấy danh sách models khả dụng
   */
  getAvailableModels(): Promise<string[]>;
}
```

### 2.2. Request/Response Types

**ApiRequest** - Request format chuẩn:

```typescript
export interface ApiRequest {
  messages: Message[];           // Conversation history
  model?: string;                // Model name (provider-specific)
  temperature?: number;          // 0.0 - 1.0
  maxTokens?: number;           // Max tokens to generate
  stream?: boolean;             // Enable streaming
  tools?: Tool[];               // Function calling tools
  systemPrompt?: string;        // System message
}
```

**ApiResponse** - Response format chuẩn:

```typescript
export interface ApiResponse {
  content: string;              // Generated text
  model: string;                // Model used
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: 'stop' | 'length' | 'tool_calls' | 'error';
  toolCalls?: ToolCall[];       // Function calls (nếu có)
}
```

**StreamChunk** - Streaming chunk format:

```typescript
export interface StreamChunk {
  content?: string;             // Text delta
  done: boolean;                // Stream completion flag
  usage?: ApiResponse['usage']; // Usage info (final chunk)
}
```

### 2.3. ApiClientFactory

Factory pattern để tạo đúng client theo configuration:

```typescript
// File: source/infrastructure/api/ApiClientFactory.ts

export class ApiClientFactory {
  create(config: Configuration): IApiClient {
    switch (config.provider) {
      case Provider.ANTHROPIC:
        return new AnthropicClient(config.apiKey, config.baseUrl);

      case Provider.OPENAI:
        return new OpenAIClient(config.apiKey, config.baseUrl);

      case Provider.OLLAMA:
        return new OllamaClient(config.baseUrl);

      case Provider.GENERIC:
        return new GenericClient(config.baseUrl, config.apiKey);

      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }
}
```

---

## 3. Anthropic (Claude) Integration

### 3.1. Overview

- **Base URL**: `https://api.anthropic.com`
- **Endpoint**: `/v1/messages`
- **Authentication**: API Key via `x-api-key` header
- **Version Header**: `anthropic-version: 2023-06-01`

### 3.2. Implementation

File: `source/infrastructure/api/clients/AnthropicClient.ts`

```typescript
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

    const response = await this.httpClient.post(
      `${this.baseUrl}/v1/messages`,
      requestBody,
    );

    return this.normalizeResponse(response.data, request);
  }
}
```

### 3.3. Request Format

```json
{
  "model": "claude-sonnet-4-5-20250929",
  "max_tokens": 1024,
  "messages": [
    {
      "role": "user",
      "content": "Hello, Claude!"
    }
  ],
  "temperature": 0.7,
  "system": "You are a helpful assistant."
}
```

### 3.4. Streaming Events

Anthropic sử dụng Server-Sent Events (SSE) với các event types:

| Event Type | Description | Data |
|------------|-------------|------|
| `message_start` | Bắt đầu message | Usage info, model name |
| `content_block_start` | Bắt đầu content block | Block index |
| `content_block_delta` | Content chunk | `delta.text` |
| `content_block_stop` | Kết thúc content block | Block index |
| `message_delta` | Message metadata update | Usage, stop_reason |
| `message_stop` | Kết thúc stream | - |

**Streaming implementation:**

```typescript
async streamChat(
  request: ApiRequest,
  onChunk: (chunk: StreamChunk) => void,
): Promise<ApiResponse> {
  let fullContent = '';
  let usage: any = undefined;

  await this.httpClient.streamPost(
    `${this.baseUrl}/v1/messages`,
    { ...requestBody, stream: true },
    (event: any) => {
      if (event.type === 'content_block_delta') {
        const text = event.delta?.text;
        if (text) {
          fullContent += text;
          onChunk({ content: text, done: false });
        }
      } else if (event.type === 'message_stop') {
        onChunk({
          done: true,
          usage: {
            promptTokens: usage?.input_tokens || 0,
            completionTokens: usage?.output_tokens || 0,
            totalTokens: (usage?.input_tokens || 0) + (usage?.output_tokens || 0),
          }
        });
      }
    },
  );

  return { content: fullContent, model, usage, finishReason };
}
```

### 3.5. Response Example

```json
{
  "id": "msg_01XFDUDYJgAACzvnptvVoYEL",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "Hello! How can I help you today?"
    }
  ],
  "model": "claude-sonnet-4-5-20250929",
  "stop_reason": "end_turn",
  "usage": {
    "input_tokens": 12,
    "output_tokens": 8
  }
}
```

---

## 4. OpenAI Integration

### 4.1. Overview

- **Base URL**: `https://api.openai.com/v1`
- **Endpoint**: `/chat/completions`
- **Authentication**: Bearer Token via `Authorization` header
- **Models**: GPT-4, GPT-4 Turbo, GPT-3.5, etc.

### 4.2. Implementation

File: `source/infrastructure/api/clients/OpenAIClient.ts`

```typescript
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
    const requestBody = {
      model: request.model,
      messages: request.messages,
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature,
      stream: false,
    };

    const response = await this.httpClient.post(
      `${this.baseUrl}/chat/completions`,
      requestBody,
    );

    return this.normalizeResponse(response.data);
  }
}
```

### 4.3. Request Format

```json
{
  "model": "gpt-4o",
  "messages": [
    {
      "role": "user",
      "content": "Hello!"
    }
  ],
  "max_tokens": 1024,
  "temperature": 0.7,
  "stream": false
}
```

### 4.4. Streaming Format

OpenAI streaming trả về chunks với format:

```typescript
{
  "choices": [
    {
      "delta": {
        "content": "Hello" // Text chunk
      },
      "finish_reason": null // "stop" khi xong
    }
  ],
  "model": "gpt-4o",
  "usage": { // Chỉ có trong final chunk
    "prompt_tokens": 10,
    "completion_tokens": 20,
    "total_tokens": 30
  }
}
```

**Streaming implementation:**

```typescript
async streamChat(
  request: ApiRequest,
  onChunk: (chunk: StreamChunk) => void,
): Promise<ApiResponse> {
  let fullContent = '';
  let usage: any = undefined;

  await this.httpClient.streamPost(
    `${this.baseUrl}/chat/completions`,
    { ...requestBody, stream: true },
    (chunk: any) => {
      const choice = chunk.choices?.[0];
      if (!choice) return;

      // Content delta
      if (choice.delta?.content) {
        const content = choice.delta.content;
        fullContent += content;
        onChunk({ content, done: false });
      }

      // Stream complete
      if (choice.finish_reason) {
        onChunk({
          done: true,
          usage: usage ? {
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens,
          } : undefined
        });
      }

      // Usage info (may appear in any chunk)
      if (chunk.usage) {
        usage = chunk.usage;
      }
    },
  );

  return { content: fullContent, model, usage, finishReason };
}
```

### 4.5. Response Example

```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "gpt-4o",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 9,
    "completion_tokens": 9,
    "total_tokens": 18
  }
}
```

---

## 5. Ollama Integration

### 5.1. Overview

- **Base URL**: `http://localhost:11434` (default)
- **Endpoint**: `/api/chat`
- **Authentication**: None (local server)
- **Models**: Llama, Mistral, CodeLlama, etc. (locally installed)
- **Timeout**: 120 seconds (models chạy local có thể chậm)

### 5.2. Implementation

File: `source/infrastructure/api/clients/OllamaClient.ts`

```typescript
export class OllamaClient implements IApiClient {
  private httpClient: HttpClient;

  constructor(private baseUrl: string = 'http://localhost:11434') {
    this.httpClient = new HttpClient();
    this.httpClient.setTimeout(120000); // 2 minutes
  }

  async chat(request: ApiRequest): Promise<ApiResponse> {
    const requestBody = {
      model: request.model,
      messages: request.messages,
      stream: false,
      options: {
        temperature: request.temperature,
        num_predict: request.maxTokens,
      },
    };

    const response = await this.httpClient.post(
      `${this.baseUrl}/api/chat`,
      requestBody,
    );

    return this.normalizeResponse(response.data, request);
  }
}
```

### 5.3. Request Format

```json
{
  "model": "llama3.2",
  "messages": [
    {
      "role": "user",
      "content": "Why is the sky blue?"
    }
  ],
  "stream": false,
  "options": {
    "temperature": 0.7,
    "num_predict": 1024
  }
}
```

### 5.4. Streaming Format

Ollama streaming format khác biệt:

```typescript
{
  "model": "llama3.2",
  "message": {
    "role": "assistant",
    "content": "The sky" // Content chunk
  },
  "done": false // true khi stream xong
}

// Final chunk với usage info:
{
  "model": "llama3.2",
  "message": { "role": "assistant", "content": "" },
  "done": true,
  "prompt_eval_count": 26,  // Prompt tokens
  "eval_count": 298          // Completion tokens
}
```

**Streaming implementation:**

```typescript
async streamChat(
  request: ApiRequest,
  onChunk: (chunk: StreamChunk) => void,
): Promise<ApiResponse> {
  let fullContent = '';
  let usage: any = undefined;

  await this.httpClient.streamPost(
    `${this.baseUrl}/api/chat`,
    { ...requestBody, stream: true },
    (chunk: any) => {
      // Content chunk
      if (chunk.message?.content) {
        const content = chunk.message.content;
        fullContent += content;
        onChunk({ content, done: false });
      }

      // Stream complete
      if (chunk.done) {
        usage = {
          prompt_eval_count: chunk.prompt_eval_count || 0,
          eval_count: chunk.eval_count || 0,
        };

        onChunk({
          done: true,
          usage: {
            promptTokens: chunk.prompt_eval_count || 0,
            completionTokens: chunk.eval_count || 0,
            totalTokens: (chunk.prompt_eval_count || 0) + (chunk.eval_count || 0),
          },
        });
      }
    },
  );

  return { content: fullContent, model, usage, finishReason };
}
```

### 5.5. Response Example

```json
{
  "model": "llama3.2",
  "created_at": "2024-01-01T00:00:00Z",
  "message": {
    "role": "assistant",
    "content": "The sky is blue because..."
  },
  "done": true,
  "total_duration": 5000000000,
  "load_duration": 2000000,
  "prompt_eval_count": 26,
  "eval_count": 298,
  "eval_duration": 4800000000
}
```

### 5.6. Get Available Models

Ollama cung cấp API để list models đã install:

```typescript
async getAvailableModels(): Promise<string[]> {
  try {
    const url = `${this.baseUrl}/api/tags`;
    const response = await this.httpClient.get(url);
    return response.data.models?.map((m: any) => m.name) || [];
  } catch (error) {
    return [];
  }
}

// Response format:
{
  "models": [
    { "name": "llama3.2:latest", "size": 7365960935, ... },
    { "name": "codellama:13b", "size": 8360548762, ... }
  ]
}
```

---

## 6. OpenAI-Compatible (Generic) Integration

### 6.1. Overview

Generic client hỗ trợ bất kỳ API nào compatible với OpenAI format. Thích hợp cho:

- Custom LLM servers
- Third-party providers (Groq, Together AI, etc.)
- Local inference servers (vLLM, TGI, etc.)
- OpenRouter, OpenPipe, và các aggregators khác

### 6.2. Implementation

File: `source/infrastructure/api/clients/GenericClient.ts`

```typescript
export class GenericClient implements IApiClient {
  private httpClient: HttpClient;

  constructor(
    private baseUrl: string,
    private apiKey?: string, // Optional
  ) {
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    this.httpClient = new HttpClient(headers);
  }

  async chat(request: ApiRequest): Promise<ApiResponse> {
    const requestBody = {
      model: request.model,
      messages: request.messages,
      max_tokens: request.maxTokens,
      temperature: request.temperature,
      stream: false,
    };

    // OpenAI-compatible endpoint
    const url = this.baseUrl.replace(/\/$/, '') + '/chat/completions';
    const response = await this.httpClient.post(url, requestBody);

    return this.normalizeResponse(response.data, request);
  }
}
```

### 6.3. Response Normalization

Generic client cố gắng normalize cả OpenAI và Anthropic format:

```typescript
private normalizeResponse(response: any, request: ApiRequest): ApiResponse {
  // Try OpenAI format
  if (response.choices?.[0]?.message?.content) {
    return {
      content: response.choices[0].message.content,
      model: response.model || request.model,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
      finishReason: response.choices[0].finish_reason,
    };
  }

  // Try Anthropic format
  if (response.content) {
    return {
      content: typeof response.content === 'string'
        ? response.content
        : response.content[0]?.text || '',
      model: response.model || request.model,
      usage: {
        promptTokens: response.usage?.input_tokens || 0,
        completionTokens: response.usage?.output_tokens || 0,
        totalTokens: (response.usage?.input_tokens || 0) +
                     (response.usage?.output_tokens || 0),
      },
      finishReason: response.stop_reason || 'stop',
    };
  }

  // Fallback: return raw response as JSON string
  return {
    content: JSON.stringify(response),
    model: request.model!,
    usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    finishReason: 'stop',
  };
}
```

---

## 7. Streaming Implementation

### 7.1. HttpClient Streaming

File: `source/infrastructure/api/HttpClient.ts`

```typescript
async streamPost<T>(
  url: string,
  data: any,
  onChunk: (chunk: T) => void,
): Promise<void> {
  const response = await fetch(url, {
    method: 'POST',
    headers: this.headers,
    body: JSON.stringify(data),
  });

  if (!response.body) {
    throw new Error('No response body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Split by lines
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // Keep last incomplete line

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.substring(6);
        if (data === '[DONE]') continue;

        try {
          const chunk = JSON.parse(data);
          onChunk(chunk);
        } catch (error) {
          console.error('Failed to parse chunk:', error);
        }
      }
    }
  }
}
```

### 7.2. Usage trong HomeScreen

```typescript
// File: source/presentation/screens/HomeScreen.tsx

async function sendMessage(text: string) {
  setState({ isStreaming: true, streamingContent: '' });

  try {
    await apiClient.streamChat(
      {
        messages: [...messages, { role: 'user', content: text }],
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
      },
      (chunk: StreamChunk) => {
        if (chunk.content) {
          // Append text delta
          setState(prev => ({
            streamingContent: prev.streamingContent + chunk.content,
          }));
        }

        if (chunk.done) {
          // Finalize message
          setState(prev => ({
            isStreaming: false,
            messages: [
              ...prev.messages,
              {
                role: 'assistant',
                content: prev.streamingContent,
                usage: chunk.usage,
              },
            ],
            streamingContent: '',
          }));
        }
      },
    );
  } catch (error) {
    setState({
      isStreaming: false,
      error: error.message,
    });
  }
}
```

---

## 8. Error Handling

### 8.1. Common Errors

**Anthropic:**
- `401 Unauthorized`: Invalid API key
- `400 Bad Request`: Invalid request format
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: API error

**OpenAI:**
- `401 Invalid Authentication`: API key issues
- `429 Rate limit reached`: Quota exceeded
- `400 Invalid request`: Bad parameters
- `503 Service Unavailable`: Overloaded

**Ollama:**
- `Connection refused`: Server not running
- `Model not found`: Model not installed
- `Timeout`: Model loading too slow

### 8.2. Error Handling Strategy

```typescript
async chat(request: ApiRequest): Promise<ApiResponse> {
  try {
    const response = await this.httpClient.post(url, body);

    if (response.status !== 200) {
      throw new Error(
        `${this.getProviderName()} API error: ${response.status} - ${
          response.data.error?.message || response.statusText
        }`,
      );
    }

    return this.normalizeResponse(response.data);
  } catch (error) {
    if (error instanceof NetworkError) {
      // Network issues - retry with backoff
      return this.retryWithBackoff(() => this.chat(request));
    }

    if (error.status === 429) {
      // Rate limit - wait and retry
      await this.waitForRateLimit(error);
      return this.chat(request);
    }

    // Other errors - propagate
    throw error;
  }
}
```

### 8.3. Retry Logic

```typescript
private async retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      const delay = Math.pow(2, i) * 1000; // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Max retries exceeded');
}
```

---

## 9. Best Practices

### 9.1. Configuration

```typescript
// ✅ Good: Load from config
const config = await loadConfiguration();
const client = new ApiClientFactory().create(config);

// ❌ Bad: Hardcode API keys
const client = new OpenAIClient('sk-...');
```

### 9.2. Error Messages

```typescript
// ✅ Good: Informative errors
throw new Error(
  `OpenAI API error: ${status} - ${message}. ` +
  `Check your API key and quota.`
);

// ❌ Bad: Generic errors
throw new Error('API call failed');
```

### 9.3. Streaming Performance

```typescript
// ✅ Good: Efficient chunk handling
onChunk(chunk => {
  if (chunk.content) {
    appendToBuffer(chunk.content); // O(1) append
  }
});

// ❌ Bad: Inefficient concatenation
onChunk(chunk => {
  fullText = fullText + chunk.content; // Creates new string each time
});
```

### 9.4. Resource Cleanup

```typescript
// ✅ Good: Always cleanup
try {
  await apiClient.streamChat(request, onChunk);
} finally {
  reader.releaseLock();
  controller.abort();
}

// ❌ Bad: No cleanup
await apiClient.streamChat(request, onChunk);
```

### 9.5. Model Selection

```typescript
// ✅ Good: User configuration
const model = config.model || getDefaultModel(config.provider);

// ❌ Bad: Hardcoded model
const model = 'gpt-4'; // Might not work with other providers
```

---

## 10. Testing

### 10.1. Unit Tests

```typescript
import { AnthropicClient } from './AnthropicClient';

describe('AnthropicClient', () => {
  let client: AnthropicClient;

  beforeEach(() => {
    client = new AnthropicClient('test-key', 'https://test-api.com');
  });

  it('should send chat request correctly', async () => {
    // Mock HttpClient
    const mockHttpClient = {
      post: jest.fn().mockResolvedValue({
        status: 200,
        data: {
          content: [{ text: 'Hello!' }],
          model: 'claude-3',
          usage: { input_tokens: 10, output_tokens: 5 },
        },
      }),
    };

    client['httpClient'] = mockHttpClient as any;

    const response = await client.chat({
      messages: [{ role: 'user', content: 'Hi' }],
    });

    expect(response.content).toBe('Hello!');
    expect(response.usage?.promptTokens).toBe(10);
    expect(response.usage?.completionTokens).toBe(5);
  });

  it('should handle streaming correctly', async () => {
    const chunks: string[] = [];

    await client.streamChat(
      { messages: [{ role: 'user', content: 'Test' }] },
      chunk => {
        if (chunk.content) {
          chunks.push(chunk.content);
        }
      },
    );

    expect(chunks.join('')).toBe('Expected full response');
  });
});
```

### 10.2. Integration Tests

```typescript
describe('LLM Integration Tests', () => {
  // Skip if no API key
  const skipIfNoKey = process.env.ANTHROPIC_API_KEY ? it : it.skip;

  skipIfNoKey('should work with real Anthropic API', async () => {
    const client = new AnthropicClient(
      process.env.ANTHROPIC_API_KEY!,
    );

    const response = await client.chat({
      messages: [{ role: 'user', content: 'Say "test"' }],
      maxTokens: 10,
    });

    expect(response.content).toContain('test');
  });
});
```

### 10.3. Mock Providers

```typescript
export class MockApiClient implements IApiClient {
  async chat(request: ApiRequest): Promise<ApiResponse> {
    return {
      content: 'Mock response',
      model: 'mock-model',
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      finishReason: 'stop',
    };
  }

  async streamChat(
    request: ApiRequest,
    onChunk: (chunk: StreamChunk) => void,
  ): Promise<ApiResponse> {
    const words = 'Mock streaming response'.split(' ');

    for (const word of words) {
      onChunk({ content: word + ' ', done: false });
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    onChunk({ done: true });

    return {
      content: 'Mock streaming response',
      model: 'mock-model',
      usage: { promptTokens: 5, completionTokens: 3, totalTokens: 8 },
      finishReason: 'stop',
    };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  getProviderName(): string {
    return 'mock';
  }

  async getAvailableModels(): Promise<string[]> {
    return ['mock-model-1', 'mock-model-2'];
  }
}
```

---

## Tham khảo

### Official Documentation

- [Anthropic API Docs](https://docs.anthropic.com/en/api/messages)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference/chat)
- [Ollama API Docs](https://github.com/ollama/ollama/blob/main/docs/api.md)

### Related Files

- `source/core/domain/interfaces/IApiClient.ts` - Interface definition
- `source/infrastructure/api/ApiClientFactory.ts` - Factory implementation
- `source/infrastructure/api/clients/` - Client implementations
- `source/infrastructure/api/HttpClient.ts` - HTTP utilities
- `docs/screens/home/technical.md` - HomeScreen technical docs
