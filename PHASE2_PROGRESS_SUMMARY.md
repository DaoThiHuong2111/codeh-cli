# Phase 2: AI Integration - Progress Summary

## 🎯 Mục tiêu Phase 2
Enable AI models sử dụng TypeScript symbol tools để:
- Discover tools available
- Call tools với parameters
- Receive và process tool results
- Continue conversation với context

---

## ✅ Đã hoàn thành (Part 1)

### 1. **ToolDefinitionConverter** ✅
**File:** `source/core/application/services/ToolDefinitionConverter.ts`

**Capabilities:**
```typescript
const converter = new ToolDefinitionConverter();

// Convert sang Anthropic Claude format
const anthropicTools = converter.toAnthropicFormat(toolDefs);
// → {name, description, input_schema: {type, properties, required}}

// Convert sang OpenAI format
const openaiTools = converter.toOpenAIFormat(toolDefs);
// → {type: 'function', function: {name, description, parameters}}

// Convert sang generic format
const genericTools = converter.toGenericFormat(toolDefs);
// → {name, description, parameters}

// Auto-select format for provider
const tools = converter.getFormatForProvider(toolDefs, 'anthropic');
```

**Supported Formats:**
- ✅ Anthropic Claude (`input_schema` format)
- ✅ OpenAI (`function` format)
- ✅ Generic (simplified)

**Input Support:**
- ✅ `inputSchema` format (JSON Schema)
- ✅ `parameters` array format
- ✅ Auto-convert between formats

---

### 2. **Mock AI Server** ✅
**File:** `mock-server/ai-server.ts` (349 dòng)

**Purpose:**
Mô phỏng AI behavior để test tool calling workflow without real API costs.

**Features:**
- HTTP server on port 3456
- 4 pre-configured scenarios
- Tool calling simulation
- CORS enabled

**Scenarios:**

#### Scenario 1: `find-calculator-class`
```
Step 1: AI thinks → calls symbol_search for "Calculator"
Step 2: AI sees result → calls symbol_search with depth=1 for methods
Step 3: AI responds với summary
```

#### Scenario 2: `find-references`
```
Step 1: AI → calls find_references for "Calculator/add"
Step 2: AI responds với 3 references found
```

#### Scenario 3: `get-overview`
```
Step 1: AI → calls get_symbols_overview
Step 2: AI responds với file structure
```

#### Scenario 4: `refactor-workflow` (Complex)
```
Step 1: AI → get_symbols_overview
Step 2: AI → symbol_search với includeBody
Step 3: AI → find_references
Step 4: AI responds với complete analysis
```

**Usage:**
```bash
# Start server
node mock-server/ai-server.ts

# Or programmatically
import {MockAIServer} from './mock-server/ai-server';
const server = new MockAIServer(3456);
await server.start();

// Use in tests
const scenarios = server.getScenarios();
// → ['find-calculator-class', 'find-references', 'get-overview', 'refactor-workflow']
```

---

## 🔜 Tiếp theo (Part 2)

### 3. **Update CodehClient for Tool Calling** 🔜
**File:** `source/core/application/CodehClient.ts`

**Cần implement:**

#### A. Send tool definitions to AI
```typescript
// CodehClient.ts
async chat(userMessage: string): Promise<string> {
  // Get tool definitions from registry
  const toolDefs = this.toolRegistry.getDefinitions();

  // Convert to API format
  const converter = new ToolDefinitionConverter();
  const tools = converter.getFormatForProvider(
    toolDefs,
    this.getProviderType()
  );

  // Send to AI with tools
  const response = await this.apiClient.chat(userMessage, {
    tools: tools
  });

  // Handle response...
}
```

#### B. Parse tool calls from AI
```typescript
private parseToolCalls(response: any): ToolCall[] {
  // Anthropic format
  if (response.content && Array.isArray(response.content)) {
    return response.content
      .filter(block => block.type === 'tool_use')
      .map(block => ({
        id: block.id,
        name: block.name,
        arguments: block.input
      }));
  }

  // OpenAI format
  if (response.tool_calls) {
    return response.tool_calls.map(call => ({
      id: call.id,
      name: call.function.name,
      arguments: JSON.parse(call.function.arguments)
    }));
  }

  return [];
}
```

#### C. Execute tools
```typescript
private async executeTools(toolCalls: ToolCall[]): Promise<ToolResult[]> {
  const results: ToolResult[] = [];

  for (const call of toolCalls) {
    // Check permission
    const allowed = await this.permissionHandler.requestPermission(
      call.name,
      call.arguments
    );

    if (!allowed) {
      results.push({
        id: call.id,
        success: false,
        error: 'Permission denied'
      });
      continue;
    }

    // Execute tool
    const result = await this.toolRegistry.execute(
      call.name,
      call.arguments
    );

    results.push({
      id: call.id,
      ...result
    });
  }

  return results;
}
```

#### D. Send tool results back
```typescript
private async sendToolResults(
  toolResults: ToolResult[]
): Promise<string> {
  // Format results for AI
  const formattedResults = this.formatToolResults(toolResults);

  // Send back to AI
  const response = await this.apiClient.continueWithTools(
    formattedResults
  );

  // Check if AI wants to call more tools
  const moreCalls = this.parseToolCalls(response);
  if (moreCalls.length > 0) {
    return this.handleToolCalls(moreCalls);
  }

  return response.content;
}
```

---

### 4. **Update API Clients** 🔜
**Files:**
- `source/infrastructure/api/clients/AnthropicClient.ts`
- `source/infrastructure/api/clients/OpenAIClient.ts`

**Cần thêm:**

#### Interface updates
```typescript
// IApiClient.ts
interface IApiClient {
  chat(
    messages: Message[],
    options?: {
      tools?: any[];
      tool_choice?: 'auto' | 'required';
    }
  ): Promise<ChatResponse>;

  continueWithTools(
    toolResults: ToolResult[]
  ): Promise<ChatResponse>;
}
```

#### Anthropic implementation
```typescript
// AnthropicClient.ts
async chat(messages, options) {
  const requestBody = {
    model: this.model,
    messages: messages,
    max_tokens: this.maxTokens,
    tools: options?.tools || []
  };

  const response = await this.httpClient.post(
    '/messages',
    requestBody
  );

  return this.parseResponse(response);
}
```

---

### 5. **E2E Tests với Mock Server** 🔜
**File:** `test/e2e/tool-integration.test.ts`

**Test scenarios:**

```typescript
test('E2E: AI finds Calculator class using tools', async t => {
  // 1. Start mock server
  const mockServer = new MockAIServer(3456);
  await mockServer.start();

  // 2. Create CodehClient pointing to mock
  process.env.CODEH_API_URL = 'http://localhost:3456';
  const client = await createCodehClient(container);

  // 3. User sends message
  const response = await client.chat('Tìm class Calculator');

  // 4. Verify AI used tools
  t.true(response.includes('Calculator'));
  t.true(response.includes('add'));
  t.true(response.includes('multiply'));

  // 5. Cleanup
  await mockServer.stop();
});

test('E2E: Complex workflow với multiple tools', async t => {
  const mockServer = new MockAIServer(3456);
  await mockServer.start();

  const client = await createCodehClient(container);

  // User request phức tạp
  const response = await client.chat(
    'Phân tích Calculator class và tìm tất cả references'
  );

  // Verify AI đã dùng multiple tools
  t.true(response.includes('overview'));
  t.true(response.includes('references'));

  await mockServer.stop();
});

test('E2E: Permission system cho tools', async t => {
  const client = await createCodehClient(container);

  // Symbol tools should be auto-approved
  const response1 = await client.chat('Find Calculator class');
  t.true(response1.includes('Calculator'));

  // Shell tool should require approval
  // (mock permission handler to deny)
  const response2 = await client.chat('Run npm test');
  t.true(response2.includes('Permission required'));
});
```

---

### 6. **Manual Testing như User** 🔜

#### Setup
```bash
# Terminal 1: Start mock server
npm run mock-server

# Terminal 2: Run codeh-cli
npm run dev
node dist/cli.js
```

#### Test Flow 1: Simple search
```
User: Tìm class Calculator trong codebase

AI: Tôi sẽ dùng symbol_search để tìm...
[Uses tool: symbol_search with namePattern="Calculator"]

Tool Result: Found Calculator at source/Calculator.ts:5

AI: Đã tìm thấy class Calculator tại source/Calculator.ts dòng 5.
    Class này có 3 methods: add, subtract, multiply.
```

#### Test Flow 2: Find references
```
User: Tìm tất cả nơi gọi Calculator.add

AI: Tôi sẽ dùng find_references...
[Uses tool: find_references with namePath="Calculator/add"]

Tool Result: 3 references found

AI: Có 3 nơi gọi Calculator.add:
    1. source/example.ts:15
    2. source/test.ts:22
    3. source/app.ts:8
```

#### Test Flow 3: Complex workflow
```
User: Refactor Calculator class

AI: Tôi sẽ phân tích class Calculator:

    Bước 1: Xem overview file
    [Uses: get_symbols_overview]

    Bước 2: Lấy chi tiết class
    [Uses: symbol_search with depth=1]

    Bước 3: Kiểm tra references
    [Uses: find_references]

    Kết quả phân tích:
    - Class có 3 methods
    - Được dùng ở 5 files
    - Có thể refactor an toàn

    Bạn muốn tôi tiếp tục refactor không?
```

---

## 📊 Current Status

| Component | Status | Files | Lines |
|-----------|--------|-------|-------|
| ToolDefinitionConverter | ✅ Complete | 1 | 199 |
| Mock AI Server | ✅ Complete | 1 | 349 |
| CodehClient Updates | 🔜 Next | 1 | ~200 |
| API Client Updates | 🔜 Next | 2 | ~150 |
| E2E Tests | 🔜 Next | 1 | ~300 |
| Manual Testing | 🔜 Next | - | - |

**Phase 2 Progress:** 35% Complete

---

## 🎯 Expected Final State

Khi Phase 2 hoàn thành:

### User Experience
```
User: Tìm class Calculator
AI: [Automatically uses symbol_search]
AI: Found Calculator at source/Calculator.ts with 3 methods

User: Tìm references
AI: [Uses find_references]
AI: Found 3 references at...

User: Refactor it
AI: [Uses get_overview + symbol_search + find_references]
AI: Analysis complete. Ready to refactor.
```

### Developer Experience
```typescript
// Tools tự động available cho AI
const client = new CodehClient(...);
const response = await client.chat('Find Calculator');
// → AI tự động discover và dùng tools

// Permission system
// - Symbol tools: auto-approved (read-only, safe)
// - Shell/FileOps: require user approval
```

### Architecture
```
User Input
    ↓
CodehClient
    ↓
1. Get tool definitions from ToolRegistry
2. Convert to API format (ToolDefinitionConverter)
3. Send to AI with tools
    ↓
AI Response (may include tool_calls)
    ↓
4. Parse tool calls
5. Execute tools (ToolRegistry)
6. Send results back to AI
    ↓
AI Final Response
    ↓
Display to User
```

---

## 🚀 Next Actions

### Immediate (Today):
1. ✅ **DONE**: ToolDefinitionConverter
2. ✅ **DONE**: Mock AI Server
3. 🔜 **TODO**: Update CodehClient implementation
4. 🔜 **TODO**: Update AnthropicClient implementation

### This Week:
5. 🔜 Write E2E tests với mock server
6. 🔜 Manual testing với mock server
7. 🔜 Fix any issues found
8. 🔜 Complete Phase 2

### After Phase 2:
9. 🔮 Phase 3: UI Components (PlanViewer, SymbolExplorer)
10. 🔮 Phase 4: Advanced features

---

## 💡 Key Insights

### ✅ Why Mock Server?
- Test without API costs
- Reproducible test scenarios
- Fast iteration
- Test edge cases easily

### ✅ Why ToolDefinitionConverter?
- Support multiple AI providers
- Clean separation of concerns
- Easy to add new formats
- Type-safe conversions

### ✅ Benefits of Phase 2
- AI becomes **much smarter** about code
- Can navigate codebase semantically
- Answer questions like:
  - "Where is this function used?"
  - "What methods does this class have?"
  - "Who calls this API?"
- Foundation for Phase 3 (workflow automation)

---

## 📚 Documentation

- **IMPLEMENTATION_ROADMAP.md** - Overall roadmap
- **TYPESCRIPT_TOOLS_IMPLEMENTATION.md** - Tools details
- **SERENA_INTEGRATION_PLAN.md** - Original inspiration
- **THIS FILE** - Phase 2 progress

---

**Last Updated:** 2025-01-11
**Status:** Phase 2 Part 1 Complete | Part 2 In Progress
**Next Commit:** CodehClient updates + E2E tests
