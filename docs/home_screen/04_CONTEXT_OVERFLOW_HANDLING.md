# 04. CONTEXT OVERFLOW HANDLING

## 📋 Tổng quan

Tài liệu này mô tả **cơ chế kỹ thuật** để phát hiện và xử lý context overflow trong Gemini CLI.

---

## 1. BỐN CƠ CHẾ CHÍNH

```
1. OVERFLOW DETECTION (95% threshold)
   → Phát hiện TRƯỚC khi gửi API request

2. CHAT COMPRESSION (70/30 split)
   → Nén history bằng AI summarization

3. IDE CONTEXT DIFF (chỉ gửi thay đổi)
   → Tiết kiệm 10-100x tokens

4. MAX SESSION TURNS (default: 50)
   → Giới hạn độ dài conversation
```

---

## 2. OVERFLOW DETECTION

### 2.1. Timing
**Khi nào check**: TRƯỚC khi gửi request đến API (trong `GeminiClient.sendMessageStream()`)

### 2.2. Công thức tính
```
estimatedTokens = JSON.stringify(request).length / 4

currentUsage = lastTurn.usage.totalTokenCount

remainingTokens = tokenLimit(model) - currentUsage

threshold = remainingTokens * 0.95

if (estimatedTokens > threshold):
    → OVERFLOW!
```

### 2.3. Token Limits theo Model

| Model | Token Limit |
|-------|-------------|
| gemini-2.0-flash-thinking | 32,768 |
| gemini-2.0-* (others) | 1,000,000 |
| gemini-1.5-flash-002 | 1,000,000 |
| gemini-1.5-flash | 1,000,000 |
| gemini-1.5-pro-002 | 2,000,000 |
| gemini-1.5-pro | 2,000,000 |
| gemini-exp-* | 2,000,000 |
| Default fallback | 32,768 |

### 2.4. Tại sao 95% threshold?

**Lý do**:
1. **Safety buffer** cho estimation error (4 chars = 1 token chỉ là ước lượng)
2. **Response space** - Model cần tokens để generate response
3. **JSON overhead** - Structure thêm tokens
4. **Better UX** - Cảnh báo trước thay vì API error

**Ví dụ**:
- Model: gemini-1.5-pro (2M limit)
- Current usage: 1,900,000 tokens
- Remaining: 100,000 tokens
- Threshold: 95,000 tokens
- New request estimate: 96,000 tokens
- **Result**: OVERFLOW! (96K > 95K)

---

## 3. COMPRESSION ALGORITHM

### 3.1. Strategy: 70/30 Split

**Nguyên lý**:
- **Giữ nguyên** 30% messages gần nhất (verbatim)
- **Summarize** 70% messages cũ bằng AI
- **Thay thế** old messages bằng 1 summary message

### 3.2. Quy trình

```
[1] Tính split point
    numToPreserve = ceil(history.length * 0.3)
    numToCompress = history.length - numToPreserve

[2] Chia history
    oldMessages = history[0 : numToCompress]
    recentMessages = history[numToCompress : end]

[3] Gọi AI summarization
    summary = callAI("Summarize these messages: ...")

[4] Build compressed history
    compressedHistory = [
        { role: 'user', text: "[Summary]\n" + summary },
        ...recentMessages
    ]

[5] Replace history
    this.history = compressedHistory
```

### 3.3. Summarization Prompt Template

**Yêu cầu với AI**:
```
Bạn là chat history summarizer.

Summarize conversation này, BẮT BUỘC giữ:
- Key facts và decisions
- Important context cho future messages
- Technical details và code snippets (quan trọng)
- User preferences và settings

CÓ THỂ bỏ qua:
- Pleasantries (xin chào, cảm ơn, etc.)
- Redundant explanations
- Obvious/general knowledge

Format: Clear, structured, < 1000 tokens
```

### 3.4. Compression Example

**Before** (100 messages, ~180K tokens):
```
[
  {user: "Hi, help with React"},
  {model: "Sure! What issue?"},
  {user: "useEffect bug..."},
  {model: "[long explanation]"},
  ... (96 messages more) ...
]
```

**After** (31 messages, ~60K tokens):
```
[
  {user: "[Compressed Summary]
    User developing React app, encountered:
    1. useEffect bug → fixed dependency array
    2. Added data fetching with custom hooks
    3. Project: React 18 + TypeScript
    User prefers: functional components, detailed explanations
  "},
  ... (30 recent messages - kept verbatim) ...
]
```

**Token savings**: 180K → 60K = **67% reduction**

---

## 4. IDE CONTEXT DIFF

### 4.1. Problem

**Không có diff**:
```
Turn 1: Gửi 20 open files = 50K tokens
Turn 2: Gửi 20 open files = 50K tokens (lại!)
Turn 3: Gửi 20 open files = 50K tokens (lại!)
→ Waste: 150K tokens chỉ để gửi cùng files
```

**Có diff**:
```
Turn 1: Gửi "Opened: 20 files" = 50K tokens
Turn 2: Gửi "Modified: 1 file" = 500 tokens
Turn 3: Gửi "Nothing changed" = 0 tokens
→ Savings: 149.5K tokens (99% reduction!)
```

### 4.2. Diff Calculation

**So sánh với previous turn**:

```
previousContext = lastTurn.ideContext
currentContext = getIdeContext()

diff = {
    openedFiles: current.files - previous.files,
    closedFiles: previous.files - current.files,
    modifiedFiles: files có same path nhưng different content,
    activeFileChanged: previous.activeFile != current.activeFile
}
```

**Chỉ gửi diff** thay vì toàn bộ context!

### 4.3. Example

**Turn 1** (khởi tạo):
```
IDE Context:
  openFiles: [App.tsx, Header.tsx, utils.ts]
  activeFile: App.tsx

→ Gửi: "Opened: App.tsx, Header.tsx, utils.ts
        Active: App.tsx"
```

**Turn 2** (user edit App.tsx):
```
IDE Context:
  openFiles: [App.tsx, Header.tsx, utils.ts]  // App.tsx modified
  activeFile: App.tsx

→ Gửi: "Modified: App.tsx (nội dung mới)"
```

**Turn 3** (user đóng Header.tsx, mở New.tsx):
```
→ Gửi: "Closed: Header.tsx
        Opened: New.tsx"
```

### 4.4. Token Savings

| Scenario | Without Diff | With Diff | Savings |
|----------|--------------|-----------|---------|
| 20 files, no change | 50K | 0 | 100% |
| 20 files, 1 modified | 50K | 500 | 99% |
| 20 files, all new | 50K | 50K | 0% |

**Average savings**: 70-90%

---

## 5. CURATED HISTORY

### 5.1. Problem
Old IDE context trong history gây nhiễu khi compression:
- File snapshots cũ không còn relevant
- Tăng kích thước history không cần thiết
- Làm giảm chất lượng summarization

### 5.2. Solution: Filter trước khi compress

**Curated History** = History đã lọc bỏ old IDE context

```
Lọc bỏ:
- Parts có "[IDE Context]" marker
- Old file snapshots
- System messages cũ

Giữ lại:
- User/model text
- Tool calls và results
- Current IDE context (nếu có)
```

### 5.3. Impact

**Trước khi curate**:
```
History size: 200 messages
Total tokens: 500K
IDE context: 200K tokens (40%)
```

**Sau khi curate**:
```
History size: 200 messages
Total tokens: 300K
IDE context: 0 tokens (removed!)
```

**Compression quality**: Better, vì less noise

---

## 6. MAX SESSION TURNS LIMIT

### 6.1. Purpose
Ngăn conversations quá dài dù không overflow:

**Lý do**:
1. **Quality degradation** - Conversations quá dài mất coherence
2. **Performance** - Processing large history chậm
3. **Cost** - More tokens = more expensive
4. **Force refresh** - User phải start fresh periodically

### 6.2. Configuration

**Default**: 50 turns (= 100 messages)

**Kiểm tra**:
```
turnCount = history.length / 2
if (turnCount >= maxSessionTurns):
    → Emit MaxSessionTurnsExceeded event
    → Suggest compression hoặc new session
```

### 6.3. User Options khi vượt

1. **Compress** - Nén history để tiếp tục
2. **New Session** - Clear history, start fresh
3. **Ignore** (nếu config cho phép) - Tiếp tục dù warning

---

## 7. COMPLETE OVERFLOW FLOW

```
submitQuery(text)
    ↓
prepareQuery()
    ↓
GeminiClient.sendMessageStream()
    ↓
    ┌─────────────────────────────────┐
    │ CHECKPOINT 1: Token Overflow    │
    │                                  │
    │ estimate > remaining * 0.95?    │
    │                                  │
    │ YES → Emit ContextWillOverflow  │
    │       STOP, đợi user decision   │
    │                                  │
    │ NO → Continue                   │
    └─────────────────┬───────────────┘
                      ↓
    ┌─────────────────────────────────┐
    │ CHECKPOINT 2: Max Turns         │
    │                                  │
    │ turnCount >= maxSessionTurns?   │
    │                                  │
    │ YES → Emit MaxTurnsExceeded     │
    │       Suggest compression       │
    │                                  │
    │ NO → Continue                   │
    └─────────────────┬───────────────┘
                      ↓
                 Call API
```

### User Decision Dialog

```
┌──────────────────────────────────────┐
│ ⚠️ Context Window Almost Full        │
│                                       │
│ Current: 1.9M / 2M tokens (95%)      │
│ Remaining: 100K tokens               │
│                                       │
│ Options:                              │
│  1. [Compress] - Nén history (recommended) │
│  2. [New Session] - Start fresh      │
│  3. [Cancel] - Không gửi message này │
└──────────────────────────────────────┘
```

**Nếu chọn Compress**:
```
→ Show "Compressing..."
→ Run compression algorithm
→ Show "Compressed: 180K → 60K (saved 67%)"
→ Retry original request
```

---

## 8. PERFORMANCE CONSIDERATIONS

### 8.1. Token Estimation Speed

**Current**: `JSON.stringify().length / 4`
- Speed: ~0.1ms cho 10KB content
- Accuracy: ±10%
- Good enough cho overflow detection

**Alternative**: Tokenization library (tiktoken)
- Speed: ~5-10ms cho 10KB
- Accuracy: 100%
- Dùng cho billing/analytics, không dùng cho real-time check

### 8.2. Compression Latency

**Timings**:
- 50 messages: ~2-3 seconds
- 100 messages: ~4-6 seconds
- 200 messages: ~8-12 seconds

**UX**: Show progress indicator nếu > 2 seconds

### 8.3. Diff Calculation Overhead

**Complexity**: O(n) where n = số open files

**Optimization**:
```
Thay vì:
  O(n²) - Nested loops để tìm modified files

Dùng:
  O(n) - Map lookup cho constant-time comparison
```

**Impact**: 10x faster với 100+ open files

---

## 9. KEY TECHNICAL INSIGHTS

### 1. Proactive Detection
Check overflow **BEFORE** API call, không phải react sau error

### 2. Multi-Layer Defense
- Overflow detection (95%)
- Max turns limit (50)
- IDE context diff (save 90%)
- Compression (save 67%)

### 3. User Control
User quyết định compress hay new session, không tự động

### 4. Quality vs Size Tradeoff
- 70/30 split: Balance giữa compression ratio và context quality
- 95% threshold: Balance giữa safety và usability

### 5. Estimation vs Accuracy
- Fast estimation cho real-time check
- Accurate counting cho analytics
- Don't need perfect accuracy cho overflow detection

---

## 📚 REFERENCES

### Files quan trọng:
- `client.ts:503-517` - Overflow detection
- `client.ts:731-859` - Compression algorithm
- `client.ts:295-461` - IDE context diff
- `tokenLimits.ts:8-58` - Model token limits

### Related Docs:
- **02_PROMPT_PROCESSING_FLOW.md** - Overflow check trong main flow
- **03_CONVERSATION_HISTORY.md** - History structure
- **05_UI_AND_STREAMING.md** - Compression UI

---

**Cập nhật**: 2025-11-02
**Loại**: Mô tả kỹ thuật (technical description)
**Không bao gồm**: Implementation code
