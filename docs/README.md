# CODEH CLI - Documentation

Tài liệu dự án CODEH CLI - Terminal UI cho AI chat với 3-layer architecture.

## 📚 Mục lục

### 🚀 [Guides](./guides/)

- [User Guide](./guides/user-guide.md) - Hướng dẫn sử dụng cho end-user
- [Configuration Guide](./guides/configuration.md) - Hướng dẫn cấu hình
- [Development Guide](./guides/development.md) - Hướng dẫn cho developer
- [Keyboard Shortcuts](./guides/keyboard-shortcuts.md) - Complete list of all keyboard shortcuts
- [Mode Switching](./guides/mode-switching.md) - Permission mode switching guide
- [UI Components](./guides/ui-components.md) - UI components usage guide

### 🏗️ [Architecture](./architecture/)

- [Overview](./architecture/overview.md) - Tổng quan kiến trúc 3-layer
- [LLM API Integration](./architecture/llm-api-integration.md) - Tích hợp 4 nhà cung cấp LLM API
- [Integrations Guide](./architecture/INTEGRATIONS_GUIDE.md) - VS Code, MCP, A2A integrations
- [Shortcut System](./architecture/shortcut-system.md) - Layer-based shortcut management system
- [Tools Comparison](./architecture/tools-comparison.md) - Analysis of tool implementations

### 💻 [Development](./development/)

- [Implementation Roadmap](./development/roadmap.md) - Project implementation roadmap
- [Implementation Summary](./development/implementation-summary.md) - Summary of completed phases
- [Serena Integration](./development/serena-integration.md) - Serena MCP integration plan
- [Testing Tools](./development/testing-tools.md) - Tool execution testing guide
- [TypeScript Tools](./development/typescript-tools.md) - TypeScript tool implementation details
- [Manual Testing](./development/manual-testing.md) - Manual testing procedures

### 📖 [API Documentation](./api/)

- [API Overview](./api/README.md) - Complete API reference for all tools
- **Tools** - Code intelligence and manipulation tools
  - Type Information, Call Hierarchy, Find Implementations
  - Smart Context Extractor, Dependency Graph
  - Symbol Search, Code Validation
- **Core Services** - Application services and business logic
- **Infrastructure** - TypeScript analyzer, shell execution, logging

### 🖥️ [Screens](./screens/)

- [Welcome Screen](./screens/welcome/) - Màn hình chào mừng
- [Home Screen](./screens/home/) - Màn hình chính (chat interface)
- [Config Screen](./screens/config/) - Màn hình cấu hình

### 📝 [Special Documents](.)

- [System Prompt Guide](./SYSTEM_PROMPT_GUIDE.md) - Guide for creating AI system prompts
- [Documentation Consolidation Plan](./DOCUMENTATION_CONSOLIDATION_PLAN.md) - Plan for organizing all docs

---

## 📖 Documentation Rules & Guidelines

### 1. Nguyên tắc tạo tài liệu

#### ✅ **KHI NÀO NÊN TẠO TÀI LIỆU:**

- Feature mới được implement hoàn chỉnh
- Thay đổi breaking changes trong API
- Cần hướng dẫn sử dụng cho user
- Kiến trúc có thay đổi quan trọng

#### ❌ **KHÔNG TẠO TÀI LIỆU:**

- Work in progress (WIP) features
- Temporary implementation details
- Duplicate information đã có sẵn
- Planning docs (dùng GitHub Issues thay thế)

### 2. Cấu trúc tài liệu theo màn hình

Mỗi màn hình phải có:

```
screens/<screen-name>/
├── README.md       # Overview, features, usage
├── technical.md    # Technical implementation
└── flows.md        # User flows (nếu phức tạp)
```

**Nội dung mỗi file:**

- **README.md**: Tổng quan, danh sách features, screenshots/examples
- **technical.md**: Component structure, state management, technical details
- **flows.md**: User interaction flows, diagrams (chỉ cần cho màn hình phức tạp)

### 3. Quy tắc viết tài liệu

#### **Format:**

```markdown
# Title (H1 - duy nhất)

Brief description (1-2 câu)

## Section 1 (H2)

Content...

### Subsection (H3)

Content...
```

#### **Code examples:**

- Luôn có language tag: \`\`\`typescript
- Có comments giải thích
- Ví dụ phải runnable hoặc rõ ràng

#### **Độ dài:**

- README.md màn hình: 100-300 dòng
- Technical docs: 200-500 dòng
- Guide: 100-400 dòng
- **KHÔNG QUÁ 500 dòng/file** (split nếu cần)

### 4. Quy trình cập nhật tài liệu

#### **Khi implement feature mới:**

1. **Implement code** → Commit code
2. **Sau khi code stable** → Viết/update docs
3. **Review docs** → Đảm bảo không duplicate
4. **Commit docs** → Separate commit với message rõ ràng

#### **Khi refactor/deprecate:**

1. **Update tài liệu trước** → Mark as deprecated
2. **Refactor code** → Implement changes
3. **Update docs** → Remove old, add new
4. **Xóa tài liệu cũ** → Không archive

### 5. Maintainability Rules

#### **Ngăn chặn tài liệu dư thừa:**

- ✅ 1 topic = 1 file duy nhất
- ✅ Cross-reference thay vì duplicate
- ✅ Keep it DRY (Don't Repeat Yourself)
- ❌ Không tạo multiple versions
- ❌ Không giữ outdated docs

#### **Review checklist trước khi commit docs:**

- [ ] Tài liệu này có duplicate với docs khác không?
- [ ] Nội dung có còn relevant không?
- [ ] Có thể gộp vào file existing không?
- [ ] File size < 500 dòng?
- [ ] Code examples có chạy được không?

### 6. Naming Conventions

#### **Filenames:**

- Lowercase với dấu gạch ngang: `user-guide.md`
- Rõ ràng, mô tả nội dung: `configuration.md` NOT `config.md`
- README.md cho overview của folder

#### **Headers:**

- H1 (#): Title duy nhất ở đầu file
- H2 (##): Main sections
- H3 (###): Subsections
- Không dùng H4 trở xuống (restructure nếu cần)

### 7. Template chuẩn

#### **Template cho screen README.md:**

```markdown
# [Screen Name] Screen

Brief description of the screen purpose and main functionality.

## Overview

What this screen does, when to use it.

## Features

- Feature 1
- Feature 2
- Feature 3

## Usage

How to use this screen (with examples/screenshots if needed)

## Components

List of main UI components used

## See Also

- [Technical Details](./technical.md)
- [User Flows](./flows.md) (if exists)
```

#### **Template cho technical.md:**

```markdown
# [Screen Name] - Technical Documentation

Technical implementation details for [Screen Name]

## Architecture

Component structure, data flow

## Components

### Component 1

Description, props, usage

### Component 2

Description, props, usage

## State Management

How state is managed in this screen

## API Integration

What APIs/services are used

## Code Examples

Practical code examples
```

---

## 🔍 Quick Navigation

### By Role:

- **End User** → Start with [User Guide](./guides/user-guide.md)
- **Developer** → Check [Development Guide](./guides/development.md) + [Architecture](./architecture/overview.md)
- **Contributor** → Read this README + [Development Guide](./guides/development.md)

### By Task:

- **Setup/Install** → [User Guide - Installation](./guides/user-guide.md#installation)
- **Configure** → [Configuration Guide](./guides/configuration.md)
- **Understand Architecture** → [Architecture Overview](./architecture/overview.md)
- **Integrate with VS Code/MCP/A2A** → [Integrations Guide](./architecture/integrations.md)
- **Customize a Screen** → [Screens](./screens/)

---

## 📝 Contributing to Documentation

Khi contribute docs, vui lòng:

1. **Đọc rules phía trên**
2. **Check existing docs** - tránh duplicate
3. **Follow templates** - đảm bảo consistency
4. **Keep it concise** - < 500 lines/file
5. **Update this README** nếu thêm section mới

### Commit Message Format cho Docs:

```
docs: <description>

hoặc

docs(<scope>): <description>
```

**Ví dụ:**

```
docs: Update home screen technical details
docs(welcome): Add welcome screen usage guide
docs(architecture): Update 3-layer architecture overview
```

---

## 🗑️ Cleanup Policy

Tài liệu cũ/outdated sẽ được **XÓA HẲNG** (không archive).

Trước khi xóa, đảm bảo:

- Content quan trọng đã được migrate
- Không còn reference đến file này
- Team đã được thông báo

---

## 📊 Documentation Status

| Category          | Status  | Last Updated | Files |
| ----------------- | ------- | ------------ | ----- |
| Architecture      | 🟢 Done | 2025-11-12   | 5     |
| Development       | 🟢 Done | 2025-11-12   | 6     |
| Guides            | 🟢 Done | 2025-11-12   | 6     |
| API Documentation | 🟡 WIP  | 2025-11-12   | 1     |
| Screens           | 🟡 WIP  | -            | 3     |
| Core Services     | 🔴 Todo | -            | -     |
| Infrastructure    | 🔴 Todo | -            | -     |

🟢 Done | 🟡 Work in Progress | 🔴 Todo

### Recent Changes (2025-11-12)

✅ **Documentation Consolidation Completed:**
- Consolidated 4 shortcut documents → 1 comprehensive guide
- Moved 13 root-level docs to organized directories
- Deleted outdated Phase 2 summary
- Created structured docs/ directory with clear hierarchy
- Root now has only 4 standard files (readme, CHANGELOG, CONTRIBUTING, CLAUDE)

---

**Maintained by:** CODEH Development Team
**Last Updated:** 2025-11-12
