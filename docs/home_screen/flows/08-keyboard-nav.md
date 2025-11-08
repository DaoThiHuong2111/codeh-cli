# ⌨️ Keyboard Navigation Flow

> **Phần 8/9** - Flow Diagrams | [← Prev: Loading States](./07-loading-states.md) | [Next: Performance →](./09-performance.md) | [Up: Index ↑](../README.md)

---

## Flowchart

```mermaid
flowchart TD
    Start([Key Press]) --> Type{Key Type?}

    Type -->|"?"| ToggleHelp[Toggle Help Overlay]
    Type -->|Ctrl+C| Exit[Exit Application]
    Type -->|Esc| EscAction{Context?}
    Type -->|Character| TypeChar[Add to input]
    Type -->|Backspace| DelChar[Remove character]
    Type -->|Enter| EnterAction{Mode?}
    Type -->|Arrow| ArrowAction{Mode?}

    EscAction -->|Help Open| CloseHelp[Close help]
    EscAction -->|Input Active| ClearInput[Clear input]

    EnterAction -->|Normal| Submit[Submit message]
    EnterAction -->|Suggestions| SelectSugg[Select suggestion]

    ArrowAction -->|Normal| NavHistory{Direction?}
    ArrowAction -->|Suggestions| NavSugg{Direction?}

    NavHistory -->|Up| PrevMsg[Previous message]
    NavHistory -->|Down| NextMsg[Next message]

    NavSugg -->|Up| PrevSugg[Previous suggestion]
    NavSugg -->|Down| NextSugg[Next suggestion]

    ToggleHelp --> Render[Re-render]
    Exit --> Close[Close app]
    CloseHelp --> Render
    ClearInput --> Render
    TypeChar --> Render
    DelChar --> Render
    Submit --> Process[Process message]
    SelectSugg --> Render
    PrevMsg --> Render
    NextMsg --> Render
    PrevSugg --> Render
    NextSugg --> Render

    Process --> Render
    Render --> End([Done])
    Close --> End

    style Submit fill:#51cf66
    style SelectSugg fill:#51cf66
    style Exit fill:#ff6b6b
```

---

## 🔗 Navigation

[← Prev: Loading States](./07-loading-states.md) | [Next: Performance →](./09-performance.md) | [Up: Index ↑](../README.md)

---

**Last Updated**: 2025-01-08 | **Part**: 8/9
