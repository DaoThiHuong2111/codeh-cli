# 🚀 Phase 1: Core Features Implementation Guide (v1.1.0)

> **Part 6/8** | [← Prev: Infrastructure](./05-layer3-infrastructure.md) | [Next: Phase 2 Features →](./07-phase2-advanced-ux.md)

---

## 📋 Phase 1 Overview

**Objective**: Implement 4 core features để match với docs và Gemini CLI

**Timeline**: 2-3 weeks

**Priority**: 🔴 CRITICAL

---

## 🎯 Phase 1 Features

### 1. Conversation History Display
### 2. Slash Commands System
### 3. Streaming Responses
### 4. Session Persistence

---

## 🔷 Feature 1: Conversation History Display

**Priority**: 🔴 HIGH | **Effort**: 3-4 days

### Objective
Hiển thị toàn bộ conversation history thay vì chỉ output cuối cùng.

### Components Required
- ✅ MessageBubble component
- ✅ ConversationArea component
- ✅ Message model (enhanced)
- ✅ Conversation model (enhanced)

### Implementation Steps

#### Step 1: Enhance Domain Models (Day 1)
```bash
# Files to modify:
- source/core/domain/models/Message.ts
- source/core/domain/models/Conversation.ts
```

**Tasks**:
- [ ] Add MessageFactory to Message.ts
- [ ] Add metadata support (tokens, duration)
- [ ] Enhance Conversation with message management methods
- [ ] Add serialization methods

#### Step 2: Create UI Components (Day 2)
```bash
# Files to create:
- source/cli/components/molecules/MessageBubble.tsx
- source/cli/components/organisms/ConversationArea.tsx
- source/cli/components/atoms/Spinner.tsx
```

**Tasks**:
- [ ] Create MessageBubble with role-based styling
- [ ] Create ConversationArea container
- [ ] Handle empty state
- [ ] Add loading indicator

#### Step 3: Update HomePresenter (Day 2-3)
```bash
# File to modify:
- source/cli/presenters/HomePresenter.ts
```

**Tasks**:
- [ ] Change state from `output: string` to `messages: Message[]`
- [ ] Update handleSubmit để add messages
- [ ] Track streaming message ID
- [ ] Update getViewState()

#### Step 4: Update Home Screen (Day 3)
```bash
# File to modify:
- source/cli/screens/Home.tsx
```

**Tasks**:
- [ ] Replace output display with ConversationArea
- [ ] Pass messages array
- [ ] Handle streaming state
- [ ] Test full flow

### Testing Checklist
- [ ] Messages hiển thị theo đúng order (oldest → newest)
- [ ] Timestamps hiển thị chính xác
- [ ] Colors đúng cho từng role
- [ ] Empty state hiển thị khi chưa có messages
- [ ] Auto-scroll to latest message
- [ ] Token count hiển thị (nếu có metadata)

### Success Criteria
✅ Users có thể xem full conversation history
✅ Messages phân biệt rõ ràng user vs assistant
✅ Timestamps hiển thị cho mỗi message
✅ UI clean và dễ đọc

---

## 🔷 Feature 2: Slash Commands System

**Priority**: 🔴 HIGH | **Effort**: 2-3 days

### Objective
Implement 6 slash commands với autocomplete suggestions.

### Components Required
- ✅ Command value object
- ✅ CommandService
- ✅ SlashSuggestions component
- ✅ CommandMenuItem component

### Commands to Implement
1. `/help` - Show help overlay
2. `/clear` - Clear conversation
3. `/new` - Start new conversation
4. `/save [name]` - Save session
5. `/load [name]` - Load session
6. `/sessions` - List sessions

### Implementation Steps

#### Step 1: Create Domain Objects (Day 1)
```bash
# Files to create:
- source/core/domain/valueObjects/Command.ts
- source/core/domain/interfaces/ICommandRegistry.ts
```

**Tasks**:
- [ ] Define Command value object
- [ ] Define ICommandRegistry interface
- [ ] Add CommandCategory enum
- [ ] Add ICommandExecutor interface

#### Step 2: Create CommandService (Day 1-2)
```bash
# File to create:
- source/core/application/services/CommandService.ts
```

**Tasks**:
- [ ] Implement ICommandRegistry
- [ ] Register 6 default commands
- [ ] Implement filter() method
- [ ] Add command execution logic

#### Step 3: Create UI Components (Day 2)
```bash
# Files to create:
- source/cli/components/molecules/CommandMenuItem.tsx
- source/cli/components/organisms/SlashSuggestions.tsx
```

**Tasks**:
- [ ] Create CommandMenuItem với selection highlight
- [ ] Create SlashSuggestions với filtering
- [ ] Add keyboard navigation (↑↓)

#### Step 4: Update HomePresenter (Day 2-3)
```bash
# File to modify:
- source/cli/presenters/HomePresenter.ts
```

**Tasks**:
- [ ] Add CommandService dependency
- [ ] Add suggestion state (filteredSuggestions, selectedIndex)
- [ ] Implement handleSuggestionNavigate()
- [ ] Implement handleSuggestionSelect()
- [ ] Update handleSubmit để check slash commands

#### Step 5: Update Home Screen (Day 3)
```bash
# File to modify:
- source/cli/screens/Home.tsx
```

**Tasks**:
- [ ] Add SlashSuggestions component
- [ ] Add global keyboard handlers (↑↓)
- [ ] Conditional rendering based on input
- [ ] Test command execution

### Testing Checklist
- [ ] Typing `/` hiển thị suggestions
- [ ] Suggestions filter theo input
- [ ] ↑↓ navigation hoạt động
- [ ] Enter/Tab select command
- [ ] Commands execute correctly
- [ ] Error messages hiển thị cho invalid commands

### Success Criteria
✅ 6 commands hoạt động đầy đủ
✅ Autocomplete suggestions hiển thị và filter
✅ Keyboard navigation smooth
✅ Commands execute và show results

---

## 🔷 Feature 3: Streaming Responses

**Priority**: 🔴 HIGH | **Effort**: 3-4 days

### Objective
Responses xuất hiện progressively thay vì all at once.

### Components Required
- ✅ StreamHandler (hoặc integrate vào CodehClient)
- ✅ API clients với streaming support
- ✅ StreamingIndicator component

### Implementation Steps

#### Step 1: Add Streaming Interface (Day 1)
```bash
# Files to create/modify:
- source/core/domain/interfaces/IStreamHandler.ts
- source/core/domain/interfaces/IApiClient.ts (enhance)
```

**Tasks**:
- [ ] Define IStreamHandler interface
- [ ] Add executeStream() to IApiClient
- [ ] Define StreamChunk type

#### Step 2: Implement in API Clients (Day 1-2)
```bash
# Files to modify:
- source/infrastructure/api/clients/AnthropicClient.ts
- source/infrastructure/api/clients/OpenAIClient.ts
- source/infrastructure/api/clients/OllamaClient.ts
```

**Tasks**:
- [ ] Add executeStream() to AnthropicClient
- [ ] Add executeStream() to OpenAIClient
- [ ] Add executeStream() to OllamaClient
- [ ] Test streaming với mỗi provider

#### Step 3: Update CodehClient (Day 2-3)
```bash
# File to modify:
- source/core/application/CodehClient.ts
```

**Tasks**:
- [ ] Implement IStreamHandler
- [ ] Add executeStream() method
- [ ] Add buffer logic (50-100ms batching)
- [ ] Add cancel() method
- [ ] Handle errors during streaming

#### Step 4: Update HomePresenter (Day 3)
```bash
# File to modify:
- source/cli/presenters/HomePresenter.ts
```

**Tasks**:
- [ ] Update handleSubmit để use streaming
- [ ] Create assistant message trước khi stream
- [ ] Update content as chunks arrive
- [ ] Track streamingMessageId
- [ ] Clear streaming state when done

#### Step 5: Update UI (Day 3-4)
```bash
# Files to modify:
- source/cli/components/atoms/Spinner.tsx (add StreamingIndicator)
- source/cli/components/molecules/MessageBubble.tsx
- source/cli/screens/Home.tsx
```

**Tasks**:
- [ ] Add streaming indicator (▌) to MessageBubble
- [ ] Show indicator when isStreaming=true
- [ ] Disable input during streaming
- [ ] Test streaming animation

### Testing Checklist
- [ ] Streaming hoạt động với Anthropic
- [ ] Streaming hoạt động với OpenAI
- [ ] Streaming hoạt động với Ollama
- [ ] Text appears progressively
- [ ] Streaming indicator hiển thị
- [ ] Input disabled during streaming
- [ ] Errors handled gracefully
- [ ] Cancel hoạt động (nếu implement)

### Success Criteria
✅ Responses stream realtime
✅ Latency < 100ms per chunk
✅ Smooth animation
✅ Error handling robust

---

## 🔷 Feature 4: Session Persistence

**Priority**: 🔴 HIGH | **Effort**: 2-3 days

### Objective
Save và load conversations để continue later.

### Components Required
- ✅ Session value object
- ✅ ISessionManager interface
- ✅ FileSessionManager implementation

### Implementation Steps

#### Step 1: Create Domain Objects (Day 1)
```bash
# Files to create:
- source/core/domain/valueObjects/Session.ts
- source/core/domain/interfaces/ISessionManager.ts
```

**Tasks**:
- [ ] Define Session value object
- [ ] Define ISessionManager interface
- [ ] Add SessionInfo type
- [ ] Add serialization methods

#### Step 2: Implement FileSessionManager (Day 1-2)
```bash
# File to create:
- source/infrastructure/session/SessionManager.ts
```

**Tasks**:
- [ ] Implement save() method
- [ ] Implement load() method
- [ ] Implement list() method
- [ ] Implement delete() method
- [ ] Create ~/.codeh/sessions directory
- [ ] Handle file I/O errors

#### Step 3: Update DI Container (Day 2)
```bash
# File to modify:
- source/core/di/Container.ts
```

**Tasks**:
- [ ] Register ISessionManager
- [ ] Bind to FileSessionManager
- [ ] Inject into HomePresenter

#### Step 4: Update HomePresenter (Day 2)
```bash
# File to modify:
- source/cli/presenters/HomePresenter.ts
```

**Tasks**:
- [ ] Add SessionManager dependency
- [ ] Implement saveSession() method
- [ ] Implement loadSession() method
- [ ] Update commands to use session methods

#### Step 5: Update Commands (Day 3)
```bash
# File to modify:
- source/core/application/services/CommandService.ts
```

**Tasks**:
- [ ] Verify `/save [name]` command
- [ ] Verify `/load [name]` command
- [ ] Verify `/sessions` command
- [ ] Add error handling
- [ ] Add success messages

### Testing Checklist
- [ ] `/save session-name` saves to file
- [ ] `/load session-name` restores conversation
- [ ] `/sessions` lists all saved sessions
- [ ] Session files created in correct directory
- [ ] Metadata saved correctly (tokens, cost, count)
- [ ] Load handles missing sessions gracefully
- [ ] Overwrite confirmation (optional)

### Success Criteria
✅ Sessions save to ~/.codeh/sessions/
✅ Sessions load correctly
✅ Metadata preserved (tokens, messages, todos)
✅ List shows all sessions with info
✅ Save/load < 500ms

---

## 📊 Phase 1 Summary

### Total Effort Breakdown

| Feature | Days | Priority |
|---------|------|----------|
| Conversation History | 3-4 | 🔴 |
| Slash Commands | 2-3 | 🔴 |
| Streaming Responses | 3-4 | 🔴 |
| Session Persistence | 2-3 | 🔴 |
| **Total** | **10-14 days** | **2-3 weeks** |

### Files Created/Modified

**New Files**: ~15 files
**Modified Files**: ~8 files
**Total New Lines**: ~1800 lines

### Dependencies
```json
{
  "ink-spinner": "^5.0.0"
}
```

### Testing Requirements
- Unit tests cho tất cả new components
- Integration tests cho presenter
- E2E tests cho slash commands
- Streaming tests với mock API
- Session save/load tests

---

## 🎯 Phase 1 Success Criteria

✅ Full conversation history hiển thị
✅ 6 slash commands hoạt động
✅ Streaming responses realtime
✅ Session save/load < 500ms
✅ 0 critical bugs
✅ Test coverage > 70%

---

## 🔗 Navigation

[← Prev: Infrastructure](./05-layer3-infrastructure.md) | [Next: Phase 2 Features →](./07-phase2-advanced-ux.md)

---

**Last Updated**: 2025-01-08
**Phase**: v1.1.0 (Critical)
**Timeline**: 2-3 weeks
