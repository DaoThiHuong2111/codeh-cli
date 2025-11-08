# 🏗️ Layer 3: Infrastructure Implementation Plan

> **Part 5/8** | [← Prev: Application Services](./04-layer2-application-services.md) | [Next: Phase 1 Features →](./06-phase1-core-features.md)

---

## 📋 Mục Tiêu

Implement infrastructure layer để support các features mới:

- **SessionManager**: Save/load conversations
- **StreamHandler**: Handle API streaming
- **Enhance existing**: API clients để support streaming

---

## 🏗️ Structure

```
source/infrastructure/
├── session/
│   ├── SessionManager.ts        ❌ NEW
│   └── FileSessionStorage.ts    ❌ NEW
│
├── streaming/
│   └── StreamHandler.ts         ❌ NEW (hoặc integrate vào clients)
│
└── api/
    └── clients/
        ├── AnthropicClient.ts   ✅ EXISTING (add streaming)
        ├── OpenAIClient.ts      ✅ EXISTING (add streaming)
        └── OllamaClient.ts      ✅ EXISTING (add streaming)
```

---

## 📄 1. SessionManager.ts ❌ NEW

**Purpose**: Implement ISessionManager interface

**Location**: `source/infrastructure/session/SessionManager.ts`

### Implementation

```typescript
import * as fs from 'fs/promises'
import * as path from 'path'
import { ISessionManager, SessionInfo } from '@/core/domain/interfaces'
import { Session } from '@/core/domain/valueObjects/Session'

export class FileSessionManager implements ISessionManager {
  private sessionsDir: string

  constructor(baseDir: string = '~/.codeh/sessions') {
    this.sessionsDir = this.expandPath(baseDir)
  }

  async init(): Promise<void> {
    // Create sessions directory if not exists
    await fs.mkdir(this.sessionsDir, { recursive: true })
  }

  async save(session: Session): Promise<void> {
    await this.init()

    const filename = this.getFilename(session.name)
    const filepath = path.join(this.sessionsDir, filename)

    // Serialize session
    const data = JSON.stringify(session.toJSON(), null, 2)

    // Write to file
    await fs.writeFile(filepath, data, 'utf-8')
  }

  async load(name: string): Promise<Session> {
    const filename = this.getFilename(name)
    const filepath = path.join(this.sessionsDir, filename)

    // Check if exists
    if (!(await this.exists(name))) {
      throw new Error(`Session "${name}" not found`)
    }

    // Read file
    const data = await fs.readFile(filepath, 'utf-8')

    // Parse and create session
    const json = JSON.parse(data)
    return Session.fromData(json)
  }

  async list(): Promise<SessionInfo[]> {
    await this.init()

    // Read directory
    const files = await fs.readdir(this.sessionsDir)

    // Filter .json files
    const sessionFiles = files.filter(f => f.endsWith('.json'))

    // Get info for each
    const infos: SessionInfo[] = []

    for (const file of sessionFiles) {
      const filepath = path.join(this.sessionsDir, file)
      const stats = await fs.stat(filepath)

      // Read file to get metadata
      const data = await fs.readFile(filepath, 'utf-8')
      const json = JSON.parse(data)

      infos.push({
        name: json.name,
        messageCount: json.metadata.messageCount,
        createdAt: new Date(json.createdAt),
        updatedAt: new Date(json.updatedAt),
        size: stats.size
      })
    }

    // Sort by updated date (newest first)
    infos.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())

    return infos
  }

  async delete(name: string): Promise<void> {
    const filename = this.getFilename(name)
    const filepath = path.join(this.sessionsDir, filename)

    if (!(await this.exists(name))) {
      throw new Error(`Session "${name}" not found`)
    }

    await fs.unlink(filepath)
  }

  async exists(name: string): Promise<boolean> {
    const filename = this.getFilename(name)
    const filepath = path.join(this.sessionsDir, filename)

    try {
      await fs.access(filepath)
      return true
    } catch {
      return false
    }
  }

  // === Private Methods ===

  private getFilename(name: string): string {
    // Sanitize name
    const sanitized = name.replace(/[^a-zA-Z0-9-_]/g, '_')
    return `${sanitized}.json`
  }

  private expandPath(filepath: string): string {
    if (filepath.startsWith('~/')) {
      return path.join(process.env.HOME || '', filepath.slice(2))
    }
    return filepath
  }
}
```

**Estimated Lines**: ~150 lines

**Phase**: v1.1

---

## 📄 2. AnthropicClient.ts ✅ ENHANCE

**Purpose**: Add streaming support

**Location**: `source/infrastructure/api/clients/AnthropicClient.ts`

### Add Streaming Method

```typescript
import Anthropic from '@anthropic-ai/sdk'

export class AnthropicClient implements IApiClient {
  private client: Anthropic
  // ... existing code

  /**
   * Execute with streaming
   */
  async *executeStream(input: string): AsyncGenerator<string> {
    // Build messages
    const messages = this.buildMessages(input)

    // Create streaming request
    const stream = await this.client.messages.stream({
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      messages,
      stream: true
    })

    // Yield chunks as they arrive
    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          yield event.delta.text
        }
      }
    }
  }
}
```

**Estimated Additional Lines**: ~30 lines

**Phase**: v1.1

---

## 📄 3. OpenAIClient.ts ✅ ENHANCE

**Purpose**: Add streaming support

**Location**: `source/infrastructure/api/clients/OpenAIClient.ts`

### Add Streaming Method

```typescript
import OpenAI from 'openai'

export class OpenAIClient implements IApiClient {
  private client: OpenAI
  // ... existing code

  /**
   * Execute with streaming
   */
  async *executeStream(input: string): AsyncGenerator<string> {
    // Build messages
    const messages = this.buildMessages(input)

    // Create streaming request
    const stream = await this.client.chat.completions.create({
      model: this.config.model,
      messages,
      stream: true
    })

    // Yield chunks
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content
      if (content) {
        yield content
      }
    }
  }
}
```

**Estimated Additional Lines**: ~25 lines

**Phase**: v1.1

---

## 📄 4. OllamaClient.ts ✅ ENHANCE

**Purpose**: Add streaming support

**Location**: `source/infrastructure/api/clients/OllamaClient.ts`

### Add Streaming Method

```typescript
export class OllamaClient implements IApiClient {
  // ... existing code

  /**
   * Execute with streaming
   */
  async *executeStream(input: string): AsyncGenerator<string> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: this.buildMessages(input),
        stream: true
      })
    })

    if (!response.body) {
      throw new Error('No response body')
    }

    // Read stream
    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(l => l.trim())

      for (const line of lines) {
        try {
          const data = JSON.parse(line)
          if (data.message?.content) {
            yield data.message.content
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }
}
```

**Estimated Additional Lines**: ~40 lines

**Phase**: v1.1

---

## 📊 Summary

### New Files (1)

| File | Lines | Phase | Priority |
|------|-------|-------|----------|
| SessionManager.ts | ~150 | v1.1 | 🔴 HIGH |

### Files to Enhance (3)

| File | Addition | Phase | Priority |
|------|----------|-------|----------|
| AnthropicClient.ts | ~30 lines | v1.1 | 🔴 HIGH |
| OpenAIClient.ts | ~25 lines | v1.1 | 🔴 HIGH |
| OllamaClient.ts | ~40 lines | v1.1 | 🔴 HIGH |

**Total New Lines**: ~245 lines

---

## 🎯 Implementation Checklist

### SessionManager
- [ ] Create sessions directory
- [ ] Implement save() method
- [ ] Implement load() method
- [ ] Implement list() method
- [ ] Implement delete() method
- [ ] Add error handling
- [ ] Add tests

### API Clients Streaming
- [ ] AnthropicClient.executeStream()
- [ ] OpenAIClient.executeStream()
- [ ] OllamaClient.executeStream()
- [ ] GenericClient.executeStream() (if needed)
- [ ] Test streaming với mỗi provider
- [ ] Handle stream errors
- [ ] Add cancellation support

---

## 🔗 Navigation

[← Prev: Application Services](./04-layer2-application-services.md) | [Next: Phase 1 Features →](./06-phase1-core-features.md)

---

**Last Updated**: 2025-01-08
**Total New Lines**: ~245 lines
**Phase**: v1.1 (all critical for Phase 1)
