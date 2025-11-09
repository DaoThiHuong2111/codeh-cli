# 🔄 Component Lifecycle & Communication

> **Phần 6/9** - Flow Diagrams | [← Prev: State Updates](./05-state-updates.md) | [Next: Loading States →](./07-loading-states.md) | [Up: Index ↑](../README.md)

---

## Lifecycle Sequence

```mermaid
sequenceDiagram
    participant React
    participant Home
    participant Hook
    participant Presenter
    participant Service

    Note over React,Service: Mount Phase

    React->>Home: Mount <Home />
    Home->>Hook: useHomePresenter()
    Hook->>Presenter: useDI(TOKENS.HomePresenter)
    Presenter->>Service: Inject dependencies

    Hook->>Presenter: setViewUpdateCallback(callback)
    Hook->>Presenter: init()
    Presenter->>Service: loadHistory()
    Service-->>Presenter: messages
    Presenter->>Hook: onViewUpdate(viewState)
    Hook->>Home: setState(viewState)
    Home->>React: Render UI

    Note over React,Service: Update Phase

    React->>Home: User input changed
    Home->>Presenter: handleInputChange(value)
    Presenter->>Presenter: Update internal state
    Presenter->>Hook: onViewUpdate(newState)
    Hook->>Home: setState(newState)
    Home->>React: Re-render

    Note over React,Service: Unmount Phase

    React->>Home: Unmount
    Home->>Hook: Cleanup useEffect
    Hook->>Presenter: setViewUpdateCallback(null)
    Presenter->>Presenter: Clear callback
```

---

## Component Communication

```mermaid
graph TB
    subgraph "Home Screen"
        Home[Home Component]

        subgraph "Header"
            Logo[Logo]
            Info[InfoSection]
        end

        subgraph "Main Area"
            Conv[ConversationArea]
            Todos[TodosDisplay]
            Tips[TipsDisplay]
        end

        subgraph "Input Area"
            Input[InputPromptArea]
            Suggest[SlashSuggestions]
        end

        Footer[Footer]
        Help[HelpOverlay]
    end

    Presenter[HomePresenter] -.->|State| Home
    Home -->|Props| Logo
    Home -->|Props| Info
    Home -->|Props| Conv
    Home -->|Props| Todos
    Home -->|Props| Tips
    Home -->|Props| Input
    Home -->|Props| Suggest
    Home -->|Props| Footer
    Home -->|Props| Help

    Input -.->|Events| Presenter
    Suggest -.->|Events| Presenter
    Help -.->|Events| Presenter

    style Presenter fill:#fab005
    style Home fill:#4dabf7
    style Input fill:#51cf66
```

---

## Lifecycle Hooks

```javascript
// Mount
useEffect(() => {
	presenter.setViewUpdateCallback(handleUpdate);
	presenter.init(); // Load initial data

	return () => {
		// Unmount
		presenter.setViewUpdateCallback(null);
	};
}, [presenter]);

// Every render
const viewState = presenter.getViewState();
```

---

## 🔗 Navigation

[← Prev: State Updates](./05-state-updates.md) | [Next: Loading States →](./07-loading-states.md) | [Up: Index ↑](../README.md)

---

**Last Updated**: 2025-01-08 | **Part**: 6/9
