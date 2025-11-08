# 📊 State Management

> **Phần 6/9** - Technical Documentation | [← Prev: API](./05-api-interfaces.md) | [Next: Keyboard →](./07-keyboard.md) | [Up: Index ↑](../README.md)

---

## State Hierarchy

```
HomePresenter (Single Source of Truth)
  │
  ├─> input: string
  │     └─> Controlled by: handleInputChange()
  │     └─> Reset by: handleSubmit()
  │
  ├─> messages: Message[]
  │     └─> Updated by: ConversationService
  │     └─> Cleared by: clearConversation()
  │
  ├─> todos: Todo[]
  │     └─> Updated by: External source (future)
  │
  ├─> isLoading: boolean
  │     └─> Set true: before API call
  │     └─> Set false: after API response/error
  │
  ├─> inputError: string
  │     └─> Set by: validation errors
  │     └─> Cleared by: handleInputChange()
  │
  ├─> selectedSuggestionIndex: number
  │     └─> Updated by: handleSuggestionNavigate()
  │     └─> Reset by: handleInputChange()
  │
  └─> showHelp: boolean
        └─> Toggled by: toggleHelp()
```

---

## State Update Pattern

```javascript
// Pattern: Update → Notify → Re-render
handleInputChange(value) {
  // 1. Update state
  this.input = value;
  this.selectedSuggestionIndex = 0;
  this.inputError = '';

  // 2. Notify view
  this._notifyView();

  // 3. React re-renders automatically
}
```

---

## State Persistence

```javascript
// Current: In-memory only
// messages: Cleared on app restart
// todos: Cleared on app restart
// input: Cleared on submit

// Future: Persistence via HistoryRepository
// - Save messages to ~/.codeh/history.json
// - Load on init()
// - Auto-save on message add
```

---

## 🔗 Navigation

[← Prev: API](./05-api-interfaces.md) | [Next: Keyboard →](./07-keyboard.md) | [Up: Index ↑](../README.md)

---

**Last Updated**: 2025-01-08 | **Part**: 6/9
