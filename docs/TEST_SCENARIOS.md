# Codeh CLI - Test Scenarios Toàn Diện

## 📋 Tổng Quan Test Strategy

Tài liệu này định nghĩa **test scenarios toàn diện** cho mọi component trong Codeh CLI project, bao gồm:
- Unit tests
- Integration tests
- End-to-end tests
- Component tests
- System tests

**Test Framework**: AVA + ink-testing-library + TypeScript  
**Coverage Target**: 95%+ (hiện tại >70%)  
**Test Types**: Unit, Integration, E2E, Component

---

## 🎯 Test Priority Matrix

| Component | Priority | Current Coverage | Target | Tests Needed |
|-----------|----------|------------------|--------|--------------|
| API Clients | 🔴 HIGH | 0% | 95% | 70+ |
| Core Services | 🔴 HIGH | ~20% | 95% | 90+ |
| Tools | 🔴 HIGH | ~30% | 95% | 60+ |
| Config Management | 🔴 HIGH | 0% | 95% | 45+ |
| Permission System | 🟡 MEDIUM | 0% | 95% | 35+ |
| UI Components | 🟢 LOW | 85% | 95% | 25+ |
| Domain Models | ✅ DONE | 100% | 100% | 0 |
| Integrations | 🟡 MEDIUM | 0% | 70% | 40+ |

**Total New Tests Needed**: ~325 tests

---

## 📦 LAYER 3: Infrastructure Layer Tests

### 1. API Client Adapters (`source/infrastructure/api/clients/`)

#### 1.1 AnthropicSDKAdapter Tests

**File**: `test/infrastructure/api/AnthropicSDKAdapter.test.ts`

**Test Cases** (20+ tests):

##### Initialization Tests
```typescript
// === Initialization ===
✅ creates adapter with valid config
✅ creates adapter with custom timeout
✅ throws error with invalid API key
✅ throws error with invalid base URL
✅ sets default headers correctly
```

##### Non-Streaming Tests
```typescript
// === Non-Streaming Chat ===
✅ sends simple message and gets response
✅ sends message with system prompt
✅ handles multi-turn conversation
✅ handles messages with tool calls
✅ formats message history correctly
✅ handles max tokens parameter
✅ handles temperature parameter
✅ handles empty response
✅ handles API error (401, 429, 500)
```

##### Streaming Tests
```typescript
// === Streaming Chat ===
✅ streams response chunks correctly
✅ calls onChunk for each content chunk
✅ handles streaming errors gracefully
✅ supports AbortController for cancellation
✅ handles timeout during streaming
```

##### Tool Handling Tests
```typescript
// === Tool Handling ===
✅ sends tool definitions correctly
✅ receives tool calls in response
✅ handles multiple tool calls in one response
✅ formats tool results correctly
```

##### Error Handling Tests
```typescript
// === Error Handling ===
✅ handles network errors
✅ handles rate limiting (429)
✅ handles authentication errors (401)
✅ handles server errors (500)
✅ retries on transient errors
✅ throws on permanent errors
```

**Implementation Strategy**:
```typescript
// Mock Anthropic SDK
import test from 'ava';
import {AnthropicSDKAdapter} from '../source/infrastructure/api/clients/AnthropicSDKAdapter.js';

class MockAnthropicClient {
  async create(params: any) {
    return {
      id: 'msg_123',
      role: 'assistant',
      content: [{type: 'text', text: 'Mock response'}],
      model: 'claude-3-5-sonnet-20241022',
    };
  }
  
  stream(params: any) {
    // Mock streaming
    return {
      async *[Symbol.asyncIterator]() {
        yield {type: 'content_block_delta', delta: {text: 'Hello'}};
        yield {type: 'content_block_delta', delta: {text: ' World'}};
      }
    };
  }
}

test('sends simple message and gets response', async t => {
  const mockClient = new MockAnthropicClient();
  const adapter = new AnthropicSDKAdapter(config);
  // Inject mock
  (adapter as any).client = mockClient;
  
  const result = await adapter.chat([{role: 'user', content: 'Hello'}]);
  
  t.is(result.content, 'Mock response');
  t.is(result.role, 'assistant');
});
```

---

#### 1.2 OpenAISDKAdapter Tests

**File**: `test/infrastructure/api/OpenAISDKAdapter.test.ts`

**Test Cases** (20+ tests):

##### Initialization Tests
```typescript
✅ creates adapter with valid config
✅ handles custom API endpoint
✅ validates API key
✅ sets default model
```

##### Chat Completion Tests
```typescript
✅ sends chat completion request
✅ handles function calling
✅ handles streaming responses
✅ handles max tokens
✅ handles temperature/top_p
✅ formats messages correctly
```

##### Error Handling Tests
```typescript
✅ handles API errors (OpenAIError)
✅ handles rate limits
✅ handles invalid requests
✅ retries on network errors
```

---

#### 1.3 OllamaSDKAdapter Tests

**File**: `test/infrastructure/api/OllamaSDKAdapter.test.ts`

**Test Cases** (15+ tests):

##### Local Connection Tests
```typescript
✅ connects to local Ollama instance
✅ lists available models
✅ validates model exists
✅ handles connection refused
```

##### Chat Tests
```typescript
✅ sends chat request to local model
✅ streams response from Ollama
✅ handles model not found error
✅ handles large context windows
```

---

#### 1.4 GenericSDKAdapter Tests

**File**: `test/infrastructure/api/GenericSDKAdapter.test.ts`

**Test Cases** (15+ tests):

##### Generic Provider Tests
```typescript
✅ works with LiteLLM endpoints
✅ works with Gemini OpenAI compat
✅ works with LM Studio
✅ handles custom headers
✅ validates endpoint connectivity
```

---

### 2. Configuration Management (`source/infrastructure/config/`)

#### 2.1 ConfigLoader Tests

**File**: `test/infrastructure/config/ConfigLoader.test.ts`

**Test Cases** (20+ tests):

##### Config Merging Tests
```typescript
// === Config Priority ===
✅ env variables override file config
✅ file config used when no env vars
✅ defaults used when no config
✅ merges partial configs correctly
✅ validates required fields
```

##### Config Loading Tests
```typescript
// === Loading ===
✅ loads from environment variables
✅ loads from config file
✅ handles missing config file
✅ handles corrupted config file
✅ validates config schema with Zod
```

##### Provider-Specific Tests
```typescript
// === Provider Configs ===
✅ loads Anthropic config correctly
✅ loads OpenAI config correctly
✅ loads Ollama config (no API key)
✅ loads Generic config correctly
✅ validates provider-specific fields
```

---

#### 2.2 EnvConfigRepository Tests

**File**: `test/infrastructure/config/EnvConfigRepository.test.ts`

**Test Cases** (15+ tests):

```typescript
// === Environment Variables ===
✅ reads CODEH_PROVIDER
✅ reads CODEH_MODEL
✅ reads CODEH_API_KEY
✅ reads CODEH_BASE_URL
✅ reads CODEH_MAX_TOKEN
✅ reads CODEH_TEMPERATURE
✅ handles missing env vars
✅ validates env var formats
✅ handles invalid values
```

---

#### 2.3 FileConfigRepository Tests

**File**: `test/infrastructure/config/FileConfigRepository.test.ts`

**Test Cases** (15+ tests):

```typescript
// === File Operations ===
✅ reads config from ~/.codeh/configs.json
✅ writes config to file
✅ creates directory if not exists
✅ handles file permission errors
✅ handles JSON parse errors
✅ validates config schema
✅ updates partial config
✅ backs up before overwrite
```

---

### 3. Permission System (`source/infrastructure/permissions/`)

#### 3.1 Permission Handler Tests

**Files**: 
- `test/infrastructure/permissions/InteractivePermissionHandler.test.ts`
- `test/infrastructure/permissions/SimplePermissionHandler.test.ts`
- `test/infrastructure/permissions/ConfigurablePermissionHandler.test.ts`

**Test Cases** (30+ tests):

```typescript
// === InteractivePermissionHandler ===
✅ prompts user for permission
✅ allows approved tools
✅ denies rejected tools
✅ remembers "always allow" choices
✅ handles timeout on user prompt

// === SimplePermissionHandler (YOLO mode) ===
✅ auto-approves all tools
✅ no user interaction needed
✅ logs tool executions

// === ConfigurablePermissionHandler ===
✅ allows tools in whitelist
✅ denies tools in blacklist
✅ prompts for unknown tools
✅ handles wildcard patterns

// === PermissionModeManager ===
✅ toggles between MVP and Interactive
✅ persists mode preference
✅ notifies mode changes
```

---

### 4. Session & History Management

#### 4.1 Session Tests

**File**: `test/infrastructure/session/SessionManager.test.ts`

**Test Cases** (20+ tests):

```typescript
// === Session Creation ===
✅ creates new session
✅ generates unique session ID
✅ initializes empty message history
✅ saves session metadata

// === Session Persistence ===
✅ saves session to disk
✅ loads session from disk
✅ handles corrupted session files
✅ migrates old session format

// === Session Management ===
✅ lists all sessions
✅ deletes session
✅ archives old sessions
✅ compresses large sessions
```

---

### 5. Integration Tests (`source/infrastructure/integrations/`)

#### 5.1 VS Code Integration Tests

**File**: `test/infrastructure/integrations/vscode.test.ts`

**Test Cases** (15+ tests):

```typescript
// === Connection ===
✅ connects to VS Code extension
✅ handles connection failure
✅ reconnects on disconnect

// === Message Passing ===
✅ sends message to VS Code
✅ receives message from VS Code
✅ handles bidirectional communication

// === Commands ===
✅ executes VS Code commands
✅ handles command errors
✅ receives VS Code events
```

---

#### 5.2 MCP Client Tests

**File**: `test/infrastructure/integrations/mcp-client.test.ts`

**Test Cases** (15+ tests):

```typescript
// === MCP Protocol ===
✅ connects to MCP server
✅ lists available tools
✅ executes MCP tools
✅ handles tool errors
✅ receives tool responses
```

---

## 🧠 LAYER 2: Core Layer Tests

### 6. Core Application Services (`source/core/application/`)

#### 6.1 CodehClient Tests

**File**: `test/core/application/CodehClient.test.ts`

**Test Cases** (30+ tests):

```typescript
// === Initialization ===
✅ creates client with dependencies
✅ initializes with config
✅ sets up tool orchestrator
✅ validates dependencies

// === Execution (Non-Streaming) ===
✅ executes simple user input
✅ classifies input type (chat vs command)
✅ sends to API client
✅ receives and parses response
✅ handles tool calls in response
✅ orchestrates tool execution
✅ continues after tool results
✅ returns final Turn

// === Execution (Streaming) ===
✅ streams response chunks
✅ calls onChunk callback
✅ handles tool calls during streaming
✅ completes streaming with final Turn

// === Tool Integration ===
✅ detects tool calls in response
✅ triggers tool orchestrator
✅ handles tool execution progress
✅ merges tool results
✅ continues conversation

// === Error Handling ===
✅ handles API errors
✅ handles tool execution errors
✅ returns error turns
✅ retries on transient errors
```

**Mock Setup**:
```typescript
class MockApiClient implements IApiClient {
  async chat(messages: Message[]) {
    return Turn.create(Message.assistant('Mock response'));
  }
  
  async chatStream(messages: Message[], onChunk: (chunk: string) => void) {
    onChunk('Hello ');
    onChunk('World');
    return Turn.create(Message.assistant('Hello World'));
  }
}

class MockHistoryRepo implements IHistoryRepository {
  private messages: Message[] = [];
  
  async addMessage(msg: Message) {
    this.messages.push(msg);
  }
  
  async getHistory() {
    return this.messages;
  }
}
```

---

#### 6.2 CodehChat Tests

**File**: `test/core/application/CodehChat.test.ts`

**Test Cases** (25+ tests):

```typescript
// === Session Management ===
✅ creates new session
✅ loads session from history
✅ clears session
✅ starts new conversation

// === Message Management ===
✅ adds user message
✅ adds assistant message
✅ retrieves history
✅ gets last N messages
✅ persists to history repo

// === Conversation Stats ===
✅ calculates message counts
✅ estimates token count
✅ checks compression need

// === Session Operations ===
✅ getSession returns current session
✅ handles empty session
✅ handles large sessions
```

---

#### 6.3 ToolExecutionOrchestrator Tests

**File**: `test/core/application/ToolExecutionOrchestrator.test.ts`

**Test Cases** (35+ tests):

```typescript
// === Tool Detection ===
✅ detects tool calls in Turn
✅ requiresToolExecution returns true/false
✅ handles multiple tool calls

// === Tool Execution Pipeline ===
✅ orchestrates full pipeline (detect → permission → execute → format → continue)
✅ handles single tool execution
✅ handles multiple tool executions
✅ executes tools in correct order

// === Permission Handling ===
✅ requests permission before execution
✅ skips denied tools
✅ continues with approved tools
✅ handles "always allow"

// === Tool Results ===
✅ formats tool results for LLM
✅ creates tool result messages
✅ handles tool execution errors
✅ continues with tool results

// === Agentic Loop ===
✅ iterates up to max iterations
✅ stops when no more tools
✅ handles tool calling more tools
✅ emits progress events

// === Streaming Integration ===
✅ streams LLM response during continuation
✅ calls onStreamChunk callback
✅ completes with final Turn

// === Progress Events ===
✅ emits iteration_start event
✅ emits tools_detected event
✅ emits tool_executing event
✅ emits tool_completed event
✅ emits tool_failed event
✅ emits iteration_complete event
✅ emits orchestration_complete event
```

---

### 7. Services Tests

#### 7.1 InputClassifier Tests

**File**: `test/core/application/services/InputClassifier.test.ts`

**Test Cases** (15+ tests):

```typescript
// === Classification ===
✅ classifies chat messages
✅ classifies slash commands (/help, /clear, etc.)
✅ classifies system commands
✅ handles ambiguous input
✅ handles empty input
```

---

#### 7.2 OutputFormatter Tests

**File**: `test/core/application/services/OutputFormatter.test.ts`

**Test Cases** (10+ tests):

```typescript
// === Formatting ===
✅ formats plain text
✅ formats markdown
✅ formats code blocks
✅ formats tool outputs
✅ handles special characters
```

---

#### 7.3 ToolResultFormatter Tests

**File**: `test/core/application/services/ToolResultFormatter.test.ts`

**Test Cases** (15+ tests):

```typescript
// === Tool Result Formatting ===
✅ formats successful tool result
✅ formats failed tool result
✅ formats tool output with metadata
✅ handles large outputs
✅ sanitizes sensitive data
✅ formats for different providers (Anthropic vs OpenAI)
```

---

### 8. Tools Tests (`source/core/tools/`)

Hiện có 19+ tools, cần tests cho mỗi tool:

#### 8.1 Shell Tool Tests

**File**: `test/core/tools/Shell.test.ts`

**Test Cases** (15+ tests):

```typescript
// === Command Execution ===
✅ executes simple command (ls, echo)
✅ captures stdout
✅ captures stderr
✅ returns exit code
✅ handles command timeout
✅ handles command not found

// === Security ===
✅ sanitizes dangerous commands
✅ blocks malicious inputs
✅ validates command whitelist

// === Edge Cases ===
✅ handles large output
✅ handles binary output
✅ handles interactive commands
```

---

#### 8.2 FileOps Tool Tests

**File**: `test/core/tools/FileOps.test.ts`

**Test Cases** (20+ tests):

```typescript
// === File Reading ===
✅ reads file content
✅ handles file not found
✅ handles permission denied
✅ handles binary files

// === File Writing ===
✅ writes content to file
✅ creates directory if needed
✅ handles write errors
✅ backs up before overwrite

// === File Operations ===
✅ lists directory contents
✅ creates directories
✅ deletes files
✅ moves/renames files
✅ checks file existence

// === Security ===
✅ validates file paths
✅ blocks directory traversal
✅ respects permission boundaries
```

---

#### 8.3 Code Navigation Tools Tests

**Files**:
- `test/core/tools/FindImplementations.test.ts` ✅ (exists)
- `test/core/tools/GetCallHierarchy.test.ts` ✅ (exists)
- `test/core/tools/GetTypeInformation.test.ts` ✅ (exists)
- `test/core/tools/DependencyGraph.test.ts` ✅ (exists)
- `test/core/tools/SmartContextExtractor.test.ts` ✅ (exists)
- `test/core/tools/ValidateCodeChanges.test.ts` ✅ (exists)

**Additional Test Cases per Tool** (5-10 tests each):

```typescript
// === General Pattern for Navigation Tools ===
✅ finds symbols in TypeScript files
✅ handles malformed code
✅ handles missing symbols
✅ handles ambiguous symbols
✅ caches results
✅ handles large codebases
```

---

#### 8.4 Missing Tool Tests

**Cần tạo tests cho các tools sau**:

1. **FindFileTool.test.ts** (10+ tests)
2. **FindReferencesTool.test.ts** (10+ tests)
3. **GetSymbolsOverviewTool.test.ts** (10+ tests)
4. **InsertAfterSymbolTool.test.ts** (10+ tests)
5. **InsertBeforeSymbolTool.test.ts** (10+ tests)
6. **RenameSymbolTool.test.ts** (10+ tests)
7. **ReplaceRegexTool.test.ts** (10+ tests)
8. **ReplaceSymbolBodyTool.test.ts** (10+ tests)
9. **SearchForPatternTool.test.ts** (10+ tests)
10. **SymbolSearchTool.test.ts** (10+ tests)
11. **WorkflowTools.test.ts** (15+ tests)

---

### 9. Keyboard Shortcuts System Tests

**File**: `test/core/input/ShortcutManager.test.ts`

**Test Cases** (20+ tests):

```typescript
// === Shortcut Registration ===
✅ registers shortcut with key
✅ registers shortcut with layer
✅ registers conditional shortcut
✅ detects conflicts

// === Shortcut Execution ===
✅ executes matching shortcut
✅ respects layer priority (input > screen > global)
✅ calls handler with correct context
✅ handles async handlers

// === Shortcut Management ===
✅ unregisters shortcuts
✅ updates shortcut handlers
✅ lists all active shortcuts
✅ filters by layer

// === Edge Cases ===
✅ handles invalid key combinations
✅ handles modifier keys
✅ handles multiple shortcuts same key different layers
✅ handles disabled shortcuts
```

---

## 🎨 LAYER 1: Presentation Layer Tests

### 10. Component Tests (`source/cli/components/`)

**Note**: Đã có một số component tests (ProgressBar, MessageBubble, TodosDisplay)

#### 10.1 Missing Component Tests

##### Atoms
- **Button.test.tsx** (10+ tests)
- **Logo.test.tsx** (5+ tests)
- **Spinner.test.tsx** (5+ tests)
- **StatusIndicator.test.tsx** (10+ tests)

##### Molecules
- **InputBox.test.tsx** (15+ tests)
- **ToolCallDisplay.test.tsx** (10+ tests)
- **ToolResultDisplay.test.tsx** (10+ tests)
- **ToolExecutionProgress.test.tsx** (10+ tests)
- **ToolPermissionDialog.test.tsx** (15+ tests)

##### Organisms
- **ConversationArea.test.tsx** (15+ tests)
- **Footer.test.tsx** (10+ tests)
- **Navigation.test.tsx** (10+ tests)
- **SlashSuggestions.test.tsx** (15+ tests)
- **SessionSelector.test.tsx** (10+ tests)

**Example Test Pattern**:
```typescript
import test from 'ava';
import React from 'react';
import {render} from 'ink-testing-library';
import {Button} from '../source/cli/components/atoms/Button.js';

test('renders button with label', t => {
  const {lastFrame} = render(<Button label="Click Me" />);
  const output = lastFrame();
  
  t.true(output.includes('Click Me'));
});

test('calls onPress when activated', t => {
  let pressed = false;
  const onPress = () => { pressed = true; };
  
  const {stdin} = render(<Button label="Test" onPress={onPress} />);
  stdin.write('\r'); // Simulate Enter key
  
  t.true(pressed);
});
```

---

### 11. Screen Tests (`source/cli/screens/`)

#### 11.1 Home Screen Tests

**File**: `test/cli/screens/Home.test.tsx`

**Test Cases** (20+ tests):

```typescript
// === Rendering ===
✅ renders conversation area
✅ renders input box
✅ renders footer
✅ renders todos display

// === User Input ===
✅ accepts text input
✅ sends message on Enter
✅ shows slash suggestions on /
✅ navigates input history

// === Messages ===
✅ displays user messages
✅ displays assistant messages
✅ streams assistant messages
✅ shows tool execution progress

// === Shortcuts ===
✅ Ctrl+C exits with confirmation
✅ Shift+Tab toggles permission mode
✅ Ctrl+N starts new conversation
✅ Ctrl+L clears screen
```

---

#### 11.2 Config Screen Tests

**File**: `test/cli/screens/Config.test.tsx`

**Test Cases** (15+ tests):

```typescript
// === Configuration Flow ===
✅ shows provider selection
✅ shows model input
✅ shows API key input
✅ shows base URL input
✅ validates inputs

// === Save/Load ===
✅ saves config to file
✅ loads existing config
✅ shows success message
✅ handles save errors
```

---

#### 11.3 Welcome Screen Tests

**File**: `test/cli/screens/Welcome.test.tsx`

**Test Cases** (5+ tests):

```typescript
// === Rendering ===
✅ displays welcome message
✅ displays logo
✅ shows quick start info
✅ transitions to home screen
```

---

### 12. Presenters Tests

**File**: `test/cli/presenters/HomePresenter.test.ts`

**Note**: Đã có HomePresenterNew.test.ts với 50+ tests ✅

**Additional Edge Cases** (10+ tests):
```typescript
// === Memory Management ===
✅ cleans up resources on unmount
✅ handles large message history
✅ compresses old messages

// === Error Recovery ===
✅ recovers from API errors
✅ recovers from tool errors
✅ shows user-friendly error messages
```

---

## 🔗 Integration & E2E Tests

### 13. API Integration Tests

**File**: `test/integration/api-integration.test.ts`

**Test Cases** (20+ tests):

```typescript
// === Real API Tests (with mock server) ===
✅ sends request to Anthropic mock server
✅ sends request to OpenAI mock server
✅ sends request to Ollama mock server
✅ handles streaming from mock server
✅ handles tool calls from mock server

// === Configuration Integration ===
✅ loads config and creates correct client
✅ switches between providers
✅ handles missing configs gracefully
```

---

### 14. Tool Execution Flow Tests

**File**: `test/integration/ToolExecutionFlow.test.ts` ✅ (exists)

**Additional Test Cases** (10+ tests):

```typescript
// === Complex Tool Workflows ===
✅ executes shell command → file write → file read
✅ executes code navigation → symbol rename
✅ handles tool errors in multi-step workflow
✅ respects permission at each step
```

---

### 15. End-to-End Workflow Tests

**File**: `test/e2e/complete-workflows.test.ts`

**Test Cases** (15+ tests):

```typescript
// === Complete User Workflows ===
✅ first-time setup (config) → chat → exit
✅ load session → continue chat → save
✅ execute tool → review result → approve → continue
✅ toggle permission mode → execute tools
✅ use slash commands → execute → view results

// === Multi-Turn Conversations ===
✅ 10-turn conversation with history
✅ conversation with tool calls at multiple points
✅ conversation with errors and recovery
```

---

## 🧪 Test Utilities & Fixtures

### 16. Test Helpers

**File**: `test/helpers/mocks.ts`

```typescript
// Mock Factories
export class MockApiClientFactory {
  static createAnthropic(): IApiClient { }
  static createOpenAI(): IApiClient { }
  static createOllama(): IApiClient { }
}

export class MockMessageFactory {
  static createUserMessage(content: string): Message { }
  static createAssistantMessage(content: string): Message { }
  static createToolCall(name: string, args: any): Message { }
}

export class MockToolFactory {
  static createShellTool(): Tool { }
  static createFileOpsTool(): Tool { }
}
```

---

**File**: `test/helpers/fixtures.ts`

```typescript
// Test Fixtures
export const TEST_CONVERSATIONS = {
  simple: [
    Message.user('Hello'),
    Message.assistant('Hi there!'),
  ],
  withTools: [
    Message.user('List files'),
    Message.assistant('', [], [
      {name: 'shell', arguments: {command: 'ls'}}
    ]),
  ],
};

export const TEST_CONFIGS = {
  anthropic: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022', apiKey: 'test-key' },
  openai: { provider: 'openai', model: 'gpt-4', apiKey: 'test-key' },
};
```

---

## 📊 Test Coverage Goals

### Coverage Breakdown

| Layer | Component | Current | Target | Priority |
|-------|-----------|---------|--------|----------|
| **Infrastructure** | | | | |
| | API Clients | 0% | 95% | 🔴 |
| | Config | 0% | 95% | 🔴 |
| | Permissions | 0% | 95% | 🟡 |
| | Session/History | 0% | 95% | 🟡 |
| | Integrations | 0% | 70% | 🟡 |
| **Core** | | | | |
| | Domain Models | 100% | 100% | ✅ |
| | Application Services | 20% | 95% | 🔴 |
| | Tools | 30% | 95% | 🔴 |
| | Input System | 0% | 95% | 🟡 |
| **Presentation** | | | | |
| | Components | 85% | 95% | 🟢 |
| | Screens | 0% | 95% | 🟡 |
| | Presenters | 70% | 95% | 🟡 |
| **Overall** | | **>70%** | **95%** | |

---

## 🎯 Test Implementation Roadmap

### Phase 1: Critical Infrastructure (2-3 weeks)
**Priority**: 🔴 HIGH  
**Coverage**: 0% → 95%

- [ ] API Client Adapters (4 adapters × 20 tests = 80 tests)
- [ ] Config Management (3 components × 15 tests = 45 tests)
- [ ] Core Services (CodehClient, CodehChat, ToolExecutionOrchestrator = 90 tests)

**Deliverable**: Confident về API interactions và config loading

---

### Phase 2: Tools & Features (2-3 weeks)
**Priority**: 🔴 HIGH  
**Coverage**: 30% → 95%

- [ ] Shell & FileOps tools (35 tests)
- [ ] Missing navigation tools (11 tools × 8 tests = 88 tests)
- [ ] Permission System (30 tests)
- [ ] Keyboard Shortcuts (20 tests)

**Deliverable**: All tools tested, tool execution reliable

---

### Phase 3: UI & Integration (1-2 weeks)
**Priority**: 🟡 MEDIUM  
**Coverage**: 60% → 95%

- [ ] Missing component tests (15 components × 10 tests = 150 tests)
- [ ] Screen tests (3 screens × 15 tests = 45 tests)
- [ ] Integration tests (VS Code, MCP, A2A = 40 tests)

**Deliverable**: UI components validated, integrations tested

---

### Phase 4: E2E & Polish (1 week)
**Priority**: 🟢 LOW  
**Coverage**: 95% → 95%+

- [ ] End-to-end workflows (15 tests)
- [ ] Performance tests (10 tests)
- [ ] Security tests (10 tests)
- [ ] Edge cases & cleanup (20 tests)

**Deliverable**: Full system confidence, production-ready

---

## 🛠️ Test Running Guide

### Run All Tests
```bash
npm test
```

### Run Specific Test Suite
```bash
# Infrastructure tests
npx ava test/infrastructure/**/*.test.ts

# Core tests
npx ava test/core/**/*.test.ts

# Component tests
npx ava test/cli/components/**/*.test.tsx

# Integration tests
npx ava test/integration/**/*.test.ts
```

### Run Single Test File
```bash
npx ava test/infrastructure/api/AnthropicSDKAdapter.test.ts
```

### Watch Mode (development)
```bash
npx ava --watch
```

### Coverage Report
```bash
npx c8 ava
npx c8 report --reporter=html
```

---

## 📝 Test Writing Guidelines

### 1. Test Structure (AAA Pattern)
```typescript
test('descriptive test name', async t => {
  // Arrange - Setup test data and mocks
  const mockClient = new MockApiClient();
  const adapter = new AnthropicSDKAdapter(config);
  
  // Act - Execute the code under test
  const result = await adapter.chat([Message.user('Hello')]);
  
  // Assert - Verify expectations
  t.is(result.role, 'assistant');
  t.truthy(result.content);
});
```

### 2. Test Naming
- ✅ **Good**: "sends simple message and gets response"
- ✅ **Good**: "handles rate limiting with retry"
- ❌ **Bad**: "test1", "it works"

### 3. Mock Strategy
- Mock external dependencies (API clients, file system)
- Use dependency injection
- Create reusable mock factories
- Keep mocks simple and focused

### 4. Test Coverage
- **Happy path**: Normal, expected behavior
- **Error cases**: API errors, network failures
- **Edge cases**: Empty inputs, large inputs, special characters
- **Security**: Injection attacks, path traversal

### 5. Async Testing
```typescript
// Correct
test('async operation', async t => {
  const result = await asyncFunction();
  t.is(result, expected);
});

// Incorrect - missing await
test('async operation', t => {
  asyncFunction().then(result => {
    t.is(result, expected); // Won't work!
  });
});
```

---

## 🎓 Summary

### Total Test Scenarios: ~325 new tests

**Breakdown**:
- Infrastructure Layer: ~130 tests
- Core Layer: ~140 tests  
- Presentation Layer: ~50 tests

**Estimated Timeline**: 6-9 weeks for completion

**Expected Outcome**:
- ✅ Coverage: 95%+
- ✅ Confidence: High for all components
- ✅ Production Ready: Yes
- ✅ Regression Prevention: Strong

---

**Document Created**: 2025-11-19  
**Test Framework**: AVA + ink-testing-library  
**Coverage Tool**: c8  
**Target**: 95% overall coverage
