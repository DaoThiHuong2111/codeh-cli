# 🚨 Error Handling Flow

> **Phần 4/9** - Flow Diagrams | [← Prev: Slash Commands](./03-slash-commands.md) | [Next: State Updates →](./05-state-updates.md) | [Up: Index ↑](../README.md)

---

## Flowchart

```mermaid
flowchart TD
    Start([User Action]) --> InputCheck{Input Valid?}

    InputCheck -->|Empty| EmptyError[Set: Please enter message]
    InputCheck -->|Too Long| LengthError[Set: Message too long]
    InputCheck -->|Valid| APICheck{API Configured?}

    EmptyError --> DisplayError[Display below input]
    LengthError --> DisplayError

    APICheck -->|No| ConfigError[Throw: API not configured]
    APICheck -->|Yes| SendAPI[Send to API]

    ConfigError --> AddErrorMsg[Add error message to conversation]

    SendAPI --> APIResponse{API Response?}

    APIResponse -->|Success| UpdateMessages[Update messages array]
    APIResponse -->|Network Error| NetworkError[Catch: Network error]
    APIResponse -->|Auth Error| AuthError[Catch: 401 Unauthorized]
    APIResponse -->|Rate Limit| RateError[Catch: 429 Rate limit]
    APIResponse -->|Server Error| ServerError[Catch: 500 Server error]

    NetworkError --> AddErrorMsg
    AuthError --> AddErrorMsg
    RateError --> AddErrorMsg
    ServerError --> AddErrorMsg

    UpdateMessages --> ClearError[Clear inputError]
    AddErrorMsg --> SetError[Set inputError]

    ClearError --> Render[Re-render UI]
    SetError --> Render
    DisplayError --> Render

    Render --> End([Done])

    style EmptyError fill:#ff6b6b
    style LengthError fill:#ff6b6b
    style ConfigError fill:#ff6b6b
    style NetworkError fill:#ff6b6b
    style AuthError fill:#ff6b6b
    style RateError fill:#ff6b6b
    style ServerError fill:#ff6b6b
    style UpdateMessages fill:#51cf66
    style ClearError fill:#51cf66
```

---

## Error Display Strategy

```
┌─────────────────────────────────────┐
│ ConversationArea                    │
│                                     │
│ > You: Hello                        │
│ ✗ Error: API not configured         │ ← Error role message
│                                     │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ ⚠ Message too long (max 10,000...) │ ← inputError
├─────────────────────────────────────┤
│ > Your very long message_           │
└─────────────────────────────────────┘
```

---

## 🔗 Navigation

[← Prev: Slash Commands](./03-slash-commands.md) | [Next: State Updates →](./05-state-updates.md) | [Up: Index ↑](../README.md)

---

**Last Updated**: 2025-01-08 | **Part**: 4/9
