# ⚙️ Luồng Xử Lý Logic

> **Phần 3/9** - Technical Documentation | [← Prev: Components](./02-components.md) | [Next: SRS →](./04-srs.md) | [Up: Index ↑](../README.md)

---

## 1. Initialization Flow

```mermaid
sequenceDiagram
    participant User
    participant Home
    participant useHomePresenter
    participant HomePresenter
    participant ConversationService

    User->>Home: Open app
    Home->>useHomePresenter: Initialize hook
    useHomePresenter->>HomePresenter: useDI(TOKENS.HomePresenter)
    HomePresenter->>ConversationService: Inject via DI
    HomePresenter->>HomePresenter: init()
    HomePresenter->>ConversationService: loadHistory()
    ConversationService-->>HomePresenter: messages[]
    HomePresenter->>Home: _notifyView()
    Home->>User: Render UI
```

---

## 2. User Input Flow

```mermaid
sequenceDiagram
    participant User
    participant InputBox
    participant HomePresenter
    participant ConversationService
    participant APIClient

    User->>InputBox: Type message
    InputBox->>HomePresenter: handleInputChange(value)
    HomePresenter->>HomePresenter: this.input = value
    HomePresenter->>HomePresenter: _notifyView()

    User->>InputBox: Press Enter
    InputBox->>HomePresenter: handleSubmit(input)
    HomePresenter->>HomePresenter: Validate input

    alt Invalid input
        HomePresenter->>InputBox: Set inputError
    else Valid input
        HomePresenter->>HomePresenter: isLoading = true
        HomePresenter->>ConversationService: sendMessage(input)
        ConversationService->>APIClient: sendMessage()
        APIClient-->>ConversationService: response
        ConversationService-->>HomePresenter: assistantMessage
        HomePresenter->>HomePresenter: isLoading = false
        HomePresenter->>HomePresenter: _notifyView()
    end
```

---

## 3. Slash Command Flow

```mermaid
sequenceDiagram
    participant User
    participant InputBox
    participant HomePresenter
    participant SlashCommandRegistry
    participant SlashSuggestions

    User->>InputBox: Type "/"
    InputBox->>HomePresenter: handleInputChange("/")
    HomePresenter->>SlashCommandRegistry: filterByInput("/")
    SlashCommandRegistry-->>HomePresenter: filtered commands
    HomePresenter->>HomePresenter: _notifyView()
    HomePresenter->>SlashSuggestions: Show suggestions

    User->>InputBox: Press ↓
    InputBox->>HomePresenter: handleSuggestionNavigate("down")
    HomePresenter->>HomePresenter: selectedIndex++
    HomePresenter->>HomePresenter: _notifyView()

    User->>InputBox: Press Enter
    InputBox->>HomePresenter: handleSuggestionSelect()
    HomePresenter-->>InputBox: selected command
    InputBox->>InputBox: Set input = command
```

---

## 4. State Update Flow

```javascript
// HomePresenter Internal Flow
_notifyView() {
  if (this.onViewUpdate) {
    this.onViewUpdate(this.getViewState());
  }
}

// useHomePresenter Hook
useEffect(() => {
  const handleViewUpdate = (viewState) => {
    setState(viewState);
  };

  presenter.setViewUpdateCallback(handleViewUpdate);
  presenter.init();

  return () => {
    presenter.setViewUpdateCallback(null);
  };
}, [presenter]);
```

---

## 🔗 Navigation

[← Prev: Components](./02-components.md) | [Next: SRS →](./04-srs.md) | [Up: Index ↑](../README.md)

---

**Last Updated**: 2025-01-08 | **Part**: 3/9
