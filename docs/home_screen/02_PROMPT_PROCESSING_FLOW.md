# 02. PROMPT PROCESSING FLOW

## 📋 Tổng quan

Tài liệu này mô tả **luồng xử lý kỹ thuật** từ khi user nhập prompt cho đến khi nhận được kết quả.

---

## 1. LUỒNG CHÍNH - 7 BƯỚC

```
User nhập text
    ↓
[1] submitQuery() - Validate & khởi tạo
    ↓
[2] prepareQueryForGemini() - Chuẩn bị request
    ↓
[3] GeminiClient.sendMessageStream() - Gọi API
    ├─ Kiểm tra context overflow (95% threshold)
    ├─ Kiểm tra max turns limit
    ↓
[4] GeminiChat.sendMessageStream() - Quản lý history
    ├─ Thêm user message vào history
    ├─ Lấy FULL history (stateless)
    ├─ Tạo request với toàn bộ history
    ↓
[5] Turn.run() - Thực thi 1 turn
    ├─ Gọi Gemini API (streaming)
    ├─ Nhận response chunks
    ├─ Xử lý tool calls (nếu có)
    ↓
[6] processGeminiStreamEvents() - Xử lý events
    ├─ TextChunk → Cập nhật UI
    ├─ ToolCallRequest → Xin phép user
    ├─ ToolCallResult → Tiếp tục
    ├─ TurnComplete → Hoàn thành
    ↓
[7] UI Update - Hiển thị kết quả
    └─ Commit pending → committed
```

---

## 2. CHI TIẾT TỪNG BƯỚC

### Bước 1: submitQuery()

**Vị trí**: `packages/cli/src/ui/hooks/useGeminiStream.ts:760-922`

**Nhiệm vụ**:
1. Validate input (không empty, state phải Idle)
2. Khởi tạo AbortController (để cancel)
3. Tạo prompt_id unique
4. Gọi prepareQueryForGemini()

**State transitions**:
- Idle → Responding

**Xử lý đặc biệt**:
- Nếu đang streaming → reject request
- Nếu đang WaitingForConfirmation → reject request

---

### Bước 2: prepareQueryForGemini()

**Vị trí**: `packages/cli/src/ui/hooks/useGeminiStream.ts:590-670`

**Nhiệm vụ**:
1. Lấy IDE context (nếu enabled)
2. Build user content với parts
3. Kiểm tra loop detection (nếu có)
4. Return query prepared

**Cấu trúc query**:
```
{
  text: <user input>,
  ideContext: {
    openedFiles: [...],
    modifiedFiles: [...],
    closedFiles: [...]
  }
}
```

**Loop detection**:
- Track số lần tool gọi liên tiếp giống nhau
- Nếu > 3 lần → báo cáo loop, yêu cầu user can thiệp

---

### Bước 3: GeminiClient.sendMessageStream()

**Vị trí**: `packages/core/src/core/client.ts:476-659`

**Nhiệm vụ chính**:

#### 3.1. Chuẩn bị request
- Build Content object theo format Gemini API
- Add IDE context parts (nếu có)
- Add tools declarations

#### 3.2. Kiểm tra Context Overflow
**Cơ chế**:
- Estimate tokens = `JSON.stringify(request).length / 4`
- Get current usage từ turn cuối
- Calculate remaining = tokenLimit - currentUsage
- **Threshold**: 95% của remaining

**Nếu overflow**:
- Emit event `ContextWindowWillOverflow`
- DỪNG xử lý
- Đợi user quyết định (Compress/New Session/Cancel)

#### 3.3. Kiểm tra Max Turns
**Cơ chế**:
- Count turns = history.length / 2
- So sánh với maxSessionTurns (default: 50)

**Nếu vượt**:
- Emit event `MaxSessionTurnsExceeded`
- Suggest compression

#### 3.4. Gọi GeminiChat
- Pass request xuống layer tiếp theo

---

### Bước 4: GeminiChat.sendMessageStream()

**Vị trí**: `packages/core/src/core/geminiChat.ts:225-343`

**Nhiệm vụ**:

#### 4.1. Thêm vào History
```
this.history.push({
  role: 'user',
  parts: [{ text: userInput }]
})
```

#### 4.2. Lấy Full History
```
const requestContents = this.getHistory(true)
```

**⚠️ KEY**: Luôn gửi TOÀN BỘ history, không phải chỉ message mới!

#### 4.3. Build API Request
```
{
  contents: requestContents,  // Full history
  tools: [...],
  generationConfig: {...}
}
```

#### 4.4. Retry Logic
- Max retries: 3
- Backoff: exponential (1s, 2s, 4s)
- Retry on: Network errors, rate limits
- KHÔNG retry on: Invalid API key, safety blocks

---

### Bước 5: Turn.run()

**Vị trí**: `packages/core/src/core/turn.ts:85-250`

**Nhiệm vụ**:

#### 5.1. Gọi Gemini API
- Method: `generateContentStream()`
- Mode: Streaming (AsyncGenerator)

#### 5.2. Process Response Stream
Xử lý từng chunk:

**TextChunk**:
- Accumulate text
- Emit TextChunk event
- Update UI real-time

**FunctionCall**:
- Parse tool call request
- Emit ToolCallRequest event
- **PAUSE** stream
- Đợi user approval

**FunctionResponse** (sau khi tool executed):
- Add to history
- Continue stream

#### 5.3. Usage Tracking
- Ghi lại promptTokenCount
- Ghi lại candidatesTokenCount
- Ghi lại totalTokenCount

---

### Bước 6: processGeminiStreamEvents()

**Vị trí**: `packages/cli/src/ui/hooks/useGeminiStream.ts:673-800`

**Event Loop**:

```
for await (const event of stream) {
  switch (event.type) {
    case TextChunk:
      → Append to pending message
      → Update UI

    case ToolCallRequest:
      → State: Responding → WaitingForConfirmation
      → Show confirmation dialog
      → Đợi user response
      → If approved: Execute tool
      → If rejected: Stop stream

    case ToolCallResult:
      → Display tool output
      → Continue stream

    case TurnComplete:
      → Commit pending to committed
      → State: Responding → Idle
      → Stream kết thúc

    case ContextWindowWillOverflow:
      → Show overflow dialog
      → Pause everything

    case Error:
      → Show error
      → State → Idle
      → Stop stream
  }
}
```

**Error Handling**:
- Network errors → Retry (nếu có retries left)
- API errors → Show error, stop
- Stream abort → Clean up, state → Idle

---

### Bước 7: UI Update

**Pending → Committed Pattern**:

**Khi streaming**:
```
HistoryItem {
  pending: { text: "Xin ch..." },  // Update real-time
  committed: null
}
```

**Khi hoàn thành**:
```
HistoryItem {
  pending: null,
  committed: { text: "Xin chào!" }  // Final
}
```

**UI render**:
- Hiển thị `pending` nếu đang streaming
- Hiển thị `committed` nếu đã xong
- Show spinner khi pending exists

---

## 3. TOOL CALL FLOW

```
AI response có FunctionCall
    ↓
Parse tool call {name, args}
    ↓
Kiểm tra approval mode
    ├─ ALWAYS → Execute ngay
    ├─ AUTO → Check dangerous
    │   ├─ Safe → Execute
    │   └─ Dangerous → Ask user
    └─ MANUAL → Ask user
    ↓
Show ToolConfirmationMessage
    ├─ User: Approve → Execute tool
    └─ User: Reject → Skip, stop stream
    ↓
Execute tool (bash, file ops, etc.)
    ↓
Get result {output, success, error}
    ↓
Create FunctionResponse
    ↓
Add to history
    ↓
Continue stream với result
    ↓
AI xử lý result, response tiếp
```

---

## 4. ERROR HANDLING STRATEGY

### Network Errors
- **Retry**: Có (max 3 lần)
- **Backoff**: Exponential
- **User notification**: "Đang retry..."

### API Errors
- **Rate limit**: Retry sau 60s
- **Invalid API key**: Show error, stop
- **Safety block**: Show reason, stop
- **Invalid request**: Show error, stop

### Stream Errors
- **Connection lost**: Retry nếu còn retries
- **Malformed response**: Log error, skip chunk
- **Timeout**: Cancel request, show error

### Tool Execution Errors
- **Tool not found**: Show error
- **Execution failed**: Show error, continue stream
- **User rejected**: Normal flow, stop stream

---

## 5. STATE MACHINE

```
┌─────────┐
│  IDLE   │ ◄──────────────────────┐
└────┬────┘                         │
     │                              │
     │ submitQuery()               │
     ▼                              │
┌──────────────┐                   │
│  RESPONDING  │                   │
└──────┬───────┘                   │
       │                            │
       │ FunctionCall received     │
       ▼                            │
┌─────────────────────────┐       │
│ WAITING_FOR_CONFIRMATION│       │
└──────┬──────────────────┘       │
       │                            │
       ├─ Approved ────────────────┘
       │   (back to RESPONDING)
       │
       └─ Rejected ────────────────┘
           (to IDLE)
```

**State transitions**:
- `Idle → Responding`: User submit query
- `Responding → WaitingForConfirmation`: Tool needs approval
- `WaitingForConfirmation → Responding`: User approved
- `WaitingForConfirmation → Idle`: User rejected
- `Responding → Idle`: Stream completed hoặc error

---

## 6. CONTEXT OVERFLOW HANDLING

### Detection Point
**Vị trí**: GeminiClient.sendMessageStream() - TRƯỚC khi gọi API

### Threshold
**95%** của remaining tokens

**Công thức**:
```
estimatedTokens = JSON.stringify(request).length / 4
remainingTokens = tokenLimit - currentUsage
threshold = remainingTokens * 0.95

if (estimatedTokens > threshold) {
  → OVERFLOW!
}
```

### Response Options

**1. Compress History**
- Giữ 30% gần nhất
- Summarize 70% cũ bằng AI
- Replace history

**2. New Session**
- Clear toàn bộ history
- Start fresh

**3. Cancel**
- Không gửi message này
- Quay lại Idle

---

## 7. MULTI-TURN CONVERSATION FLOW

### Turn 1:
```
Request:
  contents: [
    { role: 'user', parts: [{ text: 'Xin chào' }] }
  ]

Response:
  { role: 'model', parts: [{ text: 'Chào bạn!' }] }

History sau turn 1:
  [
    { role: 'user', parts: [{ text: 'Xin chào' }] },
    { role: 'model', parts: [{ text: 'Chào bạn!' }] }
  ]
```

### Turn 2:
```
Request: (GỬI LẠI TẤT CẢ!)
  contents: [
    { role: 'user', parts: [{ text: 'Xin chào' }] },
    { role: 'model', parts: [{ text: 'Chào bạn!' }] },
    { role: 'user', parts: [{ text: 'Tên tôi là gì?' }] }
  ]

Response:
  { role: 'model', parts: [{ text: 'Bạn chưa nói tên bạn' }] }
```

**⚠️ KEY INSIGHT**: Mỗi request đều gửi TOÀN BỘ lịch sử hội thoại!

---

## 8. IDE CONTEXT INTEGRATION

### Cơ chế Diff
**Chỉ gửi thay đổi** so với request trước:

**Turn 1**:
```
ideContext: {
  openFiles: [file1.ts, file2.ts]
}
→ Gửi: "Opened: file1.ts, file2.ts"
```

**Turn 2** (user edit file1.ts):
```
ideContext: {
  openFiles: [file1.ts, file2.ts]  // file1 đã thay đổi
}
→ Gửi: "Modified: file1.ts" (chỉ gửi thay đổi!)
```

### Token Savings
- Không diff: Mỗi turn gửi tất cả files (~50K tokens)
- Có diff: Chỉ gửi thay đổi (~500 tokens)
- **Tiết kiệm**: 100x

---

## 9. PERFORMANCE CONSIDERATIONS

### Bottlenecks
1. **Token counting**: O(n) với n = độ dài JSON
2. **History serialization**: O(n) với n = số messages
3. **UI updates**: Mỗi chunk → re-render

### Optimizations
1. **Debounce UI updates**: Batch chunks mỗi 100ms
2. **Virtual scrolling**: Cho history dài
3. **Memoization**: Cache parsed messages
4. **Lazy loading**: Chỉ render visible items

---

## 10. KEY TECHNICAL INSIGHTS

### 1. Stateless API
Gemini API **không lưu** conversation history. Mỗi request phải gửi full context.

### 2. Streaming Architecture
AsyncGenerator pattern cho phép:
- Real-time updates
- Cancellation (AbortController)
- Backpressure handling

### 3. Pending/Committed Separation
Tách streaming state và final state:
- UX mượt (thấy text ngay)
- Dễ rollback nếu error
- Clean state management

### 4. Event-Driven Design
Mọi thứ là events:
- Dễ extend
- Dễ debug
- Dễ test

### 5. Defense in Depth
Multiple checkpoints:
- Validate input (bước 1)
- Check overflow (bước 3)
- Check approval (bước 6)
- Error handling (mọi bước)

---

## 📚 REFERENCES

### Files quan trọng:
- `useGeminiStream.ts:760-922` - submitQuery()
- `client.ts:476-659` - Context checks
- `geminiChat.ts:225-343` - History management
- `turn.ts:85-250` - API interaction

### Related Docs:
- **03_CONVERSATION_HISTORY.md** - Chi tiết về history
- **04_CONTEXT_OVERFLOW_HANDLING.md** - Chi tiết về overflow
- **05_UI_AND_STREAMING.md** - Chi tiết về UI
- **07_CONFIRMATION_SYSTEM.md** - Chi tiết về approval

---

**Cập nhật**: 2025-11-02
**Loại**: Mô tả kỹ thuật (technical description)
**Không bao gồm**: Implementation code
