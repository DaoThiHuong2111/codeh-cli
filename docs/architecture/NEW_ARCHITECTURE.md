# 🏗️ NEW 3-LAYER ARCHITECTURE

**Ngày:** 2025-11-02
**Status:** 🚧 In Progress (Core & Infrastructure: ✅ Complete, CLI: ⏳ Pending)

---

## 📋 TABLE OF CONTENTS

1. [Overview](#overview)
2. [Architecture Principles](#architecture-principles)
3. [Layer Details](#layer-details)
4. [Folder Structure](#folder-structure)
5. [Key Components](#key-components)
6. [Dependency Flow](#dependency-flow)
7. [Usage Examples](#usage-examples)
8. [Best Practices](#best-practices)

---

## 🎯 OVERVIEW

Kiến trúc mới được thiết kế theo **Clean Architecture** principles với 3 layers rõ ràng:

```
┌─────────────────────────────────────────┐
│   LAYER 1: CLI (Presentation)          │
│   - Components, Screens, Hooks          │
│   - User interactions                   │
└────────────────┬────────────────────────┘
                 │ depends on
                 ↓
┌─────────────────────────────────────────┐
│   LAYER 2: CORE (Business Logic)       │
│   - Domain Models & Value Objects       │
│   - Application Services                │
│   - Use Cases & Orchestrators           │
│   - Tool Definitions                    │
└────────────────┬────────────────────────┘
                 │ depends on
                 ↓
┌─────────────────────────────────────────┐
│   LAYER 3: INFRASTRUCTURE               │
│   - API Clients (Anthropic, OpenAI)    │
│   - Configuration Storage               │
│   - File System & Process Execution     │
│   - External Integrations               │
└─────────────────────────────────────────┘
```

---

## 🎓 ARCHITECTURE PRINCIPLES

### 1. **Separation of Concerns**

Mỗi layer có trách nhiệm riêng, không chồng chéo.

### 2. **Dependency Rule**

```
CLI → CORE → INFRASTRUCTURE
```

- CLI chỉ phụ thuộc vào CORE
- CORE chỉ phụ thuộc vào INFRASTRUCTURE interfaces
- INFRASTRUCTURE implement các interfaces của CORE

### 3. **Independence**

- **Framework Independence:** Business logic không phụ thuộc Ink/React
- **Testability:** Core có thể test mà không cần UI hay external services
- **UI Independence:** Có thể thay Ink bằng web UI
- **Database/API Independence:** Dễ dàng thay đổi providers

### 4. **Dependency Injection**

Sử dụng DI Container để quản lý dependencies, không dùng global singletons.

---

## 📦 LAYER DETAILS

### LAYER 3: INFRASTRUCTURE (Hoàn thành ✅)

**Trách nhiệm:** Implement infrastructure details, external integrations

#### API Clients

```typescript
// source/infrastructure/api/

HttpClient.ts              // Base HTTP client wrapper
ApiClientFactory.ts        // Create clients based on config

clients/
├── AnthropicClient.ts     // Claude API implementation
├── OpenAIClient.ts        // GPT API implementation
├── OllamaClient.ts        // Local LLM implementation
└── GenericClient.ts       // Generic OpenAI-compatible API
```

**Features:**

- ✅ Unified interface (`IApiClient`)
- ✅ Support 4 providers: Anthropic, OpenAI, Ollama, Generic
- ✅ Error handling & retries
- ✅ Request/response normalization

#### Configuration

```typescript
// source/infrastructure/config/

EnvConfigRepository.ts; // Read from environment variables
FileConfigRepository.ts; // Read from ~/.codeh/configs.json
ConfigLoader.ts; // Merge configs (ENV > File)
```

**Features:**

- ✅ Priority: ENV vars > File > Defaults
- ✅ Backward compatibility with legacy env vars
- ✅ Validation & error reporting
- ✅ Support custom models

#### History

```typescript
// source/infrastructure/history/

FileHistoryRepository.ts; // Persist to ~/.codeh/history/
InMemoryHistoryRepository.ts; // For testing
```

**Features:**

- ✅ Conversation persistence
- ✅ Load/save/delete operations
- ✅ Get recent messages

#### File System & Process

```typescript
// source/infrastructure/filesystem/
FileOperations.ts; // Safe file operations

// source/infrastructure/process/
ShellExecutor.ts; // Execute shell commands
CommandValidator.ts; // Validate commands for security
```

**Features:**

- ✅ Safe file read/write
- ✅ Directory operations
- ✅ Shell command execution (async/sync/stream)
- ✅ Security validation (whitelist commands)

---

### LAYER 2: CORE (Hoàn thành ✅)

**Trách nhiệm:** Business logic, domain models, application services

#### Domain Models

```typescript
// source/core/domain/models/

Message.ts; // Single message entity
Conversation.ts; // Collection of messages
Turn.ts; // Request-response cycle
Configuration.ts; // App configuration model
```

**Features:**

- ✅ Rich domain models với behaviors
- ✅ Immutable design patterns
- ✅ Factory methods
- ✅ Validation logic

#### Value Objects

```typescript
// source/core/domain/valueObjects/

Provider.ts; // Provider enum & info
InputType.ts; // Input classification types
ModelInfo.ts; // Model metadata & registry
```

**Features:**

- ✅ Type-safe enums
- ✅ Immutable value objects
- ✅ Model registry với context window info

#### Interfaces

```typescript
// source/core/domain/interfaces/

IApiClient.ts; // API client contract
IConfigRepository.ts; // Config storage contract
IHistoryRepository.ts; // History storage contract
IToolExecutor.ts; // Tool execution contract
```

**Benefits:**

- ✅ Decoupling từ infrastructure
- ✅ Easy mocking for tests
- ✅ Swappable implementations

#### Application Services

```typescript
// source/core/application/services/

InputClassifier.ts; // Classify & validate input
OutputFormatter.ts; // Format & classify output
```

**Features:**

- ✅ Input type detection (command, code, url, file, text)
- ✅ Security validation
- ✅ Output type classification
- ✅ Formatting logic

#### Orchestrators

```typescript
// source/core/application/

CodehClient.ts; // Main orchestrator
CodehChat.ts; // Conversation manager
```

**Features:**

- ✅ Coordinate all operations
- ✅ Manage conversation flow
- ✅ Handle errors gracefully
- ✅ Track metrics (tokens, duration)

#### Tools

```typescript
// source/core/tools/

base/
├── Tool.ts          // Base tool interface
└── ToolRegistry.ts  // Tool management

Shell.ts    // Shell command execution tool
FileOps.ts  // File operations tool
```

**Features:**

- ✅ Extensible tool system
- ✅ Parameter validation
- ✅ Registry pattern
- ✅ Easy to add new tools

#### DI Container

```typescript
// source/core/di/

Container.ts; // DI container implementation
setup.ts; // Setup all dependencies
```

**Features:**

- ✅ Singleton & transient registrations
- ✅ Factory-based resolution
- ✅ Clear instance management
- ✅ Easy testing

---

### LAYER 1: CLI (Chưa hoàn thành ⏳)

**Trách nhiệm:** User interface, input/output, navigation

```typescript
// source/cli/ (Planned)

components/
├── atoms/        // Button, Logo, StatusIndicator
├── molecules/    // InputBox, InfoSection, Menu
└── organisms/    // Card, Navigation

screens/
├── Welcome.tsx
├── Home.tsx
└── Config.tsx

hooks/
├── useGeminiStream.ts
├── useHistoryManager.ts
├── useInput.ts
└── useConfig.ts

presenters/
├── HomePresenter.ts
├── ConfigPresenter.ts
└── types.ts
```

**Note:** CLI layer giữ nguyên từ codebase cũ, chưa refactor.

---

## 📁 FOLDER STRUCTURE

```
source/
├── core/                          # LAYER 2: Business Logic
│   ├── domain/
│   │   ├── models/               # Domain entities
│   │   │   ├── Message.ts
│   │   │   ├── Conversation.ts
│   │   │   ├── Turn.ts
│   │   │   └── Configuration.ts
│   │   ├── valueObjects/         # Value objects
│   │   │   ├── Provider.ts
│   │   │   ├── InputType.ts
│   │   │   └── ModelInfo.ts
│   │   └── interfaces/           # Contracts
│   │       ├── IApiClient.ts
│   │       ├── IConfigRepository.ts
│   │       ├── IHistoryRepository.ts
│   │       └── IToolExecutor.ts
│   ├── application/
│   │   ├── services/             # Application services
│   │   │   ├── InputClassifier.ts
│   │   │   └── OutputFormatter.ts
│   │   ├── usecases/            # Use cases (future)
│   │   ├── CodehClient.ts       # Main orchestrator
│   │   └── CodehChat.ts         # Conversation manager
│   ├── tools/
│   │   ├── base/
│   │   │   ├── Tool.ts
│   │   │   └── ToolRegistry.ts
│   │   ├── Shell.ts
│   │   └── FileOps.ts
│   ├── di/
│   │   ├── Container.ts
│   │   └── setup.ts
│   └── index.ts                 # Core exports
│
├── infrastructure/               # LAYER 3: Infrastructure
│   ├── api/
│   │   ├── clients/
│   │   │   ├── AnthropicClient.ts
│   │   │   ├── OpenAIClient.ts
│   │   │   ├── OllamaClient.ts
│   │   │   └── GenericClient.ts
│   │   ├── HttpClient.ts
│   │   └── ApiClientFactory.ts
│   ├── config/
│   │   ├── EnvConfigRepository.ts
│   │   ├── FileConfigRepository.ts
│   │   └── ConfigLoader.ts
│   ├── history/
│   │   ├── FileHistoryRepository.ts
│   │   └── InMemoryHistoryRepository.ts
│   ├── filesystem/
│   │   └── FileOperations.ts
│   ├── process/
│   │   ├── ShellExecutor.ts
│   │   └── CommandValidator.ts
│   ├── integrations/            # Future: VS Code, MCP, A2A
│   │   ├── vscode/
│   │   ├── mcp/
│   │   └── a2a/
│   └── index.ts                 # Infrastructure exports
│
└── cli/                          # LAYER 1: UI (existing code)
    ├── components/
    ├── screens/
    └── ... (existing structure)
```

---

## 🔑 KEY COMPONENTS

### 1. **CodehClient** (Main Orchestrator)

```typescript
import {setupContainer} from '@/core';

const container = await setupContainer();
const client = await container.resolve('CodehClient');

// Execute user input
const turn = await client.execute('Hello, AI!');
console.log(turn.response?.content);
console.log(turn.getTokenUsage());
```

**Responsibilities:**

- Validate input
- Call AI API with history context
- Save to history
- Return Turn with metadata

### 2. **CodehChat** (Conversation Manager)

```typescript
import {CodehChat} from '@/core';

const chat = new CodehChat(historyRepo);

await chat.sendMessage('What is TypeScript?');
await chat.addResponse('TypeScript is...');

const history = chat.getHistory();
const stats = chat.getStats();
```

**Responsibilities:**

- Manage conversation state
- Track messages
- Provide conversation stats

### 3. **Configuration System**

```typescript
import {ConfigLoader} from '@/infrastructure';

const loader = new ConfigLoader();
const config = await loader.load();

console.log(config.provider); // 'anthropic'
console.log(config.model); // 'claude-3-5-sonnet-20241022'
console.log(config.isValid()); // true
```

**Priority:** ENV vars > File (~/.codeh/configs.json) > Defaults

### 4. **Tool System**

```typescript
import {ToolRegistry} from '@/core';

const registry = container.resolve<ToolRegistry>('ToolRegistry');

const result = await registry.execute('shell', {
	command: 'git status',
});
```

**Available Tools:**

- `shell`: Execute shell commands
- `file_ops`: File operations (read, write, list, exists)

---

## 🔄 DEPENDENCY FLOW

### Example: User sends a message

```
1. User Input (CLI Layer)
   ↓
2. CodehClient.execute()  (Core)
   ├─→ InputClassifier.validate()
   ├─→ HistoryRepository.getRecentMessages()  (Infrastructure)
   ├─→ ApiClient.chat()  (Infrastructure)
   ├─→ HistoryRepository.addMessage()
   └─→ Return Turn
   ↓
3. Display Response (CLI Layer)
```

### Dependency Graph

```
┌─────────────┐
│ CLI Layer   │
└──────┬──────┘
       │ uses
       ↓
┌──────────────────────────────────────┐
│ Core Layer                           │
│  ┌──────────────┐  ┌──────────────┐ │
│  │ CodehClient  │  │  CodehChat   │ │
│  └──────┬───────┘  └──────┬───────┘ │
│         │ uses            │         │
│         ↓                 ↓         │
│  ┌──────────────────────────────┐  │
│  │    Services & Tools          │  │
│  └──────────────────────────────┘  │
└──────────────┬───────────────────────┘
               │ uses interfaces
               ↓
┌──────────────────────────────────────┐
│ Infrastructure Layer                 │
│  ┌─────────┐  ┌────────┐  ┌───────┐ │
│  │ API     │  │ Config │  │History│ │
│  │ Clients │  │  Repos │  │ Repos │ │
│  └─────────┘  └────────┘  └───────┘ │
└──────────────────────────────────────┘
```

---

## 💡 USAGE EXAMPLES

### Example 1: Basic Setup

```typescript
import {setupContainer, CodehClient} from '@/core';

async function main() {
	// Setup DI container
	const container = await setupContainer();

	// Resolve dependencies
	const client = await container.resolve<CodehClient>('CodehClient');

	// Use the client
	const turn = await client.execute('Explain TypeScript');
	console.log(turn.response?.content);
}

main();
```

### Example 2: Custom Configuration

```typescript
import {ConfigLoader, Configuration} from '@/infrastructure';
import {ApiClientFactory} from '@/infrastructure';

const loader = new ConfigLoader();
const config = await loader.load();

// Validate
if (!config.isValid()) {
	const errors = config.getValidationErrors();
	throw new Error(`Invalid config: ${errors.join(', ')}`);
}

// Create API client
const factory = new ApiClientFactory();
const apiClient = factory.create(config);

// Use client
const response = await apiClient.chat({
	messages: [{role: 'user', content: 'Hello'}],
});
```

### Example 3: Using Tools

```typescript
import {ToolRegistry, ShellTool, FileOpsTool} from '@/core';
import {ShellExecutor, FileOperations} from '@/infrastructure';

// Create registry
const registry = new ToolRegistry();

// Register tools
registry.register(new ShellTool(new ShellExecutor()));
registry.register(new FileOpsTool(new FileOperations()));

// Execute shell command
const result = await registry.execute('shell', {
	command: 'npm test',
	cwd: '/path/to/project',
});

if (result.success) {
	console.log('Tests passed!');
	console.log(result.output);
} else {
	console.error('Tests failed:', result.error);
}
```

### Example 4: History Management

```typescript
import {CodehChat} from '@/core';
import {FileHistoryRepository} from '@/infrastructure';

const historyRepo = new FileHistoryRepository();
const chat = new CodehChat(historyRepo);

// Send messages
await chat.sendMessage('What is Clean Architecture?');
await chat.addResponse('Clean Architecture is a software design philosophy...');

// Get stats
const stats = chat.getStats();
console.log(`Total messages: ${stats.messageCount}`);
console.log(`Estimated tokens: ${stats.estimatedTokens}`);

// Check if needs compression
if (chat.needsCompression(100000)) {
	console.log('Context is getting large, consider compression');
}

// Clear history
await chat.clear();
```

---

## ✅ BEST PRACTICES

### 1. **Always Use DI Container**

❌ **Bad:**

```typescript
import {AnthropicClient} from '@/infrastructure';

const client = new AnthropicClient(apiKey, baseUrl);
```

✅ **Good:**

```typescript
import {setupContainer} from '@/core';

const container = await setupContainer();
const client = await container.resolve('CodehClient');
```

### 2. **Use Domain Models**

❌ **Bad:**

```typescript
const message = {
	role: 'user',
	content: 'Hello',
};
```

✅ **Good:**

```typescript
import {Message} from '@/core';

const message = Message.user('Hello');
```

### 3. **Validate Configuration**

❌ **Bad:**

```typescript
const config = await loader.load();
// Use directly without validation
```

✅ **Good:**

```typescript
const config = await loader.load();

if (!config.isValid()) {
	const errors = config.getValidationErrors();
	throw new Error(`Config errors: ${errors.join(', ')}`);
}
```

### 4. **Handle Errors Gracefully**

❌ **Bad:**

```typescript
const turn = await client.execute(input);
console.log(turn.response.content); // May crash if error
```

✅ **Good:**

```typescript
const turn = await client.execute(input);

if (turn.isComplete() && turn.response) {
	console.log(turn.response.content);
} else {
	console.error('Failed to get response');
}
```

### 5. **Use Type Safety**

❌ **Bad:**

```typescript
const result = await registry.execute('shell', {
	cmd: 'ls', // Wrong parameter name
});
```

✅ **Good:**

```typescript
import {ToolExecutionResult} from '@/core';

const result: ToolExecutionResult = await registry.execute('shell', {
	command: 'ls', // Correct parameter
});

if (result.success) {
	console.log(result.output);
}
```

---

## 📚 NEXT STEPS

1. ✅ **Phase 1:** Core & Infrastructure (DONE)
2. ⏳ **Phase 2:** Refactor CLI Layer (Pending)
3. ⏳ **Phase 3:** Integration & Testing
4. ⏳ **Phase 4:** Remove old code
5. ⏳ **Phase 5:** Documentation & Examples

---

## 📖 RELATED DOCUMENTS

- [3-Layer Refactoring Plan](./3-LAYER_REFACTORING_PLAN.md)
- [Migration Guide](./MIGRATION_GUIDE.md)
- [Base Logic](../base_logic.md)
- [Configuration Flow](../config.md)

---

**Tác giả:** Claude Code
**Cập nhật:** 2025-11-02
**Version:** 1.0
