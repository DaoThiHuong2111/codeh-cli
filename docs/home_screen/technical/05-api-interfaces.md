# 🔌 API và Interfaces

> **Phần 5/9** - Technical Documentation | [← Prev: SRS](./04-srs.md) | [Next: State →](./06-state-management.md) | [Up: Index ↑](../README.md)

---

## HomePresenter API

```javascript
class HomePresenter {
  // === Constructor ===
  constructor(conversationService, config)

  // === View Management ===
  setViewUpdateCallback(callback)
  getViewState()

  // === Input Handlers ===
  handleInputChange(value)
  handleSubmit(userInput)

  // === Suggestion Handlers ===
  handleSuggestionNavigate(direction)  // direction: 'up' | 'down'
  handleSuggestionSelect()             // returns: string | null
  getFilteredSuggestions()
  hasSuggestions()

  // === UI State ===
  toggleHelp()

  // === Conversation Management ===
  clearConversation()
  init()

  // === Internal ===
  _notifyView()
}
```

---

## View State Interface

```typescript
interface ViewState {
  input: string
  inputError: string
  messages: Message[]
  isLoading: boolean
  todos: Todo[]
  hasSuggestions: boolean
  filteredSuggestions: Command[]
  selectedSuggestionIndex: number
  showHelp: boolean
}
```

---

## Message Interface

```typescript
interface Message {
  id: string
  role: 'user' | 'assistant' | 'system' | 'error'
  content: string
  timestamp: Date
  metadata?: {
    model?: string
    usage?: {
      promptTokens: number
      completionTokens: number
      totalTokens: number
    }
    toolCalls?: ToolCall[]
  }
}
```

---

## Todo Interface

```typescript
interface Todo {
  content: string              // "Fix bug in authentication"
  status: 'pending' | 'in_progress' | 'completed'
  activeForm: string           // "Fixing bug in authentication"
}
```

---

## Command Interface

```typescript
interface Command {
  cmd: string                  // "/help"
  desc: string                 // "Show help documentation"
  category: CommandCategory    // CONVERSATION | CONFIGURATION | ...
  aliases?: string[]           // ["/h", "/?"]
}
```

---

## 🔗 Navigation

[← Prev: SRS](./04-srs.md) | [Next: State →](./06-state-management.md) | [Up: Index ↑](../README.md)

---

**Last Updated**: 2025-01-08 | **Part**: 5/9
