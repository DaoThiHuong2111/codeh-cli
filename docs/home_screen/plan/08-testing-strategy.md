# 🧪 Testing Strategy Implementation Plan

> **Part 8/8** | [← Prev: Phase 2 Features](./07-phase2-advanced-ux.md)

---

## 📋 Testing Overview

**Objective**: Comprehensive testing strategy với > 70% coverage

**Types**: Unit, Integration, E2E

**Tools**: Jest, React Testing Library, Mock APIs

---

## 🎯 Testing Pyramid

```
        E2E Tests (10%)
       /              \
      /   Integration   \  (30%)
     /      Tests        \
    /____________________\
         Unit Tests (60%)
```

---

## 📦 1. Unit Tests

**Coverage Target**: 70%+

**Focus**: Individual components, services, models

### 1.1 Component Tests

#### Testing Logo Component
```typescript
// Logo.test.tsx
import { render } from 'ink-testing-library'
import { Logo } from '@/cli/components/atoms/Logo'

describe('Logo', () => {
  it('should render CODEH text', () => {
    const { lastFrame } = render(<Logo />)
    expect(lastFrame()).toContain('CODEH')
  })
})
```

#### Testing MessageBubble Component
```typescript
// MessageBubble.test.tsx
import { render } from 'ink-testing-library'
import { MessageBubble } from '@/cli/components/molecules/MessageBubble'

describe('MessageBubble', () => {
  const mockMessage = {
    id: '1',
    role: 'user',
    content: 'Hello',
    timestamp: new Date()
  }

  it('should render user message with correct prefix', () => {
    const { lastFrame } = render(<MessageBubble message={mockMessage} />)
    expect(lastFrame()).toContain('> You')
    expect(lastFrame()).toContain('Hello')
  })

  it('should render assistant message with correct color', () => {
    const assistantMsg = { ...mockMessage, role: 'assistant' }
    const { lastFrame } = render(<MessageBubble message={assistantMsg} />)
    expect(lastFrame()).toContain('< Assistant')
  })

  it('should show streaming indicator when streaming', () => {
    const { lastFrame } = render(
      <MessageBubble message={mockMessage} isStreaming={true} />
    )
    expect(lastFrame()).toContain('▌')
  })

  it('should show token count when metadata exists', () => {
    const msgWithTokens = {
      ...mockMessage,
      metadata: { usage: { totalTokens: 100 } }
    }
    const { lastFrame } = render(<MessageBubble message={msgWithTokens} />)
    expect(lastFrame()).toContain('100 tokens')
  })
})
```

#### Testing ConversationArea Component
```typescript
// ConversationArea.test.tsx
describe('ConversationArea', () => {
  it('should render empty state when no messages', () => {
    const { lastFrame } = render(
      <ConversationArea messages={[]} isLoading={false} />
    )
    expect(lastFrame()).toContain('No conversation yet')
  })

  it('should render all messages', () => {
    const messages = [
      { id: '1', role: 'user', content: 'Hi', timestamp: new Date() },
      { id: '2', role: 'assistant', content: 'Hello', timestamp: new Date() }
    ]
    const { lastFrame } = render(
      <ConversationArea messages={messages} isLoading={false} />
    )
    expect(lastFrame()).toContain('Hi')
    expect(lastFrame()).toContain('Hello')
  })

  it('should show loading indicator when loading', () => {
    const { lastFrame } = render(
      <ConversationArea messages={[]} isLoading={true} />
    )
    expect(lastFrame()).toContain('Loading')
  })
})
```

#### Testing TodosDisplay Component
```typescript
// TodosDisplay.test.tsx
describe('TodosDisplay', () => {
  const mockTodos = [
    { content: 'Task 1', status: 'completed', activeForm: 'Task 1' },
    { content: 'Task 2', status: 'in_progress', activeForm: 'Working on Task 2' },
    { content: 'Task 3', status: 'pending', activeForm: 'Task 3' }
  ]

  it('should show correct progress', () => {
    const { lastFrame } = render(<TodosDisplay todos={mockTodos} />)
    expect(lastFrame()).toContain('1/3 completed')
  })

  it('should show correct icons for each status', () => {
    const { lastFrame } = render(<TodosDisplay todos={mockTodos} />)
    expect(lastFrame()).toContain('✓')  // completed
    expect(lastFrame()).toContain('▶')  // in_progress
    expect(lastFrame()).toContain('○')  // pending
  })

  it('should show activeForm for in_progress todos', () => {
    const { lastFrame } = render(<TodosDisplay todos={mockTodos} />)
    expect(lastFrame()).toContain('Working on Task 2')
  })
})
```

---

### 1.2 Domain Model Tests

#### Testing Message Model
```typescript
// Message.test.ts
import { MessageFactory } from '@/core/domain/models/Message'

describe('MessageFactory', () => {
  it('should create user message', () => {
    const msg = MessageFactory.createUserMessage('Hello')
    expect(msg.role).toBe('user')
    expect(msg.content).toBe('Hello')
    expect(msg.timestamp).toBeInstanceOf(Date)
    expect(msg.id).toMatch(/^msg_/)
  })

  it('should create error message from Error object', () => {
    const error = new Error('Something failed')
    const msg = MessageFactory.createErrorMessage(error)
    expect(msg.role).toBe('error')
    expect(msg.content).toBe('Something failed')
  })
})
```

#### Testing Todo Value Object
```typescript
// Todo.test.ts
import { Todo } from '@/core/domain/valueObjects/Todo'

describe('Todo', () => {
  it('should create pending todo', () => {
    const todo = Todo.create('Fix bug', 'Fixing bug')
    expect(todo.status).toBe('pending')
    expect(todo.isPending()).toBe(true)
  })

  it('should transition to in_progress', () => {
    const todo = Todo.create('Task', 'Working on task')
    const inProgress = todo.markInProgress()
    expect(inProgress.status).toBe('in_progress')
  })

  it('should transition to completed', () => {
    const todo = Todo.create('Task', 'Working')
    const completed = todo.markCompleted()
    expect(completed.status).toBe('completed')
    expect(completed.completedAt).toBeDefined()
  })

  it('should not mark completed todo as in_progress', () => {
    const todo = Todo.create('Task', 'Working').markCompleted()
    expect(() => todo.markInProgress()).toThrow()
  })
})
```

#### Testing Session Value Object
```typescript
// Session.test.ts
import { Session } from '@/core/domain/valueObjects/Session'

describe('Session', () => {
  const messages = [
    { id: '1', role: 'user', content: 'Hi', timestamp: new Date() }
  ]

  it('should create session with metadata', () => {
    const session = Session.create('my-session', messages, [], 'claude-3')
    expect(session.name).toBe('my-session')
    expect(session.messages).toEqual(messages)
    expect(session.metadata.messageCount).toBe(1)
  })

  it('should serialize to JSON', () => {
    const session = Session.create('test', messages, [], 'claude-3')
    const json = session.toJSON()
    expect(json.name).toBe('test')
    expect(json.messages).toEqual(messages)
  })

  it('should deserialize from JSON', () => {
    const data = {
      id: 'sess_123',
      name: 'test',
      messages,
      todos: [],
      metadata: {
        messageCount: 1,
        totalTokens: 0,
        estimatedCost: 0,
        model: 'claude-3'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
    const session = Session.fromData(data)
    expect(session.name).toBe('test')
  })
})
```

---

### 1.3 Service Tests

#### Testing CommandService
```typescript
// CommandService.test.ts
import { CommandService } from '@/core/application/services/CommandService'

describe('CommandService', () => {
  let service: CommandService

  beforeEach(() => {
    service = new CommandService()
  })

  it('should get command by name', () => {
    const cmd = service.get('/help')
    expect(cmd).toBeDefined()
    expect(cmd?.cmd).toBe('/help')
  })

  it('should get command by alias', () => {
    const cmd = service.get('/h')
    expect(cmd).toBeDefined()
    expect(cmd?.cmd).toBe('/help')
  })

  it('should filter commands by input', () => {
    const filtered = service.filter('/he')
    expect(filtered.length).toBeGreaterThan(0)
    expect(filtered[0].cmd).toBe('/help')
  })

  it('should return all commands when input is /', () => {
    const all = service.filter('/')
    expect(all.length).toBe(6)  // 6 default commands
  })
})
```

#### Testing SessionManager
```typescript
// SessionManager.test.ts
import { FileSessionManager } from '@/infrastructure/session/SessionManager'
import { Session } from '@/core/domain/valueObjects/Session'
import * as fs from 'fs/promises'

jest.mock('fs/promises')

describe('FileSessionManager', () => {
  let manager: FileSessionManager

  beforeEach(() => {
    manager = new FileSessionManager('/tmp/sessions')
  })

  it('should save session to file', async () => {
    const session = Session.create('test', [], [], 'claude-3')
    await manager.save(session)

    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('test.json'),
      expect.any(String),
      'utf-8'
    )
  })

  it('should load session from file', async () => {
    const sessionData = {
      id: 'sess_1',
      name: 'test',
      messages: [],
      todos: [],
      metadata: {
        messageCount: 0,
        totalTokens: 0,
        estimatedCost: 0,
        model: 'claude-3'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    ;(fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(sessionData))

    const session = await manager.load('test')
    expect(session.name).toBe('test')
  })

  it('should throw if session not found', async () => {
    ;(fs.access as jest.Mock).mockRejectedValue(new Error('Not found'))

    await expect(manager.load('nonexistent')).rejects.toThrow()
  })
})
```

---

## 🔗 2. Integration Tests

**Coverage Target**: 30%

**Focus**: Component + Presenter interactions

### 2.1 HomePresenter Integration Tests

```typescript
// HomePresenter.integration.test.ts
import { HomePresenter } from '@/cli/presenters/HomePresenter'

describe('HomePresenter Integration', () => {
  let presenter: HomePresenter
  let mockClient: any
  let mockCommandRegistry: any
  let mockSessionManager: any

  beforeEach(() => {
    mockClient = {
      execute: jest.fn(),
      executeStream: jest.fn()
    }

    mockCommandRegistry = new CommandService()

    mockSessionManager = {
      save: jest.fn(),
      load: jest.fn(),
      list: jest.fn()
    }

    presenter = new HomePresenter(
      mockClient,
      mockCommandRegistry,
      mockSessionManager,
      { version: '1.0.0', model: 'claude-3' }
    )
  })

  it('should handle user input and add message', async () => {
    mockClient.executeStream = async function*() {
      yield 'Hello '
      yield 'World'
    }

    await presenter.handleSubmit('Hi')

    const messages = presenter.messages
    expect(messages.length).toBe(2)
    expect(messages[0].role).toBe('user')
    expect(messages[0].content).toBe('Hi')
    expect(messages[1].role).toBe('assistant')
    expect(messages[1].content).toBe('Hello World')
  })

  it('should execute slash command', async () => {
    await presenter.handleSubmit('/clear')

    expect(presenter.messages.length).toBeGreaterThan(0)
    expect(presenter.messages[0].role).toBe('system')
    expect(presenter.messages[0].content).toContain('cleared')
  })

  it('should save session', async () => {
    await presenter.saveSession('test-session')

    expect(mockSessionManager.save).toHaveBeenCalled()
  })

  it('should navigate input history', () => {
    presenter.handleInputChange('First')
    presenter.handleSubmit('First')
    presenter.handleInputChange('Second')
    presenter.handleSubmit('Second')

    presenter.navigateHistory('up')
    expect(presenter.input).toBe('Second')

    presenter.navigateHistory('up')
    expect(presenter.input).toBe('First')

    presenter.navigateHistory('down')
    expect(presenter.input).toBe('Second')
  })
})
```

---

## 🎬 3. E2E Tests

**Coverage Target**: 10%

**Focus**: Full user journeys

### 3.1 Complete Conversation Flow

```typescript
// conversation.e2e.test.tsx
import { render } from 'ink-testing-library'
import { Home } from '@/cli/screens/Home'

describe('E2E: Complete Conversation', () => {
  it('should handle full conversation flow', async () => {
    const { stdin, lastFrame, waitUntilExit } = render(<Home />)

    // User types message
    stdin.write('What is React?')
    await delay(100)

    // Submit
    stdin.write('\r')
    await delay(500)

    // Check conversation area
    expect(lastFrame()).toContain('> You')
    expect(lastFrame()).toContain('What is React?')
    expect(lastFrame()).toContain('< Assistant')

    // User types second message
    stdin.write('Tell me more')
    stdin.write('\r')
    await delay(500)

    // Check both messages visible
    expect(lastFrame()).toContain('What is React?')
    expect(lastFrame()).toContain('Tell me more')
  })
})
```

### 3.2 Slash Commands Flow

```typescript
// slash-commands.e2e.test.tsx
describe('E2E: Slash Commands', () => {
  it('should execute /clear command', async () => {
    const { stdin, lastFrame } = render(<Home />)

    // Add some messages first
    stdin.write('Hello')
    stdin.write('\r')
    await delay(500)

    // Execute /clear
    stdin.write('/clear')
    stdin.write('\r')
    await delay(100)

    // Check conversation cleared
    expect(lastFrame()).toContain('Conversation cleared')
  })

  it('should save and load session', async () => {
    const { stdin, lastFrame } = render(<Home />)

    // Add message
    stdin.write('Test message')
    stdin.write('\r')
    await delay(500)

    // Save session
    stdin.write('/save test-session')
    stdin.write('\r')
    await delay(100)

    expect(lastFrame()).toContain('Session saved')

    // Clear
    stdin.write('/clear')
    stdin.write('\r')

    // Load session
    stdin.write('/load test-session')
    stdin.write('\r')
    await delay(100)

    expect(lastFrame()).toContain('Test message')
  })
})
```

---

## 📊 Test Coverage Targets

| Layer | Target | Focus |
|-------|--------|-------|
| Components | 80% | UI rendering, props |
| Presenters | 90% | Business logic |
| Services | 85% | Application logic |
| Models | 95% | Domain rules |
| Infrastructure | 70% | External integrations |
| **Overall** | **>70%** | All code |

---

## 🎯 Testing Checklist

### Phase 1 Tests
- [ ] MessageBubble unit tests
- [ ] ConversationArea unit tests
- [ ] Message model tests
- [ ] Session model tests
- [ ] CommandService tests
- [ ] SessionManager tests
- [ ] HomePresenter integration tests
- [ ] Slash commands E2E tests
- [ ] Streaming E2E tests

### Phase 2 Tests
- [ ] TodosDisplay unit tests
- [ ] Footer unit tests
- [ ] HelpOverlay unit tests
- [ ] Todo model tests
- [ ] MarkdownService tests
- [ ] Keyboard shortcuts E2E tests
- [ ] Input history E2E tests
- [ ] Markdown rendering E2E tests

---

## 🛠️ Test Setup

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  collectCoverageFrom: [
    'source/**/*.{ts,tsx}',
    '!source/**/*.test.{ts,tsx}',
    '!source/**/*.d.ts'
  ]
}
```

### Test Scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=\\.test\\.",
    "test:integration": "jest --testPathPattern=\\.integration\\.test\\.",
    "test:e2e": "jest --testPathPattern=\\.e2e\\.test\\."
  }
}
```

---

## 🎯 Success Criteria

✅ > 70% overall test coverage
✅ All unit tests pass
✅ All integration tests pass
✅ All E2E tests pass
✅ 0 critical bugs
✅ CI/CD pipeline green

---

## 🔗 Navigation

[← Prev: Phase 2 Features](./07-phase2-advanced-ux.md) | [Up: Overview ↑](./00-overview.md)

---

**Last Updated**: 2025-01-08
**Test Coverage Target**: >70%
**Test Files**: ~30 test files
