# PLAN REFACTOR: Session Only Architecture

## 🎯 MỤC TIÊU

Refactor codebase để:
1. **Bỏ Conversation**, chỉ giữ **Session**
2. **Gộp /new và /clear** thành một `/new` với chức năng:
   - Auto-save session hiện tại với tên theo timestamp
   - Start session mới rỗng
3. **Bỏ /save command** (vì đã auto-save)
4. **Auto-save session** khi:
   - User dùng `/new`
   - User thoát application
5. **Start session mới** khi user vào app

---

## 📊 PHÂN TÍCH HIỆN TRẠNG

### Vấn đề hiện tại
```
Session (immutable Value Object)
├─ Lưu persistent: ~/.codeh/sessions/
├─ User-controlled: /save, /load
└─ Rich metadata: cost, tokens, model

Conversation (mutable Domain Model)
├─ In-memory only
├─ Runtime state
└─ Minimal metadata

→ TRÙNG CHÉO: Cả 2 đều chứa Message[], timestamps, serialization
→ DUPLICATE LOGIC: Slash commands /new và /clear làm điều tương tự
→ MANUAL PERSISTENCE: User phải nhớ /save
```

### Giải pháp
```
Session (mutable Aggregate Root)
├─ Lưu persistent: ~/.codeh/sessions/
├─ Auto-save: Khi /new hoặc exit
├─ Runtime state: Thay thế Conversation
├─ Rich metadata: cost, tokens, model
└─ Single source of truth
```

---

## 📋 DANH SÁCH TASKS

### Phase 1: Refactor Session Model (Domain Layer)
**File: `source/core/domain/valueObjects/Session.ts`**

- [ ] **Task 1.1**: Di chuyển Session từ valueObjects sang models
  - Rename file: `Session.ts` → `source/core/domain/models/Session.ts`
  - Update imports trong toàn bộ codebase

- [ ] **Task 1.2**: Chuyển Session từ immutable sang mutable
  - Bỏ `readonly` khỏi các properties
  - Convert từ Value Object sang Aggregate Root

- [ ] **Task 1.3**: Thêm mutation methods vào Session
  ```typescript
  class Session {
    // Existing properties (now mutable)
    private messages: Message[]

    // New methods
    addMessage(message: Message): void
    clear(): void
    getMessages(): Message[]
    getLastMessage(): Message | undefined
    getLastNMessages(n: number): Message[]
    getUserMessages(): Message[]
    getAssistantMessages(): Message[]

    // Token estimation (from Conversation)
    estimateTokenCount(): number
    needsCompression(maxTokens: number): boolean

    // Metadata updates
    updateMetadata(): void  // Recalculate messageCount, totalTokens
  }
  ```

- [ ] **Task 1.4**: Update Session factory methods
  ```typescript
  // New session (empty)
  static createNew(model: string): Session

  // From saved data (existing)
  static fromData(data: SessionData): Session
  ```

---

### Phase 2: Update Infrastructure Layer

**File: `source/infrastructure/session/SessionManager.ts`**

- [ ] **Task 2.1**: Thêm auto-save method
  ```typescript
  async saveWithTimestamp(session: Session): Promise<string> {
    // Generate name: session_YYYYMMDD_HHMMSS
    const name = `session_${formatTimestamp(new Date())}`
    await this.save(session.withName(name))
    return name
  }
  ```

- [ ] **Task 2.2**: Thêm method lấy latest session
  ```typescript
  async getLatest(): Promise<Session | null> {
    // List sessions, sort by updatedAt, return newest
  }
  ```

**File: `source/infrastructure/history/FileHistoryRepository.ts`**

- [ ] **Task 2.3**: Đánh dấu deprecated hoặc xóa (optional)
  - Nếu không dùng history nữa: xóa file
  - Nếu vẫn giữ cho backward compatibility: mark @deprecated

---

### Phase 3: Update Application Layer

**File: `source/core/application/services/CommandService.ts`**

- [ ] **Task 3.1**: Xóa `/save` command
  - Remove command registration
  - Remove executor implementation
  - Update tests

- [ ] **Task 3.2**: Xóa `/clear` command
  - Remove command registration
  - Remove executor implementation
  - Update aliases mapping

- [ ] **Task 3.3**: Refactor `/new` command
  ```typescript
  // Old: Just clear messages
  async execute() {
    await presenter.clearConversation()
  }

  // New: Auto-save + start new
  async execute() {
    // 1. Auto-save current session
    const savedName = await presenter.autoSaveCurrentSession()

    // 2. Start new session
    await presenter.startNewSession()

    // 3. System message
    return `Previous session saved as "${savedName}". New session started.`
  }
  ```

- [ ] **Task 3.4**: Update command descriptions
  - `/new`: "Save current session and start new one"
  - Remove `/save`, `/clear` từ documentation

**File: `source/core/application/services/CodehChat.ts`**

- [ ] **Task 3.5**: Thay Conversation bằng Session
  ```typescript
  // Old
  private conversation: Conversation

  // New
  private session: Session
  ```

- [ ] **Task 3.6**: Update methods
  - `startNewConversation()` → `startNewSession()`
  - Update `sendMessage()` để dùng `session.addMessage()`
  - Update token tracking

---

### Phase 4: Update Presentation Layer

**File: `source/cli/presenters/HomePresenter.ts`**

- [ ] **Task 4.1**: Thay state.messages bằng Session
  ```typescript
  // Old
  interface ViewState {
    messages: Message[]
    ...
  }

  // New
  interface ViewState {
    session: Session
    ...
  }
  ```

- [ ] **Task 4.2**: Implement auto-save methods
  ```typescript
  async autoSaveCurrentSession(): Promise<string> {
    if (this.state.session.getMessageCount() === 0) {
      return 'empty' // Skip empty sessions
    }

    this.state.session.updateMetadata()
    const savedName = await this.sessionManager.saveWithTimestamp(this.state.session)
    return savedName
  }

  async startNewSession(): Promise<void> {
    this.state.session = Session.createNew(this.config.model)
    this._notifyView()
  }
  ```

- [ ] **Task 4.3**: Update initialization
  ```typescript
  async initialize() {
    // Create new empty session on app start
    this.state.session = Session.createNew(this.config.model)
  }
  ```

- [ ] **Task 4.4**: Update cleanup for auto-save
  ```typescript
  async cleanup() {
    // Auto-save before exit
    await this.autoSaveCurrentSession()

    // Clear timer
    if (this.durationTimer) {
      clearInterval(this.durationTimer)
    }
  }
  ```

- [ ] **Task 4.5**: Update message handling
  - `clearConversation()` → Xóa hoặc refactor
  - `startNewConversation()` → `startNewSession()`
  - All `this.state.messages` → `this.state.session.getMessages()`

**File: `source/cli/hooks/useHomeLogic.ts`**

- [ ] **Task 4.6**: Update state interface
  ```typescript
  const [viewState, setViewState] = useState<ViewState>({
    session: Session.createNew(config.model),
    // ... other state
  })
  ```

**File: `source/cli/screens/Home.tsx`**

- [ ] **Task 4.7**: Update props and rendering
  ```typescript
  // Old
  {messages.map(msg => ...)}

  // New
  {viewState.session.getMessages().map(msg => ...)}
  ```

---

### Phase 5: Exit Handler & Lifecycle

**File: `source/cli/cli.ts` (or entry point)**

- [ ] **Task 5.1**: Implement exit handler
  ```typescript
  process.on('SIGINT', async () => {
    console.log('\nSaving session before exit...')
    await homePresenter.cleanup()  // Will auto-save
    process.exit(0)
  })

  process.on('exit', async () => {
    await homePresenter.cleanup()
  })
  ```

- [ ] **Task 5.2**: Graceful shutdown
  - Đảm bảo session được save trước khi exit
  - Handle errors during save

---

### Phase 6: Tests & Validation

- [ ] **Task 6.1**: Update unit tests
  - Session.spec.ts: Test mutation methods
  - SessionManager.spec.ts: Test auto-save with timestamp
  - CommandService.spec.ts: Remove /save, /clear tests; update /new test

- [ ] **Task 6.2**: Update integration tests
  - Test flow: Start app → Add messages → /new → Check saved
  - Test flow: Start app → Add messages → Exit → Check saved

- [ ] **Task 6.3**: Manual testing
  - [ ] Vào app → Start new session (empty)
  - [ ] Add messages → /new → Check file saved với timestamp
  - [ ] Add messages → Exit → Check file saved
  - [ ] /load session → Works correctly
  - [ ] /sessions → List all including auto-saved

---

### Phase 7: Documentation & Cleanup

- [ ] **Task 7.1**: Update user documentation
  - README.md: Remove /save, /clear
  - Document auto-save behavior
  - Update /new description

- [ ] **Task 7.2**: Code cleanup
  - Xóa Conversation.ts (nếu không dùng)
  - Xóa FileHistoryRepository.ts (nếu không dùng)
  - Remove unused imports

- [ ] **Task 7.3**: Update type definitions
  - Interfaces, types liên quan đến Conversation

---

## 🔄 LUỒNG MỚI

### User Flow: Entry
```
1. User mở app
   ↓
2. Initialize HomePresenter
   ↓
3. Create new empty Session
   session = Session.createNew(model)
   ↓
4. UI hiển thị với empty session
```

### User Flow: /new Command
```
1. User gõ "/new"
   ↓
2. Auto-save current session
   - Skip nếu empty (0 messages)
   - Name: session_YYYYMMDD_HHMMSS
   - Save to ~/.codeh/sessions/
   ↓
3. Create new Session
   session = Session.createNew(model)
   ↓
4. System message: "Previous session saved as X. New session started."
```

### User Flow: Exit
```
1. User nhấn Ctrl+C (SIGINT)
   ↓
2. Exit handler triggered
   ↓
3. Call presenter.cleanup()
   ↓
4. Auto-save current session
   - Skip nếu empty
   - Save với timestamp
   ↓
5. Clean resources
   ↓
6. Exit app
```

### User Flow: /load
```
1. User gõ "/load session_20251113_143022"
   ↓
2. Load session from file
   session = sessionManager.load(name)
   ↓
3. Replace current session
   presenter.state.session = session
   ↓
4. UI update với loaded messages
```

---

## ⚠️ LƯU Ý QUAN TRỌNG

### Breaking Changes
1. **API Changes**:
   - Session không còn immutable
   - Bỏ commands: /save, /clear
   - /new behavior thay đổi

2. **Storage Changes**:
   - Auto-generated session names với timestamp
   - ~/.codeh/history/ có thể deprecated

3. **Migration**:
   - Existing saved sessions vẫn load được (backward compatible)
   - Conversation history cũ có thể không dùng được

### Edge Cases
1. **Empty Session**: Không save nếu 0 messages
2. **Rapid /new**: Multiple saves nhanh → unique timestamps (millisecond precision)
3. **Exit Without Save**: Auto-save handler đảm bảo không mất data
4. **Load Then Exit**: Session loaded được save lại với metadata updated

### Performance
1. **Auto-save**: Async, không block UI
2. **File I/O**: Debounce nếu cần (không trong scope hiện tại)
3. **Memory**: Chỉ 1 Session active tại 1 thời điểm

---

## 📁 FILES CẦN SỬA

### Core Domain (3 files)
- [x] `source/core/domain/valueObjects/Session.ts` → Move to models/
- [x] `source/core/domain/models/Session.ts` (refactored)
- [ ] `source/core/domain/models/Conversation.ts` (deprecated/removed)

### Application Layer (2 files)
- [x] `source/core/application/services/CommandService.ts`
- [x] `source/core/application/services/CodehChat.ts`

### Infrastructure (2 files)
- [x] `source/infrastructure/session/SessionManager.ts`
- [ ] `source/infrastructure/history/FileHistoryRepository.ts` (optional cleanup)

### Presentation Layer (3 files)
- [x] `source/cli/presenters/HomePresenter.ts`
- [x] `source/cli/hooks/useHomeLogic.ts`
- [x] `source/cli/screens/Home.tsx`

### Entry Point (1 file)
- [x] `source/cli/cli.ts` (or main entry)

### Tests (multiple files)
- [ ] `source/core/domain/models/Session.spec.ts`
- [ ] `source/infrastructure/session/SessionManager.spec.ts`
- [ ] `source/core/application/services/CommandService.spec.ts`
- [ ] Integration tests

### Documentation (2 files)
- [ ] `README.md`
- [ ] `CLAUDE.md` (if needed)

---

## 🎯 DEFINITION OF DONE

### Phase 1-2: Core Refactor
- [ ] Session là mutable Aggregate Root
- [ ] Session có đầy đủ methods (addMessage, clear, etc.)
- [ ] SessionManager có saveWithTimestamp()

### Phase 3-4: Application & UI
- [ ] /new auto-save + start new
- [ ] /save, /clear bị removed
- [ ] HomePresenter dùng Session thay messages
- [ ] UI render từ session.getMessages()

### Phase 5: Lifecycle
- [ ] Auto-save khi exit (SIGINT handler)
- [ ] Start new session khi vào app
- [ ] Empty sessions không được save

### Phase 6-7: Quality
- [ ] All tests pass
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Code cleanup done

---

## 📊 RISK ASSESSMENT

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing saved sessions | HIGH | Ensure backward compatibility in Session.fromData() |
| Data loss on crash | MEDIUM | Implement robust exit handlers, consider periodic auto-save |
| Performance với frequent saves | LOW | Async save, skip empty sessions |
| User confusion với /new behavior | LOW | Clear system messages, update docs |

---

## 🚀 NEXT STEPS

1. **Review plan** với team/stakeholder
2. **Tạo branch**: `refactor/session-only-architecture`
3. **Implement từng phase** tuần tự
4. **Testing** sau mỗi phase
5. **Merge** khi hoàn thành tất cả phases

---

## ✅ APPROVAL

- [ ] Plan được review và approved
- [ ] Team đồng ý với breaking changes
- [ ] Timeline estimate: ~3-5 days (tùy theo team size)
- [ ] Ready to implement

---

**Created**: 2025-11-13
**Status**: PENDING_APPROVAL
**Estimated Effort**: 3-5 days
**Priority**: MEDIUM
