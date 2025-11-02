# 03. CONVERSATION HISTORY MANAGEMENT

> **Chi tiết cách codeh CLI quản lý conversation history và GỬI TOÀN BỘ HISTORY mỗi lần**

---

## 📋 QUICK REFERENCE

**❗ KEY INSIGHT:**
```
codeh CLI GỬI TOÀN BỘ CONVERSATION HISTORY mỗi lần request!
KHÔNG CHỈ gửi prompt mới nhất.
```

**Lý do:** codeh API là **STATELESS** - không nhớ conversations trước đó

---

## 1. GỬI PROMPT ĐƠN LẺ HAY TOÀN BỘ HỘI THOẠI?

### 1.1. Câu Trả Lời: TOÀN BỘ HỘI THOẠI

**File:** `packages/core/src/core/codehChat.ts` (line 255-257)

```typescript
// Add user content to history
this.history.push(userContent);

// Get FULL history for API call
const requestContents = this.getHistory(true);  // ← FULL HISTORY

// Make API call with FULL history
const stream = await this.makeApiCallAndProcessStream(
  model,
  requestContents,  // ← Gửi toàn bộ
  currentParams,
  prompt_id,
);
```

### 1.2. Ví Dụ Cụ Thể

```typescript
// ═══════════════════════════════════════════════════════
// REQUEST 1
// ═══════════════════════════════════════════════════════
POST /v1/models/codeh-pro:generateContentStream
{
  "contents": [
    {
      "role": "user",
      "parts": [{ "text": "Hello, who are you?" }]
    }
  ]
}

// RESPONSE 1
{
  "role": "model",
  "parts": [{ "text": "I am codeh, a large language model." }]
}

// ═══════════════════════════════════════════════════════
// REQUEST 2 - GỬI LẠI TẤT CẢ HISTORY
// ═══════════════════════════════════════════════════════
POST /v1/models/codeh-pro:generateContentStream
{
  "contents": [
    // ← Previous user message
    {
      "role": "user",
      "parts": [{ "text": "Hello, who are you?" }]
    },
    // ← Previous model response
    {
      "role": "model",
      "parts": [{ "text": "I am codeh, a large language model." }]
    },
    // ← NEW user message
    {
      "role": "user",
      "parts": [{ "text": "What can you help me with?" }]
    }
  ]
}

// ═══════════════════════════════════════════════════════
// REQUEST 3 - TIẾP TỤC GỬI TOÀN BỘ
// ═══════════════════════════════════════════════════════
POST /v1/models/codeh-pro:generateContentStream
{
  "contents": [
    { "role": "user", "parts": [{ "text": "Hello, who are you?" }] },
    { "role": "model", "parts": [{ "text": "I am codeh..." }] },
    { "role": "user", "parts": [{ "text": "What can you help me with?" }] },
    { "role": "model", "parts": [{ "text": "I can help with..." }] },
    { "role": "user", "parts": [{ "text": "Write a Python function" }] }  // NEW
  ]
}
```

### 1.3. Tại Sao Phải Gửi Toàn Bộ?

**codeh API characteristics:**
1. **Stateless**: API không lưu state giữa các requests
2. **No session storage**: Không có session ID hay conversation tracking
3. **Context cần thiết**: Model cần full context để generate coherent responses

**Alternative approaches (KHÔNG dùng):**
- ❌ Chỉ gửi new message → Model không biết context
- ❌ Session-based API → codeh không hỗ trợ
- ❌ Embedding-based retrieval → Quá phức tạp, không real-time

---

## 2. DATA STRUCTURES

### 2.1. Content & Part Types

**File:** `packages/core/src/core/types.ts`

```typescript
// Content = một message trong conversation
interface Content {
  role: 'user' | 'model';
  parts: Part[];
}

// Part = một phần của message
type Part =
  | { text: string }                                    // Text
  | { inlineData: { mimeType: string; data: string } }  // File/Image (base64)
  | { functionCall: { name: string; args: object } }    // Tool call
  | { functionResponse: { name: string; response: object } }; // Tool response
```

**Example:**
```typescript
const userContent: Content = {
  role: 'user',
  parts: [
    { text: 'Analyze this image:' },
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: 'base64_encoded_image_data...'
      }
    }
  ]
};

const modelContent: Content = {
  role: 'model',
  parts: [
    { text: 'I can see a cat in the image.' },
    {
      functionCall: {
        name: 'saveToFile',
        args: { filename: 'analysis.txt', content: '...' }
      }
    }
  ]
};
```

### 2.2. History Structure trong codehChat

**File:** `packages/core/src/core/codehChat.ts`

```typescript
class codehChat {
  private history: Content[] = [];  // ← In-memory history

  // Add message
  addHistory(content: Content): void {
    this.history.push(content);
  }

  // Get history (optionally curated)
  getHistory(curated: boolean = false): Content[] {
    const history = curated
      ? extractCuratedHistory(this.history)  // Remove old IDE context
      : this.history;

    return structuredClone(history);  // Deep copy
  }

  // Set history (e.g., after compression)
  setHistory(history: Content[]): void {
    this.history = history;
  }
}
```

### 2.3. HistoryItem Structure trong CLI

**File:** `packages/cli/src/ui/hooks/useHistoryManager.ts`

```typescript
interface HistoryItem {
  // Message đã hoàn thành
  committed: Message | null;

  // Message đang streaming (real-time updates)
  pending: Message | null;
}

interface Message {
  type: MessageType;
  text: string;
  parts?: Part[];
  toolCalls?: ToolCall[];
  timestamp: number;
  metadata?: Record<string, any>;
}

enum MessageType {
  USER = 'user',
  codeh = 'codeh',
  TOOL = 'tool',
  ERROR = 'error',
  INFO = 'info',
}
```

**Streaming workflow:**
```typescript
// 1. Start streaming
const item: HistoryItem = {
  committed: null,
  pending: {
    type: 'codeh',
    text: '',  // Empty initially
    timestamp: Date.now()
  }
};

// 2. Update during streaming
item.pending.text += chunk.text;  // Append chunks

// 3. Finalize
item.committed = item.pending;
item.pending = null;
```

---

## 3. useHistoryManager HOOK

**File:** `packages/cli/src/ui/hooks/useHistoryManager.ts`

### 3.1. Interface

```typescript
interface UseHistoryManagerReturn {
  items: HistoryItem[];
  addItem: (message: Message) => void;
  updateItem: (index: number, updater: (msg: Message) => Message) => void;
  clear: () => void;
  getLastItem: () => HistoryItem | undefined;
}

function useHistory(): UseHistoryManagerReturn {
  const [items, setItems] = useState<HistoryItem[]>([]);

  // Implementation...
}
```

### 3.2. Implementation Chi Tiết

```typescript
function useHistory(): UseHistoryManagerReturn {
  const [items, setItems] = useState<HistoryItem[]>([]);

  // ═══════════════════════════════════════════════════════
  // ADD ITEM (committed message)
  // ═══════════════════════════════════════════════════════
  const addItem = useCallback((message: Message) => {
    setItems(prev => [
      ...prev,
      {
        committed: message,
        pending: null
      }
    ]);
  }, []);

  // ═══════════════════════════════════════════════════════
  // UPDATE ITEM (for streaming updates)
  // ═══════════════════════════════════════════════════════
  const updateItem = useCallback((
    index: number,
    updater: (msg: Message) => Message
  ) => {
    setItems(prev => {
      const newItems = [...prev];
      const item = newItems[index];

      if (item.pending) {
        // Update pending
        item.pending = updater(item.pending);
      } else if (item.committed) {
        // Create new pending from committed
        item.pending = updater(item.committed);
      }

      return newItems;
    });
  }, []);

  // ═══════════════════════════════════════════════════════
  // COMMIT PENDING (finalize streaming)
  // ═══════════════════════════════════════════════════════
  const commitPending = useCallback((index: number) => {
    setItems(prev => {
      const newItems = [...prev];
      const item = newItems[index];

      if (item.pending) {
        item.committed = item.pending;
        item.pending = null;
      }

      return newItems;
    });
  }, []);

  // ═══════════════════════════════════════════════════════
  // CLEAR ALL
  // ═══════════════════════════════════════════════════════
  const clear = useCallback(() => {
    setItems([]);
  }, []);

  // ═══════════════════════════════════════════════════════
  // GET LAST ITEM
  // ═══════════════════════════════════════════════════════
  const getLastItem = useCallback(() => {
    return items[items.length - 1];
  }, [items]);

  return {
    items,
    addItem,
    updateItem,
    commitPending,
    clear,
    getLastItem,
  };
}
```

### 3.3. Usage Example

```typescript
function ChatComponent() {
  const history = useHistory();

  // Add user message
  const handleSubmit = (text: string) => {
    history.addItem({
      type: 'user',
      text: text,
      timestamp: Date.now()
    });

    // Start streaming
    streamResponse(text);
  };

  // During streaming
  const streamResponse = async (prompt: string) => {
    // Add empty codeh message
    const codehIndex = history.items.length;
    history.addItem({
      type: 'codeh',
      text: '',
      timestamp: Date.now()
    });

    // Update as chunks arrive
    for await (const chunk of stream) {
      history.updateItem(codehIndex, (prev) => ({
        ...prev,
        text: prev.text + chunk.text
      }));
    }

    // Finalize
    history.commitPending(codehIndex);
  };

  return (
    <div>
      {history.items.map((item, i) => (
        <MessageDisplay key={i} item={item} />
      ))}
    </div>
  );
}
```

---

## 4. CURATED HISTORY

### 4.1. Tại Sao Cần Curated?

**Problem:**
- IDE context có thể rất lớn (open files, directory structure)
- Gửi lại old IDE context → waste tokens
- Context window đầy nhanh hơn

**Solution:** extractCuratedHistory()

### 4.2. Implementation

**File:** `packages/core/src/core/historyUtils.ts`

```typescript
function extractCuratedHistory(history: Content[]): Content[] {
  const curated: Content[] = [];

  for (let i = 0; i < history.length; i++) {
    const content = history[i];

    // ═══════════════════════════════════════════════════════
    // FILTER OUT OLD IDE CONTEXT
    // ═══════════════════════════════════════════════════════

    if (isIdeContextMessage(content)) {
      // Only keep LATEST IDE context
      const hasNewerIdeContext = history
        .slice(i + 1)
        .some(c => isIdeContextMessage(c));

      if (hasNewerIdeContext) {
        continue;  // Skip old IDE context
      }
    }

    // ═══════════════════════════════════════════════════════
    // FILTER OUT SYSTEM MESSAGES (optional)
    // ═══════════════════════════════════════════════════════

    if (isSystemMessage(content)) {
      // Decide if system message is important
      if (!isImportantSystemMessage(content)) {
        continue;  // Skip
      }
    }

    // ═══════════════════════════════════════════════════════
    // KEEP MESSAGE
    // ═══════════════════════════════════════════════════════

    curated.push(content);
  }

  return curated;
}

// Helper functions
function isIdeContextMessage(content: Content): boolean {
  if (content.role !== 'user') return false;

  const text = content.parts
    .filter(p => 'text' in p)
    .map(p => p.text)
    .join('');

  return text.includes('# IDE Context') ||
         text.includes('# Open Files') ||
         text.includes('# Directory Structure');
}

function isSystemMessage(content: Content): boolean {
  const text = content.parts
    .filter(p => 'text' in p)
    .map(p => p.text)
    .join('');

  return text.startsWith('System:');
}
```

### 4.3. Before vs After Curated

**Before:**
```typescript
history = [
  { role: 'user', parts: [{ text: '# IDE Context\nfile1.ts\nfile2.ts' }] },  // OLD
  { role: 'user', parts: [{ text: 'User query 1' }] },
  { role: 'model', parts: [{ text: 'Response 1' }] },
  { role: 'user', parts: [{ text: '# IDE Context\nfile1.ts\nfile3.ts' }] },  // NEW
  { role: 'user', parts: [{ text: 'User query 2' }] },
]
```

**After curated:**
```typescript
curatedHistory = [
  // OLD IDE context removed ✓
  { role: 'user', parts: [{ text: 'User query 1' }] },
  { role: 'model', parts: [{ text: 'Response 1' }] },
  { role: 'user', parts: [{ text: '# IDE Context\nfile1.ts\nfile3.ts' }] },  // Kept
  { role: 'user', parts: [{ text: 'User query 2' }] },
]
```

---

## 5. PERSISTENCE (Optional)

### 5.1. Save History to Disk

```typescript
async function saveHistory(
  sessionId: string,
  history: Content[]
): Promise<void> {
  const filePath = path.join(
    os.homedir(),
    '.codeh',
    'sessions',
    `${sessionId}.json`
  );

  await fs.writeFile(
    filePath,
    JSON.stringify(history, null, 2),
    'utf-8'
  );
}
```

### 5.2. Load History from Disk

```typescript
async function loadHistory(
  sessionId: string
): Promise<Content[]> {
  const filePath = path.join(
    os.homedir(),
    '.codeh',
    'sessions',
    `${sessionId}.json`
  );

  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // File không tồn tại hoặc corrupt
    return [];
  }
}
```

### 5.3. Auto-save on Change

```typescript
useEffect(() => {
  // Debounce save
  const timer = setTimeout(() => {
    saveHistory(sessionId, codehChat.getHistory());
  }, 1000);  // Save after 1s of no changes

  return () => clearTimeout(timer);
}, [history]);
```

---

## 6. IMPLEMENTATION CHECKLIST CHO CODEH

### ✅ Phase 1: Basic History (MUST HAVE)

- [ ] **Content & Part types**
  - [ ] Define TypeScript interfaces
  - [ ] Text parts
  - [ ] Function call/response parts

- [ ] **In-memory history storage**
  - [ ] Array of Content
  - [ ] addHistory()
  - [ ] getHistory()

- [ ] **Always send full history**
  - [ ] Get full history before API call
  - [ ] Send entire array to API

### 🔶 Phase 2: UI History (SHOULD HAVE)

- [ ] **HistoryItem structure**
  - [ ] committed vs pending
  - [ ] Message types

- [ ] **useHistoryManager hook**
  - [ ] items state
  - [ ] addItem()
  - [ ] updateItem() for streaming
  - [ ] commitPending()

- [ ] **Display history**
  - [ ] Map items to components
  - [ ] Show streaming updates

### 🔹 Phase 3: Optimization (NICE TO HAVE)

- [ ] **Curated history**
  - [ ] Filter old IDE context
  - [ ] Filter system messages

- [ ] **Persistence**
  - [ ] Save to disk
  - [ ] Load on startup
  - [ ] Session management

- [ ] **History limits**
  - [ ] Max items (e.g., 100)
  - [ ] Auto-cleanup old items

---

## 7. CODE EXAMPLES CHO CODEH

### 7.1. Minimal History Manager

```typescript
class SimpleHistoryManager {
  private history: Content[] = [];

  add(content: Content): void {
    this.history.push(content);
  }

  getAll(): Content[] {
    return [...this.history];  // Copy
  }

  clear(): void {
    this.history = [];
  }
}

// Usage
const history = new SimpleHistoryManager();

history.add({
  role: 'user',
  parts: [{ text: 'Hello' }]
});

history.add({
  role: 'model',
  parts: [{ text: 'Hi there!' }]
});

// Send to API
const response = await api.generateContent({
  contents: history.getAll()  // Full history
});
```

### 7.2. React Hook với Streaming

```typescript
function useConversation() {
  const [history, setHistory] = useState<Content[]>([]);
  const [streaming, setStreaming] = useState<string>('');

  const sendMessage = async (text: string) => {
    // Add user message
    const userMsg: Content = {
      role: 'user',
      parts: [{ text }]
    };
    setHistory(prev => [...prev, userMsg]);

    // Start streaming
    setStreaming('');

    const stream = await api.generateContentStream({
      contents: [...history, userMsg]  // Full history + new message
    });

    let fullResponse = '';
    for await (const chunk of stream) {
      fullResponse += chunk.text;
      setStreaming(fullResponse);  // Update UI
    }

    // Commit
    const modelMsg: Content = {
      role: 'model',
      parts: [{ text: fullResponse }]
    };
    setHistory(prev => [...prev, modelMsg]);
    setStreaming('');
  };

  return { history, streaming, sendMessage };
}
```

---

## 📚 NEXT STEPS

Đọc tiếp:
- **[04_CONTEXT_OVERFLOW_HANDLING.md](./04_CONTEXT_OVERFLOW_HANDLING.md)** - Xử lý khi history quá lớn
- **[08_DATA_STRUCTURES.md](./08_DATA_STRUCTURES.md)** - Chi tiết types

---

**Tóm tắt**: codeh CLI LUÔN gửi toàn bộ conversation history mỗi lần request. History được quản lý với structure committed/pending cho streaming updates. Curated history giúp optimize token usage.
