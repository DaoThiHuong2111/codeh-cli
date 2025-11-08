# ⚡ Slash Command Flow

> **Phần 3/9** - Flow Diagrams | [← Prev: User Input](./02-user-input.md) | [Next: Error Handling →](./04-error-handling.md) | [Up: Index ↑](../README.md)

---

## Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant Input
    participant Presenter
    participant Registry
    participant Suggestions

    User->>Input: Type "/"
    Input->>Presenter: handleInputChange("/")
    Presenter->>Registry: filterByInput("/")
    Registry-->>Presenter: All commands
    Presenter->>Presenter: hasSuggestions() = true
    Presenter->>Presenter: _notifyView()
    Presenter-->>Suggestions: Show all commands

    User->>Input: Type "/he"
    Input->>Presenter: handleInputChange("/he")
    Presenter->>Registry: filterByInput("/he")
    Registry-->>Presenter: ["/help"]
    Presenter->>Presenter: _notifyView()
    Presenter-->>Suggestions: Show filtered ["/help"]

    User->>Input: Press ↓
    Input->>Presenter: handleSuggestionNavigate("down")
    Presenter->>Presenter: selectedIndex++
    Presenter->>Presenter: _notifyView()
    Presenter-->>Suggestions: Highlight next item

    User->>Input: Press ↑
    Input->>Presenter: handleSuggestionNavigate("up")
    Presenter->>Presenter: selectedIndex--
    Presenter->>Presenter: _notifyView()
    Presenter-->>Suggestions: Highlight previous item

    User->>Input: Press Enter
    Input->>Presenter: handleSuggestionSelect()
    Presenter->>Registry: Get selected command
    Registry-->>Presenter: "/help"
    Presenter-->>Input: Return "/help"
    Input->>Input: Set input value = "/help"
    Input->>Presenter: handleSubmit("/help")
    Presenter->>Presenter: Execute command
```

---

## Command Registry

```javascript
// Centralized in SlashCommand.js
const COMMANDS = [
  { cmd: '/help', desc: 'Show help', category: 'CONVERSATION' },
  { cmd: '/clear', desc: 'Clear history', category: 'CONVERSATION' },
  { cmd: '/model', desc: 'Change model', category: 'CONFIGURATION' },
  { cmd: '/config', desc: 'Configure', category: 'CONFIGURATION' },
  { cmd: '/todos', desc: 'Show todos', category: 'DEVELOPMENT' },
  { cmd: '/exit', desc: 'Exit app', category: 'SYSTEM' },
]

// With aliases support
{ cmd: '/help', aliases: ['/h', '/?'] }
```

---

## 🔗 Navigation

[← Prev: User Input](./02-user-input.md) | [Next: Error Handling →](./04-error-handling.md) | [Up: Index ↑](../README.md)

---

**Last Updated**: 2025-01-08 | **Part**: 3/9
