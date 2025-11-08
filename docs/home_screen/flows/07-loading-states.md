# ⏳ Loading States

> **Phần 7/9** - Flow Diagrams | [← Prev: Lifecycle](./06-lifecycle.md) | [Next: Keyboard Nav →](./08-keyboard-nav.md) | [Up: Index ↑](../README.md)

---

## State Diagram

```mermaid
stateDiagram-v2
    [*] --> Idle: Initial

    Idle --> Loading: User submits
    Loading --> Idle: Success
    Loading --> Error: API Error
    Error --> Idle: User types

    Idle: isLoading = false<br/>messages = []
    Loading: isLoading = true<br/>Show spinner
    Error: isLoading = false<br/>inputError set

    note right of Loading
        • Disable input
        • Show "Thinking..."
        • Animate spinner
    end note

    note right of Error
        • Show error message
        • Keep input value
        • Enable retry
    end note
```

---

## Component States

```javascript
// Idle
{ isLoading: false, inputError: '', messages: [] }
→ Show: TipsDisplay

// Loading
{ isLoading: true, inputError: '', messages: [...] }
→ Show: LoadingIndicator "Thinking..."

// With Todos
{ isLoading: false, todos: [...] }
→ Show: TodosDisplay

// Error
{ isLoading: false, inputError: 'API error...' }
→ Show: Error below input + error in conversation
```

---

## 🔗 Navigation

[← Prev: Lifecycle](./06-lifecycle.md) | [Next: Keyboard Nav →](./08-keyboard-nav.md) | [Up: Index ↑](../README.md)

---

**Last Updated**: 2025-01-08 | **Part**: 7/9
