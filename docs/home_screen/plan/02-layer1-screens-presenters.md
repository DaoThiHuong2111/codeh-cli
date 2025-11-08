# 🖥️ Layer 1: Screens & Presenters Implementation Plan

> **Part 2/8** | [← Prev: CLI Components](./01-layer1-cli-components.md) | [Next: Domain Models →](./03-layer2-domain-models.md)

---

## 📋 Mục Tiêu

Refactor và enhance các file chính trong Layer 1:
- **Home.tsx**: Main screen component (integration layer)
- **HomePresenter.ts**: Business logic và state management
- **useHomeLogic.ts**: React hook để connect presenter với view

---

## 🏗️ File Structure

```
source/cli/
├── screens/
│   └── Home.tsx                ✅ EXISTING (major refactor)
├── presenters/
│   └── HomePresenter.ts        ✅ EXISTING (major enhance)
└── hooks/
    └── useHomeLogic.ts         ✅ EXISTING (enhance)
```

---

## 📄 1. Home.tsx - MAJOR REFACTOR

**Status**: Hiện có 64 lines → Sẽ tăng lên ~200 lines

**Location**: `source/cli/screens/Home.tsx`

---

### Current Implementation (v1.0.0)

```typescript
// Current: Simple MVP
<Box flexDirection="column">
  <Logo />
  <InfoSection version={...} model={...} directory={...} />
  <TipsSection />
  <InputBox {...} />
  {output && <Text>{output}</Text>}
  {chatError && <Text color="red">{chatError}</Text>}
</Box>
```

**Problems**:
- Chỉ hiển thị output cuối cùng
- Không có conversation history
- Không có conditional rendering logic
- Không có slash commands support

---

### Enhanced Implementation (v1.1.0)

**New Structure**:
```typescript
import { Box, Text, useInput } from 'ink'
import React from 'react'

// Components
import { Logo } from '../components/atoms/Logo'
import { InfoSection } from '../components/molecules/InfoSection'
import { TipsSection } from '../components/molecules/TipsSection'
import { InputBox } from '../components/molecules/InputBox'
import { ConversationArea } from '../components/organisms/ConversationArea'
import { SlashSuggestions } from '../components/organisms/SlashSuggestions'
import { TodosDisplay } from '../components/organisms/TodosDisplay'
import { Footer } from '../components/organisms/Footer'
import { HelpOverlay } from '../components/organisms/HelpOverlay'

// Hook
import { useHomeLogic } from '../hooks/useHomeLogic'

export const Home: React.FC = () => {
  // Get presenter and state
  const presenter = useHomeLogic()

  // Global keyboard shortcuts
  useInput((input, key) => {
    // Toggle help
    if (input === '?') {
      presenter.toggleHelp()
    }

    // Navigate suggestions (when typing slash command)
    if (presenter.hasSuggestions()) {
      if (key.upArrow) {
        presenter.handleSuggestionNavigate('up')
      } else if (key.downArrow) {
        presenter.handleSuggestionNavigate('down')
      } else if (key.return || key.tab) {
        const selected = presenter.handleSuggestionSelect()
        if (selected) {
          // Auto-fill selected command
        }
      }
    }

    // Navigate input history (when NOT in suggestions mode)
    if (!presenter.hasSuggestions() && !presenter.isLoading) {
      if (key.upArrow) {
        presenter.navigateHistory('up')
      } else if (key.downArrow) {
        presenter.navigateHistory('down')
      }
    }
  })

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Logo />
      <InfoSection
        version={presenter.version}
        model={presenter.model}
        directory={presenter.directory}
        gitBranch={presenter.gitBranch}
      />

      {/* Conversation Area */}
      <ConversationArea
        messages={presenter.messages}
        isLoading={presenter.isLoading}
        streamingMessageId={presenter.streamingMessageId}
      />

      {/* Conditional Middle Section */}
      {/* Show Todos if available and not loading */}
      {presenter.todos.length > 0 && !presenter.isLoading && (
        <TodosDisplay todos={presenter.todos} />
      )}

      {/* Show Tips if idle (no messages, no todos, not loading) */}
      {presenter.messages.length === 0 &&
        presenter.todos.length === 0 &&
        !presenter.isLoading && <TipsSection />}

      {/* Slash Command Suggestions */}
      {presenter.hasSuggestions() && (
        <SlashSuggestions
          input={presenter.input}
          commands={presenter.getFilteredSuggestions()}
          selectedIndex={presenter.selectedSuggestionIndex}
        />
      )}

      {/* Input Area */}
      <InputBox
        value={presenter.input}
        onChange={presenter.handleInputChange}
        onSubmit={presenter.handleSubmit}
        error={presenter.inputError}
        isDisabled={presenter.isLoading}
        showCharCount={presenter.input.length > 100}
        maxLength={10000}
        onHistoryNavigate={presenter.navigateHistory}
      />

      {/* Footer */}
      <Footer
        model={presenter.model}
        messageCount={presenter.messages.length}
        tokenCount={presenter.totalTokens}
        estimatedCost={presenter.estimatedCost}
        sessionDuration={presenter.sessionDuration}
        gitBranch={presenter.gitBranch}
      />

      {/* Help Overlay (Modal) */}
      {presenter.showHelp && (
        <HelpOverlay onClose={presenter.toggleHelp} />
      )}
    </Box>
  )
}
```

**Estimated Lines**: ~200 lines

---

### Conditional Rendering Logic

```typescript
// Todos Display
{presenter.todos.length > 0 && !presenter.isLoading && (
  <TodosDisplay todos={presenter.todos} />
)}

// Tips Display
{presenter.messages.length === 0 &&
  presenter.todos.length === 0 &&
  !presenter.isLoading && (
  <TipsSection />
)}

// Slash Suggestions
{presenter.hasSuggestions() && (
  <SlashSuggestions
    input={presenter.input}
    commands={presenter.getFilteredSuggestions()}
    selectedIndex={presenter.selectedSuggestionIndex}
  />
)}

// Help Overlay
{presenter.showHelp && (
  <HelpOverlay onClose={presenter.toggleHelp} />
)}
```

---

### Phase Breakdown

**Phase 1 (v1.1)** - Core:
- ✅ ConversationArea integration
- ✅ SlashSuggestions integration
- ✅ Global keyboard shortcuts
- ✅ Conditional rendering for suggestions

**Phase 2 (v1.2)** - Advanced:
- ✅ TodosDisplay integration
- ✅ Footer integration
- ✅ HelpOverlay integration
- ✅ Input history navigation

---

## 📄 2. HomePresenter.ts - MAJOR ENHANCE

**Status**: Hiện có 90 lines → Sẽ tăng lên ~400 lines

**Location**: `source/cli/presenters/HomePresenter.ts`

---

### Current State (v1.0.0)

```typescript
// Current state
{
  output: string
  processing: boolean
  version: string
  model: string
  directory: string
  chatError: string | null
}
```

**Methods**:
- `handleInput(input: string)`
- `getConversation()`
- `clearConversation()`

---

### Enhanced State (v1.1.0+)

```typescript
interface ViewState {
  // Input
  input: string
  inputError: string
  inputHistory: string[]
  currentHistoryIndex: number

  // Messages
  messages: Message[]
  streamingMessageId: string | null

  // Loading
  isLoading: boolean

  // Todos
  todos: Todo[]

  // Slash Commands
  filteredSuggestions: Command[]
  selectedSuggestionIndex: number

  // UI State
  showHelp: boolean

  // Info
  version: string
  model: string
  directory: string
  gitBranch: string | null

  // Stats
  totalTokens: number
  estimatedCost: number
  sessionDuration: number
  sessionStartTime: Date
}
```

---

### Enhanced Implementation

```typescript
import { Message, Todo, Command } from '@/core/domain/models'
import { ICodehClient } from '@/core/domain/interfaces'
import { CommandRegistry } from '@/core/application/services/CommandRegistry'

export class HomePresenter {
  // State
  private state: ViewState

  // Dependencies (via DI)
  private client: ICodehClient
  private commandRegistry: CommandRegistry
  private sessionManager: ISessionManager
  private viewUpdateCallback?: () => void

  constructor(
    client: ICodehClient,
    commandRegistry: CommandRegistry,
    sessionManager: ISessionManager,
    config: Config
  ) {
    this.client = client
    this.commandRegistry = commandRegistry
    this.sessionManager = sessionManager

    // Initialize state
    this.state = {
      input: '',
      inputError: '',
      inputHistory: [],
      currentHistoryIndex: -1,

      messages: [],
      streamingMessageId: null,

      isLoading: false,

      todos: [],

      filteredSuggestions: [],
      selectedSuggestionIndex: 0,

      showHelp: false,

      version: config.version,
      model: config.model,
      directory: process.cwd(),
      gitBranch: this.getGitBranch(),

      totalTokens: 0,
      estimatedCost: 0,
      sessionDuration: 0,
      sessionStartTime: new Date()
    }

    // Start duration tracker
    this.startDurationTracker()
  }

  // === View Management ===

  setViewUpdateCallback(callback: () => void) {
    this.viewUpdateCallback = callback
  }

  private _notifyView() {
    this.viewUpdateCallback?.()
  }

  // === Input Handlers ===

  handleInputChange = (value: string) => {
    this.state.input = value
    this.state.inputError = ''

    // Filter suggestions if starts with /
    if (value.startsWith('/')) {
      this.state.filteredSuggestions = this.commandRegistry.filter(value)
      this.state.selectedSuggestionIndex = 0
    } else {
      this.state.filteredSuggestions = []
    }

    this._notifyView()
  }

  handleSubmit = async (userInput: string) => {
    // Validation
    if (!userInput.trim()) {
      this.state.inputError = 'Please enter a message'
      this._notifyView()
      return
    }

    if (userInput.length > 10000) {
      this.state.inputError = 'Message too long (max 10,000 characters)'
      this._notifyView()
      return
    }

    // Check if slash command
    if (userInput.startsWith('/')) {
      await this.handleCommand(userInput)
      return
    }

    // Add to history
    this.addToInputHistory(userInput)

    // Clear input
    this.state.input = ''

    // Add user message
    const userMessage: Message = {
      id: this.generateId(),
      role: 'user',
      content: userInput,
      timestamp: new Date()
    }
    this.state.messages.push(userMessage)

    // Set loading
    this.state.isLoading = true
    this._notifyView()

    try {
      // Create assistant message for streaming
      const assistantMessage: Message = {
        id: this.generateId(),
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }
      this.state.messages.push(assistantMessage)
      this.state.streamingMessageId = assistantMessage.id

      // Stream response
      for await (const chunk of this.client.executeStream(userInput)) {
        assistantMessage.content += chunk
        this._notifyView()
      }

      // Update token stats
      this.updateTokenStats(assistantMessage)

      // Clear streaming
      this.state.streamingMessageId = null
    } catch (error) {
      // Add error message
      const errorMessage: Message = {
        id: this.generateId(),
        role: 'error',
        content: error.message,
        timestamp: new Date()
      }
      this.state.messages.push(errorMessage)
    } finally {
      this.state.isLoading = false
      this._notifyView()
    }
  }

  // === Command Handlers ===

  private async handleCommand(input: string) {
    const [cmd, ...args] = input.split(' ')

    // Find command
    const command = this.commandRegistry.get(cmd)

    if (!command) {
      this.state.inputError = `Unknown command: ${cmd}`
      this._notifyView()
      return
    }

    // Clear input
    this.state.input = ''
    this.state.filteredSuggestions = []

    try {
      await command.execute(args, this)
    } catch (error) {
      const errorMessage: Message = {
        id: this.generateId(),
        role: 'error',
        content: `Command error: ${error.message}`,
        timestamp: new Date()
      }
      this.state.messages.push(errorMessage)
    }

    this._notifyView()
  }

  // === Suggestion Handlers ===

  handleSuggestionNavigate = (direction: 'up' | 'down') => {
    const count = this.state.filteredSuggestions.length
    if (count === 0) return

    if (direction === 'up') {
      this.state.selectedSuggestionIndex =
        (this.state.selectedSuggestionIndex - 1 + count) % count
    } else {
      this.state.selectedSuggestionIndex =
        (this.state.selectedSuggestionIndex + 1) % count
    }

    this._notifyView()
  }

  handleSuggestionSelect = (): string | null => {
    const selected = this.state.filteredSuggestions[
      this.state.selectedSuggestionIndex
    ]

    if (!selected) return null

    // Auto-fill input
    this.state.input = selected.cmd + ' '
    this.state.filteredSuggestions = []

    this._notifyView()

    return selected.cmd
  }

  hasSuggestions = (): boolean => {
    return this.state.filteredSuggestions.length > 0
  }

  getFilteredSuggestions = (): Command[] => {
    return this.state.filteredSuggestions
  }

  // === Input History Navigation ===

  navigateHistory = (direction: 'up' | 'down') => {
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

  private addToInputHistory(input: string) {
    // Add to beginning
    this.state.inputHistory.unshift(input)

    // Limit to 50
    if (this.state.inputHistory.length > 50) {
      this.state.inputHistory = this.state.inputHistory.slice(0, 50)
    }

    // Reset index
    this.state.currentHistoryIndex = -1
  }

  // === UI State ===

  toggleHelp = () => {
    this.state.showHelp = !this.state.showHelp
    this._notifyView()
  }

  // === Conversation Management ===

  clearConversation = async () => {
    this.state.messages = []
    this.state.todos = []
    this.state.totalTokens = 0
    this.state.estimatedCost = 0
    this._notifyView()
  }

  startNewConversation = async () => {
    await this.clearConversation()
    this.state.sessionStartTime = new Date()
    this.state.sessionDuration = 0
  }

  // === Session Management ===

  saveSession = async (name: string) => {
    await this.sessionManager.save({
      name,
      messages: this.state.messages,
      todos: this.state.todos,
      metadata: {
        totalTokens: this.state.totalTokens,
        estimatedCost: this.state.estimatedCost,
        messageCount: this.state.messages.length
      }
    })
  }

  loadSession = async (name: string) => {
    const session = await this.sessionManager.load(name)

    this.state.messages = session.messages
    this.state.todos = session.todos || []
    this.state.totalTokens = session.metadata.totalTokens || 0
    this.state.estimatedCost = session.metadata.estimatedCost || 0

    this._notifyView()
  }

  // === Getters ===

  get input() { return this.state.input }
  get inputError() { return this.state.inputError }
  get messages() { return this.state.messages }
  get isLoading() { return this.state.isLoading }
  get todos() { return this.state.todos }
  get showHelp() { return this.state.showHelp }
  get version() { return this.state.version }
  get model() { return this.state.model }
  get directory() { return this.state.directory }
  get gitBranch() { return this.state.gitBranch }
  get totalTokens() { return this.state.totalTokens }
  get estimatedCost() { return this.state.estimatedCost }
  get sessionDuration() { return this.state.sessionDuration }
  get streamingMessageId() { return this.state.streamingMessageId }
  get selectedSuggestionIndex() { return this.state.selectedSuggestionIndex }

  // === Utility Methods ===

  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getGitBranch(): string | null {
    try {
      const { execSync } = require('child_process')
      return execSync('git rev-parse --abbrev-ref HEAD')
        .toString()
        .trim()
    } catch {
      return null
    }
  }

  private updateTokenStats(message: Message) {
    if (message.metadata?.usage) {
      this.state.totalTokens += message.metadata.usage.totalTokens

      // Estimate cost (example: $0.005 per 1K tokens)
      this.state.estimatedCost = (this.state.totalTokens / 1000) * 0.005
    }
  }

  private startDurationTracker() {
    setInterval(() => {
      this.state.sessionDuration = Math.floor(
        (new Date().getTime() - this.state.sessionStartTime.getTime()) / 1000
      )
      this._notifyView()
    }, 1000)
  }
}
```

**Estimated Lines**: ~400 lines

---

## 📄 3. useHomeLogic.ts - ENHANCE

**Status**: Hiện có 112 lines → Sẽ tăng lên ~150 lines

**Location**: `source/cli/hooks/useHomeLogic.ts`

---

### Enhanced Implementation

```typescript
import { useEffect, useState } from 'react'
import { useDIContainer } from './useDIContainer'
import { HomePresenter } from '../presenters/HomePresenter'

export const useHomeLogic = (): HomePresenter => {
  // Get dependencies from DI container
  const container = useDIContainer()

  // Create presenter (singleton pattern)
  const [presenter] = useState(() => {
    const client = container.get('ICodehClient')
    const commandRegistry = container.get('CommandRegistry')
    const sessionManager = container.get('ISessionManager')
    const config = container.get('Config')

    return new HomePresenter(
      client,
      commandRegistry,
      sessionManager,
      config
    )
  })

  // State for force re-render
  const [, forceUpdate] = useState({})

  // Setup view callback
  useEffect(() => {
    presenter.setViewUpdateCallback(() => {
      forceUpdate({})
    })

    // Initialize presenter
    presenter.init?.()

    return () => {
      // Cleanup if needed
    }
  }, [presenter])

  return presenter
}
```

**Estimated Lines**: ~150 lines

---

## 📊 Summary

### Files to Refactor/Enhance

| File | Current | New | Change | Phase |
|------|---------|-----|--------|-------|
| Home.tsx | 64 | ~200 | +136 lines | v1.1 → v1.2 |
| HomePresenter.ts | 90 | ~400 | +310 lines | v1.1 → v1.2 |
| useHomeLogic.ts | 112 | ~150 | +38 lines | v1.1 |

**Total New Lines**: ~484 lines

---

## 🎯 Implementation Checklist

### Home.tsx
- [ ] Import all new components
- [ ] Add global keyboard shortcuts handler
- [ ] Implement conditional rendering logic
- [ ] Add SlashSuggestions integration
- [ ] Add TodosDisplay integration (Phase 2)
- [ ] Add Footer integration (Phase 2)
- [ ] Add HelpOverlay integration (Phase 2)

### HomePresenter.ts
- [ ] Extend state with new properties
- [ ] Add input history tracking
- [ ] Add suggestion navigation methods
- [ ] Add command handling logic
- [ ] Add session save/load methods
- [ ] Add streaming support
- [ ] Add token/cost tracking
- [ ] Add duration tracking

### useHomeLogic.ts
- [ ] Update DI container usage
- [ ] Pass new dependencies to presenter
- [ ] Ensure proper cleanup

---

## 🔗 Navigation

[← Prev: CLI Components](./01-layer1-cli-components.md) | [Next: Domain Models →](./03-layer2-domain-models.md)

---

**Last Updated**: 2025-01-08
**Total Files**: 3
**Estimated New Lines**: ~484 lines
