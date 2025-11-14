# 🚀 Mock Server - Quick Start Guide

## TẠI SAO KHÔNG CẦN API KEY?

Mock server được thiết kế để **test local** mà **KHÔNG CẦN API keys thật**:

✅ **Lợi ích:**
- Không tốn tiền (no API costs)
- Test offline (no internet needed)
- Nhanh (local response)
- Không rate limits
- Consistent responses (không random)

 **Không cần:**
- API keys
- Authentication
- Internet connection
- Anthropic/OpenAI accounts

---

## CÁCH SỬ DỤNG

### 1. Start Mock Server

```bash
cd mock-server
npm install
npm run dev
```

Server chạy tại: `http://localhost:3001`

### 2. Gọi API (Không Cần API Key!)

#### Với cURL:

```bash
# Anthropic Mock API
curl -X POST http://localhost:3001/anthropic/v1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": true
  }'

# Không cần header Authorization!
# Không cần x-api-key!
```

#### Với JavaScript/TypeScript:

```typescript
// Không cần API key - chỉ cần point to mock server!
const response = await fetch('http://localhost:3001/anthropic/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // KHÔNG CẦN: 'x-api-key': 'sk-...'
    // KHÔNG CẦN: 'Authorization': 'Bearer ...'
  },
  body: JSON.stringify({
    messages: [{role: 'user', content: 'Hello'}],
    stream: true
  })
});
```

### 3. Sử Dụng Với HomeScreen

```typescript
import {AnthropicClient} from './clients/AnthropicClient';

// Chỉ cần point baseURL to mock server
const client = new AnthropicClient({
  apiKey: 'any-value-works',  // Bất kỳ giá trị nào cũng được!
  baseURL: 'http://localhost:3001/anthropic',  // Point to mock
});

// Use như bình thường
<HomeScreen apiClient={client} />
```

**Lưu ý:** `apiKey` vẫn cần có value (vì client validate), nhưng mock server **không check** nó!

---

## TẤT CẢ PROVIDERS

### Anthropic (Claude)

```bash
# Endpoint
POST http://localhost:3001/anthropic/v1/messages

# Request
{
  "messages": [{"role": "user", "content": "Hello"}],
  "model": "claude-3-5-sonnet-20241022",
  "stream": true
}

# API Key: KHÔNG CẦN
```

### OpenAI

```bash
# Endpoint
POST http://localhost:3001/openai/v1/chat/completions

# Request
{
  "messages": [{"role": "user", "content": "Hello"}],
  "model": "gpt-4-turbo-preview",
  "stream": true
}

# API Key: KHÔNG CẦN
```

### Ollama

```bash
# Endpoint
POST http://localhost:3001/ollama/api/chat

# Request
{
  "messages": [{"role": "user", "content": "Hello"}],
  "model": "llama2",
  "stream": true
}

# API Key: KHÔNG CẦN (Ollama vốn không dùng API key)
```

### Generic (OpenAI-compatible)

```bash
# Endpoint
POST http://localhost:3001/generic/v1/chat/completions

# Request
{
  "messages": [{"role": "user", "content": "Hello"}],
  "stream": true
}

# API Key: KHÔNG CẦN
```

---

## SMART RESPONSES

Mock server trả về responses dựa trên **keywords** trong message:

| Keyword | Response |
|---------|----------|
| `hello`, `hi` | Greeting message |
| `code`, `function` | TypeScript code example |
| `markdown`, `demo` | Full markdown showcase |
| `long`, `scroll` | Long text for testing |
| `error`, `fail` | Error simulation |
| Anything else | Generic response |

**Ví dụ:**

```bash
# Request với keyword "code"
curl -X POST http://localhost:3001/anthropic/v1/messages \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"show me code"}]}'

# Response: TypeScript code example với syntax highlighting
```

---

## TEST CLIENT

Chạy test client tự động:

```bash
cd mock-server
npx ts-node test-client.ts
```

Test client sẽ:
1. ✅ Test health check
2. ✅ Test Anthropic streaming
3. ✅ Test OpenAI streaming
4. ✅ Test Ollama streaming
5. ✅ Show statistics

**Tất cả KHÔNG CẦN API keys!**

---

## SO SÁNH: Mock vs Real API

### Real API (Anthropic, OpenAI)

```typescript
// Cần API key thật
const client = new AnthropicClient({
  apiKey: process.env.ANTHROPIC_API_KEY,  // Phải có key thật!
  baseURL: 'https://api.anthropic.com',   // Real API
});

//  Tốn tiền
//  Cần internet
//  Rate limits
//  Cần account
```

### Mock API (Local Testing)

```typescript
// Không cần API key
const client = new AnthropicClient({
  apiKey: 'mock-key',  // Bất kỳ string nào
  baseURL: 'http://localhost:3001/anthropic',  // Local
});

// ✅ Miễn phí
// ✅ Offline works
// ✅ No limits
// ✅ No account needed
```

---

## TROUBLESHOOTING

### "Connection refused"

**Nguyên nhân:** Mock server chưa chạy

**Fix:**
```bash
cd mock-server
npm run dev
```

### "404 Not Found"

**Nguyên nhân:** Sai endpoint URL

**Check:**
- Anthropic: `http://localhost:3001/anthropic/v1/messages`
- OpenAI: `http://localhost:3001/openai/v1/chat/completions`
- Ollama: `http://localhost:3001/ollama/api/chat`

### "Cannot find module"

**Nguyên nhân:** Chưa install dependencies

**Fix:**
```bash
cd mock-server
npm install
```

### Streaming không work

**Check:**
- `stream: true` trong request body
- Content-Type: `application/json`
- Response headers có `text/event-stream` (Anthropic, OpenAI) hoặc `application/x-ndjson` (Ollama)

---

## FAQ

### Q: Có cần đăng ký account không?
**A:** KHÔNG! Mock server hoàn toàn local.

### Q: Có tốn tiền không?
**A:** KHÔNG! Hoàn toàn miễn phí.

### Q: Có giống API thật không?
**A:** Response format giống 99%, nhưng content là mock data.

### Q: Có thể custom responses không?
**A:** CÓ! Edit file `mock-server/src/mock-data/responses.ts`

### Q: Có thể deploy lên server không?
**A:** CÓ! Nhưng chỉ nên dùng cho testing, không phải production.

### Q: Streaming có giống thật không?
**A:** CÓ! Word-by-word với 50ms delay, giống như real API.

### Q: Rate limits?
**A:** KHÔNG CÓ! Call bao nhiêu cũng được.

---

## EXAMPLE: Full Integration

```typescript
// Step 1: Start mock server
// cd mock-server && npm run dev

// Step 2: Configure client
import {HomeScreen} from './HomeScreen';
import {AnthropicClient} from './clients/AnthropicClient';

const mockClient = new AnthropicClient({
  apiKey: 'not-needed-but-required-by-client',
  baseURL: 'http://localhost:3001/anthropic',
});

// Step 3: Use it!
function App() {
  return (
    <HomeScreen
      apiClient={mockClient}
      initialProvider="anthropic"
    />
  );
}

// Chạy app và test - KHÔNG CẦN API key thật!
```

---

## PRODUCTION USE

⚠️ **CẢNH BÁO:** Mock server chỉ cho **TESTING/DEVELOPMENT**!

**Không nên dùng cho production vì:**
- Responses không thật
- Không có security
- Không có persistence
- Không có monitoring

**Để production:**
- Switch sang real API endpoints
- Dùng API keys thật
- Enable proper authentication
- Add monitoring & logging

**Switch rất đơn giản:**
```typescript
// Development
const client = new AnthropicClient({
  baseURL: 'http://localhost:3001/anthropic',  // Mock
});

// Production
const client = new AnthropicClient({
  apiKey: process.env.ANTHROPIC_API_KEY,        // Real key
  baseURL: 'https://api.anthropic.com',         // Real API
});
```

---

## SUMMARY

**Mock Server = Local Testing Paradise** 🎉

- ✅ Không cần API keys
- ✅ Không tốn tiền
- ✅ Test offline
- ✅ No rate limits
- ✅ Consistent responses
- ✅ Fast local responses
- ✅ All 4 providers supported
- ✅ Realistic streaming
- ✅ Easy to use

**Start testing now:**
```bash
cd mock-server
npm install
npm run dev
# Ready to test! 🚀
```
