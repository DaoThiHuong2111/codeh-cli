# 🎨 Phase 2: Advanced UX Implementation Guide (v1.2.0)

> **Part 7/8** | [← Prev: Phase 1 Features](./06-phase1-core-features.md) | [Next: Testing Strategy →](./08-testing-strategy.md)

---

## 📋 Phase 2 Overview

**Objective**: Rich UX và unique features

**Timeline**: 3-4 weeks

**Priority**: 🟡 IMPORTANT

**Prerequisites**: Phase 1 (v1.1) hoàn thành

---

## 🎯 Phase 2 Features

### 1. Keyboard Shortcuts & Input History
### 2. Markdown Rendering
### 3. Todos Display
### 4. Enhanced Footer
### 5. Help Overlay
### 6. Character Counter

---

## 🔷 Feature 1: Keyboard Shortcuts & Input History

**Priority**: 🟡 MEDIUM | **Effort**: 2 days

### Objective
- Keyboard shortcuts: `?`, `Esc`, `Ctrl+L`, etc.
- Input history navigation với ↑↓

### Implementation Steps

#### Step 1: Add Input History to HomePresenter (Day 1)
```bash
# File to modify:
- source/cli/presenters/HomePresenter.ts
```

**Tasks**:
- [ ] Add inputHistory: string[] to state
- [ ] Add currentHistoryIndex to state
- [ ] Implement navigateHistory(direction) method
- [ ] Implement addToInputHistory() private method
- [ ] Limit history to 50 items

**Code**:
```typescript
navigateHistory(direction: 'up' | 'down') {
  const history = this.state.inputHistory
  if (history.length === 0) return

  if (direction === 'up') {
    if (this.state.currentHistoryIndex < history.length - 1) {
      this.state.currentHistoryIndex++
      this.state.input = history[this.state.currentHistoryIndex]
    }
  } else {
    if (this.state.currentHistoryIndex > 0) {
      this.state.currentHistoryIndex--
      this.state.input = history[this.state.currentHistoryIndex]
    } else if (this.state.currentHistoryIndex === 0) {
      this.state.currentHistoryIndex = -1
      this.state.input = ''
    }
  }

  this._notifyView()
}
```

#### Step 2: Add Global Shortcuts to Home Screen (Day 1-2)
```bash
# File to modify:
- source/cli/screens/Home.tsx
```

**Tasks**:
- [ ] Add useInput hook for global shortcuts
- [ ] Handle `?` → toggle help
- [ ] Handle `Esc` → clear input / close overlay
- [ ] Handle `Ctrl+L` → clear screen (optional)
- [ ] Handle ↑↓ for history when NOT in suggestion mode

**Code**:
```typescript
useInput((input, key) => {
  // Toggle help
  if (input === '?') {
    presenter.toggleHelp()
  }

  // Clear input or close overlay
  if (key.escape) {
    if (presenter.showHelp) {
      presenter.toggleHelp()
    } else if (presenter.input) {
      presenter.handleInputChange('')
    }
  }

  // Input history (when not in suggestion mode)
  if (!presenter.hasSuggestions() && !presenter.isLoading) {
    if (key.upArrow) {
      presenter.navigateHistory('up')
    } else if (key.downArrow) {
      presenter.navigateHistory('down')
    }
  }
})
```

### Testing Checklist
- [ ] `?` toggles help overlay
- [ ] `Esc` clears input
- [ ] `Esc` closes help overlay
- [ ] ↑ navigates to previous input
- [ ] ↓ navigates to next input
- [ ] History limited to 50 items
- [ ] Newest items first

---

## 🔷 Feature 2: Markdown Rendering

**Priority**: 🟡 MEDIUM | **Effort**: 3-4 days

### Objective
Render markdown trong responses với syntax highlighting.

### Implementation Steps

#### Step 1: Create MarkdownService (Day 1-2)
```bash
# File to create:
- source/core/application/services/MarkdownService.ts
```

**Tasks**:
- [ ] Parse markdown to blocks
- [ ] Render headings
- [ ] Render paragraphs
- [ ] Render code blocks
- [ ] Render lists
- [ ] Handle inline formatting (bold, italic, code)

#### Step 2: Enhance MessageBubble (Day 2-3)
```bash
# File to modify:
- source/cli/components/molecules/MessageBubble.tsx
```

**Tasks**:
- [ ] Use MarkdownService to render content
- [ ] Apply syntax highlighting (optional)
- [ ] Handle long code blocks
- [ ] Test with complex markdown

**Code**:
```typescript
import { MarkdownService } from '@/core/application/services/MarkdownService'

const markdownService = new MarkdownService()

export const MessageBubble = ({ message, isStreaming }) => {
  const renderedContent = message.role === 'assistant'
    ? markdownService.render(message.content)
    : <Text>{message.content}</Text>

  return (
    <Box flexDirection="column">
      {/* Header */}
      <RoleHeader role={message.role} timestamp={message.timestamp} />

      {/* Content */}
      <Box marginLeft={2}>
        {renderedContent}
        {isStreaming && <StreamingIndicator />}
      </Box>
    </Box>
  )
}
```

#### Step 3: Add Syntax Highlighting (Day 3-4, optional)
```bash
# Dependency: highlight.js
```

**Tasks**:
- [ ] Install highlight.js
- [ ] Integrate với code block rendering
- [ ] Support common languages (js, ts, py, etc.)
- [ ] Apply colors for terminal

### Testing Checklist
- [ ] Headings render correctly
- [ ] Code blocks have borders
- [ ] Lists show bullet points
- [ ] Inline code styled differently
- [ ] Bold/italic work (if implemented)
- [ ] Syntax highlighting for code (if implemented)

---

## 🔷 Feature 3: Todos Display

**Priority**: 🟡 MEDIUM | **Effort**: 2-3 days

### Objective
Display task list từ AI responses.

### Implementation Steps

#### Step 1: Create Todo Value Object (Day 1)
```bash
# File to create:
- source/core/domain/valueObjects/Todo.ts
```

**Tasks**:
- [ ] Define Todo interface
- [ ] Add status: pending/in_progress/completed
- [ ] Add activeForm for in_progress state
- [ ] Add factory methods
- [ ] Add state transition methods

#### Step 2: Create UI Components (Day 1-2)
```bash
# Files to create:
- source/cli/components/atoms/Icon.tsx
- source/cli/components/organisms/TodosDisplay.tsx
```

**Tasks**:
- [ ] Create Icon component (○, ▶, ✓)
- [ ] Create TodosDisplay với progress bar
- [ ] Show activeForm cho in_progress todos
- [ ] Add border styling

#### Step 3: Update HomePresenter (Day 2)
```bash
# File to modify:
- source/cli/presenters/HomePresenter.ts
```

**Tasks**:
- [ ] Add todos: Todo[] to state
- [ ] Add setTodos() method
- [ ] Parse todos từ AI response (optional)

#### Step 4: Update Home Screen (Day 2-3)
```bash
# File to modify:
- source/cli/screens/Home.tsx
```

**Tasks**:
- [ ] Add TodosDisplay component
- [ ] Conditional render when todos.length > 0
- [ ] Hide when loading

### Testing Checklist
- [ ] Todos hiển thị với correct icons
- [ ] Progress bar accurate
- [ ] activeForm hiển thị cho in_progress
- [ ] Completed todos styled differently (gray)
- [ ] Empty state không show component

---

## 🔷 Feature 4: Enhanced Footer

**Priority**: 🟡 MEDIUM | **Effort**: 1-2 days

### Objective
Status bar với stats (tokens, cost, duration, branch).

### Implementation Steps

#### Step 1: Create Footer Component (Day 1)
```bash
# File to create:
- source/cli/components/organisms/Footer.tsx
```

**Tasks**:
- [ ] Display model name
- [ ] Display message count
- [ ] Display token count
- [ ] Display estimated cost
- [ ] Display session duration
- [ ] Display git branch (if available)

#### Step 2: Update HomePresenter (Day 1)
```bash
# File to modify:
- source/cli/presenters/HomePresenter.ts
```

**Tasks**:
- [ ] Add totalTokens to state
- [ ] Add estimatedCost to state
- [ ] Add sessionDuration to state
- [ ] Add duration tracker (setInterval)
- [ ] Update token stats after each response

#### Step 3: Update Home Screen (Day 2)
```bash
# File to modify:
- source/cli/screens/Home.tsx
```

**Tasks**:
- [ ] Add Footer component
- [ ] Pass all required props
- [ ] Position at bottom

### Testing Checklist
- [ ] Stats update realtime
- [ ] Duration increments every second
- [ ] Token count accurate
- [ ] Cost calculation correct
- [ ] Git branch shows (if in repo)

---

## 🔷 Feature 5: Help Overlay

**Priority**: 🟡 MEDIUM | **Effort**: 1-2 days

### Objective
Full-screen help với keyboard shortcuts và commands.

### Implementation Steps

#### Step 1: Create HelpOverlay Component (Day 1)
```bash
# File to create:
- source/cli/components/organisms/HelpOverlay.tsx
```

**Tasks**:
- [ ] Display keyboard shortcuts table
- [ ] Display slash commands list
- [ ] Add border styling
- [ ] Add close instruction
- [ ] Handle `?` and `Esc` to close

#### Step 2: Update HomePresenter (Day 1)
```bash
# File to modify:
- source/cli/presenters/HomePresenter.ts
```

**Tasks**:
- [ ] Add showHelp: boolean to state
- [ ] Implement toggleHelp() method

#### Step 3: Update Home Screen (Day 1-2)
```bash
# File to modify:
- source/cli/screens/Home.tsx
```

**Tasks**:
- [ ] Add HelpOverlay component
- [ ] Conditional render when showHelp=true
- [ ] Handle `?` keyboard shortcut
- [ ] Pass onClose callback

### Testing Checklist
- [ ] `?` opens help
- [ ] `?` closes help when open
- [ ] `Esc` closes help
- [ ] All shortcuts listed
- [ ] All commands listed
- [ ] Overlay visible on top

---

## 🔷 Feature 6: Character Counter

**Priority**: 🟢 LOW | **Effort**: 1 day

### Objective
Show character count với warnings.

### Implementation Steps

#### Step 1: Enhance InputBox Component (Day 1)
```bash
# File to modify:
- source/cli/components/molecules/InputBox.tsx
```

**Tasks**:
- [ ] Show counter when > 100 chars
- [ ] Yellow warning at 80% (8000 chars)
- [ ] Red warning at 100% (10000 chars)
- [ ] Prevent input > maxLength

**Code**:
```typescript
const charCount = value.length
const maxLength = 10000
const showCounter = charCount > 100
const isNearLimit = charCount > maxLength * 0.8
const isAtLimit = charCount >= maxLength

const counterColor = isAtLimit ? 'red' : isNearLimit ? 'yellow' : 'gray'

return (
  <Box flexDirection="column">
    <InputField {...} />

    {showCounter && (
      <Box marginLeft={2}>
        <Text color={counterColor}>
          {charCount}/{maxLength}
        </Text>
      </Box>
    )}
  </Box>
)
```

### Testing Checklist
- [ ] Counter shows at > 100 chars
- [ ] Counter yellow at 80%
- [ ] Counter red at 100%
- [ ] Cannot input > 10000 chars
- [ ] Counter updates realtime

---

## 📊 Phase 2 Summary

### Total Effort Breakdown

| Feature | Days | Priority |
|---------|------|----------|
| Keyboard Shortcuts | 2 | 🟡 |
| Markdown Rendering | 3-4 | 🟡 |
| Todos Display | 2-3 | 🟡 |
| Enhanced Footer | 1-2 | 🟡 |
| Help Overlay | 1-2 | 🟡 |
| Character Counter | 1 | 🟢 |
| **Total** | **10-14 days** | **3-4 weeks** |

### Files Created/Modified

**New Files**: ~7 files
**Modified Files**: ~6 files
**Total New Lines**: ~1200 lines

### Dependencies
```json
{
  "ink-markdown": "^2.0.0",
  "highlight.js": "^11.9.0"
}
```

---

## 🎯 Phase 2 Success Criteria

✅ Markdown rendering 100% responses
✅ Todos tracking hoạt động
✅ Help accessible trong 1 keystroke
✅ Stats update realtime
✅ Input history navigation smooth
✅ User satisfaction > 8/10

---

## 🔗 Navigation

[← Prev: Phase 1 Features](./06-phase1-core-features.md) | [Next: Testing Strategy →](./08-testing-strategy.md)

---

**Last Updated**: 2025-01-08
**Phase**: v1.2.0 (Important)
**Timeline**: 3-4 weeks
