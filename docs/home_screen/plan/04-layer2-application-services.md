# ⚙️ Layer 2: Application Services Implementation Plan

> **Part 4/8** | [← Prev: Domain Models](./03-layer2-domain-models.md) | [Next: Infrastructure →](./05-layer3-infrastructure.md)

---

## 📋 Mục Tiêu

Implement và enhance application services trong Layer 2:

- **CodehClient**: Thêm streaming support
- **CodehChat**: Enhance conversation management
- **New Services**:
  - CommandService: Manage slash commands
  - MarkdownService: Render markdown (Phase 2)

---

## 🏗️ Structure

```
source/core/application/
├── CodehClient.ts           ✅ EXISTING (enhance với streaming)
├── CodehChat.ts             ✅ EXISTING (minor enhance)
└── services/
    ├── CommandService.ts    ❌ NEW
    └── MarkdownService.ts   ❌ NEW (Phase 2)
```

---

## 📄 1. CodehClient.ts ✅ ENHANCE

**Location**: `source/core/application/CodehClient.ts`

**Current**: ~300 lines

**New Features**:
- Thêm `executeStream()` method cho streaming responses
- Implement `IStreamHandler` interface

---

### Enhanced Implementation

**Add Streaming Method**:
```typescript
import { IApiClient, IStreamHandler } from '@/core/domain/interfaces'
import { StreamChunk, StreamOptions } from '@/core/domain/interfaces/IStreamHandler'

export class CodehClient implements IStreamHandler {
  // Existing properties
  private apiClient: IApiClient
  private config: Config
  private isStreamingActive: boolean = false

  // Existing methods...

  /**
   * Execute with streaming response
   */
  async *executeStream(
    input: string,
    options?: StreamOptions
  ): AsyncGenerator<StreamChunk> {
    this.isStreamingActive = true

    try {
      // Validate input
      if (!input.trim()) {
        throw new Error('Input cannot be empty')
      }

      // Get streaming generator from API client
      const stream = this.apiClient.executeStream(input)

      // Buffer for batching chunks
      let buffer = ''
      const bufferSize = options?.bufferSize || 10
      const bufferDelay = options?.bufferDelay || 50

      for await (const chunk of stream) {
        if (!this.isStreamingActive) {
          break
        }

        buffer += chunk

        // Yield when buffer reaches size or after delay
        if (buffer.length >= bufferSize) {
          const chunkData: StreamChunk = {
            type: 'content',
            data: buffer
          }

          yield chunkData
          options?.onChunk?.(chunkData)

          buffer = ''
        }
      }

      // Flush remaining buffer
      if (buffer) {
        const chunkData: StreamChunk = {
          type: 'content',
          data: buffer
        }
        yield chunkData
        options?.onChunk?.(chunkData)
      }

      // Send done signal
      const doneChunk: StreamChunk = {
        type: 'done',
        data: null
      }
      yield doneChunk
      options?.onDone?.()

    } catch (error) {
      const errorChunk: StreamChunk = {
        type: 'error',
        data: error
      }
      yield errorChunk
      options?.onError?.(error)

    } finally {
      this.isStreamingActive = false
    }
  }

  /**
   * Cancel ongoing stream
   */
  cancel(): void {
    this.isStreamingActive = false
  }

  /**
   * Check if currently streaming
   */
  isStreaming(): boolean {
    return this.isStreamingActive
  }
}
```

**Estimated Additional Lines**: ~80 lines

**Total**: ~380 lines

**Phase**: v1.1

---

## 📄 2. CodehChat.ts ✅ MINOR ENHANCE

**Location**: `source/core/application/CodehChat.ts`

**Current**: ~200 lines

**Minor Enhancements**:
- Add method để get conversation statistics
- Add method để export conversation

---

### Enhanced Methods

```typescript
export class CodehChat {
  // Existing code...

  /**
   * Get conversation statistics
   */
  getStatistics(): ConversationStats {
    const messages = this.conversation.getMessages()

    return {
      messageCount: messages.length,
      userMessageCount: messages.filter(m => m.role === 'user').length,
      assistantMessageCount: messages.filter(m => m.role === 'assistant').length,
      errorCount: messages.filter(m => m.role === 'error').length,
      totalTokens: this.conversation.getMetadata().totalTokens,
      estimatedCost: this.conversation.getMetadata().estimatedCost
    }
  }

  /**
   * Export conversation to different formats
   */
  exportConversation(format: 'json' | 'markdown' | 'text'): string {
    const messages = this.conversation.getMessages()

    switch (format) {
      case 'json':
        return JSON.stringify(this.conversation.toJSON(), null, 2)

      case 'markdown':
        return this.exportAsMarkdown(messages)

      case 'text':
        return this.exportAsText(messages)

      default:
        throw new Error(`Unsupported format: ${format}`)
    }
  }

  private exportAsMarkdown(messages: Message[]): string {
    let md = '# Conversation Export\n\n'

    for (const msg of messages) {
      const role = msg.role.charAt(0).toUpperCase() + msg.role.slice(1)
      const time = msg.timestamp.toLocaleString()

      md += `## ${role} (${time})\n\n`
      md += `${msg.content}\n\n`
      md += '---\n\n'
    }

    return md
  }

  private exportAsText(messages: Message[]): string {
    let text = 'Conversation Export\n\n'

    for (const msg of messages) {
      const role = msg.role.toUpperCase()
      const time = msg.timestamp.toLocaleString()

      text += `[${time}] ${role}:\n`
      text += `${msg.content}\n\n`
    }

    return text
  }
}

interface ConversationStats {
  messageCount: number
  userMessageCount: number
  assistantMessageCount: number
  errorCount: number
  totalTokens: number
  estimatedCost: number
}
```

**Estimated Additional Lines**: ~70 lines

**Total**: ~270 lines

**Phase**: v1.1

---

## 📄 3. CommandService.ts ❌ NEW

**Purpose**: Central service để manage slash commands

**Location**: `source/core/application/services/CommandService.ts`

---

### Implementation

```typescript
import { Command, CommandCategory } from '@/core/domain/valueObjects/Command'
import { ICommandRegistry } from '@/core/domain/interfaces'

export class CommandService implements ICommandRegistry {
  private commands: Map<string, Command> = new Map()
  private aliases: Map<string, string> = new Map()

  constructor() {
    this.registerDefaultCommands()
  }

  // === Registration ===

  register(command: Command): void {
    // Register main command
    this.commands.set(command.cmd, command)

    // Register aliases
    for (const alias of command.aliases) {
      this.aliases.set(alias, command.cmd)
    }
  }

  // === Retrieval ===

  get(cmd: string): Command | null {
    // Check aliases first
    const mainCmd = this.aliases.get(cmd) || cmd

    return this.commands.get(mainCmd) || null
  }

  getAll(): Command[] {
    return Array.from(this.commands.values())
  }

  getByCategory(category: string): Command[] {
    return this.getAll().filter(cmd => cmd.category === category)
  }

  // === Filtering ===

  filter(input: string): Command[] {
    const normalized = input.toLowerCase().replace(/^\//, '')

    if (!normalized) {
      return this.getAll()
    }

    return this.getAll().filter(cmd =>
      cmd.matches('/' + normalized)
    )
  }

  // === Queries ===

  has(cmd: string): boolean {
    return this.get(cmd) !== null
  }

  // === Default Commands ===

  private registerDefaultCommands(): void {
    // /help command
    this.register(new Command(
      {
        cmd: '/help',
        desc: 'Show help documentation',
        category: CommandCategory.SYSTEM,
        aliases: ['/h', '/?']
      },
      {
        execute: async (args, presenter) => {
          presenter.toggleHelp()
        }
      }
    ))

    // /clear command
    this.register(new Command(
      {
        cmd: '/clear',
        desc: 'Clear conversation history',
        category: CommandCategory.CONVERSATION,
        aliases: ['/cls', '/reset']
      },
      {
        execute: async (args, presenter) => {
          await presenter.clearConversation()

          // Add system message
          const msg = {
            id: `msg_${Date.now()}`,
            role: 'system',
            content: 'Conversation cleared',
            timestamp: new Date()
          }
          presenter.state.messages.push(msg)
        }
      }
    ))

    // /new command
    this.register(new Command(
      {
        cmd: '/new',
        desc: 'Start new conversation',
        category: CommandCategory.CONVERSATION,
        aliases: ['/n']
      },
      {
        execute: async (args, presenter) => {
          await presenter.startNewConversation()

          const msg = {
            id: `msg_${Date.now()}`,
            role: 'system',
            content: 'New conversation started',
            timestamp: new Date()
          }
          presenter.state.messages.push(msg)
        }
      }
    ))

    // /save command
    this.register(new Command(
      {
        cmd: '/save',
        desc: 'Save current session',
        category: CommandCategory.SESSION,
        argCount: 1,
        argNames: ['name']
      },
      {
        execute: async (args, presenter) => {
          const name = args[0]
          await presenter.saveSession(name)

          const msg = {
            id: `msg_${Date.now()}`,
            role: 'system',
            content: `Session saved as "${name}"`,
            timestamp: new Date()
          }
          presenter.state.messages.push(msg)
        }
      }
    ))

    // /load command
    this.register(new Command(
      {
        cmd: '/load',
        desc: 'Load saved session',
        category: CommandCategory.SESSION,
        argCount: 1,
        argNames: ['name']
      },
      {
        execute: async (args, presenter) => {
          const name = args[0]
          await presenter.loadSession(name)

          const msg = {
            id: `msg_${Date.now()}`,
            role: 'system',
            content: `Session "${name}" loaded`,
            timestamp: new Date()
          }
          presenter.state.messages.push(msg)
        }
      }
    ))

    // /sessions command
    this.register(new Command(
      {
        cmd: '/sessions',
        desc: 'List all saved sessions',
        category: CommandCategory.SESSION,
        aliases: ['/ls']
      },
      {
        execute: async (args, presenter) => {
          const sessions = await presenter.sessionManager.list()

          let content = 'Saved Sessions:\n\n'
          for (const session of sessions) {
            content += `- ${session.name} (${session.messageCount} messages, `
            content += `${new Date(session.updatedAt).toLocaleDateString()})\n`
          }

          if (sessions.length === 0) {
            content = 'No saved sessions found'
          }

          const msg = {
            id: `msg_${Date.now()}`,
            role: 'system',
            content,
            timestamp: new Date()
          }
          presenter.state.messages.push(msg)
        }
      }
    ))
  }
}
```

**Estimated Lines**: ~250 lines

**Phase**: v1.1

---

## 📄 4. MarkdownService.ts ❌ NEW

**Purpose**: Render markdown trong terminal

**Location**: `source/core/application/services/MarkdownService.ts`

---

### Implementation

```typescript
import { Text, Box } from 'ink'
import React from 'react'

export class MarkdownService {
  /**
   * Render markdown content to Ink components
   */
  render(content: string): React.ReactNode {
    // Parse markdown
    const blocks = this.parse(content)

    // Convert to Ink components
    return blocks.map((block, index) =>
      this.renderBlock(block, index)
    )
  }

  /**
   * Parse markdown into blocks
   */
  private parse(content: string): MarkdownBlock[] {
    const blocks: MarkdownBlock[] = []
    const lines = content.split('\n')

    let currentBlock: MarkdownBlock | null = null

    for (const line of lines) {
      // Code block
      if (line.startsWith('```')) {
        if (currentBlock?.type === 'code') {
          // End code block
          blocks.push(currentBlock)
          currentBlock = null
        } else {
          // Start code block
          const lang = line.slice(3).trim()
          currentBlock = {
            type: 'code',
            content: [],
            language: lang
          }
        }
        continue
      }

      // Inside code block
      if (currentBlock?.type === 'code') {
        currentBlock.content.push(line)
        continue
      }

      // Heading
      if (line.startsWith('#')) {
        const level = line.match(/^#+/)?.[0].length || 1
        blocks.push({
          type: 'heading',
          content: line.replace(/^#+\s*/, ''),
          level
        })
        continue
      }

      // List item
      if (line.match(/^[-*]\s/)) {
        blocks.push({
          type: 'list',
          content: line.replace(/^[-*]\s*/, '')
        })
        continue
      }

      // Paragraph
      if (line.trim()) {
        blocks.push({
          type: 'paragraph',
          content: line
        })
      }
    }

    // Close any open code block
    if (currentBlock) {
      blocks.push(currentBlock)
    }

    return blocks
  }

  /**
   * Render a markdown block
   */
  private renderBlock(block: MarkdownBlock, key: number): React.ReactNode {
    switch (block.type) {
      case 'heading':
        return this.renderHeading(block, key)

      case 'paragraph':
        return this.renderParagraph(block, key)

      case 'code':
        return this.renderCode(block, key)

      case 'list':
        return this.renderList(block, key)

      default:
        return null
    }
  }

  private renderHeading(block: MarkdownBlock, key: number) {
    const colors = ['cyan', 'blue', 'magenta']
    const color = colors[Math.min(block.level! - 1, 2)]

    return (
      <Box key={key} marginY={1}>
        <Text color={color} bold>
          {block.content}
        </Text>
      </Box>
    )
  }

  private renderParagraph(block: MarkdownBlock, key: number) {
    // Parse inline formatting
    const content = this.parseInline(block.content as string)

    return (
      <Box key={key}>
        <Text>{content}</Text>
      </Box>
    )
  }

  private renderCode(block: MarkdownBlock, key: number) {
    const lines = block.content as string[]

    return (
      <Box
        key={key}
        flexDirection="column"
        borderStyle="single"
        borderColor="gray"
        paddingX={1}
        marginY={1}
      >
        {block.language && (
          <Text color="gray" dimColor>
            {block.language}
          </Text>
        )}
        {lines.map((line, i) => (
          <Text key={i} color="yellow">
            {line}
          </Text>
        ))}
      </Box>
    )
  }

  private renderList(block: MarkdownBlock, key: number) {
    return (
      <Box key={key}>
        <Text>• </Text>
        <Text>{block.content}</Text>
      </Box>
    )
  }

  /**
   * Parse inline formatting (bold, italic, code)
   */
  private parseInline(text: string): string {
    // Bold: **text** or __text__
    text = text.replace(/\*\*(.*?)\*\*/g, '$1')
    text = text.replace(/__(.*?)__/g, '$1')

    // Italic: *text* or _text_
    text = text.replace(/\*(.*?)\*/g, '$1')
    text = text.replace(/_(.*?)_/g, '$1')

    // Inline code: `text`
    text = text.replace(/`(.*?)`/g, '$1')

    return text
  }
}

interface MarkdownBlock {
  type: 'heading' | 'paragraph' | 'code' | 'list'
  content: string | string[]
  language?: string
  level?: number
}
```

**Estimated Lines**: ~200 lines

**Phase**: v1.2

---

## 📊 Summary

### Files to Enhance (2)

| File | Current | New | Changes | Phase |
|------|---------|-----|---------|-------|
| CodehClient.ts | ~300 | ~380 | +streaming support | v1.1 |
| CodehChat.ts | ~200 | ~270 | +stats, +export | v1.1 |

### New Files (2)

| File | Lines | Phase | Priority |
|------|-------|-------|----------|
| CommandService.ts | ~250 | v1.1 | 🔴 HIGH |
| MarkdownService.ts | ~200 | v1.2 | 🟡 MEDIUM |

**Total New Lines**: ~380 lines

---

## 🎯 Implementation Order

### Phase 1 (v1.1):
1. **CommandService.ts** - Needed for slash commands
2. **CodehClient.ts** - Add streaming method
3. **CodehChat.ts** - Add statistics methods

### Phase 2 (v1.2):
4. **MarkdownService.ts** - For markdown rendering

---

## 🔗 Navigation

[← Prev: Domain Models](./03-layer2-domain-models.md) | [Next: Infrastructure →](./05-layer3-infrastructure.md)

---

**Last Updated**: 2025-01-08
**Total Files**: 4
**Estimated Total Lines**: ~380 new + ~150 enhanced = ~530 lines
