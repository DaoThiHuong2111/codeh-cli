# 🏠 Màn Hình Home - Tổng Quan & Kiến Trúc

> **Phần 1/9** - Technical Documentation | [Next: Components →](./02-components.md) | [Up: Index ↑](../README.md)

---

## 🎯 Tổng Quan

### Mục đích
Màn hình **Home** là màn hình chính của ứng dụng CODEH CLI, nơi người dùng tương tác với AI assistant thông qua giao diện command-line interface.

### Đặc điểm chính
- ✅ **Pure UI Component**: Không chứa business logic
- ✅ **MVP Pattern**: Logic xử lý qua `HomePresenter`
- ✅ **Dependency Injection**: Presenter inject qua DI Container
- ✅ **Real-time Updates**: Auto-update khi state thay đổi
- ✅ **Responsive**: Adaptive layout dựa trên state

### File chính
```
source/cli/screens/Home.js              # UI Component
source/cli/presenters/HomePresenter.js  # Business Logic
source/cli/hooks/useHomePresenter.js    # React Hook Bridge
```

---

## 🏗️ Kiến Trúc

### Design Pattern: MVP (Model-View-Presenter)

```
┌─────────────────────────────────────────────────────────────┐
│                        Home Screen                          │
│                         (View)                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ useHomePresenter()
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    HomePresenter                            │
│                     (Presenter)                             │
│  - handleInputChange()                                      │
│  - handleSubmit()                                           │
│  - handleSuggestionNavigate()                               │
│  - toggleHelp()                                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ inject via DI
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                ConversationService                          │
│                      (Model)                                │
│  - sendMessage()                                            │
│  - getHistory()                                             │
│  - clearHistory()                                           │
└─────────────────────────────────────────────────────────────┘
```

### Dependency Injection Flow

```
App.js
  └─> setupContainer()
       └─> DIProvider (container)
            └─> Home Screen
                 └─> useHomePresenter()
                      └─> useDI(TOKENS.HomePresenter)
                           └─> Resolve HomePresenter
                                └─> Inject ConversationService
```

---

## 🔗 Navigation

[Next: Components →](./02-components.md) | [Up: Index ↑](../README.md)

---

**Last Updated**: 2025-01-08 | **Part**: 1/9
