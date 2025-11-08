# 📝 Best Practices & Known Issues

> **Phần 9/9** - Technical Documentation | [← Prev: Errors](./08-error-handling.md) | [Up: Index ↑](../README.md)

---

## Best Practices

### 1. Component Design
✅ **DO**:
- Giữ components nhỏ và focused
- Sử dụng composition over inheritance
- Props drilling tối đa 2 levels
- Sử dụng semantic component names

❌ **DON'T**:
- Hardcode values trong components
- Mix business logic với UI logic
- Create components > 200 lines
- Use inline styles

### 2. State Management
✅ **DO**:
- Single source of truth (HomePresenter)
- Immutable state updates
- Notify view sau mọi state change
- Clear error states khi cần

❌ **DON'T**:
- Mutate state trực tiếp
- Store derived state
- Forget to notify view
- Keep stale error messages

### 3. Performance
✅ **DO**:
- Virtual scrolling cho long lists
- Debounce expensive operations
- Memoize filtered results
- Use stable callback references

❌ **DON'T**:
- Render all messages at once (> 40)
- Filter suggestions trong render
- Create new functions trong render
- Re-render unnecessarily

### 4. Error Handling
✅ **DO**:
- Validate input trước khi submit
- Show user-friendly error messages
- Log errors cho debugging
- Graceful degradation

❌ **DON'T**:
- Throw errors to user
- Ignore silent failures
- Show stack traces
- Crash on errors

---

## Known Issues

### 1. Missing Service Dependencies ⚠️
```javascript
// Home.js:19-20
import {getVersion, getCurrentDirectory} from '../../services/system/index.js';
import {getModel} from '../../services/config/index.js';
// ❌ Thư mục services/ không tồn tại
```
**Workaround**: Temporary functions hoặc move to presenter

### 2. No Offline Support
- Requires active internet connection
- No cached responses
- No queued messages

### 3. Memory Leaks (Potential)
- Long conversations (500+ messages) may cause issues
- No automatic cleanup
- Need periodic clear

### 4. Limited Error Recovery
- Network errors không retry
- Không có error boundary
- State loss on crash

---

## Future Enhancements

1. **Persistent History**: Save conversations to file
2. **Streaming Responses**: Real-time token streaming
3. **Multi-model Support**: Switch models mid-conversation
4. **Enhanced Todos**: Create/edit/delete todos
5. **Search & Filter**: Search conversation history
6. **Themes**: Dark/light mode support

---

## Testing Strategy

```javascript
// Unit Tests (HomePresenter)
describe('HomePresenter', () => {
  test('handleInputChange updates input state')
  test('handleSubmit validates empty input')
  test('handleSubmit calls ConversationService')
  test('handleSuggestionNavigate wraps around')
  test('clearConversation clears messages')
})

// Integration Tests (Home Screen)
describe('Home Screen', () => {
  test('renders all components')
  test('shows loading state during API call')
  test('displays error message on API failure')
  test('shows suggestions when typing /')
  test('toggles help overlay on ?')
})
```

---

## 🔗 Navigation

[← Prev: Errors](./08-error-handling.md) | [Up: Index ↑](../README.md)

**Hoàn thành phần Technical Documentation!**

Tiếp theo: [Flow Diagrams →](../flows/01-startup.md)

---

**Last Updated**: 2025-01-08 | **Part**: 9/9 (Final)
