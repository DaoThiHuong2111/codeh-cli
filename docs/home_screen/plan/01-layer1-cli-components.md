# 🎨 Layer 1: CLI Components Implementation Plan

> **Part 1/8** | [← Prev: Overview](./00-overview.md) | [Next: Screens & Presenters →](./02-layer1-screens-presenters.md)

---

## 📋 Mục Tiêu

Implement và enhance tất cả UI components theo **Atomic Design** pattern:
- **Atoms**: Logo (✅ đã có)
- **Molecules**: InputBox, MessageBubble, TipsSection, InfoSection
- **Organisms**: ConversationArea, SlashSuggestions, TodosDisplay, Footer, HelpOverlay

---

## 🏗️ Component Hierarchy

```
source/cli/components/
├── atoms/
│   ├── Logo.tsx                    ✅ EXISTING (enhance minimal)
│   ├── Icon.tsx                    ❌ NEW
│   └── Spinner.tsx                 ❌ NEW
│
├── molecules/
│   ├── InputBox.tsx                ✅ EXISTING (enhance heavily)
│   ├── MessageBubble.tsx           ❌ NEW
│   ├── TipsSection.tsx             ✅ EXISTING (minor enhance)
│   ├── InfoSection.tsx             ✅ EXISTING (minor enhance)
│   └── CommandMenuItem.tsx         ❌ NEW
│
└── organisms/
    ├── ConversationArea.tsx        ❌ NEW
    ├── SlashSuggestions.tsx        ❌ NEW
    ├── TodosDisplay.tsx            ❌ NEW
    ├── Footer.tsx                  ❌ NEW
    └── HelpOverlay.tsx             ❌ NEW
```

---

## 🔷 ATOMS

### 1.1 Logo.tsx ✅ EXISTING

**Status**: Đã có, chỉ cần verify

**Location**: `source/cli/components/atoms/Logo.tsx`

**Current Implementation**: ~30 lines
```typescript
import { Text } from 'ink'
import Gradient from 'ink-gradient'
import BigText from 'ink-big-text'

export const Logo = () => (
  <Gradient name="cristal">
    <BigText text="CODEH" font="tiny" />
  </Gradient>
)
```

**Action**: ✅ Keep as is (no changes needed)

---

### 1.2 Icon.tsx ❌ NEW

**Purpose**: Reusable icon component cho các loại icons

**Location**: `source/cli/components/atoms/Icon.tsx`

**Props**:
```typescript
interface IconProps {
  type: 'pending' | 'in_progress' | 'completed' | 'error' | 'info' | 'warning'
  color?: string
}
```

**Implementation**:
```typescript
import { Text } from 'ink'
import React from 'react'

const ICONS = {
  pending: '○',
  in_progress: '▶',
  completed: '✓',
  error: '✗',
  info: 'ℹ',
  warning: '⚠'
}

const COLORS = {
  pending: 'gray',
  in_progress: 'yellow',
  completed: 'green',
  error: 'red',
  info: 'blue',
  warning: 'yellow'
}

export const Icon: React.FC<IconProps> = ({ type, color }) => (
  <Text color={color || COLORS[type]}>
    {ICONS[type]}
  </Text>
)
```

**Estimated Lines**: ~30 lines

**Phase**: v1.2 (for TodosDisplay)

---

### 1.3 Spinner.tsx ❌ NEW

**Purpose**: Loading indicator cho streaming

**Location**: `source/cli/components/atoms/Spinner.tsx`

**Props**:
```typescript
interface SpinnerProps {
  type?: 'dots' | 'line' | 'pulse'
}
```

**Implementation**:
```typescript
import { Text } from 'ink'
import Spinner from 'ink-spinner'
import React from 'react'

export const LoadingSpinner: React.FC<SpinnerProps> = ({
  type = 'dots'
}) => (
  <Text color="cyan">
    <Spinner type={type} /> Loading...
  </Text>
)

export const StreamingIndicator: React.FC = () => (
  <Text color="green">▌</Text>
)
```

**Dependencies**: `ink-spinner`

**Estimated Lines**: ~25 lines

**Phase**: v1.1 (for streaming)

---

## 🔶 MOLECULES

### 2.1 InputBox.tsx ✅ EXISTING - ENHANCE

**Status**: Hiện có 89 lines, cần enhance

**Location**: `source/cli/components/molecules/InputBox.tsx`

**Current Features**:
- Basic text input
- Border decoration
- Prefix "> "

**New Features Cần Thêm**:
1. Character counter (show when > 100 chars)
2. Input validation error display
3. Input history navigation (↑↓)
4. Max length enforcement (10,000 chars)
5. Disable during loading

**Enhanced Props**:
```typescript
interface InputBoxProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (value: string) => void
  error?: string
  isDisabled?: boolean
  showCharCount?: boolean
  maxLength?: number
  placeholder?: string
  onHistoryNavigate?: (direction: 'up' | 'down') => void
}
```

**Enhanced Implementation**:
```typescript
import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'
import React from 'react'

export const InputBox: React.FC<InputBoxProps> = ({
  value,
  onChange,
  onSubmit,
  error,
  isDisabled = false,
  showCharCount = true,
  maxLength = 10000,
  placeholder = 'Type your message...',
  onHistoryNavigate
}) => {
  // Handle key press for history navigation
  const handleKeyPress = (input: string, key: any) => {
    if (key.upArrow) {
      onHistoryNavigate?.('up')
    } else if (key.downArrow) {
      onHistoryNavigate?.('down')
    }
  }

  // Character counter
  const charCount = value.length
  const showCounter = showCharCount && charCount > 100
  const isNearLimit = charCount > maxLength * 0.8
  const isAtLimit = charCount >= maxLength

  // Color for counter
  const counterColor = isAtLimit ? 'red' : isNearLimit ? 'yellow' : 'gray'

  return (
    <Box flexDirection="column">
      {/* Input field */}
      <Box>
        <Text color="cyan">{"> "}</Text>
        <TextInput
          value={value}
          onChange={(val) => {
            if (val.length <= maxLength) {
              onChange(val)
            }
          }}
          onSubmit={onSubmit}
          placeholder={placeholder}
          isDisabled={isDisabled}
        />
      </Box>

      {/* Character counter */}
      {showCounter && (
        <Box marginLeft={2}>
          <Text color={counterColor}>
            {charCount}/{maxLength}
          </Text>
        </Box>
      )}

      {/* Error message */}
      {error && (
        <Box marginLeft={2}>
          <Text color="red">✗ {error}</Text>
        </Box>
      )}
    </Box>
  )
}
```

**Estimated Lines**: ~120 lines (enhance from 89)

**Phase**:
- Character counter: v1.2
- Input history: v1.2
- Basic enhancements: v1.1

---

### 2.2 MessageBubble.tsx ❌ NEW

**Purpose**: Hiển thị một message trong conversation

**Location**: `source/cli/components/molecules/MessageBubble.tsx`

**Props**:
```typescript
interface MessageBubbleProps {
  message: Message
  isStreaming?: boolean
}

interface Message {
  id: string
  role: 'user' | 'assistant' | 'error' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    model?: string
    usage?: {
      promptTokens: number
      completionTokens: number
      totalTokens: number
    }
  }
}
```

**Implementation**:
```typescript
import { Box, Text } from 'ink'
import React from 'react'
import { StreamingIndicator } from '../atoms/Spinner'

const ROLE_CONFIG = {
  user: {
    prefix: '> You',
    color: 'cyan'
  },
  assistant: {
    prefix: '< Assistant',
    color: 'green'
  },
  error: {
    prefix: '✗ Error',
    color: 'red'
  },
  system: {
    prefix: 'ℹ System',
    color: 'blue'
  }
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isStreaming = false
}) => {
  const config = ROLE_CONFIG[message.role]

  // Format timestamp
  const timeStr = message.timestamp.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <Box flexDirection="column" marginY={0}>
      {/* Header: Role + Timestamp */}
      <Box>
        <Text color={config.color} bold>
          {config.prefix}
        </Text>
        <Text color="gray" dimColor>
          {' '}({timeStr})
        </Text>
      </Box>

      {/* Content */}
      <Box marginLeft={2}>
        <Text>{message.content}</Text>
        {isStreaming && <StreamingIndicator />}
      </Box>

      {/* Metadata (optional) */}
      {message.metadata?.usage && (
        <Box marginLeft={2}>
          <Text color="gray" dimColor>
            🪙 {message.metadata.usage.totalTokens} tokens
          </Text>
        </Box>
      )}
    </Box>
  )
}
```

**Phase 2 Enhancement** (v1.2 - Markdown):
```typescript
import { renderMarkdown } from '../../utils/markdown'

// In component:
<Box marginLeft={2}>
  {renderMarkdown(message.content)}
  {isStreaming && <StreamingIndicator />}
</Box>
```

**Estimated Lines**:
- Phase 1 (basic): ~80 lines
- Phase 2 (markdown): ~120 lines

**Phase**: v1.1 (basic), v1.2 (markdown)

---

### 2.3 TipsSection.tsx ✅ EXISTING - MINOR ENHANCE

**Status**: Hiện có 32 lines

**Location**: `source/cli/components/molecules/TipsSection.tsx`

**Current Implementation**: Working fine

**Minor Enhancement**: Add more tips
```typescript
const TIPS = [
  'Type your question to start chatting',
  'Use /help to see all available commands',
  'Press ? to toggle help overlay',
  'Use ↑↓ to navigate input history',
  // Add more tips here
]
```

**Estimated Lines**: ~40 lines

**Phase**: v1.2

---

### 2.4 InfoSection.tsx ✅ EXISTING - MINOR ENHANCE

**Status**: Hiện có 31 lines

**Location**: `source/cli/components/molecules/InfoSection.tsx`

**Current Implementation**: Working fine (shows version, model, directory)

**Minor Enhancement**: Add git branch info (Phase 2)
```typescript
interface InfoSectionProps {
  version: string
  model: string
  directory: string
  gitBranch?: string  // NEW
}
```

**Estimated Lines**: ~40 lines

**Phase**: v1.2

---

### 2.5 CommandMenuItem.tsx ❌ NEW

**Purpose**: Single item trong slash command suggestions

**Location**: `source/cli/components/molecules/CommandMenuItem.tsx`

**Props**:
```typescript
interface CommandMenuItemProps {
  command: Command
  isSelected: boolean
}

interface Command {
  cmd: string        // "/help"
  desc: string       // "Show help documentation"
  category: string   // "CONVERSATION"
}
```

**Implementation**:
```typescript
import { Box, Text } from 'ink'
import React from 'react'

export const CommandMenuItem: React.FC<CommandMenuItemProps> = ({
  command,
  isSelected
}) => {
  return (
    <Box>
      {isSelected && <Text color="cyan">› </Text>}
      {!isSelected && <Text>  </Text>}

      <Text color={isSelected ? 'cyan' : 'white'} bold={isSelected}>
        {command.cmd}
      </Text>

      <Text color="gray"> - {command.desc}</Text>
    </Box>
  )
}
```

**Estimated Lines**: ~30 lines

**Phase**: v1.1

---

## 🔷 ORGANISMS

### 3.1 ConversationArea.tsx ❌ NEW

**Purpose**: Container hiển thị tất cả messages

**Location**: `source/cli/components/organisms/ConversationArea.tsx`

**Props**:
```typescript
interface ConversationAreaProps {
  messages: Message[]
  isLoading: boolean
  streamingMessageId?: string
}
```

**Implementation**:
```typescript
import { Box, Text } from 'ink'
import React from 'react'
import { MessageBubble } from '../molecules/MessageBubble'
import { LoadingSpinner } from '../atoms/Spinner'

export const ConversationArea: React.FC<ConversationAreaProps> = ({
  messages,
  isLoading,
  streamingMessageId
}) => {
  // Empty state
  if (messages.length === 0) {
    return (
      <Box marginY={1}>
        <Text color="gray" dimColor>
          No conversation yet. Type a message to start!
        </Text>
      </Box>
    )
  }

  return (
    <Box flexDirection="column" marginY={1}>
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          isStreaming={message.id === streamingMessageId}
        />
      ))}

      {isLoading && !streamingMessageId && (
        <Box marginTop={1}>
          <LoadingSpinner />
        </Box>
      )}
    </Box>
  )
}
```

**Phase 2 Enhancement** (v1.2 - Virtual Scrolling):
```typescript
// For large conversations (> 40 messages)
import { useVirtualScroll } from '../../hooks/useVirtualScroll'

// Only render visible messages + buffer
const { visibleMessages, scrollToBottom } = useVirtualScroll(messages, {
  bufferSize: 5,
  autoScroll: true
})
```

**Estimated Lines**:
- Phase 1: ~60 lines
- Phase 2 (virtual scroll): ~100 lines

**Phase**: v1.1 (basic), v1.2 (virtual scroll)

---

### 3.2 SlashSuggestions.tsx ❌ NEW

**Purpose**: Autocomplete menu cho slash commands

**Location**: `source/cli/components/organisms/SlashSuggestions.tsx`

**Props**:
```typescript
interface SlashSuggestionsProps {
  input: string
  commands: Command[]
  selectedIndex: number
}
```

**Implementation**:
```typescript
import { Box, Text } from 'ink'
import React from 'react'
import { CommandMenuItem } from '../molecules/CommandMenuItem'

export const SlashSuggestions: React.FC<SlashSuggestionsProps> = ({
  input,
  commands,
  selectedIndex
}) => {
  // Filter commands based on input
  const filtered = commands.filter(cmd =>
    cmd.cmd.startsWith(input) ||
    cmd.desc.toLowerCase().includes(input.slice(1).toLowerCase())
  )

  // No matches
  if (filtered.length === 0) {
    return null
  }

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="cyan"
      paddingX={1}
      marginY={1}
    >
      <Text color="cyan" bold>
        Slash Commands (↑↓ to navigate):
      </Text>

      {filtered.map((cmd, index) => (
        <CommandMenuItem
          key={cmd.cmd}
          command={cmd}
          isSelected={index === selectedIndex}
        />
      ))}
    </Box>
  )
}
```

**Estimated Lines**: ~70 lines

**Phase**: v1.1

---

### 3.3 TodosDisplay.tsx ❌ NEW

**Purpose**: Hiển thị task list từ AI

**Location**: `source/cli/components/organisms/TodosDisplay.tsx`

**Props**:
```typescript
interface TodosDisplayProps {
  todos: Todo[]
}

interface Todo {
  content: string
  status: 'pending' | 'in_progress' | 'completed'
  activeForm: string
}
```

**Implementation**:
```typescript
import { Box, Text } from 'ink'
import React from 'react'
import { Icon } from '../atoms/Icon'

export const TodosDisplay: React.FC<TodosDisplayProps> = ({ todos }) => {
  // Count completed
  const completed = todos.filter(t => t.status === 'completed').length
  const total = todos.length

  // Progress percentage
  const progress = Math.round((completed / total) * 100)

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="yellow"
      paddingX={1}
      marginY={1}
    >
      {/* Header with progress */}
      <Box justifyContent="space-between">
        <Text color="yellow" bold>
          📋 Tasks
        </Text>
        <Text color="gray">
          {completed}/{total} completed ({progress}%)
        </Text>
      </Box>

      {/* Todo items */}
      {todos.map((todo, index) => (
        <Box key={index} marginTop={index === 0 ? 1 : 0}>
          <Icon type={todo.status} />
          <Text> </Text>
          <Text color={todo.status === 'completed' ? 'gray' : 'white'}>
            {todo.status === 'in_progress' ? todo.activeForm : todo.content}
          </Text>
        </Box>
      ))}
    </Box>
  )
}
```

**Estimated Lines**: ~80 lines

**Phase**: v1.2

---

### 3.4 Footer.tsx ❌ NEW

**Purpose**: Status bar với stats

**Location**: `source/cli/components/organisms/Footer.tsx`

**Props**:
```typescript
interface FooterProps {
  model: string
  messageCount: number
  tokenCount?: number
  estimatedCost?: number
  sessionDuration?: number
  gitBranch?: string
}
```

**Implementation**:
```typescript
import { Box, Text } from 'ink'
import React from 'react'

export const Footer: React.FC<FooterProps> = ({
  model,
  messageCount,
  tokenCount,
  estimatedCost,
  sessionDuration,
  gitBranch
}) => {
  // Format duration (seconds to mm:ss)
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  return (
    <Box
      borderStyle="single"
      borderColor="gray"
      paddingX={1}
      justifyContent="space-between"
    >
      {/* Left side */}
      <Box>
        <Text color="green">🤖 {model}</Text>
        <Text color="gray"> | </Text>
        <Text color="cyan">💬 {messageCount} msgs</Text>

        {tokenCount && (
          <>
            <Text color="gray"> | </Text>
            <Text color="yellow">🪙 {tokenCount.toLocaleString()}</Text>
          </>
        )}

        {estimatedCost && (
          <>
            <Text color="gray"> | </Text>
            <Text color="magenta">💰 ${estimatedCost.toFixed(4)}</Text>
          </>
        )}
      </Box>

      {/* Right side */}
      <Box>
        {sessionDuration && (
          <>
            <Text color="gray">⏱️ {formatDuration(sessionDuration)}</Text>
            <Text color="gray"> | </Text>
          </>
        )}

        {gitBranch && (
          <Text color="blue">🌿 {gitBranch}</Text>
        )}
      </Box>
    </Box>
  )
}
```

**Estimated Lines**: ~90 lines

**Phase**: v1.2

---

### 3.5 HelpOverlay.tsx ❌ NEW

**Purpose**: Full-screen help overlay

**Location**: `source/cli/components/organisms/HelpOverlay.tsx`

**Props**:
```typescript
interface HelpOverlayProps {
  onClose: () => void
}
```

**Implementation**:
```typescript
import { Box, Text } from 'ink'
import React, { useEffect } from 'react'
import { useInput } from 'ink'

export const HelpOverlay: React.FC<HelpOverlayProps> = ({ onClose }) => {
  // Close on ? or Esc
  useInput((input, key) => {
    if (input === '?' || key.escape) {
      onClose()
    }
  })

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor="cyan"
      padding={1}
    >
      {/* Header */}
      <Box justifyContent="center" marginBottom={1}>
        <Text color="cyan" bold>
          🏠 CODEH CLI - Help
        </Text>
      </Box>

      {/* Keyboard Shortcuts */}
      <Box flexDirection="column" marginBottom={1}>
        <Text color="yellow" bold>
          ⌨️  Keyboard Shortcuts:
        </Text>
        <Text>  ? - Toggle this help</Text>
        <Text>  Ctrl+C - Exit application</Text>
        <Text>  ↑↓ - Navigate input history</Text>
        <Text>  Enter - Submit message</Text>
        <Text>  Esc - Clear input / Close overlay</Text>
      </Box>

      {/* Slash Commands */}
      <Box flexDirection="column" marginBottom={1}>
        <Text color="yellow" bold>
          / Slash Commands:
        </Text>
        <Text>  /help - Show this help</Text>
        <Text>  /clear - Clear conversation</Text>
        <Text>  /new - Start new conversation</Text>
        <Text>  /save [name] - Save current session</Text>
        <Text>  /load [name] - Load saved session</Text>
        <Text>  /sessions - List all sessions</Text>
      </Box>

      {/* Footer */}
      <Box justifyContent="center" marginTop={1}>
        <Text color="gray" dimColor>
          Press ? or Esc to close
        </Text>
      </Box>
    </Box>
  )
}
```

**Estimated Lines**: ~90 lines

**Phase**: v1.2

---

## 📊 Summary

### Components to Create (Total: 8 new)

| Component | Type | Lines | Phase | Priority |
|-----------|------|-------|-------|----------|
| Icon | Atom | ~30 | v1.2 | 🟡 |
| Spinner | Atom | ~25 | v1.1 | 🔴 |
| MessageBubble | Molecule | ~80 | v1.1 | 🔴 |
| CommandMenuItem | Molecule | ~30 | v1.1 | 🔴 |
| ConversationArea | Organism | ~60 | v1.1 | 🔴 |
| SlashSuggestions | Organism | ~70 | v1.1 | 🔴 |
| TodosDisplay | Organism | ~80 | v1.2 | 🟡 |
| Footer | Organism | ~90 | v1.2 | 🟡 |
| HelpOverlay | Organism | ~90 | v1.2 | 🟡 |

### Components to Enhance (Total: 2)

| Component | Current Lines | New Lines | Changes |
|-----------|---------------|-----------|---------|
| InputBox | 89 | ~120 | +char counter, +history nav, +validation |
| TipsSection | 32 | ~40 | +more tips |
| InfoSection | 31 | ~40 | +git branch |

---

## 🎯 Implementation Order

### Phase 1 (v1.1) - Priority Order:
1. **Spinner** (needed for streaming indicator)
2. **MessageBubble** (core display component)
3. **ConversationArea** (container for messages)
4. **CommandMenuItem** (for slash suggestions)
5. **SlashSuggestions** (command autocomplete)
6. **InputBox** (enhance existing)

### Phase 2 (v1.2) - Priority Order:
7. **Icon** (for todos)
8. **TodosDisplay** (task tracking)
9. **Footer** (stats display)
10. **HelpOverlay** (help system)
11. **TipsSection** (enhance)
12. **InfoSection** (enhance)

---

## 📝 Testing Checklist

### For Each Component:
- [ ] Props validation
- [ ] Conditional rendering
- [ ] Error states
- [ ] Loading states
- [ ] Accessibility (keyboard nav)
- [ ] Visual regression tests
- [ ] Unit tests (> 70% coverage)

---

## 🔗 Navigation

[← Prev: Overview](./00-overview.md) | [Next: Screens & Presenters →](./02-layer1-screens-presenters.md)

---

**Last Updated**: 2025-01-08
**Total New Components**: 8
**Total Enhanced Components**: 3
**Estimated Total Lines**: ~800 new lines
