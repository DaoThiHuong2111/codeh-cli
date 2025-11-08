# 🏠 Home Screen - Quick Reference

> Tài liệu tham khảo nhanh cho màn hình Home. Xem [HOME_SCREEN.md](./HOME_SCREEN.md) cho chi tiết đầy đủ.

## 🎯 Tóm Tắt

**Home Screen** là màn hình chính của CODEH CLI, sử dụng **MVP pattern** với logic xử lý qua `HomePresenter`.

## 📁 Files Chính

```
source/cli/screens/Home.js              # UI Component (97 lines)
source/cli/presenters/HomePresenter.js  # Business Logic (144 lines)
source/cli/hooks/useHomePresenter.js    # React Hook Bridge (78 lines)
```

## 🧩 Components

```
Home
├── Logo
├── InfoSection (version, model, directory)
├── ConversationArea (messages)
├── TodosDisplay [conditional]
├── TipsDisplay [conditional]
├── InputPromptArea
├── SlashSuggestions [conditional]
├── Footer
└── HelpOverlay [conditional]
```

## ⚙️ State (HomePresenter)

```javascript
{
  input: string               // User input
  messages: Message[]         // Conversation history
  todos: Todo[]              // Task list
  isLoading: boolean         // API call in progress
  inputError: string         // Validation error
  selectedSuggestionIndex: number
  showHelp: boolean          // Help overlay visible
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

| Key | Action |
|-----|--------|
| `?` | Toggle help |
| `Ctrl+C` | Exit |
| `↑` `↓` | Navigate history/suggestions |
| `Enter` | Submit/Select |
| `Esc` | Clear/Cancel |

## 🎨 Conditional Rendering

```javascript
// Todos (có tasks)
{presenter.todos.length > 0 && !presenter.isLoading && <TodosDisplay />}

// Tips (idle state)
{!presenter.isLoading && presenter.todos.length === 0 && <TipsDisplay />}

// Suggestions (typing slash command)
{presenter.input.startsWith('/') && <SlashSuggestions />}

// Help overlay (manual toggle)
{presenter.showHelp && <HelpOverlay />}
```

## 📊 Message Roles

| Role | Prefix | Color |
|------|--------|-------|
| `user` | `> You` | cyan |
| `assistant` | `< Assistant` | green |
| `error` | `✗ Error` | red |
| `system` | `ℹ System` | blue |

## 🚨 Validation Rules

```javascript
// Empty input
if (!input.trim()) return "Please enter a message"

// Too long
if (input.length > 10000) return "Message too long (max 10,000 characters)"

// No API configured
if (!apiClient) throw "API not configured. Please configure..."
```

## 🔌 API Methods

### HomePresenter
```javascript
// Input
handleInputChange(value)
handleSubmit(userInput)

// Suggestions
handleSuggestionNavigate(direction)
handleSuggestionSelect()

// UI
toggleHelp()

// Conversation
clearConversation()
init()
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

## ⚠️ Known Issues

1. **Missing services/** ← Need to fix
   ```javascript
   // Home.js:19-20 - These imports fail
   import {getVersion} from '../../services/system/index.js';
   ```

2. **No offline support** - Requires internet

3. **Memory leaks** (potential) - Long conversations

## 🔗 Quick Links

- [Full Documentation](./HOME_SCREEN.md)
- [Architecture](./ARCHITECTURE.md)
- [Components](./COMPONENTS.md)
- [API Docs](./API.md)

---

**Version**: 1.0.0 | **Last Updated**: 2025-01-08
