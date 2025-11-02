# 01. ARCHITECTURE OVERVIEW

> **Phân tích kiến trúc tổng thể của Gemini CLI để làm nền tảng cho việc clone vào CodeH**

---

## 📋 QUICK REFERENCE

| Khía cạnh | Gemini CLI | Gợi ý cho CodeH |
|-----------|------------|-----------------|
| **Language** | TypeScript (strict) | TypeScript hoặc tương tự |
| **UI Framework** | React + Ink | React + Ink hoặc tương đương |
| **Runtime** | Node.js >= 20 | Tùy theo CodeH |
| **Architecture** | 3-Layer (CLI/Core/External) | Có thể đơn giản hóa |
| **State Management** | React hooks + Context | Tùy chọn |
| **Streaming** | AsyncGenerator + Events | Quan trọng - cần có |

---

## 1. KIẾN TRÚC 3 TẦNG (3-LAYER ARCHITECTURE)

Gemini CLI sử dụng kiến trúc 3 tầng rõ ràng:

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: CLI LAYER (User Interface)                       │
│  packages/cli/                                              │
│                                                             │
│  - Entry point (gemini.tsx)                                │
│  - React UI components (Ink framework)                     │
│  - Hooks (useGeminiStream, useHistoryManager, etc.)        │
│  - State management                                         │
│  - User interactions (keyboard, prompts)                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Gọi API
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 2: CORE LAYER (Business Logic)                      │
│  packages/core/                                             │
│                                                             │
│  - GeminiClient: Orchestrator chính                        │
│  - GeminiChat: Quản lý conversation                        │
│  - Turn: Xử lý một request-response cycle                  │
│  - Tools: Shell, FileOps, WebSearch, MCP                   │
│  - Services: Loop detection, Compression, Routing          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Call External APIs
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 3: EXTERNAL SERVICES                                │
│                                                             │
│  - Google Gemini API (@google/genai SDK)                   │
│  - IDE Integration (VS Code Extension)                     │
│  - MCP Servers (Model Context Protocol)                    │
└─────────────────────────────────────────────────────────────┘
```

### 💡 **Lợi ích của kiến trúc này:**

1. **Separation of Concerns**: UI logic tách biệt khỏi business logic
2. **Testability**: Có thể test core logic độc lập với UI
3. **Reusability**: Core layer có thể dùng cho nhiều UI khác nhau
4. **Maintainability**: Dễ maintain và mở rộng

### ⚙️ **Adaptation cho CodeH:**

```typescript
// CodeH có thể đơn giản hóa thành 2 layers nếu cần:

codeh/
├── src/
│   ├── cli/              // CLI Layer (UI + Entry point)
│   └── core/             // Core Layer (Business logic)
│       ├── client.ts     // Main orchestrator
│       ├── chat.ts       // Chat management
│       ├── streaming.ts  // Streaming logic
│       └── tools/        // Tools implementation
```

---

## 2. MONOREPO STRUCTURE

Gemini CLI sử dụng **monorepo** với **npm workspaces**:

```
gemini-cli/
├── package.json                    # Root package.json
├── packages/
│   ├── cli/                        # ⭐ Main CLI application
│   │   ├── package.json
│   │   └── src/
│   │       ├── gemini.tsx          # Entry point
│   │       ├── ui/                 # React components
│   │       │   ├── App.tsx
│   │       │   ├── AppContainer.tsx
│   │       │   ├── components/
│   │       │   │   ├── MainContent.tsx
│   │       │   │   ├── HistoryItemDisplay.tsx
│   │       │   │   ├── Composer.tsx
│   │       │   │   └── messages/
│   │       │   │       ├── GeminiMessage.tsx
│   │       │   │       ├── UserMessage.tsx
│   │       │   │       ├── ToolMessage.tsx
│   │       │   │       ├── ToolConfirmationMessage.tsx
│   │       │   │       └── DiffRenderer.tsx
│   │       │   └── hooks/
│   │       │       ├── useGeminiStream.ts      # ⭐⭐⭐
│   │       │       ├── useHistoryManager.ts    # ⭐⭐
│   │       │       ├── useKeypress.ts
│   │       │       └── ...
│   │       ├── services/
│   │       ├── utils/
│   │       └── config/
│   │
│   ├── core/                       # ⭐ Core functionality
│   │   ├── package.json
│   │   └── src/
│   │       ├── core/
│   │       │   ├── client.ts       # ⭐⭐⭐ GeminiClient
│   │       │   ├── geminiChat.ts   # ⭐⭐⭐ GeminiChat
│   │       │   ├── turn.ts         # ⭐⭐ Turn
│   │       │   └── config.ts
│   │       ├── tools/
│   │       │   ├── shell.ts
│   │       │   ├── read-file.ts
│   │       │   ├── write-file.ts
│   │       │   ├── grep.ts
│   │       │   ├── web-search.ts
│   │       │   └── mcp-client.ts
│   │       ├── services/
│   │       │   ├── loop-detection.ts
│   │       │   ├── compression.ts
│   │       │   ├── model-router.ts
│   │       │   └── telemetry.ts
│   │       ├── agents/
│   │       └── mcp/
│   │
│   ├── vscode-ide-companion/       # VS Code extension
│   ├── a2a-server/                # Agent-to-Agent server
│   └── test-utils/                # Shared test utilities
│
├── integration-tests/
├── scripts/
├── docs/
└── bundle/                        # Built application
```

### ⭐ **Files đánh dấu sao càng nhiều = càng quan trọng**

**3 sao (⭐⭐⭐)**: Files CỐT LÕI nhất, PHẢI hiểu
**2 sao (⭐⭐)**: Files quan trọng
**1 sao (⭐)**: Files cần biết

### ⚙️ **Adaptation cho CodeH:**

CodeH có thể không cần monorepo. Structure đơn giản:

```typescript
codeh/
├── package.json
└── src/
    ├── index.ts           # Entry point
    ├── cli/               # CLI layer
    │   ├── app.tsx
    │   ├── components/
    │   └── hooks/
    └── core/              # Core layer
        ├── client.ts
        ├── chat.ts
        └── tools/
```

---

## 3. TECH STACK CHI TIẾT

### 3.1. Runtime & Language

```json
{
  "engines": {
    "node": ">=20.0.0"
  },
  "typescript": {
    "version": "^5.3.0",
    "strict": true,
    "compilerOptions": {
      "target": "ES2022",
      "module": "NodeNext"
    }
  }
}
```

**💡 Lý do chọn:**
- Node.js 20+: Hỗ trợ native ES modules, performance tốt
- TypeScript strict: Type safety tối đa

### 3.2. UI Framework

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "ink": "^4.4.1",
    "chalk": "^5.3.0"
  }
}
```

**Ink** - React cho terminal:
```typescript
import React from 'react';
import { render, Text, Box } from 'ink';

const App = () => (
  <Box flexDirection="column">
    <Text color="green">Hello from terminal!</Text>
  </Box>
);

render(<App />);
```

**💡 Lợi ích:**
- Component-based UI trong terminal
- React mental model quen thuộc
- Reusable components
- State management với hooks

**⚠️ Alternatives cho CodeH:**
- **blessed** - Lower-level, không dùng React
- **blessed-contrib** - Charts và widgets
- **Terminal-kit** - Full-featured terminal UI
- **Pure Node.js** - Console.log + ANSI codes

### 3.3. AI/API

```json
{
  "dependencies": {
    "@google/genai": "^0.1.0"
  }
}
```

**@google/genai** - Official Gemini SDK:
```typescript
import { GoogleGenerativeAI } from '@google/genai';

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// Streaming
const result = await model.generateContentStream(prompt);
for await (const chunk of result.stream) {
  console.log(chunk.text());
}
```

**⚙️ Adaptation cho CodeH:**
- Nếu dùng Claude: `@anthropic-ai/sdk`
- Nếu dùng OpenAI: `openai`
- Nếu dùng nhiều models: Abstraction layer

### 3.4. Markdown & Syntax Highlighting

```json
{
  "dependencies": {
    "marked": "^11.0.0",
    "marked-terminal": "^6.2.0",
    "highlight.js": "^11.9.0"
  }
}
```

**Markdown rendering trong terminal:**
```typescript
import { marked } from 'marked';
import markedTerminal from 'marked-terminal';

marked.use(markedTerminal({
  code: chalk.yellow,
  blockquote: chalk.gray.italic,
  // ...
}));

const html = marked(markdownText);
console.log(html); // Terminal-formatted output
```

**Syntax highlighting:**
```typescript
import hljs from 'highlight.js';

const highlighted = hljs.highlight(code, {
  language: 'typescript'
}).value;

// Convert to terminal colors
const terminalOutput = convertAnsiToTerminalColors(highlighted);
```

### 3.5. Utilities

```json
{
  "dependencies": {
    "yargs": "^17.7.2",           // CLI argument parsing
    "diff": "^5.1.0",             // Diff generation
    "fast-glob": "^3.3.2",        // File globbing
    "execa": "^8.0.1",            // Shell command execution
    "p-queue": "^8.0.1",          // Promise queue
    "lodash-es": "^4.17.21"       // Utilities
  }
}
```

---

## 4. CÁC KHÁI NIỆM CỐT LÕI

### 4.1. Turn

**Definition**: Một chu kỳ request-response hoàn chỉnh

```typescript
interface Turn {
  // User sends prompt
  userMessage: Content;

  // Model responds (có thể có nhiều chunks)
  modelResponse: Content;

  // Model có thể call tools
  toolCalls: ToolCall[];

  // Tool responses
  toolResponses: ToolResponse[];

  // Finish reason
  finishReason: 'STOP' | 'MAX_TOKENS' | 'SAFETY' | 'OTHER';
}
```

**Ví dụ một Turn:**
```
1. User: "List files in current directory"
2. Model: [Calls tool: shell("ls")]
3. Tool Response: "file1.txt\nfile2.txt"
4. Model: "Here are the files: file1.txt, file2.txt"
5. Turn ends with finishReason: STOP
```

**💡 Quan trọng**:
- Một Turn có thể có **NHIỀU** tool calls
- Turn chỉ kết thúc khi model response STOP
- Có thể có recursive turns (model tiếp tục sau khi tool response)

### 4.2. Streaming

**Definition**: Nhận response từ AI theo real-time chunks thay vì đợi full response

```typescript
// Non-streaming (BAD for UX)
const response = await model.generateContent(prompt);
console.log(response.text); // User phải đợi lâu

// Streaming (GOOD for UX)
const stream = await model.generateContentStream(prompt);
for await (const chunk of stream) {
  console.log(chunk.text); // User thấy ngay lập tức
}
```

**Lợi ích:**
- **UX tốt**: User thấy progress ngay lập tức
- **Cancellable**: Có thể cancel giữa chừng
- **Memory efficient**: Không phải load full response vào memory

**Implementation với AsyncGenerator:**
```typescript
async function* streamResponse(): AsyncGenerator<string> {
  const chunks = ['Hello', ' ', 'World', '!'];
  for (const chunk of chunks) {
    await sleep(100); // Simulate network delay
    yield chunk;
  }
}

// Usage
for await (const chunk of streamResponse()) {
  process.stdout.write(chunk); // "Hello World!" appears gradually
}
```

### 4.3. Conversation History

**Definition**: Toàn bộ messages từ lúc bắt đầu chat

```typescript
interface ConversationHistory {
  contents: Content[];  // Array of all messages
}

interface Content {
  role: 'user' | 'model';
  parts: Part[];
  timestamp?: number;
}

interface Part {
  text?: string;
  inlineData?: { mimeType: string; data: string };
  functionCall?: { name: string; args: object };
  functionResponse?: { name: string; response: object };
}
```

**⚠️ KEY INSIGHT - Gemini CLI GỬI TOÀN BỘ HISTORY mỗi lần:**

```typescript
// Request 1
sendMessage({
  contents: [
    { role: 'user', parts: [{ text: 'Hi' }] }
  ]
});

// Request 2 - Gửi TOÀN BỘ history
sendMessage({
  contents: [
    { role: 'user', parts: [{ text: 'Hi' }] },
    { role: 'model', parts: [{ text: 'Hello!' }] },
    { role: 'user', parts: [{ text: 'How are you?' }] }  // New message
  ]
});
```

**Lý do**: Gemini API là **stateless**, không nhớ conversations trước.

### 4.4. Confirmation

**Definition**: Cơ chế xin phép user trước khi thực thi actions

```typescript
enum ApprovalMode {
  MANUAL = 'manual',    // Hỏi mọi command
  AUTO = 'auto',        // Chỉ hỏi dangerous commands
  ALWAYS = 'always'     // Không hỏi (nguy hiểm)
}

interface ConfirmationRequest {
  type: 'exec' | 'edit' | 'mcp';
  prompt: string;
  details: object;
  onConfirm: (decision: UserDecision) => void;
}
```

**Flow:**
```
1. AI wants to run: rm -rf /tmp/files
2. System detects: dangerous command
3. Show confirmation dialog to user
4. User chooses: Accept / Reject / Disable approval
5. Execute hoặc skip based on decision
```

### 4.5. StreamingState

**Definition**: State machine cho streaming process

```typescript
enum StreamingState {
  Idle = 'idle',                          // Không làm gì
  Responding = 'responding',              // Đang nhận response từ AI
  WaitingForConfirmation = 'waitingForConfirmation'  // Đang đợi user confirm
}
```

**State transitions:**
```
Idle
  → (submitQuery) →
Responding
  → (tool needs confirmation) →
WaitingForConfirmation
  → (user confirms) →
Responding
  → (finish) →
Idle
```

**UI behavior based on state:**
- **Idle**: Input enabled, có thể submit query mới
- **Responding**: Input disabled, show loading indicator, có thể cancel
- **WaitingForConfirmation**: Input disabled, show confirmation dialog, focus vào dialog

---

## 5. DATA FLOW OVERVIEW

**High-level data flow từ user input đến display:**

```
┌─────────────┐
│ User Input  │
│ (Terminal)  │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ CLI Layer                                │
│ - AppContainer (React component)         │
│ - useGeminiStream hook                   │
│   └─ submitQuery(prompt)                 │
└──────┬───────────────────────────────────┘
       │
       │ Call
       ▼
┌──────────────────────────────────────────┐
│ Core Layer                               │
│ - GeminiClient.sendMessageStream()       │
│   ├─ Check context overflow              │
│   ├─ Compress if needed                  │
│   ├─ Add IDE context                     │
│   └─ GeminiChat.sendMessageStream()      │
│       ├─ Add to history                  │
│       ├─ Get full history                │
│       └─ Call Gemini API                 │
└──────┬───────────────────────────────────┘
       │
       │ Async Stream
       ▼
┌──────────────────────────────────────────┐
│ Stream Processing                        │
│ - processGeminiStreamEvents()            │
│   ├─ For each chunk:                     │
│   │   ├─ Update UI state                 │
│   │   ├─ Append to history               │
│   │   └─ Handle tool calls               │
│   └─ On finish:                          │
│       └─ Finalize history                │
└──────┬───────────────────────────────────┘
       │
       │ State Update
       ▼
┌──────────────────────────────────────────┐
│ UI Update                                │
│ - React re-renders                       │
│ - HistoryItemDisplay shows messages      │
│ - Streaming text appears                 │
│ - Confirmation dialogs if needed         │
└──────────────────────────────────────────┘
```

---

## 6. FOLDER STRUCTURE CHI TIẾT CỦA PACKAGES/CLI/SRC

```
packages/cli/src/
├── gemini.tsx                      # ⭐⭐⭐ Entry point
│   └─ main() function
│   └─ startInteractiveUI()
│
├── ui/
│   ├── App.tsx                     # ⭐⭐ Root component
│   │   └─ Provides contexts
│   │   └─ Renders AppContainer
│   │
│   ├── AppContainer.tsx            # ⭐⭐⭐ Main container
│   │   └─ State management
│   │   └─ Keyboard handling
│   │   └─ Renders MainContent + Composer
│   │
│   ├── components/
│   │   ├── MainContent.tsx         # ⭐⭐ History display
│   │   │   └─ Maps history items to HistoryItemDisplay
│   │   │
│   │   ├── HistoryItemDisplay.tsx  # ⭐⭐ Single history item
│   │   │   └─ Renders based on message type
│   │   │
│   │   ├── Composer.tsx            # ⭐ Input composer
│   │   │   └─ User input UI
│   │   │
│   │   ├── messages/
│   │   │   ├── GeminiMessage.tsx
│   │   │   ├── UserMessage.tsx
│   │   │   ├── ToolMessage.tsx
│   │   │   ├── ToolGroupMessage.tsx
│   │   │   ├── ToolConfirmationMessage.tsx  # ⭐⭐
│   │   │   └── DiffRenderer.tsx             # ⭐⭐
│   │   │
│   │   ├── LoadingIndicator.tsx
│   │   ├── Notifications.tsx
│   │   └── DialogManager.tsx
│   │
│   ├── hooks/
│   │   ├── useGeminiStream.ts      # ⭐⭐⭐ CORE streaming logic
│   │   │   └─ submitQuery()
│   │   │   └─ processGeminiStreamEvents()
│   │   │
│   │   ├── useHistoryManager.ts    # ⭐⭐ History management
│   │   │   └─ addItem()
│   │   │   └─ updateItem()
│   │   │   └─ clear()
│   │   │
│   │   ├── useKeypress.ts
│   │   ├── useVimMode.ts
│   │   └── useMessageQueue.ts
│   │
│   ├── contexts/
│   │   ├── SettingsContext.tsx
│   │   ├── StreamingContext.tsx
│   │   ├── UIStateContext.tsx
│   │   └── KeypressContext.tsx
│   │
│   └── themes/
│       └─ Theme definitions
│
├── services/
│   ├── historyService.ts
│   ├── settingsService.ts
│   └── extensionService.ts
│
├── utils/
│   ├── markdown.ts
│   ├── ansi.ts
│   ├── terminal.ts
│   └── validation.ts
│
└── config/
    └─ Config types and loaders
```

---

## 7. FOLDER STRUCTURE CHI TIẾT CỦA PACKAGES/CORE/SRC

```
packages/core/src/
├── core/
│   ├── client.ts                   # ⭐⭐⭐ GeminiClient
│   │   └─ class GeminiClient
│   │       ├─ sendMessageStream()  # Main method
│   │       ├─ tryCompressChat()
│   │       ├─ getIdeContextParts()
│   │       └─ getHistory()
│   │
│   ├── geminiChat.ts               # ⭐⭐⭐ GeminiChat
│   │   └─ class GeminiChat
│   │       ├─ sendMessageStream()
│   │       ├─ getHistory()
│   │       ├─ addHistory()
│   │       └─ makeApiCallAndProcessStream()
│   │
│   ├── turn.ts                     # ⭐⭐ Turn
│   │   └─ class Turn
│   │       ├─ run()
│   │       └─ processStreamChunk()
│   │
│   ├── config.ts
│   └── types.ts
│
├── tools/
│   ├── shell.ts                    # Shell command execution
│   ├── read-file.ts
│   ├── write-file.ts
│   ├── edit-file.ts
│   ├── grep.ts
│   ├── ripGrep.ts
│   ├── web-search.ts
│   ├── web-fetch.ts
│   ├── mcp-client.ts
│   └── memoryTool.ts
│
├── services/
│   ├── loop-detection.ts           # Detect infinite loops
│   ├── compression.ts              # Chat compression
│   ├── model-router.ts             # Route to appropriate model
│   ├── telemetry.ts
│   └── policy.ts
│
├── agents/
│   ├── executor.ts
│   └── codebase-investigator.ts
│
└── mcp/
    └─ Model Context Protocol implementation
```

---

## 8. KEY DEPENDENCIES RELATIONSHIPS

```
AppContainer
  └─ useGeminiStream
      ├─ config.getGeminiClient()
      │   └─ GeminiClient
      │       └─ GeminiChat
      │           └─ @google/genai API
      │
      ├─ useHistoryManager
      │   └─ Local state (items array)
      │
      └─ processGeminiStreamEvents
          └─ Updates history in real-time
```

---

## 9. IMPLEMENTATION CHECKLIST CHO CODEH

### Phase 1: Setup cơ bản
- [ ] Quyết định tech stack (TypeScript? React+Ink?)
- [ ] Setup project structure (monorepo hay single package?)
- [ ] Install dependencies cơ bản
- [ ] Setup TypeScript config (nếu dùng TS)

### Phase 2: Core architecture
- [ ] Tạo 2-3 layer structure
- [ ] Define interfaces/types cơ bản:
  - [ ] Content, Part, Message
  - [ ] StreamEvent
  - [ ] HistoryItem
- [ ] Implement basic API client (tương tự GeminiClient)

### Phase 3: Basic streaming
- [ ] Implement AsyncGenerator cho streaming
- [ ] Basic event processing
- [ ] Simple state management

### Phase 4: UI foundation
- [ ] Setup React + Ink (hoặc alternative)
- [ ] Basic component structure
- [ ] Simple history display

### Phase 5: Advanced features
- [ ] History management
- [ ] Context overflow handling
- [ ] Confirmation system
- [ ] Diff rendering

---

## 10. NOTES QUAN TRỌNG KHI CLONE VÀO CODEH

### ✅ **SHOULD DO:**

1. **Hiểu concepts, không copy code**
   - Học cách Gemini CLI giải quyết vấn đề
   - Adapt vào context của CodeH

2. **Giữ architecture đơn giản**
   - Không cần phức tạp như Gemini CLI
   - Focus vào features cần thiết

3. **Test từng layer**
   - Unit test cho core logic
   - Integration test cho full flow

4. **Document decisions**
   - Ghi lại tại sao chọn approach này
   - Giúp maintain sau này

### ❌ **SHOULD NOT DO:**

1. **Copy nguyên xi code**
   - Code của Gemini CLI specific cho use case của nó
   - CodeH có requirements khác

2. **Over-engineer**
   - Không cần tất cả features của Gemini CLI
   - Start simple, iterate

3. **Ignore error handling**
   - Streaming dễ lỗi, cần handle cẩn thận
   - Network errors, API errors, user cancellation

### 💡 **BEST PRACTICES:**

1. **Start với MVP**
   ```
   MVP features:
   - Basic prompt → response flow
   - Simple streaming display
   - Basic history
   ```

2. **Iterate incrementally**
   ```
   Iteration 1: MVP
   Iteration 2: Add context management
   Iteration 3: Add confirmation system
   Iteration 4: Add diff rendering
   ```

3. **Keep it testable**
   ```typescript
   // Good: Testable
   async function* generateStream(prompt: string) {
     // Logic here
   }

   // Can test:
   const stream = generateStream("test");
   const chunks = [];
   for await (const chunk of stream) {
     chunks.push(chunk);
   }
   expect(chunks).toEqual([...]);
   ```

---

## 📚 NEXT STEPS

Sau khi đã hiểu kiến trúc tổng thể, đọc tiếp:

1. **[02_PROMPT_PROCESSING_FLOW.md](./02_PROMPT_PROCESSING_FLOW.md)**
   - Chi tiết flow từ user input → result

2. **[03_CONVERSATION_HISTORY.md](./03_CONVERSATION_HISTORY.md)**
   - Hiểu cách quản lý history

3. **[08_DATA_STRUCTURES.md](./08_DATA_STRUCTURES.md)**
   - Reference cho types và interfaces

---

**Tóm tắt**: Gemini CLI có kiến trúc 3-layer rõ ràng, sử dụng React+Ink cho UI, và tập trung vào streaming UX. CodeH có thể học concepts này và adapt cho phù hợp với requirements riêng.
