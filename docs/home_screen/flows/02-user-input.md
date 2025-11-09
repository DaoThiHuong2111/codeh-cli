# 🎯 User Input Processing Flow

> **Phần 2/9** - Flow Diagrams | [← Prev: Startup](./01-startup.md) | [Next: Slash Commands →](./03-slash-commands.md) | [Up: Index ↑](../README.md)

---

## Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant Input
    participant Presenter
    participant Validator
    participant Service
    participant API

    User->>Input: Type "Hello AI"
    Input->>Presenter: handleInputChange("Hello AI")
    Presenter->>Presenter: this.input = "Hello AI"
    Presenter->>Presenter: _notifyView()
    Presenter-->>Input: Update UI

    User->>Input: Press Enter
    Input->>Presenter: handleSubmit("Hello AI")

    Presenter->>Validator: Validate input
    alt Invalid (empty or too long)
        Validator-->>Presenter: Validation error
        Presenter->>Presenter: Set inputError
        Presenter-->>Input: Show error
    else Valid
        Validator-->>Presenter: OK
        Presenter->>Presenter: isLoading = true
        Presenter->>Presenter: _notifyView()
        Presenter-->>Input: Show loading

        Presenter->>Service: sendMessage("Hello AI")
        Service->>Service: Create user message
        Service->>API: POST /messages

        alt API Success
            API-->>Service: response
            Service->>Service: Create assistant message
            Service-->>Presenter: assistantMessage
            Presenter->>Presenter: Update messages
            Presenter->>Presenter: isLoading = false
            Presenter-->>Input: Show response
        else API Error
            API-->>Service: error
            Service->>Service: Create error message
            Service-->>Presenter: throw error
            Presenter->>Presenter: Set inputError
            Presenter->>Presenter: isLoading = false
            Presenter-->>Input: Show error
        end
    end
```

---

## Validation Steps

```javascript
// Step 1: Empty check
if (!userInput.trim()) {
	throw 'Please enter a message';
}

// Step 2: Length check
if (userInput.length > 10000) {
	throw 'Message too long (max 10,000 characters)';
}

// Step 3: API check
if (!this.apiClient) {
	throw 'API not configured';
}
```

---

## 🔗 Navigation

[← Prev: Startup](./01-startup.md) | [Next: Slash Commands →](./03-slash-commands.md) | [Up: Index ↑](../README.md)

---

**Last Updated**: 2025-01-08 | **Part**: 2/9
