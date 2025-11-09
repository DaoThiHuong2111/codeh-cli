# 📋 Home Screen Implementation Plan

> **Created**: 2025-01-08
> **Purpose**: Chi tiết implementation plan cho Home Screen từ v1.0 MVP → v1.2 Full Features

---

## 🎯 Tổng Quan

Plan này được chia thành **9 files** để dễ đọc và maintain, tuân thủ **Clean Architecture 3 layers** và roadmap đã định nghĩa trong tài liệu.

---

## 📚 Danh Sách Files

### 🌟 Core Planning Documents

| #   | File                               | Nội Dung                               | Lines | Priority               |
| --- | ---------------------------------- | -------------------------------------- | ----- | ---------------------- |
| 0   | [00-overview.md](./00-overview.md) | Tổng quan strategy, kiến trúc, roadmap | 469   | ⭐ **BẮT ĐẦU TẠI ĐÂY** |

---

### 🎨 Layer 1: Presentation Layer

| #   | File                                                                 | Nội Dung                                    | Lines | Phase       |
| --- | -------------------------------------------------------------------- | ------------------------------------------- | ----- | ----------- |
| 1   | [01-layer1-cli-components.md](./01-layer1-cli-components.md)         | 8 components mới + 3 components enhance     | 949   | v1.1 → v1.2 |
| 2   | [02-layer1-screens-presenters.md](./02-layer1-screens-presenters.md) | Home.tsx, HomePresenter.ts, useHomeLogic.ts | 801   | v1.1 → v1.2 |

**Tổng**: 2 files, 1,750 lines

---

### 🏛️ Layer 2: Core/Business Logic

| #   | File                                                                     | Nội Dung                                     | Lines | Phase       |
| --- | ------------------------------------------------------------------------ | -------------------------------------------- | ----- | ----------- |
| 3   | [03-layer2-domain-models.md](./03-layer2-domain-models.md)               | Models, Value Objects, Interfaces            | 794   | v1.1 → v1.2 |
| 4   | [04-layer2-application-services.md](./04-layer2-application-services.md) | CodehClient, CommandService, MarkdownService | 742   | v1.1 → v1.2 |

**Tổng**: 2 files, 1,536 lines

---

### 🏗️ Layer 3: Infrastructure

| #   | File                                                         | Nội Dung                              | Lines | Phase |
| --- | ------------------------------------------------------------ | ------------------------------------- | ----- | ----- |
| 5   | [05-layer3-infrastructure.md](./05-layer3-infrastructure.md) | SessionManager, API clients streaming | 383   | v1.1  |

**Tổng**: 1 file, 383 lines

---

### 🚀 Phase Implementation Guides

| #   | File                                                       | Nội Dung                                                 | Lines | Timeline  |
| --- | ---------------------------------------------------------- | -------------------------------------------------------- | ----- | --------- |
| 6   | [06-phase1-core-features.md](./06-phase1-core-features.md) | 4 core features (History, Commands, Streaming, Sessions) | 455   | 2-3 weeks |
| 7   | [07-phase2-advanced-ux.md](./07-phase2-advanced-ux.md)     | 6 advanced features (Keyboard, Markdown, Todos, etc.)    | 492   | 3-4 weeks |

**Tổng**: 2 files, 947 lines

---

### 🧪 Testing & Quality

| #   | File                                               | Nội Dung                     | Lines | Coverage |
| --- | -------------------------------------------------- | ---------------------------- | ----- | -------- |
| 8   | [08-testing-strategy.md](./08-testing-strategy.md) | Unit, Integration, E2E tests | 643   | >70%     |

**Tổng**: 1 file, 643 lines

---

## 📖 Hướng Dẫn Đọc

### 👨‍💻 Cho Developers (Implement từ đầu)

**Đọc theo thứ tự:**

1. ✅ [00-overview.md](./00-overview.md) - Hiểu tổng thể
2. → [03-layer2-domain-models.md](./03-layer2-domain-models.md) - Domain design
3. → [05-layer3-infrastructure.md](./05-layer3-infrastructure.md) - Foundation
4. → [04-layer2-application-services.md](./04-layer2-application-services.md) - Business logic
5. → [01-layer1-cli-components.md](./01-layer1-cli-components.md) - UI components
6. → [02-layer1-screens-presenters.md](./02-layer1-screens-presenters.md) - Integration
7. → [06-phase1-core-features.md](./06-phase1-core-features.md) - Phase 1 guide
8. → [07-phase2-advanced-ux.md](./07-phase2-advanced-ux.md) - Phase 2 guide
9. → [08-testing-strategy.md](./08-testing-strategy.md) - Testing

**Estimated Time**: 1 giờ để đọc toàn bộ

---

### 🏗️ Cho Architects

**Focus on:**

- [00-overview.md](./00-overview.md) - Architecture overview
- [03-layer2-domain-models.md](./03-layer2-domain-models.md) - Domain design
- [05-layer3-infrastructure.md](./05-layer3-infrastructure.md) - Infrastructure patterns

---

### 🎯 Cho Project Managers

**Focus on:**

- [00-overview.md](./00-overview.md) - Timeline & roadmap
- [06-phase1-core-features.md](./06-phase1-core-features.md) - Phase 1 deliverables
- [07-phase2-advanced-ux.md](./07-phase2-advanced-ux.md) - Phase 2 deliverables

---

### 🐛 Cho QA

**Focus on:**

- [06-phase1-core-features.md](./06-phase1-core-features.md) - Feature specs Phase 1
- [07-phase2-advanced-ux.md](./07-phase2-advanced-ux.md) - Feature specs Phase 2
- [08-testing-strategy.md](./08-testing-strategy.md) - Test cases

---

## 📊 Thống Kê

```
Total Files:           9 files
Total Lines:           5,728 lines
Average Lines/File:    636 lines

By Category:
- Planning:            469 lines (1 file)
- Layer 1 (CLI):       1,750 lines (2 files)
- Layer 2 (Core):      1,536 lines (2 files)
- Layer 3 (Infra):     383 lines (1 file)
- Phases:              947 lines (2 files)
- Testing:             643 lines (1 file)

Breakdown by Phase:
- Phase 1 (v1.1):      ~60% of implementation
- Phase 2 (v1.2):      ~40% of implementation
```

---

## 🎯 Implementation Summary

### Files to Create (Total: ~25 new files)

**Layer 1 (CLI)**:

- 8 new components (Spinner, MessageBubble, ConversationArea, etc.)
- 3 enhanced components (InputBox, TipsSection, InfoSection)

**Layer 2 (Core)**:

- 6 new value objects/models (Todo, Command, Session, etc.)
- 4 new interfaces
- 2 new services (CommandService, MarkdownService)

**Layer 3 (Infrastructure)**:

- 1 new SessionManager
- 3 API clients enhance (streaming)

### Files to Enhance (Total: ~8 files)

- Home.tsx (64 → ~200 lines)
- HomePresenter.ts (90 → ~400 lines)
- Message.ts, Conversation.ts, IApiClient.ts
- AnthropicClient.ts, OpenAIClient.ts, OllamaClient.ts

### Total Code Estimates

```
New Lines:         ~3,000 lines
Enhanced Lines:    ~800 lines
Test Lines:        ~2,000 lines
Total New Code:    ~5,800 lines
```

---

## 🚀 Quick Start

### 1. Đọc Overview

```bash
cat 00-overview.md
```

### 2. Chọn Phase

```bash
# Phase 1 (Core features)
cat 06-phase1-core-features.md

# Phase 2 (Advanced UX)
cat 07-phase2-advanced-ux.md
```

### 3. Implement theo Layer

```bash
# Layer 3 first (infrastructure)
cat 05-layer3-infrastructure.md

# Layer 2 (domain + services)
cat 03-layer2-domain-models.md
cat 04-layer2-application-services.md

# Layer 1 (UI)
cat 01-layer1-cli-components.md
cat 02-layer1-screens-presenters.md
```

### 4. Test

```bash
cat 08-testing-strategy.md
npm test
```

---

## ✅ Implementation Checklist

### Phase 1 (v1.1) - 2-3 weeks

- [ ] Layer 3: SessionManager, API streaming
- [ ] Layer 2: Domain models, CommandService
- [ ] Layer 1: MessageBubble, ConversationArea, SlashSuggestions
- [ ] Integration: Update Home, HomePresenter
- [ ] Testing: Unit + Integration tests
- [ ] **Deliverable**: Conversation history, Slash commands, Streaming, Sessions

### Phase 2 (v1.2) - 3-4 weeks

- [ ] Layer 2: Todo model, MarkdownService
- [ ] Layer 1: TodosDisplay, Footer, HelpOverlay
- [ ] Features: Keyboard shortcuts, Markdown, Input history
- [ ] Testing: E2E tests
- [ ] **Deliverable**: Full UX với todos, markdown, help

---

## 📝 Notes

### Tuân Thủ Clean Architecture

✅ Dependency rule (inward only)
✅ Layer isolation
✅ Interface abstraction
✅ DI container usage

### Code Quality Standards

✅ File size < 500 lines (most files)
✅ Component size < 200 lines
✅ Test coverage > 70%
✅ TypeScript strict mode

### Best Practices

✅ MVP pattern cho presenters
✅ Atomic Design cho components
✅ Value Objects immutable
✅ Factory methods cho creation

---

## 🔗 Related Documents

- [../README.md](../README.md) - Home Screen docs index
- [../CURRENT_STATE.md](../CURRENT_STATE.md) - Current implementation status
- [../ROADMAP.md](../ROADMAP.md) - Development roadmap
- [../technical/](../technical/) - Technical documentation

---

## 🤝 Contributing

Khi implement theo plan này:

1. **Đọc plan file trước** khi code
2. **Follow architecture** đã định nghĩa
3. **Write tests** cùng lúc với code
4. **Update CURRENT_STATE.md** khi hoàn thành feature
5. **Commit với clear message**: `feat(home): implement ConversationArea component`

---

## 📞 Support

- **Questions về plan**: Review [00-overview.md](./00-overview.md)
- **Questions về architecture**: Review [../technical/01-overview.md](../technical/01-overview.md)
- **Questions về features**: Review phase files (06, 07)

---

**Version**: 1.0.0
**Last Updated**: 2025-01-08
**Status**: ✅ Complete - Ready for implementation
**Estimated Implementation Time**: 5-7 weeks (Phase 1 + Phase 2)
