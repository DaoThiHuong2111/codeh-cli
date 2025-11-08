# 🏛️ Layer 2: Domain Models & Interfaces Implementation Plan

> **Part 3/8** | [← Prev: Screens & Presenters](./02-layer1-screens-presenters.md) | [Next: Application Services →](./04-layer2-application-services.md)

---

## 📋 Mục Tiêu

Define và implement các domain models, value objects, và interfaces cho Layer 2 (Core/Business Logic):

- **Models**: Message, Conversation (enhance existing)
- **Value Objects**: Todo, Command, Session (new)
- **Interfaces**: ISessionManager, IStreamHandler, ICommandRegistry (new)

---

## 🏗️ Structure

```
source/core/
├── domain/
│   ├── models/
│   │   ├── Message.ts              ✅ EXISTING (enhance)
│   │   ├── Conversation.ts         ✅ EXISTING (enhance)
│   │   └── Turn.ts                 ✅ EXISTING
│   │
│   ├── valueObjects/
│   │   ├── Todo.ts                 ❌ NEW
│   │   ├── Command.ts              ❌ NEW
│   │   ├── Session.ts              ❌ NEW
│   │   └── ModelInfo.ts            ✅ EXISTING
│   │
│   └── interfaces/
│       ├── ISessionManager.ts      ❌ NEW
│       ├── IStreamHandler.ts       ❌ NEW
│       ├── ICommandRegistry.ts     ❌ NEW
│       ├── IApiClient.ts           ✅ EXISTING (enhance)
│       └── IConfigRepository.ts    ✅ EXISTING
```

---

## 📦 MODELS

### 1. Message.ts ✅ EXISTING - ENHANCE

**Location**: `source/core/domain/models/Message.ts`

**Current Definition**: Basic message structure

**Enhanced Definition**:
```typescript
export interface MessageMetadata {
  model?: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  toolCalls?: ToolCall[]
  finishReason?: 'stop' | 'length' | 'tool_calls' | 'content_filter'
  duration?: number  // Response time in ms
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system' | 'error'
  content: string
  timestamp: Date
  metadata?: MessageMetadata
}

export class MessageFactory {
  static createUserMessage(content: string): Message {
    return {
      id: this.generateId(),
      role: 'user',
      content,
      timestamp: new Date()
    }
  }

  static createAssistantMessage(
    content: string,
    metadata?: MessageMetadata
  ): Message {
    return {
      id: this.generateId(),
      role: 'assistant',
      content,
      timestamp: new Date(),
      metadata
    }
  }

  static createSystemMessage(content: string): Message {
    return {
      id: this.generateId(),
      role: 'system',
      content,
      timestamp: new Date()
    }
  }

  static createErrorMessage(error: Error | string): Message {
    const content = typeof error === 'string' ? error : error.message

    return {
      id: this.generateId(),
      role: 'error',
      content,
      timestamp: new Date()
    }
  }

  private static generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
```

**Estimated Lines**: ~100 lines

**Phase**: v1.1

---

### 2. Conversation.ts ✅ EXISTING - ENHANCE

**Location**: `source/core/domain/models/Conversation.ts`

**Current Definition**: Basic conversation

**Enhanced Definition**:
```typescript
import { Message } from './Message'
import { Todo } from '../valueObjects/Todo'

export interface ConversationMetadata {
  title?: string
  tags?: string[]
  createdAt: Date
  updatedAt: Date
  messageCount: number
  totalTokens: number
  estimatedCost: number
}

export class Conversation {
  private messages: Message[] = []
  private todos: Todo[] = []
  private metadata: ConversationMetadata

  constructor(metadata?: Partial<ConversationMetadata>) {
    this.metadata = {
      createdAt: new Date(),
      updatedAt: new Date(),
      messageCount: 0,
      totalTokens: 0,
      estimatedCost: 0,
      ...metadata
    }
  }

  // === Message Management ===

  addMessage(message: Message): void {
    this.messages.push(message)
    this.metadata.messageCount++
    this.metadata.updatedAt = new Date()

    // Update token count
    if (message.metadata?.usage) {
      this.metadata.totalTokens += message.metadata.usage.totalTokens
      this.updateCost()
    }
  }

  getMessages(): Message[] {
    return [...this.messages]
  }

  getLastMessage(): Message | null {
    return this.messages[this.messages.length - 1] || null
  }

  clearMessages(): void {
    this.messages = []
    this.metadata.messageCount = 0
    this.metadata.totalTokens = 0
    this.metadata.estimatedCost = 0
    this.metadata.updatedAt = new Date()
  }

  // === Todo Management ===

  setTodos(todos: Todo[]): void {
    this.todos = todos
  }

  getTodos(): Todo[] {
    return [...this.todos]
  }

  // === Metadata ===

  getMetadata(): ConversationMetadata {
    return { ...this.metadata }
  }

  setTitle(title: string): void {
    this.metadata.title = title
    this.metadata.updatedAt = new Date()
  }

  // === Serialization ===

  toJSON(): object {
    return {
      messages: this.messages,
      todos: this.todos,
      metadata: this.metadata
    }
  }

  static fromJSON(data: any): Conversation {
    const conversation = new Conversation(data.metadata)
    conversation.messages = data.messages || []
    conversation.todos = data.todos || []
    return conversation
  }

  // === Private Methods ===

  private updateCost(): void {
    // Example: $0.005 per 1K tokens
    this.metadata.estimatedCost = (this.metadata.totalTokens / 1000) * 0.005
  }
}
```

**Estimated Lines**: ~150 lines

**Phase**: v1.1

---

## 🎯 VALUE OBJECTS

### 3. Todo.ts ❌ NEW

**Purpose**: Represent a task in todo list

**Location**: `source/core/domain/valueObjects/Todo.ts`

**Implementation**:
```typescript
export type TodoStatus = 'pending' | 'in_progress' | 'completed'

export interface TodoData {
  content: string
  status: TodoStatus
  activeForm: string
  createdAt?: Date
  completedAt?: Date
}

export class Todo {
  readonly content: string
  readonly status: TodoStatus
  readonly activeForm: string
  readonly createdAt: Date
  readonly completedAt?: Date

  private constructor(data: TodoData) {
    this.content = data.content
    this.status = data.status
    this.activeForm = data.activeForm
    this.createdAt = data.createdAt || new Date()
    this.completedAt = data.completedAt
  }

  // === Factory Methods ===

  static create(content: string, activeForm: string): Todo {
    return new Todo({
      content,
      status: 'pending',
      activeForm,
      createdAt: new Date()
    })
  }

  static fromData(data: TodoData): Todo {
    return new Todo(data)
  }

  // === State Transitions ===

  markInProgress(): Todo {
    if (this.status === 'completed') {
      throw new Error('Cannot mark completed todo as in progress')
    }

    return new Todo({
      ...this,
      status: 'in_progress'
    })
  }

  markCompleted(): Todo {
    return new Todo({
      ...this,
      status: 'completed',
      completedAt: new Date()
    })
  }

  // === Queries ===

  isPending(): boolean {
    return this.status === 'pending'
  }

  isInProgress(): boolean {
    return this.status === 'in_progress'
  }

  isCompleted(): boolean {
    return this.status === 'completed'
  }

  // === Serialization ===

  toJSON(): TodoData {
    return {
      content: this.content,
      status: this.status,
      activeForm: this.activeForm,
      createdAt: this.createdAt,
      completedAt: this.completedAt
    }
  }
}
```

**Estimated Lines**: ~90 lines

**Phase**: v1.2

---

### 4. Command.ts ❌ NEW

**Purpose**: Represent a slash command

**Location**: `source/core/domain/valueObjects/Command.ts`

**Implementation**:
```typescript
export enum CommandCategory {
  CONVERSATION = 'conversation',
  SESSION = 'session',
  CONFIGURATION = 'configuration',
  SYSTEM = 'system'
}

export interface CommandData {
  cmd: string
  desc: string
  category: CommandCategory
  aliases?: string[]
  argCount?: number
  argNames?: string[]
}

export interface ICommandExecutor {
  execute(args: string[], presenter: any): Promise<void>
}

export class Command {
  readonly cmd: string
  readonly desc: string
  readonly category: CommandCategory
  readonly aliases: string[]
  readonly argCount: number
  readonly argNames: string[]
  private executor: ICommandExecutor

  constructor(data: CommandData, executor: ICommandExecutor) {
    this.cmd = data.cmd
    this.desc = data.desc
    this.category = data.category
    this.aliases = data.aliases || []
    this.argCount = data.argCount || 0
    this.argNames = data.argNames || []
    this.executor = executor
  }

  // === Execution ===

  async execute(args: string[], presenter: any): Promise<void> {
    // Validate arg count
    if (args.length < this.argCount) {
      throw new Error(
        `${this.cmd} requires ${this.argCount} argument(s): ${this.argNames.join(', ')}`
      )
    }

    await this.executor.execute(args, presenter)
  }

  // === Matching ===

  matches(input: string): boolean {
    const normalized = input.toLowerCase()
    return (
      this.cmd.toLowerCase().startsWith(normalized) ||
      this.aliases.some(alias => alias.toLowerCase().startsWith(normalized))
    )
  }

  // === Serialization ===

  toJSON(): CommandData {
    return {
      cmd: this.cmd,
      desc: this.desc,
      category: this.category,
      aliases: this.aliases,
      argCount: this.argCount,
      argNames: this.argNames
    }
  }
}
```

**Estimated Lines**: ~80 lines

**Phase**: v1.1

---

### 5. Session.ts ❌ NEW

**Purpose**: Represent a saved session

**Location**: `source/core/domain/valueObjects/Session.ts`

**Implementation**:
```typescript
import { Message } from '../models/Message'
import { Todo } from './Todo'

export interface SessionMetadata {
  messageCount: number
  totalTokens: number
  estimatedCost: number
  model: string
  tags?: string[]
}

export interface SessionData {
  id: string
  name: string
  messages: Message[]
  todos: Todo[]
  metadata: SessionMetadata
  createdAt: Date
  updatedAt: Date
}

export class Session {
  readonly id: string
  readonly name: string
  readonly messages: Message[]
  readonly todos: Todo[]
  readonly metadata: SessionMetadata
  readonly createdAt: Date
  readonly updatedAt: Date

  private constructor(data: SessionData) {
    this.id = data.id
    this.name = data.name
    this.messages = data.messages
    this.todos = data.todos
    this.metadata = data.metadata
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }

  // === Factory Methods ===

  static create(
    name: string,
    messages: Message[],
    todos: Todo[],
    model: string
  ): Session {
    const totalTokens = messages.reduce(
      (sum, msg) => sum + (msg.metadata?.usage?.totalTokens || 0),
      0
    )

    const estimatedCost = (totalTokens / 1000) * 0.005

    return new Session({
      id: this.generateId(),
      name,
      messages,
      todos,
      metadata: {
        messageCount: messages.length,
        totalTokens,
        estimatedCost,
        model
      },
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }

  static fromData(data: SessionData): Session {
    return new Session(data)
  }

  // === Queries ===

  getMessageCount(): number {
    return this.messages.length
  }

  getTotalTokens(): number {
    return this.metadata.totalTokens
  }

  // === Serialization ===

  toJSON(): SessionData {
    return {
      id: this.id,
      name: this.name,
      messages: this.messages,
      todos: this.todos,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }

  // === Private ===

  private static generateId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
```

**Estimated Lines**: ~120 lines

**Phase**: v1.1

---

## 🔌 INTERFACES

### 6. ISessionManager.ts ❌ NEW

**Purpose**: Interface cho session persistence

**Location**: `source/core/domain/interfaces/ISessionManager.ts`

**Implementation**:
```typescript
import { Session } from '../valueObjects/Session'

export interface ISessionManager {
  /**
   * Save a session
   */
  save(session: Session): Promise<void>

  /**
   * Load a session by name
   */
  load(name: string): Promise<Session>

  /**
   * List all saved sessions
   */
  list(): Promise<SessionInfo[]>

  /**
   * Delete a session
   */
  delete(name: string): Promise<void>

  /**
   * Check if session exists
   */
  exists(name: string): Promise<boolean>
}

export interface SessionInfo {
  name: string
  messageCount: number
  createdAt: Date
  updatedAt: Date
  size: number  // File size in bytes
}
```

**Estimated Lines**: ~40 lines

**Phase**: v1.1

---

### 7. IStreamHandler.ts ❌ NEW

**Purpose**: Interface cho streaming responses

**Location**: `source/core/domain/interfaces/IStreamHandler.ts`

**Implementation**:
```typescript
export interface StreamChunk {
  type: 'content' | 'metadata' | 'error' | 'done'
  data: any
}

export interface StreamOptions {
  bufferSize?: number      // Buffer chunks before sending
  bufferDelay?: number     // Delay in ms before flushing buffer
  onChunk?: (chunk: StreamChunk) => void
  onError?: (error: Error) => void
  onDone?: () => void
}

export interface IStreamHandler {
  /**
   * Start streaming
   */
  stream(
    input: string,
    options?: StreamOptions
  ): AsyncGenerator<StreamChunk>

  /**
   * Cancel ongoing stream
   */
  cancel(): void

  /**
   * Check if currently streaming
   */
  isStreaming(): boolean
}
```

**Estimated Lines**: ~50 lines

**Phase**: v1.1

---

### 8. ICommandRegistry.ts ❌ NEW

**Purpose**: Interface cho command management

**Location**: `source/core/domain/interfaces/ICommandRegistry.ts`

**Implementation**:
```typescript
import { Command } from '../valueObjects/Command'

export interface ICommandRegistry {
  /**
   * Register a command
   */
  register(command: Command): void

  /**
   * Get command by name
   */
  get(cmd: string): Command | null

  /**
   * Get all commands
   */
  getAll(): Command[]

  /**
   * Filter commands by input
   */
  filter(input: string): Command[]

  /**
   * Check if command exists
   */
  has(cmd: string): boolean

  /**
   * Get commands by category
   */
  getByCategory(category: string): Command[]
}
```

**Estimated Lines**: ~40 lines

**Phase**: v1.1

---

### 9. IApiClient.ts ✅ EXISTING - ENHANCE

**Purpose**: Add streaming support

**Location**: `source/core/domain/interfaces/IApiClient.ts`

**Enhanced Interface**:
```typescript
export interface IApiClient {
  // Existing methods
  execute(input: string): Promise<ExecutionResult>

  // NEW: Streaming method
  executeStream(input: string): AsyncGenerator<string>

  // Existing
  getModel(): string
  validateConnection(): Promise<boolean>
}
```

**Estimated Lines**: Add ~10 lines

**Phase**: v1.1

---

## 📊 Summary

### New Files to Create (6)

| File | Type | Lines | Phase | Priority |
|------|------|-------|-------|----------|
| Todo.ts | Value Object | ~90 | v1.2 | 🟡 |
| Command.ts | Value Object | ~80 | v1.1 | 🔴 |
| Session.ts | Value Object | ~120 | v1.1 | 🔴 |
| ISessionManager.ts | Interface | ~40 | v1.1 | 🔴 |
| IStreamHandler.ts | Interface | ~50 | v1.1 | 🔴 |
| ICommandRegistry.ts | Interface | ~40 | v1.1 | 🔴 |

### Files to Enhance (3)

| File | Current | New | Changes | Phase |
|------|---------|-----|---------|-------|
| Message.ts | ~50 | ~100 | +MessageFactory, +metadata | v1.1 |
| Conversation.ts | ~80 | ~150 | +todos, +metadata, +serialization | v1.1 |
| IApiClient.ts | ~30 | ~40 | +executeStream() | v1.1 |

**Total New Lines**: ~720 lines

---

## 🎯 Implementation Order

### Phase 1 (v1.1):
1. **Command.ts** (needed for slash commands)
2. **Session.ts** (needed for persistence)
3. **ISessionManager.ts** (interface for session)
4. **IStreamHandler.ts** (interface for streaming)
5. **ICommandRegistry.ts** (interface for commands)
6. **Message.ts** (enhance with factory)
7. **Conversation.ts** (enhance with todos)
8. **IApiClient.ts** (add streaming method)

### Phase 2 (v1.2):
9. **Todo.ts** (for todos display)

---

## 🔗 Navigation

[← Prev: Screens & Presenters](./02-layer1-screens-presenters.md) | [Next: Application Services →](./04-layer2-application-services.md)

---

**Last Updated**: 2025-01-08
**Total New Files**: 6
**Total Enhanced Files**: 3
**Estimated Total Lines**: ~720 lines
