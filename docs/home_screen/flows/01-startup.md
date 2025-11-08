# 🔄 Application Startup Flow

> **Phần 1/9** - Flow Diagrams | [Next: User Input →](./02-user-input.md) | [Up: Index ↑](../README.md)

---

## Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant CLI
    participant App
    participant DI
    participant Home
    participant Presenter
    participant Service

    User->>CLI: npm start / codeh
    CLI->>App: Load App.js
    App->>DI: setupContainer(config)
    DI->>DI: Register services
    DI-->>App: container

    App->>Home: Render <Home />
    Home->>DI: useDI(TOKENS.HomePresenter)
    DI->>Presenter: Create HomePresenter
    DI->>Service: Inject ConversationService
    Presenter->>Presenter: constructor()

    Home->>Presenter: useEffect → init()
    Presenter->>Service: loadHistory()
    Service-->>Presenter: messages[]
    Presenter->>Presenter: _notifyView()
    Presenter-->>Home: viewState
    Home->>User: Display UI
```

---

## Chi tiết

1. CLI khởi động từ `npm start` hoặc binary `codeh`
2. App.js setup DI container với config từ env
3. Home component mount và resolve presenter từ DI
4. Presenter inject ConversationService
5. useEffect gọi init() để load history
6. View update và render UI

---

## 🔗 Navigation

[Next: User Input →](./02-user-input.md) | [Up: Index ↑](../README.md)

---

**Last Updated**: 2025-01-08 | **Part**: 1/9
