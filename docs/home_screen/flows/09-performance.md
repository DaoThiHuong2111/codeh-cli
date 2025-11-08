# 📊 Performance Optimization

> **Phần 9/9** - Flow Diagrams | [← Prev: Keyboard Nav](./08-keyboard-nav.md) | [Up: Index ↑](../README.md)

---

## Virtual Scrolling

```mermaid
flowchart LR
    Messages[All Messages<br/>1000 items] --> Check{Count > 40?}
    Check -->|No| RenderAll[Render All]
    Check -->|Yes| Virtual[Virtual Scrolling]

    Virtual --> Calc[Calculate visible range]
    Calc --> Slice[Slice array<br/>scrollPos ± 20]
    Slice --> RenderVisible[Render 40 items]

    RenderAll --> DOM[To DOM]
    RenderVisible --> DOM

    style Virtual fill:#51cf66
    style RenderAll fill:#ff6b6b
```

---

## Suggestion Filtering

```mermaid
flowchart LR
    Input[User Input] --> Cache{Cached?}
    Cache -->|Yes| Return[Return cached]
    Cache -->|No| Filter[Filter commands]
    Filter --> Store[Store in cache]
    Store --> Return

    Return --> Display[Display suggestions]

    style Cache fill:#51cf66
    style Filter fill:#fab005
```

---

## 🔗 Navigation

[← Prev: Keyboard Nav](./08-keyboard-nav.md) | [Up: Index ↑](../README.md)

**Hoàn thành phần Flow Diagrams!**

Xem tiếp: [Quick Reference →](../quick-reference.md)

---

**Last Updated**: 2025-01-08 | **Part**: 9/9 (Final)
