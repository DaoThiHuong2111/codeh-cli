# BỘ TÀI LIỆU KỸ THUẬT - CLONE codeh CLI VÀO CODEH

## 🎯 Tóm tắt nội dung đã tạo

### ✅ Đã hoàn thành:

1. **[00_INDEX.md](./00_INDEX.md)** - Mục lục tổng thể
   - Cấu trúc tài liệu
   - Hướng dẫn sử dụng
   - Quick start guide

2. **[01_ARCHITECTURE_OVERVIEW.md](./01_ARCHITECTURE_OVERVIEW.md)** - Kiến trúc tổng quan
   - ✅ 3-layer architecture
   - ✅ Monorepo structure
   - ✅ Tech stack chi tiết
   - ✅ Các khái niệm cốt lõi (Turn, Streaming, History, Confirmation, StreamingState)
   - ✅ Data flow overview
   - ✅ Folder structure chi tiết
   - ✅ Implementation checklist cho CodeH

### 📝 Các tài liệu còn lại cần tạo:

Dựa trên phân tích chi tiết tôi đã thực hiện, đây là outline cho các tài liệu còn lại:

---

## 📖 02_PROMPT_PROCESSING_FLOW.md

**Nội dung chính:**

### 1. Overview Flow
- Diagram từ user input → kết quả
- Các bước chính trong flow

### 2. Entry Point (codeh.tsx:main)
```typescript
- Setup & Configuration
- Parse arguments
- Sandbox check
- Extension loading
- Config initialization
- Start interactive UI
```

### 3. submitQuery() - Core Function
**File:** `packages/cli/src/ui/hooks/usecodehStream.ts:760-922`

```typescript
async submitQuery(query, options, prompt_id) {
  // Step 1: Validate state
  // Step 2: Reset state for new query
  // Step 3: Setup AbortController
  // Step 4: Generate prompt_id
  // Step 5: prepareQueryForcodeh()
  // Step 6: codehClient.sendMessageStream()
  // Step 7: processcodehStreamEvents()
  // Step 8: Handle loop detection
  // Step 9: Error handling
}
```

**Chi tiết từng step:**
- Validate StreamingState
- Create AbortController (để cancel)
- Generate unique prompt_id: `sessionId + '########' + promptCount`
- Prepare query (handle files, images)
- Call codehClient.sendMessageStream()
- Process stream events
- Update UI real-time
- Handle errors và loop detection

### 4. codehClient.sendMessageStream()
**File:** `packages/core/src/core/client.ts:476-659`

```typescript
async *sendMessageStream(request, signal, prompt_id, turns) {
  // Step 1: Loop detection reset
  // Step 2: Check max session turns
  // Step 3: Context overflow check (QUAN TRỌNG)
  // Step 4: Chat compression
  // Step 5: IDE context management
  // Step 6: Model routing/stickiness
  // Step 7: Turn.run()
  // Step 8: Process stream events
  // Step 9: Next speaker check
}
```

**Chi tiết context overflow check:**
```typescript
const estimatedTokens = Math.floor(JSON.stringify(request).length / 4);
const remainingTokens = tokenLimit(model) - lastPromptTokenCount;

if (estimatedTokens > remainingTokens * 0.95) {
  yield { type: 'ContextWindowWillOverflow' };
  return;
}
```

### 5. codehChat.sendMessageStream()
**File:** `packages/core/src/core/codehChat.ts:225-343`

```typescript
- Add message to history
- Get full history
- Retry logic (max 2 attempts)
- Temperature = 1 for retries
- Call makeApiCallAndProcessStream()
- Yield chunks
```

### 6. processcodehStreamEvents()
**File:** `packages/cli/src/ui/hooks/usecodehStream.ts`

```typescript
- For each event from stream:
  - Update streaming text
  - Handle tool calls
  - Handle confirmations
  - Update history
  - Error handling
```

### 7. Implementation Checklist cho CodeH

---

## 📖 03_CONVERSATION_HISTORY.md

**Nội dung chính:**

### 1. KEY INSIGHT: Gửi Toàn Bộ History

**❗ QUAN TRỌNG**: codeh CLI GỬI TOÀN BỘ conversation history mỗi lần request

**Lý do:**
- codeh API là STATELESS
- API không nhớ conversations trước đó
- Phải gửi full context mỗi lần

**Code minh họa:**
```typescript
// codehChat.getHistory() - line 414-421
getHistory(curated: boolean = false): Content[] {
  const history = curated
    ? extractCuratedHistory(this.history)  // Remove old IDE context
    : this.history;

  return structuredClone(history);  // Deep copy
}

// Mỗi request
const requestContents = this.getHistory(true);  // Get FULL history
const stream = await makeApiCallAndProcessStream(
  model,
  requestContents,  // <-- Toàn bộ lịch sử
  params
);
```

### 2. History Data Structure

```typescript
interface HistoryItem {
  committed: Message | null;   // Message đã hoàn thành
  pending: Message | null;     // Message đang streaming
}

interface Message {
  type: 'user' | 'codeh' | 'tool' | 'error' | 'info';
  text: string;
  parts?: Part[];
  toolCalls?: ToolCall[];
  timestamp: number;
}
```

### 3. useHistoryManager Hook

**File:** `packages/cli/src/ui/hooks/useHistoryManager.ts`

```typescript
interface UseHistoryManagerReturn {
  items: HistoryItem[];
  addItem(message: Message): void;
  updateItem(index: number, message: Message): void;
  clear(): void;
}
```

**Streaming updates:**
```typescript
// Khi bắt đầu stream
setPendingHistoryItem({ type: 'codeh', text: '' });

// Mỗi chunk
updatePendingHistoryItem((prev) => ({
  ...prev,
  text: prev.text + chunk
}));

// Khi kết thúc
commitPendingHistoryItem();
```

### 4. Curated History

**extractCuratedHistory()** loại bỏ:
- IDE context cũ (chỉ giữ mới nhất)
- System messages không cần thiết
- Metadata

**Lý do:** Giảm token count, tránh overflow

### 5. Implementation Checklist cho CodeH

---

## 📖 04_CONTEXT_OVERFLOW_HANDLING.md

**Nội dung chính:**

### 1. Context Overflow Detection

**File:** `packages/core/src/core/client.ts:503-517`

```typescript
// Estimate token count (4 chars = 1 token)
const estimatedRequestTokenCount = Math.floor(
  JSON.stringify(request).length / 4
);

// Get remaining tokens
const remainingTokenCount =
  tokenLimit(model) - uiTelemetryService.getLastPromptTokenCount();

// Check overflow (95% threshold)
if (estimatedRequestTokenCount > remainingTokenCount * 0.95) {
  yield {
    type: codehEventType.ContextWindowWillOverflow,
    value: { estimatedRequestTokenCount, remainingTokenCount }
  };
  return new Turn(chat, prompt_id);
}
```

**Threshold**: 95% để có buffer an toàn

### 2. Chat Compression Algorithm

**File:** `packages/core/src/core/client.ts:731-859`

**Khi nào compress:**
```typescript
const threshold = contextPercentageThreshold ?? COMPRESSION_TOKEN_THRESHOLD;
if (originalTokenCount < threshold * tokenLimit(model)) {
  return NOOP;  // Không cần compress
}
```

**Compression flow:**
```typescript
1. Find split point (preserve 30% recent messages)
2. historyToCompress = history.slice(0, splitPoint)
3. historyToKeep = history.slice(splitPoint)
4. Generate summary of historyToCompress using AI
5. Create new history:
   [
     { role: 'user', parts: [{ text: summary }] },
     { role: 'model', parts: [{ text: 'Got it.' }] },
     ...historyToKeep
   ]
6. Estimate new token count
7. If newTokens < originalTokens → SUCCESS, update chat
   Else → FAILED, mark và không compress nữa
```

**Compression prompt:**
```typescript
function getCompressionPrompt() {
  return `You are a conversation summarizer. Your task is to:
1. Think in scratchpad
2. Generate a <state_snapshot> with:
   - Key facts and decisions
   - Important context
   - Open tasks
Preserve important details, compress verbose parts.`;
}
```

### 3. IDE Context Diff Management

**File:** `packages/core/src/core/client.ts:295-461`

**Problem**: IDE context có thể rất lớn (open files, directory structure)

**Solution**: Chỉ gửi DIFF

```typescript
// Track last sent IDE context
this.lastSentIdeContext = { files: [...], dirs: [...] };

// Next time
const { contextParts, newIdeContext } = this.getIdeContextParts(
  forceFullIdeContext || history.length === 0
);

// contextParts chỉ chứa:
// - New files opened
// - Files closed
// - Changed files
// Không gửi lại files không đổi
```

### 4. Token Counting

**Estimation method:**
```typescript
// Simple heuristic
const tokenCount = Math.floor(JSON.stringify(content).length / 4);

// More accurate (using API)
const response = await model.countTokens(content);
const tokenCount = response.totalTokens;
```

**Token limits:**
```typescript
const TOKEN_LIMITS = {
  'codeh-pro': 32000,
  'codeh-1.5-pro': 1000000,
  'codeh-1.5-flash': 1000000,
};

function tokenLimit(model: string): number {
  return TOKEN_LIMITS[model] || 32000;
}
```

### 5. Max Session Turns

```typescript
if (maxSessionTurns > 0 && sessionTurnCount > maxSessionTurns) {
  yield { type: codehEventType.MaxSessionTurns };
  return;
}
```

**Lý do**: Tránh conversations quá dài, khuyến khích user start new session

### 6. Implementation Checklist cho CodeH

---

## 📖 05_UI_AND_STREAMING.md

**Nội dung chính:**

### 1. React + Ink Architecture

**Component Hierarchy:**
```
App
└── AppContainer
    ├── MainContent
    │   └── HistoryItemDisplay (foreach item)
    │       ├── UserMessage
    │       ├── codehMessage
    │       ├── ToolGroupMessage
    │       ├── ErrorMessage
    │       └── InfoMessage
    └── Composer
```

### 2. Streaming State Management

```typescript
enum StreamingState {
  Idle = 'idle',
  Responding = 'responding',
  WaitingForConfirmation = 'waitingForConfirmation'
}

// State transitions
Idle → (submitQuery) → Responding
Responding → (tool needs confirm) → WaitingForConfirmation
WaitingForConfirmation → (user confirms) → Responding
Responding → (finish) → Idle
```

### 3. Real-time UI Updates

**Mechanism:** React state updates trigger re-renders

```typescript
// In usecodehStream
const [streamingText, setStreamingText] = useState('');

// For each chunk
for await (const chunk of stream) {
  setStreamingText(prev => prev + chunk.text);
  // React automatically re-renders
}
```

### 4. HistoryItemDisplay Component

**File:** `packages/cli/src/ui/components/HistoryItemDisplay.tsx`

```typescript
export const HistoryItemDisplay = ({ item, isPending }) => {
  const itemForDisplay = isPending ? item.pending : item.committed;

  switch (itemForDisplay.type) {
    case 'user': return <UserMessage {...itemForDisplay} />;
    case 'codeh': return <codehMessage {...itemForDisplay} />;
    case 'tool': return <ToolGroupMessage {...itemForDisplay} />;
    case 'error': return <ErrorMessage {...itemForDisplay} />;
    case 'info': return <InfoMessage {...itemForDisplay} />;
  }
};
```

### 5. Markdown Rendering

```typescript
import { marked } from 'marked';
import markedTerminal from 'marked-terminal';

marked.use(markedTerminal());

const rendered = marked(text);
// Outputs terminal-formatted text with colors
```

### 6. Implementation Checklist cho CodeH

---

## 📖 06_DIFF_RENDERING.md

**Nội dung chính:**

### 1. Parse Unified Diff

**File:** `packages/cli/src/ui/components/messages/DiffRenderer.tsx`

```typescript
function parseDiffWithLineNumbers(diffContent: string): DiffLine[] {
  const lines = diffContent.split('\n');
  const result: DiffLine[] = [];

  let currentLineNumber = 0;

  for (const line of lines) {
    if (line.startsWith('@@')) {
      // Parse hunk header: @@ -10,7 +10,8 @@
      const match = line.match(/@@ -(\d+),\d+ \+\d+,\d+ @@/);
      currentLineNumber = parseInt(match[1]);
      continue;
    }

    if (line.startsWith('+')) {
      result.push({
        lineNumber: null,  // Added line
        type: 'added',
        content: line.substring(1)
      });
    } else if (line.startsWith('-')) {
      result.push({
        lineNumber: currentLineNumber++,
        type: 'removed',
        content: line.substring(1)
      });
    } else {
      result.push({
        lineNumber: currentLineNumber++,
        type: 'context',
        content: line.substring(1)
      });
    }
  }

  return result;
}
```

### 2. Syntax Highlighting

```typescript
import hljs from 'highlight.js';

const language = getLanguageFromExtension(filename);
const highlighted = hljs.highlight(content, { language });

// Convert to terminal colors
const terminalOutput = convertAnsiToTerminalColors(highlighted.value);
```

### 3. Terminal Rendering

```typescript
function renderDiffContent(parsedLines: DiffLine[]): string[] {
  return parsedLines.map(line => {
    const { lineNumber, type, content } = line;

    const gutter = lineNumber
      ? String(lineNumber).padStart(gutterWidth)
      : ' '.repeat(gutterWidth);

    const prefix = type === 'added' ? '+'
                 : type === 'removed' ? '-'
                 : ' ';

    const colored = type === 'added' ? chalk.green(content)
                  : type === 'removed' ? chalk.red(content)
                  : chalk.gray(content);

    return `${chalk.gray(gutter)}${prefix} ${colored}`;
  });
}
```

### 4. Implementation Checklist cho CodeH

---

## 📖 07_CONFIRMATION_SYSTEM.md

**Nội dung chính:**

### 1. Confirmation Flow

```
Tool wants to execute
  → Check approval mode
  → If manual/auto(dangerous): Set confirmationRequest state
  → StreamingState = WaitingForConfirmation
  → Render ToolConfirmationMessage
  → Wait for user input
  → Execute/Skip based on decision
  → StreamingState = Responding (or Idle)
```

### 2. Approval Modes

```typescript
enum ApprovalMode {
  MANUAL = 'manual',    // Hỏi mọi command
  AUTO = 'auto',        // Chỉ hỏi dangerous commands
  ALWAYS = 'always'     // Không hỏi
}

const DANGEROUS_COMMANDS = [
  'rm', 'rmdir', 'dd', 'mkfs', 'format',
  ':(){:|:&};:',  // fork bomb
];

function isDangerousCommand(command: string): boolean {
  return DANGEROUS_COMMANDS.some(d => command.startsWith(d));
}
```

### 3. ToolConfirmationMessage Component

**File:** `packages/cli/src/ui/components/messages/ToolConfirmationMessage.tsx`

```typescript
<Box flexDirection="column">
  <Text bold>Execute command?</Text>
  <Text>{confirmationDetails.command}</Text>
  <Text dimColor>cwd: {confirmationDetails.cwd}</Text>

  {/* Show diff if file edit */}
  {confirmationDetails.type === 'edit' && (
    <DiffRenderer diffContent={confirmationDetails.fileDiff} />
  )}

  <SelectInput
    items={[
      { label: '✓ Accept', value: 'accept' },
      { label: '✗ Reject', value: 'reject' },
      { label: '⊗ Disable approval', value: 'disable_approval' }
    ]}
    onSelect={handleConfirm}
  />
</Box>
```

### 4. Trusted Folders

```typescript
// Check if folder is trusted
const trusted = await config.isFolderTrusted(process.cwd());

if (!trusted) {
  // Show trust dialog
  showFolderTrustDialog({
    onTrust: () => config.trustFolder(process.cwd()),
    onDeny: () => process.exit(0)
  });
}
```

### 5. Implementation Checklist cho CodeH

---

## 📖 08_DATA_STRUCTURES.md

**Tất cả TypeScript interfaces và types:**

```typescript
// Core types
interface Part { ... }
interface Content { ... }
interface Message { ... }

// Stream events
interface StreamEvent { ... }
enum codehEventType { ... }

// History
interface HistoryItem { ... }

// Tool calls
interface ToolCall { ... }
interface ToolResponse { ... }

// Confirmation
interface ConfirmationRequest { ... }
enum ApprovalMode { ... }

// ... và nhiều hơn nữa
```

---

## 📖 09_IMPLEMENTATION_ROADMAP.md

**Kế hoạch implementation từng bước cho CodeH:**

### Phase 1: Foundation (1-2 weeks)
- Setup project structure
- Install dependencies
- Define core types

### Phase 2: Basic Prompt Processing (1 week)
- Implement submitQuery()
- Basic API calling
- Simple response display

### Phase 3: Streaming (1 week)
- AsyncGenerator implementation
- Real-time UI updates
- Cancel functionality

### Phase 4: History Management (3-4 days)
- useHistoryManager hook
- Display conversation history
- Persist history

### Phase 5: Context Overflow (1 week)
- Token counting
- Overflow detection
- Compression algorithm

### Phase 6: UI Polish (1 week)
- Markdown rendering
- Syntax highlighting
- Loading indicators

### Phase 7: Diff Rendering (3-4 days)
- Parse diff format
- Terminal rendering
- Syntax highlighting for diffs

### Phase 8: Confirmation System (1 week)
- Approval modes
- Confirmation dialogs
- Trusted folders
- Dangerous command detection

### Phase 9: Testing & Polish (1-2 weeks)
- Unit tests
- Integration tests
- Bug fixes
- Performance optimization

**Total estimate: 8-12 weeks**

---

## 🚀 NEXT STEPS ĐỂ HOÀN THIỆN TÀI LIỆU

Tôi đã tạo xong INDEX và phần 01. Để hoàn thiện bộ tài liệu:

### Bạn có thể:

1. **Tiếp tục yêu cầu tôi tạo từng file:**
   - "Hãy tạo file 02_PROMPT_PROCESSING_FLOW.md"
   - "Hãy tạo file 03_CONVERSATION_HISTORY.md"
   - v.v...

2. **Hoặc sử dụng outline trên để tự viết:**
   - Outline đã rất chi tiết
   - Có references đến files cụ thể
   - Có code examples

3. **Hoặc yêu cầu tôi tạo tất cả một lần:**
   - Tôi sẽ tạo toàn bộ remaining files
   - Nhưng sẽ phải chia nhỏ ra nhiều responses

### Tôi recommend:

**Option 3**: Tôi tạo hết tất cả files còn lại cho bạn. Bạn chỉ cần nói:

> "Hãy tiếp tục tạo hết tất cả các tài liệu còn lại (02-09)"

Tôi sẽ tạo từng file một cách chi tiết nhất có thể.

---

## 📊 TRẠNG THÁI HIỆN TẠI

✅ **Hoàn thành:**
- 00_INDEX.md (Mục lục tổng thể)
- 01_ARCHITECTURE_OVERVIEW.md (Kiến trúc chi tiết)
- README.md (Hướng dẫn và outline các phần còn lại)

⏳ **Chưa hoàn thành:**
- 02_PROMPT_PROCESSING_FLOW.md
- 03_CONVERSATION_HISTORY.md
- 04_CONTEXT_OVERFLOW_HANDLING.md
- 05_UI_AND_STREAMING.md
- 06_DIFF_RENDERING.md
- 07_CONFIRMATION_SYSTEM.md
- 08_DATA_STRUCTURES.md
- 09_IMPLEMENTATION_ROADMAP.md

**Tiến độ: 2/10 files (20%)**

---

Bạn muốn tôi làm gì tiếp theo? 🚀
