# 🔄 State Update Cycle

> **Phần 5/9** - Flow Diagrams | [← Prev: Error Handling](./04-error-handling.md) | [Next: Lifecycle →](./06-lifecycle.md) | [Up: Index ↑](../README.md)

---

## Flowchart

```mermaid
flowchart LR
    A[User Action] --> B[Handler Method]
    B --> C{Update State}

    C -->|input| D[this.input = value]
    C -->|messages| E[this.messages = [...]]
    C -->|loading| F[this.isLoading = bool]
    C -->|error| G[this.inputError = str]

    D --> H[_notifyView]
    E --> H
    F --> H
    G --> H

    H --> I[Call onViewUpdate callback]
    I --> J[React setState]
    J --> K[Re-render Components]
    K --> L[UI Updates]

    style A fill:#4dabf7
    style H fill:#fab005
    style J fill:#51cf66
    style L fill:#9775fa
```

---

## Code Flow

```javascript
// 1. User types in input
handleInputChange(value) {
  this.input = value;           // Update state
  this.inputError = '';         // Clear error
  this._notifyView();           // Trigger update
}

// 2. _notifyView triggers callback
_notifyView() {
  if (this.onViewUpdate) {
    this.onViewUpdate(this.getViewState());
  }
}

// 3. Callback updates React state
const handleViewUpdate = (viewState) => {
  setState(viewState);  // React re-renders
}

// 4. Components receive new props
<InputBox value={state.input} />
```

---

## 🔗 Navigation

[← Prev: Error Handling](./04-error-handling.md) | [Next: Lifecycle →](./06-lifecycle.md) | [Up: Index ↑](../README.md)

---

**Last Updated**: 2025-01-08 | **Part**: 5/9
