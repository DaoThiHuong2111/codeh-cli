# CODEH CLI - User Guide

> Complete guide to using CODEH CLI with all features and shortcuts

**Version**: 1.2.0
**Last Updated**: 2025-01-08

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Home Screen Features](#home-screen-features)
3. [Keyboard Shortcuts](#keyboard-shortcuts)
4. [Slash Commands](#slash-commands)
5. [Advanced Features](#advanced-features)
6. [Tips & Tricks](#tips--tricks)
7. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Installation

```bash
npm install -g codeh-cli
```

### First Run

```bash
codeh
```

### Configuration

Set your API key:

```bash
export ANTHROPIC_API_KEY="your-key-here"
```

Or create a `.env` file:

```env
ANTHROPIC_API_KEY=your-key-here
MODEL=claude-3-5-sonnet
```

---

## Home Screen Features

### Conversation Area

The main conversation area displays all messages in your current session:

- **User Messages**: Your input (cyan color)
- **Assistant Messages**: AI responses with markdown rendering (green color)
- **System Messages**: Status updates (gray color)
- **Error Messages**: Error notifications (red color)

### Real-time Streaming

Responses are streamed in real-time as the AI generates them:

- Watch responses appear word-by-word
- Streaming indicator (▊) shows when AI is typing
- Interrupt-safe - won't corrupt messages

### Input Box

Enhanced input field with smart features:

#### Character Counter
- Shows `0/4000 characters` below input
- **Gray**: Normal usage (< 80%)
- **Yellow**: Approaching limit (80-95%) with ⚠️ warning
- **Red**: Limit reached (> 95%) with ⚠️ Limit reached!
- Blocks input beyond 4000 characters

#### Input Validation
- Empty messages are rejected
- Whitespace-only messages are rejected
- Clear error messages displayed

### Enhanced Footer

Real-time statistics bar at the bottom:

| Stat | Description | Example |
|------|-------------|---------|
| **Model** | Current AI model | claude-3-5-sonnet |
| **Messages** | Total messages in session | 12 |
| **Tokens** | Total tokens used | 1.5K |
| **Cost** | Estimated cost | $0.008 |
| **Duration** | Session time (MM:SS) | 05:32 |
| **Branch** | Git branch (if in repo) | feature/new-ui |

---

## Keyboard Shortcuts

### Global Shortcuts

| Key | Action | Description |
|-----|--------|-------------|
| **?** | Toggle Help | Show/hide help overlay |
| **Esc** | Clear/Close | Clear input or close overlay |
| **↑** | Previous Input | Navigate to previous message in history |
| **↓** | Next Input | Navigate to next message in history |
| **Enter** | Submit | Send message to AI |
| **Tab** | Select Suggestion | Select slash command suggestion |

### Input History

Navigate through your last 50 inputs:

1. Press **↑** to go to previous input
2. Press **↓** to go to next input
3. Press **↓** from newest returns to empty input
4. Automatically saves all submitted messages

**Example**:
```
> Hello           (Submit)
> How are you?    (Submit)
> (empty)         (Press ↑)
> How are you?    (Press ↑)
> Hello           (Press ↓)
> How are you?    (Press ↓)
> (empty)
```

---

## Slash Commands

Start typing `/` to see available commands:

### Core Commands

#### `/help`
Show comprehensive help overlay

```
> /help
```

#### `/clear`
Clear conversation history

```
> /clear
```

#### `/model [name]`
Switch AI model

```
> /model claude-3-5-sonnet
> /model claude-3-opus
```

#### `/session`
Manage sessions (new, save, load)

```
> /session new
> /session save my-session
> /session load my-session
```

### Using Suggestions

1. Type `/` to trigger suggestions
2. Use **↑↓** to navigate suggestions
3. Press **Tab** or **Enter** to select
4. Suggestions filter as you type

---

## Advanced Features

### Markdown Rendering

Assistant responses support rich markdown:

#### Headings
```markdown
# Heading 1
## Heading 2
### Heading 3
```

**Rendered**: Color-coded headings (cyan, yellow, etc.)

#### Code Blocks
````markdown
```javascript
const hello = () => {
  console.log("Hello, World!");
};
```
````

**Rendered**: Bordered code block with language label

#### Lists
```markdown
- Item 1
- Item 2
  - Nested item
- Item 3
```

**Rendered**: Bulleted list with proper indentation

#### Inline Formatting
```markdown
**bold text**
*italic text*
`inline code`
```

**Rendered**:
- **bold** (bright)
- *italic* (dimmed)
- `code` (gray background)

#### Blockquotes
```markdown
> Important note
> Continues here
```

**Rendered**: Bordered quote with dim color

### Task Tracking (Todos)

Visual task list that can be populated by AI or manually:

#### Display
- **📋 Tasks** header with completion count
- **Progress bar** showing % complete
- **Grouped by status**:
  - ⚡ In Progress (yellow, shown first)
  - ⏳ Pending (gray, shown second)
  - ✓ Completed (green dimmed, shown last)

#### Status Indicators
- **○** Pending (gray circle)
- **◐** In Progress (yellow half-circle)
- **●** Completed (green filled circle)

**Example**:
```
┌─ 📋 Tasks (2/4 completed) ───────┐
│ ████████████░░░░░░░░░░░░ 50%    │
│                                   │
│ ⚡ In Progress (1)                │
│   ◐ Implement feature X          │
│                                   │
│ ⏳ Pending (1)                    │
│   ○ Write tests                  │
│                                   │
│ ✓ Completed (2)                  │
│   ● Fix bug in parser            │
│   ● Update documentation         │
└───────────────────────────────────┘
```

### Help Overlay

Press **?** to see full help:

- **Keyboard Shortcuts** table
- **Slash Commands** list
- **Tips** for effective usage
- Press **?** or **Esc** to close

---

## Tips & Tricks

### 1. Efficient Messaging

✅ **DO**:
```
> Explain async/await in JavaScript with examples
```

❌ **DON'T**:
```
> Can you help me?
> I need to understand something
> It's about JavaScript
> Async/await
```

### 2. Use Slash Commands

Quick actions save time:
```
> /clear              # Clear history
> /model opus         # Switch to better model
> /help               # When stuck
```

### 3. Leverage Input History

Don't retype similar queries:
1. Press **↑** to find previous similar query
2. Edit it slightly
3. Submit modified version

### 4. Watch Token Usage

Monitor footer stats to manage API costs:
- **Tokens**: Track usage in real-time
- **Cost**: See estimated cost
- **Messages**: Know when to start new session

### 5. Markdown for Clarity

Ask AI to use markdown:
```
> Explain X with code examples (use markdown)
```

You'll get nicely formatted responses with:
- Syntax highlighted code blocks
- Organized lists
- Clear headings

### 6. Character Limit Awareness

Watch the character counter:
- **Gray**: Keep typing
- **Yellow**: Consider shortening or splitting
- **Red**: Must shorten (hard limit 4000)

**Tip**: Split very long requests into multiple messages

### 7. Use Todos for Complex Tasks

For multi-step tasks, ask AI to create todos:
```
> Create a plan to implement feature X as a todo list
```

Track progress visually with the todos display.

---

## Troubleshooting

### Issue: No Response from AI

**Symptoms**: Message sent but no response

**Solutions**:
1. Check API key is set: `echo $ANTHROPIC_API_KEY`
2. Verify internet connection
3. Check error messages in conversation
4. Try `/session new` to restart

### Issue: Slow Responses

**Symptoms**: AI takes long to respond

**Solutions**:
1. Check network speed
2. Try smaller model: `/model sonnet`
3. Shorter, more focused queries
4. Clear history if very long: `/clear`

### Issue: Character Limit Hit

**Symptoms**: Red warning, can't type more

**Solutions**:
1. Shorten message
2. Split into multiple messages
3. Remove unnecessary details
4. Use more concise language

### Issue: Input History Not Working

**Symptoms**: ↑↓ doesn't navigate history

**Solutions**:
1. Make sure you're not in slash command mode (`/...`)
2. Make sure help overlay is not open
3. Submit at least one message first
4. Check you're not in loading state

### Issue: Markdown Not Rendering

**Symptoms**: Seeing raw markdown instead of formatted

**Solutions**:
1. Only assistant messages render markdown
2. User messages show literal text
3. Check markdown syntax is correct
4. Some complex markdown may not render

### Issue: Todos Not Showing

**Symptoms**: No todos display

**Solutions**:
1. Todos only show when list is non-empty
2. Ask AI to create tasks
3. Or use presenter methods (advanced)

### Issue: Footer Stats Wrong

**Symptoms**: Incorrect token/cost counts

**Solutions**:
1. Stats reset on new session
2. Cost is estimated ($0.005 per 1K tokens average)
3. Tokens track cumulative for session
4. Duration includes idle time

---

## Keyboard Shortcuts Reference Card

```
┌─────────────────────────────────────┐
│     CODEH CLI Shortcuts             │
├─────────────────────────────────────┤
│  ?     → Toggle help overlay        │
│  Esc   → Clear input / Close        │
│  ↑     → Previous input             │
│  ↓     → Next input                 │
│  Enter → Submit message             │
│  Tab   → Select suggestion          │
│  /     → Slash commands             │
└─────────────────────────────────────┘
```

---

## Advanced Usage Examples

### Example 1: Code Review

```
> Review this code and suggest improvements:

```typescript
function processData(data) {
  let result = []
  for (let i = 0; i < data.length; i++) {
    if (data[i] > 0) {
      result.push(data[i] * 2)
    }
  }
  return result
}
```
```

**AI Response**: Markdown-formatted review with code examples

### Example 2: Step-by-Step Tutorial

```
> Teach me React hooks with examples, step by step
```

**AI Response**: Multi-part tutorial with:
- Headings for each step
- Code blocks with syntax highlighting
- Lists of key points
- Blockquotes for important notes

### Example 3: Complex Task Planning

```
> Create a detailed plan to build a todo app with React and TypeScript.
> Include it as a checklist I can track.
```

**AI Response**: Checklist that populates the todos display

---

## Feature Summary

| Feature | Shortcut | Description |
|---------|----------|-------------|
| **Streaming** | Auto | Real-time word-by-word responses |
| **Markdown** | Auto | Rich formatting for assistant messages |
| **Character Counter** | Auto | Smart limit warnings (4000 chars) |
| **Input History** | ↑↓ | Navigate last 50 inputs |
| **Help Overlay** | ? | Full shortcuts and commands |
| **Slash Commands** | / | Quick actions |
| **Todos** | Auto | Visual task tracking |
| **Footer Stats** | Auto | Tokens, cost, duration, branch |

---

## Support

- **Documentation**: `/docs` directory
- **Issues**: [GitHub Issues](https://github.com/your-repo/codeh-cli/issues)
- **Help Command**: Type `/help` in CLI

---

**Made with ❤️ by the CODEH team**
