# 🏠 Tài Liệu Màn Hình Home

Tài liệu đầy đủ về màn hình Home của CODEH CLI.

---

## ⚠️ ĐỌC TRƯỚC KHI BẮT ĐẦU

> **QUAN TRỌNG**: Tài liệu này bao gồm **cả hiện tại VÀ tương lai**.
>
> - ✅ **Implemented (v1.0.0)**: Features đã hoạt động
> - 🚧 **Planned (v1.1+)**: Features trong roadmap
> - 💡 **Future (v2.0+)**: Ý tưởng cho tương lai
>
> **📍 BẮT ĐẦU TỪ ĐÂY:**
>
> 1. 📋 [CURRENT_STATE.md](./CURRENT_STATE.md) - **Hiện trạng** implementation
> 2. 🔄 [GEMINI_COMPARISON.md](./GEMINI_COMPARISON.md) - So sánh với **Gemini CLI**
> 3. 🗺️ [ROADMAP.md](./ROADMAP.md) - **Lộ trình** phát triển

---

## 📚 Tổng Quan

Màn hình **Home** là trung tâm làm việc chính của CODEH CLI - nơi bạn tương tác với AI assistant.

**Hiện tại (v1.0.0) - ✅ Working:**

- MVP UI Component với clean architecture
- Basic Q&A với AI (input/output)
- Loading states & error handling
- Tips section cho người dùng mới

**Đang phát triển (v1.1+) - 🚧 Roadmap:**

- Full conversation history display
- Slash commands system
- Streaming responses (realtime)
- Session save/load (persistent)
- Markdown rendering & syntax highlighting
- Todos management
- Advanced keyboard shortcuts

**Học từ Gemini CLI:**

- Conversation context management
- Session persistence patterns
- Multi-modal input (future)
- Minimal friction philosophy

---

## 🚀 Quick Start

### Muốn hiểu hiện trạng?

→ Đọc [CURRENT_STATE.md](./CURRENT_STATE.md)

### Muốn biết roadmap?

→ Đọc [ROADMAP.md](./ROADMAP.md)

### Muốn so sánh với Gemini CLI?

→ Đọc [GEMINI_COMPARISON.md](./GEMINI_COMPARISON.md)

### Muốn tài liệu chi tiết?

→ Tiếp tục đọc phần dưới ⬇️

---

## 📖 Hướng Dẫn Đọc Tài Liệu

### 👤 Người Dùng Cuối (End Users)

**BẮT ĐẦU TỪ:** [Functional Documentation](./functional/01-overview.md)

Đọc theo thứ tự:

1. [Tổng quan & Giao diện](./functional/01-overview.md) - Hiểu UI và layout
2. [Các chức năng chính](./functional/02-main-features.md) - 7 features cơ bản
3. [Luồng sử dụng](./functional/03-usage-flows.md) - 5 scenarios thực tế
4. [Hướng dẫn sử dụng](./functional/05-user-guide.md) - Step-by-step guide
5. [FAQ](./functional/07-faq.md) - Câu hỏi thường gặp

Tham khảo khi cần:

- [Tính năng chi tiết](./functional/04-detailed-features.md)
- [Xử lý lỗi](./functional/06-error-handling.md)
- [Best practices](./functional/08-best-practices.md)

### 👨‍💻 Developers

**BẮT ĐẦU TỪ:** [CURRENT_STATE.md](./CURRENT_STATE.md) ← **ĐỌC ĐẦU TIÊN!**

**Hiểu project trước:**

1. ⭐ [CURRENT_STATE.md](./CURRENT_STATE.md) - **Gap analysis** (must read!)
2. ⭐ [ROADMAP.md](./ROADMAP.md) - **Development roadmap** (must read!)
3. [GEMINI_COMPARISON.md](./GEMINI_COMPARISON.md) - Comparison với Gemini CLI

**Sau đó đọc technical docs:**

1. [Technical Overview](./technical/01-overview.md) - MVP pattern, DI
2. [Components](./technical/02-components.md) - Components chi tiết
3. [Logic flows](./technical/03-logic-flows.md) - Sequence diagrams
4. [API & Interfaces](./technical/05-api-interfaces.md) - Public APIs
5. [State management](./technical/06-state-management.md) - State hierarchy

**Tham khảo:**

- [SRS](./technical/04-srs.md) - Requirements specification
- [Keyboard shortcuts](./technical/07-keyboard.md)
- [Error handling](./technical/08-error-handling.md)
- [Best practices](./technical/09-best-practices.md)

**Quick reference:**

- [Quick Reference](./quick-reference.md) - Cheat sheet (updated với current state)

### 🏗️ Architects / Tech Leads

**Đọc theo thứ tự:**

1. ⭐ [CURRENT_STATE.md](./CURRENT_STATE.md) - **Current vs planned features**
2. ⭐ [GEMINI_COMPARISON.md](./GEMINI_COMPARISON.md) - **Learn from Gemini CLI**
3. ⭐ [ROADMAP.md](./ROADMAP.md) - **Development phases & priorities**
4. [Functional Overview](./functional/01-overview.md) - Business requirements
5. [Technical Overview](./technical/01-overview.md) - Architecture
6. [SRS](./technical/04-srs.md) - FR & NFR
7. [Flow Diagrams](./flows/) - All 9 flow diagrams
8. [Best Practices](./technical/09-best-practices.md) - Design decisions

### 🐛 QA / Debuggers

1. [Functional Spec](./functional/) - Expected behavior
2. [Error Handling (Functional)](./functional/06-error-handling.md) - User errors
3. [Error Handling (Technical)](./technical/08-error-handling.md) - Error strategies
4. [Error Flow](./flows/04-error-handling.md) - Error flow diagram

---

## 📂 Cấu Trúc Tài Liệu

### 🌟 NEW: Analysis & Planning Documents

> **Đọc trước** để hiểu current state & roadmap

| File                                              | Nội dung                                     | Lines | Priority      |
| ------------------------------------------------- | -------------------------------------------- | ----- | ------------- |
| ⭐ [CURRENT_STATE.md](./CURRENT_STATE.md)         | Gap analysis: Docs vs Implementation         | ~250  | **MUST READ** |
| ⭐ [GEMINI_COMPARISON.md](./GEMINI_COMPARISON.md) | So sánh với Gemini CLI, learn best practices | ~300  | **MUST READ** |
| ⭐ [ROADMAP.md](./ROADMAP.md)                     | Development roadmap từ v1.0 → v2.0+          | ~500  | **MUST READ** |

**Tại sao đọc trước?**

- ✅ Hiểu rõ features nào đã có, chưa có
- ✅ Tránh confusion giữa docs (vision) vs reality
- ✅ Biết ưu tiên implement gì trước
- ✅ Học từ Gemini CLI để build better

---

### 📖 Functional Documentation (User-Focused)

> 0% code, 100% chức năng - Viết cho người dùng cuối

| File                                                            | Nội dung                    | Lines |
| --------------------------------------------------------------- | --------------------------- | ----- |
| [01-overview.md](./functional/01-overview.md)                   | Giới thiệu & Giao diện UI   | ~170  |
| [02-main-features.md](./functional/02-main-features.md)         | 7 chức năng chính           | ~145  |
| [03-usage-flows.md](./functional/03-usage-flows.md)             | 5 luồng sử dụng thực tế     | ~80   |
| [04-detailed-features.md](./functional/04-detailed-features.md) | Tính năng chi tiết          | ~140  |
| [05-user-guide.md](./functional/05-user-guide.md)               | Hướng dẫn từng bước         | ~80   |
| [06-error-handling.md](./functional/06-error-handling.md)       | 6 lỗi thường gặp + cách fix | ~110  |
| [07-faq.md](./functional/07-faq.md)                             | 10 câu hỏi thường gặp       | ~125  |
| [08-best-practices.md](./functional/08-best-practices.md)       | Best practices & Support    | ~55   |

### 💻 Technical Documentation (Developer-Focused)

> Chi tiết kỹ thuật - Viết cho developers

| File                                                         | Nội dung                        | Lines |
| ------------------------------------------------------------ | ------------------------------- | ----- |
| [01-overview.md](./technical/01-overview.md)                 | Tổng quan, MVP, DI              | ~85   |
| [02-components.md](./technical/02-components.md)             | 10 components chi tiết          | ~180  |
| [03-logic-flows.md](./technical/03-logic-flows.md)           | 4 sequence diagrams             | ~110  |
| [04-srs.md](./technical/04-srs.md)                           | FR-1 đến FR-8, NFR-1 đến NFR-4  | ~85   |
| [05-api-interfaces.md](./technical/05-api-interfaces.md)     | API methods & interfaces        | ~100  |
| [06-state-management.md](./technical/06-state-management.md) | State hierarchy & patterns      | ~65   |
| [07-keyboard.md](./technical/07-keyboard.md)                 | Keyboard shortcuts table        | ~35   |
| [08-error-handling.md](./technical/08-error-handling.md)     | Error categories & strategies   | ~65   |
| [09-best-practices.md](./technical/09-best-practices.md)     | Coding standards & known issues | ~175  |

### 🔄 Flow Diagrams

> Mermaid sequence & flow diagrams

| File                                                 | Nội dung                 | Lines |
| ---------------------------------------------------- | ------------------------ | ----- |
| [01-startup.md](./flows/01-startup.md)               | Application startup flow | ~55   |
| [02-user-input.md](./flows/02-user-input.md)         | User input processing    | ~72   |
| [03-slash-commands.md](./flows/03-slash-commands.md) | Slash command flow       | ~65   |
| [04-error-handling.md](./flows/04-error-handling.md) | Error handling flow      | ~67   |
| [05-state-updates.md](./flows/05-state-updates.md)   | State update cycle       | ~54   |
| [06-lifecycle.md](./flows/06-lifecycle.md)           | Component lifecycle      | ~120  |
| [07-loading-states.md](./flows/07-loading-states.md) | Loading state diagram    | ~47   |
| [08-keyboard-nav.md](./flows/08-keyboard-nav.md)     | Keyboard navigation      | ~51   |
| [09-performance.md](./flows/09-performance.md)       | Performance optimization | ~48   |

### 🚀 Quick Reference

- [quick-reference.md](./quick-reference.md) - Cheat sheet (165 lines)

---

## 📊 Thống Kê

```
Total Files:     30 files (+3 new analysis docs!)
Total Lines:     ~3,450 lines (+1,050 new lines)
Average/File:    ~115 lines

Phân loại:
- Analysis:      3 files (~1,050 lines) ← NEW!
- Functional:    8 files (~880 lines)
- Technical:     9 files (~900 lines)
- Flows:         9 files (~580 lines)
- Quick Ref:     1 file  (~165 lines)

Breakdown:
✅ CURRENT_STATE.md       ~250 lines
✅ GEMINI_COMPARISON.md   ~300 lines
✅ ROADMAP.md             ~500 lines
```

## 🎯 Files Chính Trong Codebase

### Current Implementation (v1.0.0)

```
source/cli/screens/Home.tsx              # UI Component (64 lines)
source/cli/presenters/HomePresenter.ts   # Business Logic (90 lines)
source/cli/hooks/useHomeLogic.ts         # React Hook (112 lines)

# Components (Atomic Design)
source/cli/components/atoms/Logo.tsx
source/cli/components/molecules/InfoSection.tsx
source/cli/components/molecules/TipsSection.tsx
source/cli/components/molecules/InputBox.tsx
```

## 🔗 Links Liên Quan

- [Architecture](../ARCHITECTURE.md) - Tổng quan kiến trúc (Coming soon)
- [Components](../COMPONENTS.md) - Component library (Coming soon)
- [API Docs](../API.md) - API documentation (Coming soon)

---

## 📝 Quy Ước Viết Tài Liệu

### Naming Convention

- Files: `01-kebab-case.md` (numbered for order)
- Sections: `## 🎯 Title Case`
- Links: Relative paths only

### Structure Standard

Mỗi file phải có:

1. H1 title với emoji
2. Brief overview
3. Detailed content
4. Navigation links (Previous | Next | Up)
5. Last updated date

### Markdown Features

- ✅ Emoji icons cho visual cues
- ✅ Tables cho structured data
- ✅ Code blocks với syntax highlighting
- ✅ Mermaid diagrams (trong flows/)
- ✅ Collapsible sections nếu cần

---

## 🤝 Contributing

### Cập nhật tài liệu:

1. Edit file tương ứng
2. Update "Last Updated" date
3. Check links vẫn hoạt động
4. Commit với message: `docs(home): <change description>`

### Thêm tài liệu mới:

1. Follow naming convention
2. Add entry vào README này
3. Update docs/README.md
4. Link từ related files

---

## 📝 Changelog

### v2.1.0 - 2025-01-08 (Current State Analysis)

**Added:**

- ⭐ `CURRENT_STATE.md` - Gap analysis giữa docs vs implementation
- ⭐ `GEMINI_COMPARISON.md` - So sánh với Gemini CLI, learn best practices
- ⭐ `ROADMAP.md` - Development roadmap từ v1.0 → v2.0+
- Updated `functional/01-overview.md` - Thêm current implementation section
- Updated `functional/02-main-features.md` - Mark features với status (✅/🚧/💡)
- Updated `quick-reference.md` - Phân biệt current vs planned
- Updated README.md - Thêm new docs section

**Why?**

- Phản ánh đúng thực trạng implementation (v1.0.0 chỉ có MVP basic)
- Tránh confusion: docs mô tả vision, không phải reality
- Roadmap rõ ràng để develop theo phases
- Học từ Gemini CLI để build better product

### v2.0.0 - 2025-01-08 (Modularized)

- Split tài liệu thành 27 files
- Functional + Technical + Flows
- Complete documentation coverage

---

**Version**: 2.1.0 (Current State Analysis)
**Last Updated**: 2025-01-08
**Maintainer**: CODEH Team
**Total Docs**: 30 files (+3 analysis docs)
**Status**: ✅ Docs reflect both current reality & future vision
