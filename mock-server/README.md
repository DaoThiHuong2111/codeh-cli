# LLM Mock Server

Mock server for testing LLM API integrations with streaming support for multiple providers.

## Features

- ✅ **4 Providers**: Anthropic, OpenAI, Ollama, Generic (OpenAI-compatible)
- ✅ **Streaming Support**: SSE and newline-delimited JSON
- ✅ **Realistic Responses**: Provider-specific response formats
- ✅ **Smart Responses**: Context-aware mock data based on user input
- ✅ **CORS Enabled**: Ready for frontend testing
- ✅ **TypeScript**: Full type safety

## Quick Start

### Installation

```bash
cd mock-server
npm install
```

### Running the Server

```bash
# Development mode (auto-reload)
npm run dev

# Production build
npm run build
npm start
```

Server will start on `http://localhost:3001`

## API Endpoints

### 1. Anthropic Claude API

**Messages API (Streaming)**
```bash
POST http://localhost:3001/anthropic/v1/messages
Content-Type: application/json

{
  "messages": [
    {"role": "user", "content": "Hello!"}
  ],
  "model": "claude-3-5-sonnet-20241022",
  "stream": true
}
```

**List Models**
```bash
GET http://localhost:3001/anthropic/v1/models
```

**Response Format:**
```json
{
  "type": "message_start",
  "message": { ... }
}
{
  "type": "content_block_delta",
  "index": 0,
  "delta": {
    "type": "text_delta",
    "text": "Hello! "
  }
}
```

### 2. OpenAI API

**Chat Completions (Streaming)**
```bash
POST http://localhost:3001/openai/v1/chat/completions
Content-Type: application/json

{
  "messages": [
    {"role": "user", "content": "Hello!"}
  ],
  "model": "gpt-4-turbo-preview",
  "stream": true
}
```

**List Models**
```bash
GET http://localhost:3001/openai/v1/models
```

**Response Format:**
```json
{
  "id": "chatcmpl_1234567890",
  "object": "chat.completion.chunk",
  "created": 1234567890,
  "model": "gpt-4-turbo-preview",
  "choices": [
    {
      "index": 0,
      "delta": {"content": "Hello! "},
      "finish_reason": null
    }
  ]
}
```

### 3. Ollama API

**Chat API (Streaming)**
```bash
POST http://localhost:3001/ollama/api/chat
Content-Type: application/json

{
  "messages": [
    {"role": "user", "content": "Hello!"}
  ],
  "model": "llama2",
  "stream": true
}
```

**List Models**
```bash
GET http://localhost:3001/ollama/api/tags
```

**Show Model Info**
```bash
POST http://localhost:3001/ollama/api/show
Content-Type: application/json

{
  "name": "llama2"
}
```

**Response Format:**
```json
{
  "model": "llama2",
  "created_at": "2024-01-01T00:00:00.000Z",
  "message": {
    "role": "assistant",
    "content": "Hello! "
  },
  "done": false
}
```

### 4. Generic (OpenAI-compatible)

**Chat Completions**
```bash
POST http://localhost:3001/generic/v1/chat/completions
Content-Type: application/json

{
  "messages": [
    {"role": "user", "content": "Hello!"}
  ],
  "stream": true
}
```

## Smart Response Triggers

The mock server provides context-aware responses based on keywords in your message:

| Keyword | Response Type | Description |
|---------|---------------|-------------|
| `hello`, `hi`, `hey` | Greeting | Simple welcome message |
| `code`, `example`, `function` | Code Example | TypeScript code snippet |
| `markdown`, `demo`, `showcase` | Markdown Showcase | Full markdown features demo |
| `long`, `scroll`, `test` | Long Response | Extended text for scrolling tests |
| `error`, `fail` | Error Simulation | Error message for testing |
| (anything else) | Default | Generic response |

## Testing Examples

### Test with cURL

**Anthropic Streaming:**
```bash
curl -X POST http://localhost:3001/anthropic/v1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Show me code"}],
    "stream": true
  }'
```

**OpenAI Streaming:**
```bash
curl -X POST http://localhost:3001/openai/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Show me markdown"}],
    "stream": true
  }'
```

**Ollama Streaming:**
```bash
curl -X POST http://localhost:3001/ollama/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": true
  }'
```

### Test with JavaScript

```javascript
// Anthropic streaming
const response = await fetch('http://localhost:3001/anthropic/v1/messages', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    messages: [{role: 'user', content: 'Hello!'}],
    stream: true
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const {done, value} = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      console.log(data);
    }
  }
}
```

### Test with HomeScreen

Update your API client configuration:

```typescript
// For Anthropic
const client = new AnthropicClient({
  apiKey: 'mock-key', // Any value works
  baseURL: 'http://localhost:3001/anthropic',
});

// For OpenAI
const client = new OpenAIClient({
  apiKey: 'mock-key',
  baseURL: 'http://localhost:3001/openai/v1',
});

// For Ollama
const client = new OllamaClient({
  baseURL: 'http://localhost:3001/ollama',
});
```

## Configuration

Create `.env` file:

```bash
cp .env.example .env
```

Edit values:

```bash
PORT=3001
STREAM_DELAY_MS=50  # Delay between streaming chunks (ms)
DEBUG=false
```

## Response Formats

### Anthropic Format

```
data: {"type":"message_start","message":{...}}
data: {"type":"content_block_start","index":0,...}
data: {"type":"content_block_delta","delta":{"text":"Hello"}}
data: {"type":"content_block_stop","index":0}
data: {"type":"message_delta","delta":{"stop_reason":"end_turn"}}
data: {"type":"message_stop"}
data: [DONE]
```

### OpenAI Format

```
data: {"id":"chatcmpl_123","choices":[{"delta":{"content":"Hello"}}]}
data: {"id":"chatcmpl_123","choices":[{"delta":{"content":" "}}]}
data: {"id":"chatcmpl_123","choices":[{"finish_reason":"stop"}]}
data: [DONE]
```

### Ollama Format

```
{"message":{"content":"Hello"},"done":false}
{"message":{"content":" "},"done":false}
{"message":{"content":""},"done":true,"eval_count":10}
```

## Architecture

```
mock-server/
├── src/
│   ├── index.ts              # Main server
│   ├── routes/
│   │   ├── anthropic.ts      # Anthropic endpoints
│   │   ├── openai.ts         # OpenAI endpoints
│   │   └── ollama.ts         # Ollama endpoints
│   ├── utils/
│   │   └── streaming.ts      # SSE utilities
│   └── mock-data/
│       └── responses.ts      # Mock response data
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Troubleshooting

### Port already in use

```bash
# Change port in .env
PORT=3002
```

Or kill the process:
```bash
lsof -ti:3001 | xargs kill -9
```

### CORS errors

Server has CORS enabled by default. If issues persist:
```typescript
// In src/index.ts, customize CORS:
app.use(cors({
  origin: 'http://your-frontend-url',
  credentials: true
}));
```

### Streaming not working

- Check `Content-Type: text/event-stream` header in response
- Ensure `stream: true` in request body
- Check browser console for connection errors
- Try with `curl` first to isolate issue

### TypeScript errors

```bash
npm run build
```

Check `tsconfig.json` and ensure all types are properly defined.

## Development

### Adding New Mock Responses

Edit `src/mock-data/responses.ts`:

```typescript
export const MOCK_RESPONSES = {
  // Add new response
  myCustomResponse: `Your response here`,
};

// Add trigger in getMockResponse()
if (msg.includes('custom')) {
  return MOCK_RESPONSES.myCustomResponse;
}
```

### Adding New Providers

1. Create route file: `src/routes/my-provider.ts`
2. Implement endpoints following provider's API spec
3. Import and mount in `src/index.ts`:
```typescript
import myProviderRouter from './routes/my-provider';
app.use('/my-provider', myProviderRouter);
```

## Production Deployment

**Not recommended** - This is a mock server for testing only.

For production testing:
- Use Docker
- Add authentication
- Add rate limiting
- Add monitoring

## License

MIT - For testing purposes only

## Related

- [Main Project Documentation](../docs/)
- [HomeScreen Implementation](../source/presentation/screens/HomeScreen/)
- [API Client Interfaces](../source/core/domain/interfaces/)
