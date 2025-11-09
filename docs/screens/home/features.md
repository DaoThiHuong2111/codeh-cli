# Home Screen - Features

Chi tiết đầy đủ về tất cả features của Home Screen.

## 1. Conversation Display

**Components**: `ConversationArea`, `MessageBubble`

- Display messages theo chronological order
- Role-based styling (user vs assistant)
- Timestamp cho mỗi message
- Metadata display (tokens, model used)
- Auto-scroll to latest

## 2. Streaming Responses

**Implementation**: SSE (Server-Sent Events)

- Word-by-word streaming
- Hỗ trợ 4 providers: Anthropic, OpenAI, Ollama, Generic
- Streaming indicator: ▊
- Interrupt-safe (có thể cancel mid-stream)

## 3. Input Handling

**Component**: `InputBox`

- Multi-line support
- Enter to send, Shift+Enter for new line
- Character count
- Input validation
- Slash command detection

## 4. Slash Commands

Tất cả slash commands available:

| Command            | Description                   | Example            |
| ------------------ | ----------------------------- | ------------------ |
| `/help`            | Show help overlay             | `/help`            |
| `/clear`           | Clear conversation            | `/clear`           |
| `/save [name]`     | Save session                  | `/save my-session` |
| `/load [name]`     | Load session                  | `/load my-session` |
| `/config`          | Open config screen            | `/config`          |
| `/exit`            | Exit app                      | `/exit`            |
| `/model [name]`    | Switch model                  | `/model gpt-4`     |
| `/todos`           | Toggle todos                  | `/todos`           |
| `/provider [name]` | Switch provider               | `/provider openai` |
| `/history`         | Show session history          | `/history`         |

**Features**:
- Auto-suggestions
- Tab completion
- Fuzzy matching

## 5. Todos Management

**Component**: `TodosDisplay`

- Add from chat: "add todo: Task description"
- Mark complete: Click on todo
- Delete: Remove from panel
- Toggle panel: `/todos` or `Ctrl+T`
- Persistence across sessions

## 6. Session Management

**Features**:
- Save với custom name
- Load previous sessions
- Auto-save draft every 30s
- Session metadata tracking
- List all saved sessions

## 7. Markdown Rendering

**Component**: `MarkdownText`

**Supported**:
- Headings (H1-H6)
- Bold, italic, strikethrough
- Code blocks với syntax highlighting
- Inline code
- Lists (ordered & unordered)
- Blockquotes
- Tables
- Links (display only)

## 8. Help System

**Component**: `HelpOverlay`

**Content**:
- Keyboard shortcuts reference
- Slash commands list
- Feature descriptions
- Tips & tricks

**Trigger**: `/help` or `?` key

## 9. Keyboard Shortcuts

| Shortcut | Action                |
| -------- | --------------------- |
| `Ctrl+C` | Exit                  |
| `Ctrl+L` | Clear screen          |
| `Ctrl+R` | Reload config         |
| `Ctrl+S` | Save session          |
| `Ctrl+O` | Load session          |
| `Ctrl+T` | Toggle todos          |
| `Tab`    | Command completion    |
| `?`      | Toggle help           |

## 10. Error Handling

**Types of errors handled**:

- Network errors (retry với exponential backoff)
- API errors (display user-friendly messages)
- Validation errors (inline feedback)
- Rate limiting (queue requests)
- Timeout errors (configurable timeout)

**Error Display**:
- Error messages in red
- Retry options
- Clear error state
- Log errors for debugging

## Feature Flags

Một số features có thể toggle trong config:

```json
{
  "features": {
    "streaming": true,
    "todos": true,
    "markdown": true,
    "autoSave": true
  }
}
```

## Upcoming Features (Roadmap)

- [ ] Multi-session tabs
- [ ] Code execution trong chat
- [ ] File attachments
- [ ] Voice input
- [ ] Export conversations
- [ ] Search trong history
- [ ] Custom themes
- [ ] Plugin system

See [Technical Documentation](./technical.md) for implementation details.
