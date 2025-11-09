# Home Screen

Main chat interface của CODEH CLI - nơi user tương tác với AI assistant.

## Overview

Home Screen là màn hình chính của CODEH CLI, cung cấp giao diện chat với AI models. Screen này hỗ trợ streaming responses, slash commands, todos management, và hiển thị history conversations.

**Status**: ✅ Production Ready (v1.2.0)

## Features

### Core Features (Phase 1)

#### 1. Conversation History Display

- Hiển thị messages với role differentiation (user/assistant/system)
- Auto-scroll to latest message
- Timestamp display
- Message metadata (tokens used, model info)
- Markdown rendering cho responses

#### 2. Streaming Support

- Real-time word-by-word responses
- Server-Sent Events (SSE) protocol
- Provider-agnostic implementation (Anthropic, OpenAI, Ollama, Generic)
- Streaming indicator (▊)
- Interrupt-safe state management

#### 3. Interactive Input Box

- Multi-line text input với auto-expansion
- Submit với Enter, new line với Shift+Enter
- Input validation và sanitization
- Character count display
- Slash command suggestions

#### 4. Error Handling

- Graceful error display
- Network error recovery
- API error messages
- Validation errors
- Retry mechanisms

### Advanced Features (Phase 2)

#### 5. Slash Commands

**Available commands**:

- `/help` - Show help overlay
- `/clear` - Clear conversation
- `/save [name]` - Save session
- `/load [name]` - Load session
- `/config` - Open config screen
- `/exit` - Exit application
- `/model [name]` - Switch model
- `/todos` - Toggle todos panel

**Features**:

- Auto-suggestions as user types
- Fuzzy matching cho command names
- Tab completion
- Command history
- Parameter validation

#### 6. Todos Management

- Add/remove todos from chat
- Real-time todos display trong sidebar
- Toggle todos panel visibility
- Mark todos as completed
- Todos persistence across sessions

#### 7. Session Management

- Save conversations với custom names
- Load previous sessions
- Session metadata (date, message count, tokens)
- Auto-save draft
- Session list với preview

#### 8. Markdown Rendering

- Full markdown support trong messages
- Code syntax highlighting
- Tables, lists, blockquotes
- Links (non-clickable, display only)
- Inline formatting (bold, italic, code)

#### 9. Help Overlay

- Keyboard shortcuts reference
- Command list với descriptions
- Feature explanations
- Toggle với `/help` hoặc `?` key

#### 10. Keyboard Navigation

**Shortcuts**:

- `Ctrl+C` - Exit application
- `Ctrl+L` - Clear screen
- `Ctrl+R` - Reload configuration
- `Ctrl+S` - Save session
- `Ctrl+O` - Load session
- `Ctrl+T` - Toggle todos
- `Tab` - Command completion
- `?` - Toggle help

## Usage

### Starting a Chat

```bash
codeh
```

Sau khi launch, Home Screen sẽ hiển thị:

```
╭─────────────────────────────────────╮
│  CODEH - AI Chat Assistant          │
├─────────────────────────────────────┤
│                                      │
│  [No messages yet]                   │
│                                      │
│  Type a message to start...          │
│                                      │
├─────────────────────────────────────┤
│ > _                                  │
╰─────────────────────────────────────╯
```

### Sending Messages

1. Type message vào input box
2. Press `Enter` để send
3. Wait for streaming response
4. Message sẽ appear trong conversation area

### Using Slash Commands

```
> /help
[Help overlay appears]

> /save my-session
✓ Session saved as "my-session"

> /model gpt-4
✓ Switched to model: gpt-4
```

### Managing Todos

```
> add todo: Implement feature X
✓ Todo added

> /todos
[Todos panel toggles]
```

## Components

### Main Components

- **ConversationArea**: Displays chat history
  - MessageBubble: Individual message display
  - MarkdownText: Markdown rendering
  - Spinner: Loading indicator
- **InputBox**: Message input field
- **SlashSuggestions**: Command suggestions dropdown
- **TodosDisplay**: Todos sidebar panel
- **HelpOverlay**: Help modal
- **Footer**: Status bar với shortcuts

### Layout Structure

```
┌─────────────────────────────────────┐
│          Navigation Bar              │
├─────────────────────┬───────────────┤
│                     │               │
│  Conversation Area  │  Todos Panel  │
│                     │  (toggle)     │
│                     │               │
├─────────────────────┴───────────────┤
│  Input Box                          │
├─────────────────────────────────────┤
│  Footer (shortcuts)                 │
└─────────────────────────────────────┘
```

## State Management

### State Structure

```typescript
interface HomeState {
	messages: Message[];
	currentInput: string;
	isStreaming: boolean;
	error: string | null;
	todos: Todo[];
	showTodos: boolean;
	showHelp: boolean;
	sessionName: string | null;
}
```

### State Updates

- **Messages**: Append on send, update on stream
- **Input**: Update on typing, clear on send
- **Streaming**: Set true on send, false on complete
- **Todos**: Add/remove/toggle as user interacts
- **UI toggles**: Boolean flags cho panels

## Performance

### Optimizations

- Message list virtualization (chỉ render visible messages)
- Memoized markdown rendering
- Debounced input updates
- Lazy loading cho sessions
- Chunked streaming (avoid buffer overflow)

### Metrics

- **Initial render**: < 100ms
- **Message append**: < 50ms
- **Streaming latency**: < 100ms per chunk
- **Command execution**: < 200ms

## Testing

200+ tests covering:

- Component rendering
- User interactions
- Streaming logic
- Error handling
- State management
- Keyboard shortcuts
- Slash commands
- Session management

See [Technical Documentation](./technical.md) for implementation details.

## See Also

- [Features Documentation](./features.md)
- [Technical Documentation](./technical.md)
- [User Flows](./flows.md)
- [User Guide](../../guides/user-guide.md)
