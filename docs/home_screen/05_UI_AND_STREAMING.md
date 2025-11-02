# 05. UI AND STREAMING SYSTEM

## 📋 Tổng quan

Tài liệu này mô tả **kiến trúc UI và cơ chế streaming** của codeh CLI.

---

## 1. TECH STACK

### React + Ink Framework

**React**: Component-based UI library
**Ink**: React renderer cho terminal (thay vì DOM)

**So sánh**:

| Aspect | React Web | Ink Terminal |
|--------|-----------|--------------|
| Render target | Browser DOM | Terminal |
| Layout | `<div>` | `<Box>` |
| Text | `<span>` | `<Text>` |
| Styling | CSS | Props (color, bold) |
| Input | `<input>` | `<TextInput>` |
| Events | onClick | useInput hook |

---

## 2. COMPONENT HIERARCHY

```
AppContainer (root)
  ├─ State management
  │   ├─ streamingState
  │   ├─ historyItems
  │   └─ currentInput
  │
  ├─ Hooks
  │   ├─ usecodehStream()
  │   └─ useHistoryManager()
  │
  └─ Render tree
      ├─ Header (session info)
      ├─ MainContent
      │   └─ HistoryItemDisplay (foreach item)
      │       ├─ UserMessage
      │       ├─ codehMessage
      │       ├─ ToolGroupMessage
      │       └─ ToolConfirmationMessage
      ├─ InputArea
      └─ StatusBar
```

---

## 3. STREAMING STATE MACHINE

### 3.1. Ba trạng thái

```typescript
enum StreamingState {
  Idle,                    // Sẵn sàng nhận input
  Responding,              // AI đang generate
  WaitingForConfirmation   // Đợi user approve tool
}
```

### 3.2. State Diagram

```
       ┌──────────┐
       │   Idle   │ ◄─────────────┐
       └────┬─────┘                │
            │                      │
            │ submitQuery()        │
            ▼                      │
     ┌──────────────┐             │
     │  Responding  │             │
     └──────┬───────┘             │
            │                      │
            ├──────────────────────┘
            │ (stream complete)
            │
            │ (tool call)
            ▼
 ┌──────────────────────────┐
 │ WaitingForConfirmation   │
 └──────┬───────────────────┘
        │
        ├─ Approved → back to Responding
        └─ Rejected → Idle
```

---

## 4. PENDING/COMMITTED PATTERN

### 4.1. Concept

**Mục đích**: Tách streaming state và finalized state

**Structure**:
```typescript
interface HistoryItem {
  id: string
  timestamp: number
  pending: Message | null      // Đang streaming
  committed: Message | null    // Đã hoàn thành
}
```

### 4.2. Lifecycle

**Phase 1: Start streaming**
```
HistoryItem {
  pending: { type: 'codeh', content: '' },
  committed: null
}
```

**Phase 2: During streaming**
```
HistoryItem {
  pending: { type: 'codeh', content: 'Xin ch...' },  // Update real-time
  committed: null
}
```

**Phase 3: Stream complete**
```
HistoryItem {
  pending: null,
  committed: { type: 'codeh', content: 'Xin chào!' }  // Final
}
```

### 4.3. Benefits

1. **Clean rollback**: Discard pending nếu error
2. **Smooth UX**: User thấy text appear real-time
3. **Clear state**: Biết rõ đang streaming hay đã xong
4. **Easy testing**: Mock pending/committed states

---

## 5. REAL-TIME UPDATES

### 5.1. Update Flow

```
API chunk received
    ↓
Event: TextChunk { text: "xin " }
    ↓
Update pending:
  pending.content += "xin "
    ↓
React re-render
    ↓
Terminal displays new text
```

### 5.2. Update Frequency

**Options**:

| Strategy | Frequency | CPU Usage | UX |
|----------|-----------|-----------|-----|
| Every chunk | ~10-50ms | High | Smooth |
| Debounced | ~100-200ms | Medium | Good |
| Batched | ~500ms | Low | Laggy |

**codeh CLI choice**: Every chunk (smooth UX priority)

**Alternative for performance**:
- Debounce updates to 100ms
- Batch multiple chunks
- Only re-render changed components (React.memo)

---

## 6. EVENT PROCESSING LOOP

### 6.1. Event Types

```
TextChunk      → Append text to message
CodeBlock      → Add code block part
ToolCallRequest → Show approval dialog
ToolCallResult  → Display tool output
TurnComplete   → Finalize message
Error          → Show error, cleanup
```

### 6.2. Processing Pattern

```
for await (const event of stream) {
  switch (event.type) {

    case 'TextChunk':
      currentMessage.content += event.text
      updateUI(currentMessage)

    case 'ToolCallRequest':
      state = WaitingForConfirmation
      approved = await showDialog(event.tool)
      if (approved) {
        result = executeTool(event.tool)
        state = Responding
      } else {
        state = Idle
        break
      }

    case 'TurnComplete':
      commitMessage(currentMessage)
      state = Idle

    case 'Error':
      showError(event.error)
      state = Idle
      break
  }
}
```

---

## 7. UI COMPONENTS

### 7.1. AppContainer
**Vai trò**: Root component, state management

**Responsibilities**:
- Initialize hooks (usecodehStream, useHistoryManager)
- Handle user input
- Manage keyboard shortcuts
- Pass state to children

### 7.2. MainContent
**Vai trò**: Display conversation history

**Responsibilities**:
- Map historyItems to components
- Auto-scroll to bottom
- Show loading indicator

### 7.3. HistoryItemDisplay
**Vai trò**: Render single message

**Responsibilities**:
- Determine message type
- Show pending vs committed
- Render appropriate component (UserMessage/codehMessage/etc.)

### 7.4. Message Types

**UserMessage**: User's input
**codehMessage**: AI response (with streaming support)
**ToolGroupMessage**: Tool calls và results
**ToolConfirmationMessage**: Approval dialog
**ErrorMessage**: Errors
**SystemMessage**: System notifications

---

## 8. KEYBOARD SHORTCUTS

### Standard Shortcuts

| Key | Action |
|-----|--------|
| Enter | Submit message |
| Ctrl+C | Cancel streaming / Exit app |
| Ctrl+L | Clear screen |
| Ctrl+U | Clear input |
| ↑ | Previous command (history) |
| ↓ | Next command (history) |

### During Tool Confirmation

| Key | Action |
|-----|--------|
| y | Approve |
| n | Reject |
| ← → | Navigate options |
| Enter | Confirm selection |

---

## 9. STATUS BAR

### 9.1. Information Displayed

```
[●] Ready | Model: codeh-1.5-pro | Tokens: 45.2K / 2M (2.3%)
```

**Components**:
1. **State indicator**: Color-coded dot (green/yellow/red)
2. **State text**: "Ready" / "Responding..." / "Waiting for approval"
3. **Model**: Current model name
4. **Token usage**: Current / Limit (percentage)

### 9.2. State Colors

| State | Color | Dot |
|-------|-------|-----|
| Idle | Green | ● |
| Responding | Yellow | ● |
| WaitingForConfirmation | Cyan | ● |
| Error | Red | ● |

---

## 10. STREAMING SPINNER

### 10.1. Purpose
Visual feedback khi AI đang generate response

### 10.2. Patterns

```
dots:    ⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏
line:    - \\ | /
dots2:   ⣾ ⣽ ⣻ ⢿ ⡿ ⣟ ⣯ ⣷
arc:     ◜ ◠ ◝ ◞ ◡ ◟
```

**codeh CLI choice**: `dots`

---

## 11. PERFORMANCE OPTIMIZATIONS

### 11.1. React.memo
**Purpose**: Prevent unnecessary re-renders

**Apply to**:
- HistoryItemDisplay (only re-render if item changed)
- Non-streaming messages (committed items)

### 11.2. Virtual Scrolling
**Purpose**: Handle very long histories (100+ messages)

**Approach**: Only render visible items + buffer

### 11.3. Debouncing
**Purpose**: Reduce re-render frequency

**Apply to**: Streaming text updates (batch every 100ms)

### 11.4. Lazy Rendering
**Purpose**: Improve initial load time

**Approach**: Render above-fold first, rest on demand

---

## 12. ERROR HANDLING UI

### 12.1. Error Display

```
┌─────────────────────────────────────┐
│ ❌ Error                             │
│                                      │
│ Network connection failed            │
│                                      │
│ [Retry] [Cancel]                    │
└─────────────────────────────────────┘
```

### 12.2. Error Types

**Network Error**: Show retry button
**API Error**: Show error message, no retry
**Stream Error**: Show partial result + error
**Tool Error**: Show error, continue stream

---

## 13. MULTI-LINE INPUT

### 13.1. Problem
TextInput component chỉ hỗ trợ single-line

### 13.2. Solutions

**Option 1**: External editor
- Press `Ctrl+E` → Open editor (vim/nano)
- User edits → Save → Return to CLI

**Option 2**: Custom multi-line component
- Shift+Enter: New line
- Enter: Submit
- Display multiple lines in terminal

**codeh CLI choice**: Single-line (simplicity)

---

## 14. KEY TECHNICAL INSIGHTS

### 1. Component-Based Architecture
React patterns work well cho terminal UI

### 2. Streaming = AsyncGenerator
Perfect fit cho real-time updates với backpressure

### 3. Pending/Committed Pattern
Essential cho smooth streaming UX

### 4. State Machine
Clear state transitions prevent bugs

### 5. Event-Driven
Decouple streaming logic và UI updates

---

## 📚 REFERENCES

### Files quan trọng:
- `AppContainer.tsx:50-250` - Root component
- `MainContent.tsx:20-150` - History display
- `usecodehStream.ts:50-900` - Streaming hook
- `useHistoryManager.ts:10-150` - History management

### Related Docs:
- **02_PROMPT_PROCESSING_FLOW.md** - Event processing
- **03_CONVERSATION_HISTORY.md** - History structure
- **07_CONFIRMATION_SYSTEM.md** - Tool approval UI

---

**Cập nhật**: 2025-11-02
**Loại**: Mô tả kỹ thuật (technical description)
**Không bao gồm**: React implementation code
