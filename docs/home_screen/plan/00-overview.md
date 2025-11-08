# 🎯 Tổng Quan Implementation Plan - Home Screen

> **Version**: 1.0.0
> **Created**: 2025-01-08
> **Purpose**: Kế hoạch chi tiết để implement đầy đủ Home Screen theo tài liệu

---

## 📋 Mục Tiêu

Implement Home Screen từ **MVP hiện tại (v1.0.0)** lên **đầy đủ chức năng (v1.2.0)** theo đúng:
- ✅ Clean Architecture 3 layers
- ✅ Tài liệu functional và technical đã viết
- ✅ Roadmap đã định nghĩa
- ✅ Best practices từ Gemini CLI

---

## 🏗️ Nguyên Tắc Kiến Trúc

### Clean Architecture 3 Layers

```
┌─────────────────────────────────────────────────────────────┐
│ LAYER 1: CLI (Presentation)                                 │
│ ├── components/                                             │
│ │   ├── atoms/        (Logo, Icon, Text, etc.)            │
│ │   ├── molecules/    (InputBox, MessageBubble, etc.)     │
│ │   └── organisms/    (ConversationArea, TodosDisplay)    │
│ ├── screens/         (Home.tsx)                            │
│ ├── presenters/      (HomePresenter.ts)                    │
│ └── hooks/           (useHomeLogic.ts)                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ LAYER 2: Core (Business Logic)                              │
│ ├── domain/                                                 │
│ │   ├── models/       (Message, Conversation, etc.)       │
│ │   ├── valueObjects/ (Todo, Command, etc.)               │
│ │   └── interfaces/   (ISessionManager, IStreamHandler)   │
│ └── application/                                            │
│     ├── CodehClient.ts   (Orchestrator)                    │
│     ├── CodehChat.ts     (Conversation manager)            │
│     └── services/        (CommandService, etc.)            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ LAYER 3: Infrastructure (External Services)                 │
│ ├── api/            (API clients)                          │
│ ├── session/        (SessionManager - NEW)                 │
│ ├── streaming/      (StreamHandler - NEW)                  │
│ └── history/        (HistoryRepository)                     │
└─────────────────────────────────────────────────────────────┘
```

### Dependency Rule
- **Inward Only**: Layer 1 → Layer 2 → Layer 3
- **No Reverse**: Layer 3 KHÔNG được phụ thuộc Layer 2 hoặc 1
- **Interface Abstraction**: Layer 2 định nghĩa interfaces, Layer 3 implements

---

## 📊 Hiện Trạng (v1.0.0)

### ✅ Đã Có
| Component/File | Location | Status | Lines |
|----------------|----------|--------|-------|
| Home.tsx | `source/cli/screens/` | ✅ | 64 |
| HomePresenter.ts | `source/cli/presenters/` | ✅ | 90 |
| useHomeLogic.ts | `source/cli/hooks/` | ✅ | 112 |
| Logo.tsx | `source/cli/components/atoms/` | ✅ | ~30 |
| InfoSection.tsx | `source/cli/components/molecules/` | ✅ | 31 |
| TipsSection.tsx | `source/cli/components/molecules/` | ✅ | 32 |
| InputBox.tsx | `source/cli/components/molecules/` | ✅ | 89 |
| CodehClient.ts | `source/core/application/` | ✅ | ~300 |
| CodehChat.ts | `source/core/application/` | ✅ | ~200 |

### ❌ Chưa Có (Cần Implement)
| Component/Feature | Priority | Phase |
|-------------------|----------|-------|
| ConversationArea | 🔴 HIGH | v1.1 |
| MessageBubble | 🔴 HIGH | v1.1 |
| SlashSuggestions | 🔴 HIGH | v1.1 |
| CommandRegistry | 🔴 HIGH | v1.1 |
| StreamHandler | 🔴 HIGH | v1.1 |
| SessionManager | 🔴 HIGH | v1.1 |
| TodosDisplay | 🟡 MEDIUM | v1.2 |
| Footer | 🟡 MEDIUM | v1.2 |
| HelpOverlay | 🟡 MEDIUM | v1.2 |
| Markdown Renderer | 🟡 MEDIUM | v1.2 |

---

## 🗂️ Cấu Trúc Plan Files

Plan được chia thành **8 files** để dễ đọc và maintain:

### 1. **00-overview.md** (File này)
- Tổng quan strategy
- Kiến trúc tổng thể
- Roadmap và timeline

### 2. **01-layer1-cli-components.md**
- **Atoms**: Logo (✅ có rồi)
- **Molecules**:
  - InputBox (✅ enhance)
  - MessageBubble (❌ mới)
- **Organisms**:
  - ConversationArea (❌ mới)
  - SlashSuggestions (❌ mới)
  - TodosDisplay (❌ mới)
  - Footer (❌ mới)
  - HelpOverlay (❌ mới)

### 3. **02-layer1-screens-presenters.md**
- **Home.tsx**: Refactor để integrate các components mới
- **HomePresenter.ts**: Enhance với state mới và methods mới
- **useHomeLogic.ts**: Enhance hooks

### 4. **03-layer2-domain-models.md**
- **Models**:
  - Message model (enhance existing)
  - Conversation model (enhance)
- **Value Objects**:
  - Todo (mới)
  - Command (mới)
- **Interfaces**:
  - ISessionManager (mới)
  - IStreamHandler (mới)
  - ICommandRegistry (mới)

### 5. **04-layer2-application-services.md**
- **CodehClient**: Thêm streaming support
- **CodehChat**: Enhance conversation management
- **Services**:
  - CommandService (mới)
  - MarkdownService (mới)

### 6. **05-layer3-infrastructure.md**
- **SessionManager**: Save/Load sessions
- **StreamHandler**: Streaming responses
- **HistoryRepository**: Enhance existing

### 7. **06-phase1-core-features.md**
- Implementation details cho Phase 1 (v1.1)
- 4 features chính:
  1. Conversation History Display
  2. Slash Commands
  3. Streaming Responses
  4. Session Persistence

### 8. **07-phase2-advanced-ux.md**
- Implementation details cho Phase 2 (v1.2)
- 6 features:
  1. Keyboard Shortcuts
  2. Markdown Rendering
  3. Todos Display
  4. Enhanced Footer
  5. Help Overlay
  6. Character Counter

### 9. **08-testing-strategy.md**
- Unit tests
- Integration tests
- E2E tests
- Test coverage targets

---

## 🚀 Roadmap & Timeline

### Phase 1: Core Features (v1.1.0) - **2-3 weeks**
**Objective**: Match với docs cơ bản và Gemini CLI core

| Feature | Effort | Priority | Dependencies |
|---------|--------|----------|--------------|
| Conversation History | 3-4 days | 🔴 | MessageBubble, ConversationArea |
| Slash Commands | 2-3 days | 🔴 | CommandRegistry, SlashSuggestions |
| Streaming Responses | 3-4 days | 🔴 | StreamHandler |
| Session Persistence | 2-3 days | 🔴 | SessionManager |

**Deliverables**:
- ✅ Hiển thị full conversation history
- ✅ 6 slash commands hoạt động
- ✅ Streaming realtime
- ✅ Save/Load sessions

---

### Phase 2: Advanced UX (v1.2.0) - **3-4 weeks**
**Objective**: Rich UX và unique features

| Feature | Effort | Priority | Dependencies |
|---------|--------|----------|--------------|
| Keyboard Shortcuts | 2 days | 🟡 | Input history tracking |
| Markdown Rendering | 3-4 days | 🟡 | ink-markdown or custom |
| Todos Display | 2-3 days | 🟡 | TodosDisplay component |
| Enhanced Footer | 1-2 days | 🟡 | Token tracking |
| Help Overlay | 1-2 days | 🟡 | HelpOverlay component |
| Character Counter | 1 day | 🟢 | InputBox enhance |

**Deliverables**:
- ✅ Beautiful markdown + syntax highlighting
- ✅ Todos tracking (unique!)
- ✅ Comprehensive help system
- ✅ Full keyboard navigation

---

## 📏 Constraints & Guidelines

### Code Quality
- **File Size**: Mỗi file < 500 lines
- **Component Size**: < 200 lines
- **Function Size**: < 50 lines
- **Test Coverage**: > 70%

### Architecture Rules
1. **Không phá vỡ Clean Architecture**
   - Components KHÔNG gọi trực tiếp infrastructure
   - Sử dụng DI container cho dependencies

2. **Single Responsibility**
   - Mỗi component/class có 1 trách nhiệm duy nhất

3. **Open/Closed Principle**
   - Mở rộng qua interfaces, không sửa code cũ

4. **Dependency Inversion**
   - Phụ thuộc vào abstractions (interfaces), không concrete

### TypeScript Standards
```typescript
// ✅ GOOD
interface ISessionManager {
  save(session: Session): Promise<void>
  load(id: string): Promise<Session>
}

class FileSessionManager implements ISessionManager {
  // Implementation
}

// ❌ BAD - Tight coupling
class Home {
  private sessionManager = new FileSessionManager()
}
```

---

## 🔍 Key Implementation Patterns

### 1. MVP Pattern (Đã dùng)
```typescript
// Presenter (Business Logic)
class HomePresenter {
  private state: ViewState

  handleInput(input: string) {
    // Business logic
    this._notifyView()
  }
}

// View (UI)
const Home = () => {
  const presenter = useHomeLogic()
  return <Box>{presenter.messages.map(...)}</Box>
}
```

### 2. Observer Pattern (Cho state updates)
```typescript
class HomePresenter {
  private viewUpdateCallback?: () => void

  setViewUpdateCallback(callback: () => void) {
    this.viewUpdateCallback = callback
  }

  private _notifyView() {
    this.viewUpdateCallback?.()
  }
}
```

### 3. Strategy Pattern (Cho commands)
```typescript
interface ICommand {
  execute(args: string[]): Promise<void>
}

class ClearCommand implements ICommand {
  async execute() {
    // Clear conversation
  }
}
```

### 4. Factory Pattern (Cho components)
```typescript
const MessageBubbleFactory = {
  create(message: Message) {
    switch(message.role) {
      case 'user': return <UserMessage {...} />
      case 'assistant': return <AssistantMessage {...} />
      case 'error': return <ErrorMessage {...} />
    }
  }
}
```

---

## 📈 Success Metrics

### Phase 1 (v1.1)
- [ ] Conversation history hiển thị đúng với timestamps
- [ ] 6 slash commands hoạt động (help, clear, new, save, load, sessions)
- [ ] Streaming latency < 100ms
- [ ] Session save/load < 500ms
- [ ] Test coverage > 70%
- [ ] 0 critical bugs

### Phase 2 (v1.2)
- [ ] Markdown rendering 100% responses
- [ ] Todos tracking hoạt động
- [ ] Help accessible trong 1 keystroke
- [ ] Stats update realtime
- [ ] User satisfaction > 8/10

---

## 🛠️ Development Workflow

### 1. Chuẩn Bị (Setup)
```bash
# Checkout branch
git checkout feature/home-screen

# Install dependencies (nếu cần thêm)
npm install ink-markdown highlight.js

# Run tests
npm test
```

### 2. Development Cycle
```
Đọc plan file → Implement theo layer → Write tests → Review → Commit
```

### 3. Implementation Order
```
Layer 3 (Infrastructure) → Layer 2 (Domain + Services) → Layer 1 (UI)
```

**Tại sao?**
- Infrastructure = foundation (session, streaming)
- Domain = business rules (models, interfaces)
- UI = presentation (components)

### 4. Testing Strategy
- **Unit Tests**: Mỗi component/class
- **Integration Tests**: Presenter + Services
- **E2E Tests**: Full user flows

---

## 📚 Dependencies Mới

### Required
```json
{
  "ink-markdown": "^2.0.0",      // Markdown rendering
  "highlight.js": "^11.9.0"       // Syntax highlighting
}
```

### Optional (Phase 2+)
```json
{
  "ink-select-input": "^5.0.0",  // For slash suggestions
  "ink-text-input": "^5.0.1"     // Enhanced input (nếu cần)
}
```

---

## ⚠️ Risk & Mitigation

### Risk 1: Streaming Performance
**Risk**: Streaming có thể lag với terminal updates
**Mitigation**:
- Batch updates (buffer 50-100ms)
- Use requestAnimationFrame equivalent
- Test với large responses

### Risk 2: Session File Size
**Risk**: Session files lớn khi có nhiều messages
**Mitigation**:
- Compress with gzip
- Limit message history (max 100)
- Archive old sessions

### Risk 3: Breaking Existing Code
**Risk**: Refactor có thể break current features
**Mitigation**:
- Comprehensive tests BEFORE refactor
- Feature flags cho new features
- Backward compatibility

---

## 📖 Reading Guide

### Cho Developers
**Đọc theo thứ tự:**
1. ✅ 00-overview.md (file này)
2. → 03-layer2-domain-models.md (Hiểu domain trước)
3. → 05-layer3-infrastructure.md (Foundation)
4. → 04-layer2-application-services.md (Business logic)
5. → 01-layer1-cli-components.md (UI components)
6. → 02-layer1-screens-presenters.md (Integration)
7. → 06-phase1-core-features.md (Implement Phase 1)
8. → 07-phase2-advanced-ux.md (Implement Phase 2)
9. → 08-testing-strategy.md (Testing)

### Cho Architects
**Focus on:**
- File này (overview)
- 03-layer2-domain-models.md (Domain design)
- 05-layer3-infrastructure.md (Technical foundation)

### Cho QA
**Focus on:**
- 06-phase1-core-features.md (Feature specs)
- 07-phase2-advanced-ux.md (UX specs)
- 08-testing-strategy.md (Test cases)

---

## 🎯 Next Steps

1. **Đọc plan files** theo thứ tự
2. **Setup environment** với dependencies mới
3. **Start Phase 1** từ infrastructure layer
4. **Test incrementally** sau mỗi feature
5. **Update docs** khi hoàn thành

---

## 📞 Support

- **Questions**: Xem [FAQ](../functional/07-faq.md)
- **Issues**: Kiểm tra [Best Practices](../technical/09-best-practices.md)
- **Architecture**: Xem [Technical Overview](../technical/01-overview.md)

---

**Ready?** → Tiếp theo: [01-layer1-cli-components.md](./01-layer1-cli-components.md)

---

**Version**: 1.0.0
**Last Updated**: 2025-01-08
**Total Plan Files**: 9
**Estimated Total Lines**: ~4000 lines (avg ~450 lines/file)
