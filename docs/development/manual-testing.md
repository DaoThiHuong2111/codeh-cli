# Manual Testing Guide - Phase 2 AI Tool Calling

## Overview

Hướng dẫn này giúp bạn test AI tool calling workflow như một người dùng thật, sử dụng Mock AI Server để simulate AI behavior mà không tốn API costs.

## Prerequisites

- Node.js đã cài đặt
- Project đã build: `npm run build`
- Mock server sẵn sàng: `mock-server/ai-server.ts`

## Architecture Flow

```
User Input
    ↓
CodehClient
    ↓
1. Get tool definitions from ToolRegistry
2. Convert to API format (ToolDefinitionConverter.toApiFormatBatch)
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

## Setup

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Build Project

```bash
npm run build
```

Build có thể có warnings về missing types (React, Ink, etc.) nhưng core functionality vẫn work.

### Step 3: Verify Tool Registration

Check rằng symbol tools đã được registered:

```bash
# Look for tool registration in DI setup
grep -A 5 "SymbolSearchTool" source/core/di/setup.ts
```

Expected output:
```typescript
registry.register(new SymbolSearchTool(projectRoot));
registry.register(new FindReferencesTool(projectRoot));
registry.register(new GetSymbolsOverviewTool(projectRoot));
```

## Testing Scenarios

### Scenario 1: Simple Symbol Search

**Goal**: Test AI using `symbol_search` tool to find a class.

**Steps**:

1. Start mock server:
```bash
node mock-server/ai-server.ts
```

Expected output:
```
Mock AI server listening on port 3456
Available scenarios:
  - find-calculator-class
  - find-references
  - get-overview
  - refactor-workflow
```

2. In another terminal, test with curl:
```bash
curl -X POST http://localhost:3456 \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "find-calculator-class",
    "step": 0
  }'
```

Expected response:
```json
{
  "content": "Tôi sẽ tìm class Calculator trong codebase.",
  "toolCalls": [{
    "id": "call_1",
    "type": "function",
    "function": {
      "name": "symbol_search",
      "arguments": "{\"namePattern\":\"Calculator\",\"substringMatching\":false}"
    }
  }],
  "nextStep": 1
}
```

3. Send tool result back:
```bash
curl -X POST http://localhost:3456 \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "find-calculator-class",
    "step": 1,
    "toolResults": [{
      "id": "call_1",
      "output": "Found Calculator class at source/Calculator.ts:5"
    }]
  }'
```

Expected: AI responds với analysis của Calculator class.

### Scenario 2: Find References

**Goal**: Test AI using `find_references` tool.

```bash
curl -X POST http://localhost:3456 \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "find-references",
    "step": 0
  }'
```

Expected: AI requests `find_references` tool với namePath và filePath.

### Scenario 3: Get Symbols Overview

**Goal**: Test AI using `get_symbols_overview` tool.

```bash
curl -X POST http://localhost:3456 \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "get-overview",
    "step": 0
  }'
```

Expected: AI requests overview của file.

### Scenario 4: Complex Multi-Tool Workflow

**Goal**: Test AI using multiple tools in sequence.

```bash
# Step 1: AI requests overview
curl -X POST http://localhost:3456 \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "refactor-workflow",
    "step": 0
  }'

# Step 2: Send overview result, AI requests symbol_search
curl -X POST http://localhost:3456 \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "refactor-workflow",
    "step": 1,
    "toolResults": [{"id": "call_1", "output": "Overview data..."}]
  }'

# Step 3: Send search result, AI requests find_references
curl -X POST http://localhost:3456 \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "refactor-workflow",
    "step": 2,
    "toolResults": [{"id": "call_2", "output": "Symbol data..."}]
  }'

# Step 4: Final response
curl -X POST http://localhost:3456 \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "refactor-workflow",
    "step": 3,
    "toolResults": [{"id": "call_3", "output": "References data..."}]
  }'
```

Expected: AI completes analysis với all tool results.

## Integration with CodehClient

Để test toàn bộ workflow thực tế (chưa implement phần này):

### Option 1: Create Test Script

Create `test-client.ts`:

```typescript
import {CodehClient} from './dist/core/application/CodehClient.js';
import {ToolRegistry} from './dist/core/tools/base/ToolRegistry.js';
import {SymbolSearchTool} from './dist/core/tools/SymbolSearchTool.js';
// ... other imports

// Create mock API client pointing to http://localhost:3456
class MockServerClient implements IApiClient {
  async chat(request: ApiRequest): Promise<ApiResponse> {
    const response = await fetch('http://localhost:3456', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        scenario: 'find-calculator-class',
        step: 0,
        tools: request.tools,
      }),
    });
    return await response.json();
  }
  // ... implement other methods
}

// Setup
const toolRegistry = new ToolRegistry();
toolRegistry.register(new SymbolSearchTool(process.cwd()));
// ... register other tools

const apiClient = new MockServerClient();
const historyRepo = new FileHistoryRepository();
const permissionHandler = new SimplePermissionHandler();

const client = new CodehClient(
  apiClient,
  historyRepo,
  toolRegistry,
  permissionHandler,
);

// Test
const turn = await client.execute('Find Calculator class');
console.log('Response:', turn.response?.content);
console.log('Tool calls:', turn.toolCalls);
```

Run:
```bash
npx tsx test-client.ts
```

### Option 2: Update Mock Server to Anthropic Format

Update `mock-server/ai-server.ts` để return đúng Anthropic API format:

```typescript
// Current format (simplified)
{
  content: "...",
  toolCalls: [...]
}

// Should be Anthropic format
{
  content: [
    {type: "text", text: "..."},
    {type: "tool_use", id: "call_1", name: "symbol_search", input: {...}}
  ],
  stop_reason: "tool_use",
  usage: {...}
}
```

## Verification Checklist

- [ ] Mock server starts successfully on port 3456
- [ ] All 4 scenarios are listed
- [ ] Scenario 1 (find-calculator-class) returns tool_calls
- [ ] Tool call has correct structure (id, type, function.name, function.arguments)
- [ ] Step 2 accepts tool results and returns final response
- [ ] Scenario 2 (find-references) works
- [ ] Scenario 3 (get-overview) works
- [ ] Scenario 4 (refactor-workflow) completes 3 steps
- [ ] No errors in console logs

## Troubleshooting

### Issue: Mock server won't start

**Solution**: Check if port 3456 is already in use:
```bash
lsof -i :3456
# Kill existing process if needed
kill -9 <PID>
```

### Issue: TypeError when parsing tool arguments

**Solution**: Verify JSON.stringify/parse in mock server:
```typescript
arguments: JSON.stringify({...})  // When creating tool call
JSON.parse(call.arguments)        // When parsing tool call
```

### Issue: Tool calls not working in CodehClient

**Solution**: Verify tool definitions are converted correctly:
```typescript
const tools = ToolDefinitionConverter.toApiFormatBatch(
  this.toolRegistry.getDefinitions()
);
console.log('Tools sent to AI:', JSON.stringify(tools, null, 2));
```

### Issue: Permission denied for symbol tools

**Solution**: Check permission handler auto-approves symbol tools:
```typescript
async requestPermission(toolName: string): Promise<boolean> {
  if (['symbol_search', 'find_references', 'get_symbols_overview'].includes(toolName)) {
    return true; // Auto-approve
  }
  // ... ask user for other tools
}
```

## Expected Results

### After Scenario 1 (find-calculator-class):

1. ✅ AI decides to use `symbol_search` tool
2. ✅ Tool is executed with correct parameters
3. ✅ Tool returns symbol information
4. ✅ AI receives result and provides final answer
5. ✅ Total API calls: 2 (initial + continuation)

### After Scenario 4 (refactor-workflow):

1. ✅ AI uses `get_symbols_overview` first
2. ✅ AI uses `symbol_search` with includeBody
3. ✅ AI uses `find_references` last
4. ✅ AI provides comprehensive analysis
5. ✅ Total API calls: 4 (initial + 3 continuations)

## Next Steps

After manual testing passes:

1. **Write Real Integration Tests**: Replace mock server with actual test fixtures
2. **Test with Real AI APIs**: Configure Anthropic/OpenAI API keys and test
3. **Implement UI for Tool Execution**: Show tool calls in progress in CLI
4. **Add More Symbol Tools**: Implement rename, refactor, edit tools
5. **Optimize Performance**: Cache tool results, batch operations

## Performance Metrics

Track these during testing:

- **Tool Discovery**: < 100ms (from ToolRegistry.getDefinitions)
- **Tool Conversion**: < 50ms (ToolDefinitionConverter.toApiFormatBatch)
- **Tool Execution**: Varies by tool (symbol_search ~200ms, find_references ~500ms)
- **Total Round-trip**: 2-5 seconds per tool call (including AI response time)

## Success Criteria

✅ All 4 mock server scenarios work end-to-end
✅ Tool definitions are correctly formatted for API
✅ Tool calls are parsed correctly from AI responses
✅ Tools execute successfully with permission checks
✅ Tool results are sent back to AI correctly
✅ Multi-turn conversations work (agentic loop)
✅ No memory leaks or crashes during extended testing

---

**Last Updated**: 2025-01-11
**Phase 2 Status**: 60% Complete
**Next**: Real API integration and UI improvements
