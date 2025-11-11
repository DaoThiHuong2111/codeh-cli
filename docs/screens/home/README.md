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

#### 9. Permission Mode Management

- Toggle between MVP (YOLO) và Interactive modes
- MVP Mode: Auto-approve all tool executions (fast workflow)
- Interactive Mode: Ask before executing tools (safe workflow)
- Runtime switching với `Shift+Tab`
- Mode indicator trong Footer
- Visual feedback với color coding (cyan for MVP, green for Interactive)

#### 10. Keyboard Navigation

**Active Shortcuts** (Layer-based system):

- `Shift+Tab` - Toggle permission mode (MVP ↔ Interactive)
- `Escape` - Clear input (when input is not empty)
- `Up Arrow` - Navigate suggestions up (when suggestions visible) or history up
- `Down Arrow` - Navigate suggestions down (when suggestions visible) or history down
- `Tab` - Select suggestion (when suggestions visible)
- `Enter` - Select suggestion (when suggestions visible) or submit message
- `Ctrl+C` - Exit application (double press for confirmation)

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
  - MarkdownText: Markdown rendering with syntax highlighting
  - ToolCallDisplay: Tool execution visualization
  - ToolResultDisplay: Tool execution results
  - Spinner: Loading indicator
- **InputBox**: Message input field with auto-resize
- **SlashSuggestions**: Command suggestions dropdown with fuzzy search
- **TodosDisplay**: Todos sidebar panel với progress tracking
- **Footer**: Enhanced status bar showing:
  - Model name
  - Estimated cost
  - Session duration
  - Git branch (if available)
  - Permission mode indicator (YOLO/Ask before edits)
- **Logo**: CODEH branding display
- **InfoSection**: Version, model, and directory information

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
interface HomePresenterState {
	// Messages
	messages: Message[];
	streamingMessageId: string | null;
	isLoading: boolean;

	// Input
	input: string;
	inputError: string | null;

	// Todos
	todos: Todo[];

	// Slash command suggestions
	filteredSuggestions: Command[];
	selectedSuggestionIndex: number;

	// Session info
	version: string;
	model: string;
	directory: string;
	gitBranch?: string;

	// Stats
	messageCount: number;
	totalTokens: number;
	estimatedCost: number;
	sessionDuration: number;
}
```

### State Updates

- **Messages**: Append on send, real-time streaming updates via streamingMessageId
- **Input**: Update on typing, clear on submit, validation on change
- **Loading**: Set true on send, false on complete/error
- **Todos**: Auto-parsed from AI responses, status updates (pending → in_progress → completed)
- **Suggestions**: Filtered based on input starting with '/', navigation with up/down arrows
- **Stats**: Auto-calculated from message history (tokens, cost, duration)
- **Permission Mode**: Toggle via Shift+Tab, persisted in PermissionModeManager

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
- [LLM UI/UX Implementation](./llm-ui-ux.md) - UI/UX cho streaming LLM responses
- [User Flows](./flows.md)
- [User Guide](../../guides/user-guide.md)
- [LLM API Integration](../../architecture/llm-api-integration.md) - Backend API integration
