## 📚 DANH MỤC TÀI LIỆU

### **Phần 1: Tổng Quan**
- [`01_ARCHITECTURE_OVERVIEW.md`](./01_ARCHITECTURE_OVERVIEW.md)
  - Kiến trúc tổng thể
  - Layer architecture
  - Tech stack và dependencies
  - Các khái niệm cốt lõi

### **Phần 2: Core Flow - Xử Lý Prompt**
- [`02_PROMPT_PROCESSING_FLOW.md`](./02_PROMPT_PROCESSING_FLOW.md)
  - Flow xử lý từ user input đến kết quả
  - Entry point và initialization
  - submitQuery() chi tiết
  - codehClient.sendMessageStream()
  - Streaming và event processing
  - **Implementation checklist cho CodeH**

### **Phần 3: Quản Lý Conversation History**
- [`03_CONVERSATION_HISTORY.md`](./03_CONVERSATION_HISTORY.md)
  - Cách gửi prompt: Đơn lẻ hay toàn bộ history?
  - Data structures cho history
  - History management hooks
  - Curated history (lọc IDE context)
  - **Implementation checklist cho CodeH**

### **Phần 4: Xử Lý Context Overflow & Token Limits**
- [`04_CONTEXT_OVERFLOW_HANDLING.md`](./04_CONTEXT_OVERFLOW_HANDLING.md)
  - Detect context overflow
  - Chat compression algorithm
  - IDE context diff management
  - Token counting và estimation
  - Max session turns
  - **Implementation checklist cho CodeH**

### **Phần 5: UI System & Streaming Display**
- [`05_UI_AND_STREAMING.md`](./05_UI_AND_STREAMING.md)
  - React + Ink architecture
  - Component hierarchy
  - Streaming state management
  - History display components
  - Real-time updates
  - **Implementation checklist cho CodeH**

### **Phần 6: Diff Rendering System**
- [`06_DIFF_RENDERING.md`](./06_DIFF_RENDERING.md)
  - Parse unified diff format
  - Syntax highlighting
  - Terminal rendering với colors
  - Context lines và gap handling
  - IDE integration
  - **Implementation checklist cho CodeH**

### **Phần 7: Confirmation & Permission System**
- [`07_CONFIRMATION_SYSTEM.md`](./07_CONFIRMATION_SYSTEM.md)
  - Tool confirmation flow
  - StreamingState.WaitingForConfirmation
  - Confirmation dialog UI
  - Approval modes (manual/auto/always)
  - Trusted folders
  - Dangerous command detection
  - **Implementation checklist cho CodeH**

### **Phần 8: Data Structures & Interfaces**
- [`08_DATA_STRUCTURES.md`](./08_DATA_STRUCTURES.md)
  - Part, Content, Message types
  - StreamEvent types
  - HistoryItem structure
  - ToolCall types
  - Confirmation request types

### **Phần 9: Implementation Roadmap cho CodeH**
- [`09_IMPLEMENTATION_ROADMAP.md`](./09_IMPLEMENTATION_ROADMAP.md)
  - Phase 1: Core architecture
  - Phase 2: Basic prompt processing
  - Phase 3: History management
  - Phase 4: Context overflow
  - Phase 5: UI & Streaming
  - Phase 6: Diff rendering
  - Phase 7: Confirmation system
  - Testing strategy
  - Migration từ code hiện tại

---

## 🎯 CÁCH SỬ DỤNG TÀI LIỆU NÀY

### 1. **Đọc Tuần Tự** (Recommended cho lần đầu)
Đọc theo thứ tự từ 01 → 09 để hiểu toàn bộ kiến trúc và flow.

### 2. **Đọc Theo Feature** (Khi implement từng phần)
Chọn tài liệu tương ứng với feature đang implement:
- Đang làm streaming? → Đọc phần 05
- Đang làm diff? → Đọc phần 06
- Đang làm confirmation? → Đọc phần 07

### 3. **Reference Nhanh**
Mỗi tài liệu có:
- **Quick Reference**: Tóm tắt các điểm chính ở đầu
- **Code Examples**: Ví dụ code cụ thể từ codeh CLI
- **Implementation Notes**: Lưu ý khi clone sang CodeH
- **Checklist**: Danh sách công việc cần làm

---

## 📊 TỔNG QUAN CÁC FEATURES CHÍNH

| Feature | Complexity | Priority | Phụ thuộc |
|---------|-----------|----------|-----------|
| **Prompt Processing** | Medium | ✅ Must | None |
| **Conversation History** | Low | ✅ Must | Prompt Processing |
| **Context Overflow** | High | 🔶 Should | History |
| **UI Streaming** | Medium | ✅ Must | Prompt Processing |
| **Diff Rendering** | Medium | 🔶 Should | UI Streaming |
| **Confirmation System** | High | 🔶 Should | UI Streaming |

---

## 🔍 TÌM KIẾM NHANH

### Keywords Index

**Architecture:**
- Layer architecture → 01
- Monorepo structure → 01
- Tech stack → 01

**Flow:**
- Prompt processing → 02
- submitQuery → 02
- Stream events → 02, 05

**History:**
- Conversation history → 03
- Gửi toàn bộ hay đơn lẻ? → 03
- History manager → 03

**Context:**
- Context overflow → 04
- Compression → 04
- Token limits → 04

**UI:**
- Streaming display → 05
- React components → 05
- History rendering → 05

**Diff:**
- Diff rendering → 06
- Syntax highlighting → 06

**Confirmation:**
- Permission system → 07
- Approval modes → 07
- Trusted folders → 07

**Data:**
- Types & Interfaces → 08
- Message formats → 08

**Implementation:**
- Roadmap → 09
- Checklists → All documents

---

## 📞 HỖ TRỢ

### Source Code Reference:
- **codeh CLI GitHub**: https://github.com/google/codeh-cli

### Key Files To Reference:
```
packages/cli/src/
├── codeh.tsx                          # Entry point
├── ui/
│   ├── AppContainer.tsx                # Main UI container
│   ├── hooks/
│   │   ├── usecodehStream.ts          # Core streaming logic ⭐
│   │   └── useHistoryManager.ts        # History management ⭐
│   └── components/
│       ├── MainContent.tsx             # History display
│       └── messages/
│           ├── DiffRenderer.tsx        # Diff rendering ⭐
│           └── ToolConfirmationMessage.tsx  # Confirmation ⭐

packages/core/src/
└── core/
    ├── client.ts                       # codehClient ⭐
    ├── codehChat.ts                   # Chat management ⭐
    └── turn.ts                         # Turn execution
```
