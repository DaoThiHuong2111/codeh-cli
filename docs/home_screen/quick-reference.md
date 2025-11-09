# 🏠 Home Screen - Quick Reference

> Tài liệu tham khảo nhanh cho màn hình Home. Xem docs đầy đủ trong thư mục này.

---

## ⚠️ Current vs Planned

> **QUAN TRỌNG**: Đây là reference cho **vision đầy đủ**.
>
> - ✅ = Implemented (v1.0.0)
> - 🚧 = Planned (v1.1+)
> - See [CURRENT_STATE.md](./CURRENT_STATE.md) for implementation status

---

## 🎯 Tóm Tắt

**Home Screen** là màn hình chính của CODEH CLI:

- ✅ MVP pattern với HomePresenter
- ✅ Basic Q&A với AI
- 🚧 Full conversation history (v1.1)
- 🚧 Slash commands (v1.1)
- 🚧 Streaming responses (v1.1)

## 📁 Files Chính

```
source/cli/screens/Home.tsx              # UI Component (64 lines) ✅
source/cli/presenters/HomePresenter.ts   # Business Logic (90 lines) ✅
source/cli/hooks/useHomeLogic.ts         # React Hook (112 lines) ✅
```

## 🧩 Components

### Current (v1.0.0) - ✅ Implemented

```
Home
├── Logo ✅
├── InfoSection (version, model, directory) ✅
├── TipsSection (static tips) ✅
├── InputBox (basic input) ✅
└── Output (plain text) ✅
```

### Planned (v1.1+) - 🚧 Roadmap

```
Home (Enhanced)
├── ConversationArea (messages) 🚧 v1.1
│   └── Message[] (user/assistant/error/system) 🚧 v1.1
├── TodosDisplay [conditional] 🚧 v1.2
├── SlashSuggestions [conditional] 🚧 v1.1
├── Footer (stats) 🚧 v1.2
└── HelpOverlay [conditional] 🚧 v1.2
```

## ⚙️ State (HomePresenter)

### Current (v1.0.0) - ✅ Implemented

```typescript
{
	output: string; // Latest response only
	processing: boolean; // Loading state
	version: string; // App version
	model: string; // AI model name
	directory: string; // Working directory
	chatError: string | null; // Error message
}
```

### Planned (v1.1+) - 🚧 Roadmap

```typescript
{
  // Current state + these additions:
  messages: Message[]         // Full conversation history 🚧 v1.1
  todos: Todo[]              // Task list 🚧 v1.2
  inputError: string         // Validation error 🚧 v1.2
  selectedSuggestionIndex: number  // For slash commands 🚧 v1.1
  showHelp: boolean          // Help overlay 🚧 v1.2
  inputHistory: string[]     // Input history 🚧 v1.2
}
```

## 🔄 Main Flows

### 1. User sends message

```
User types → handleInputChange() → handleSubmit()
→ ConversationService.sendMessage() → Update messages → Re-render
```

### 2. Slash command

```
User types "/" → Filter commands → Show suggestions
→ Navigate with ↑↓ → Select with Enter → Execute
```

### 3. Error handling

```
Validation error → Set inputError → Display below input
API error → Add error message → Display in conversation
```

## ⌨️ Keyboard Shortcuts

| Key      | Action                       |
| -------- | ---------------------------- |
| `?`      | Toggle help                  |
| `Ctrl+C` | Exit                         |
| `↑` `↓`  | Navigate history/suggestions |
| `Enter`  | Submit/Select                |
| `Esc`    | Clear/Cancel                 |

## 🎨 Conditional Rendering

```javascript
// Todos (có tasks)
{
	presenter.todos.length > 0 && !presenter.isLoading && <TodosDisplay />;
}

// Tips (idle state)
{
	!presenter.isLoading && presenter.todos.length === 0 && <TipsDisplay />;
}

// Suggestions (typing slash command)
{
	presenter.input.startsWith('/') && <SlashSuggestions />;
}

// Help overlay (manual toggle)
{
	presenter.showHelp && <HelpOverlay />;
}
```

## 📊 Message Roles

| Role        | Prefix        | Color |
| ----------- | ------------- | ----- |
| `user`      | `> You`       | cyan  |
| `assistant` | `< Assistant` | green |
| `error`     | `✗ Error`     | red   |
| `system`    | `ℹ System`   | blue  |

## 🚨 Validation Rules

```javascript
// Empty input
if (!input.trim()) return 'Please enter a message';

// Too long
if (input.length > 10000) return 'Message too long (max 10,000 characters)';

// No API configured
if (!apiClient) throw 'API not configured. Please configure...';
```

## 🔌 API Methods

### HomePresenter (Current - v1.0.0)

```typescript
// ✅ Implemented
async handleInput(input: string): Promise<ExecutionResult>
getConversation(): ConversationViewModel
async clearConversation(): Promise<void>
async startNewConversation(): Promise<void>
needsCompression(): boolean

// 🚧 Planned (v1.1+)
// handleSuggestionNavigate(direction) - v1.1
// handleSuggestionSelect() - v1.1
// toggleHelp() - v1.2
```

## 📝 Best Practices

✅ **DO**

- Validate input before submit
- Clear error on input change
- Notify view after state update
- Use virtual scrolling (> 40 messages)

❌ **DON'T**

- Hardcode values in UI
- Mix business logic in components
- Forget to handle errors
- Mutate state directly

## ⚠️ Known Gaps & Issues

### Current Limitations (v1.0.0)

1. **No conversation history** - Chỉ hiển thị output cuối
2. **No slash commands** - Không có command system
3. **No streaming** - Response xuất hiện cùng lúc
4. **No session persistence** - Mất hết khi thoát
5. **Plain text only** - Không có markdown rendering

### Planned Fixes

- See [ROADMAP.md](./ROADMAP.md) for development timeline
- v1.1 sẽ fix issues 1-4
- v1.2 sẽ add markdown + advanced features

## 🔗 Quick Links

### Documentation

- [README.md](./README.md) - Documentation index
- [CURRENT_STATE.md](./CURRENT_STATE.md) - Implementation status
- [ROADMAP.md](./ROADMAP.md) - Development roadmap
- [GEMINI_COMPARISON.md](./GEMINI_COMPARISON.md) - Comparison with Gemini CLI

### Functional Docs

- [01-overview.md](./functional/01-overview.md) - UI overview
- [02-main-features.md](./functional/02-main-features.md) - Features list

### Technical Docs

- [01-overview.md](./technical/01-overview.md) - Architecture
- [02-components.md](./technical/02-components.md) - Components detail

---

**Version**: 1.0.0 | **Last Updated**: 2025-01-08
**Status**: Updated với current implementation + roadmap
