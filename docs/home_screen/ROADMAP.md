# 🗺️ Home Screen Development Roadmap

> **Last Updated**: 2025-01-08
> **Purpose**: Lộ trình phát triển Home Screen kết hợp features từ docs hiện tại và học hỏi từ Gemini CLI

---

## 🎯 Vision

Tạo ra **AI CLI tốt nhất** bằng cách kết hợp:
- ✅ **Gemini CLI's** proven UX patterns (conversation, streaming, commands)
- ✅ **CODEH's** superior architecture & documentation
- ✅ **Unique features** tạo sự khác biệt (todos, analytics, branding)

---

## 📊 Roadmap Overview

```
Current (v1.0) → Phase 1 (v1.1) → Phase 2 (v1.2) → Phase 3 (v1.3) → Future (v2.0)
  MVP Basic       Core Features    Advanced UX      Extensions      Innovation

Timeline:       2-3 weeks        3-4 weeks        4-5 weeks        TBD
Effort:         Medium          High             High             Very High
Priority:       ✅ Done          🔴 Critical      🟡 Important     🟢 Nice-to-have
```

---

## ✅ Current State (v1.0.0)

### Đã Có
- [x] MVP Home Screen (64 lines)
- [x] Logo component
- [x] InfoSection (version, model, directory)
- [x] TipsSection (static tips)
- [x] InputBox (basic input)
- [x] HomePresenter với MVP pattern
- [x] Basic error handling
- [x] Loading states (text-based)
- [x] CLAUDE.md context file support

### Limitations
- ❌ Chỉ hiển thị output cuối cùng
- ❌ Không có conversation history
- ❌ Không có slash commands
- ❌ Không có streaming
- ❌ Không có session persistence

---

## 🔴 Phase 1: Core Features (v1.1.0)
> **Timeline**: 2-3 weeks | **Priority**: CRITICAL | **Học từ**: Gemini CLI + Docs hiện tại

### Objectives
Implement các tính năng **thiết yếu** để match với docs và Gemini CLI core features.

### Features

#### 1.1 Conversation History Display 🔴
**From:** Docs + Gemini CLI
**Effort:** 3-4 days
**Files:**
- Create `ConversationArea.tsx`
- Create `Message.tsx` component
- Update `HomePresenter.ts` - Add messages array
- Update `useHomeLogic.ts` - Track messages

**Acceptance Criteria:**
- [ ] Display all messages in conversation
- [ ] Distinguish user/assistant/error/system with colors
- [ ] Show timestamps for each message
- [ ] Auto-scroll to latest message
- [ ] Support scrolling to view history

**UI Mockup:**
```
┌─────────────────────────────────────┐
│ > You: How to use async?  (10:30)  │
│                                     │
│ < Assistant: Here's how... (10:30) │
│   [content]                         │
│                                     │
│ > You: Show example       (10:32)  │
│                                     │
│ < Assistant: Sure...      (10:32)  │
│   [streaming...]▌                   │
└─────────────────────────────────────┘
```

---

#### 1.2 Slash Commands Implementation 🔴
**From:** Docs + Gemini CLI
**Effort:** 2-3 days
**Files:**
- Create `SlashSuggestions.tsx`
- Create `CommandRegistry.ts`
- Update `InputBox.tsx` - Detect `/` prefix
- Update `HomePresenter.ts` - Handle commands

**Commands to Implement:**
| Command | Function | Aliases |
|---------|----------|---------|
| `/help` | Show help | `/h`, `/?` |
| `/clear` | Clear conversation | `/cls`, `/reset` |
| `/new` | Start new conversation | `/n` |
| `/save [name]` | Save session | - |
| `/load [name]` | Load session | - |
| `/sessions` | List sessions | `/ls` |

**Acceptance Criteria:**
- [ ] Typing `/` shows suggestions
- [ ] Filter suggestions as user types
- [ ] Navigate with ↑↓ keys
- [ ] Select with Enter/Tab
- [ ] Execute command
- [ ] Show command results

**UI Mockup:**
```
┌─────────────────────────────────────┐
│ > /he_                              │
├─────────────────────────────────────┤
│ Slash Commands (↑↓ to navigate):   │
│  › /help - Show help documentation  │
│    /health - System health check    │
└─────────────────────────────────────┘
```

---

#### 1.3 Streaming Response Support 🔴
**From:** Gemini CLI (new feature)
**Effort:** 3-4 days
**Files:**
- Update `CodehClient.ts` - Add `executeStream()` method
- Update `HomePresenter.ts` - Handle streaming
- Update `useHomeLogic.ts` - Stream state updates
- Update `Message.tsx` - Show streaming indicator

**Acceptance Criteria:**
- [ ] Text appears progressively (not all at once)
- [ ] Show streaming indicator (▌)
- [ ] Update UI as chunks arrive
- [ ] Handle stream errors gracefully
- [ ] Disable input during streaming

**Technical Notes:**
```typescript
// In CodehClient
async *executeStream(input: string): AsyncGenerator<string> {
  const stream = await anthropic.messages.stream({...});
  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta') {
      yield chunk.delta.text;
    }
  }
}

// In HomePresenter
async handleInputWithStream(input: string, onChunk: (text: string) => void) {
  for await (const chunk of this.client.executeStream(input)) {
    onChunk(chunk);
  }
}
```

---

#### 1.4 Session Persistence 🔴
**From:** Gemini CLI (new feature)
**Effort:** 2-3 days
**Files:**
- Create `SessionManager.ts`
- Create storage in `~/.codeh/sessions/`
- Update commands: `/save`, `/load`, `/sessions`

**Acceptance Criteria:**
- [ ] `/save [name]` saves current conversation
- [ ] `/load [name]` restores conversation
- [ ] `/sessions` lists saved sessions
- [ ] Session includes: messages, metadata, timestamp
- [ ] Auto-save on exit (optional)

**Session Format:**
```json
{
  "name": "debug-session",
  "created": "2025-01-08T10:30:00Z",
  "updated": "2025-01-08T11:45:00Z",
  "model": "claude-3-5-sonnet",
  "messages": [...],
  "metadata": {
    "messageCount": 15,
    "totalTokens": 2500
  }
}
```

---

### Phase 1 Deliverables
- ✅ Conversation history như Gemini CLI
- ✅ 6 slash commands hoạt động
- ✅ Streaming responses realtime
- ✅ Session save/load/list
- ✅ Match với docs đã viết

### Phase 1 Metrics
- **Lines of Code**: ~300-400 new lines
- **New Components**: 4 components
- **New Files**: 6-8 files
- **Test Coverage**: 70%+

---

## 🟡 Phase 2: Advanced UX (v1.2.0)
> **Timeline**: 3-4 weeks | **Priority**: IMPORTANT | **Học từ**: Docs + UX improvements

### Features

#### 2.1 Keyboard Shortcuts & Input History 🟡
**From:** Docs
**Effort:** 2 days

**Shortcuts:**
- `?` - Toggle help overlay
- `Esc` - Clear input / Close overlay
- `↑` / `↓` - Navigate input history
- `Ctrl+L` - Clear screen
- `Ctrl+R` - Reload session

**Input History:**
- Track last 50 inputs
- Navigate with ↑↓
- Persist across sessions

---

#### 2.2 Markdown & Code Rendering 🟡
**From:** Docs + Gemini CLI
**Effort:** 3-4 days

**Features:**
- Syntax highlighting for code blocks
- Formatted markdown (bold, italic, lists)
- Collapsible code blocks
- Copy code button

**Libraries:**
- `ink-markdown` or custom renderer
- `highlight.js` for syntax highlighting

---

#### 2.3 Todos Display 🟡
**From:** Docs (unique to CODEH)
**Effort:** 2-3 days

**Features:**
- Display task list from AI
- 3 states: pending/in-progress/completed
- Progress bar
- Auto-update on status change

**UI:**
```
┌─────────────────────────────────────┐
│ Tasks: 2/5 completed                │
│  ✓ Setup project                    │
│  ✓ Install deps                     │
│  ▶ Writing tests                    │
│  ○ Add docs                         │
│  ○ Deploy                           │
└─────────────────────────────────────┘
```

---

#### 2.4 Enhanced Footer & Stats 🟡
**From:** Gemini CLI idea + new
**Effort:** 1-2 days

**Display:**
- Token usage (input/output)
- Message count
- Estimated cost
- Session duration
- Git branch (if in repo)

**UI:**
```
┌─────────────────────────────────────┐
│ 🤖 claude-3-5-sonnet | 💬 15 msgs  │
│ 🪙 2.5K tokens | 💰 $0.0125        │
│ ⏱️ 5m 23s | 📁 /home/user/project │
└─────────────────────────────────────┘
```

---

#### 2.5 Help Overlay 🟡
**From:** Docs
**Effort:** 1-2 days

**Content:**
- Keyboard shortcuts table
- Slash commands list
- Quick tips
- Press ? or Esc to close

---

#### 2.6 Character Counter & Validation 🟢
**From:** Docs
**Effort:** 1 day

**Features:**
- Show counter when > 100 chars
- Yellow warning at 80%
- Red warning at 100%
- Prevent submit if > 10,000

---

### Phase 2 Deliverables
- ✅ Rich UX với keyboard shortcuts
- ✅ Beautiful markdown rendering
- ✅ Todos tracking (unique feature!)
- ✅ Comprehensive stats display
- ✅ Help system
- ✅ Full input validation

---

## 🟢 Phase 3: Extensions (v1.3.0)
> **Timeline**: 4-5 weeks | **Priority**: NICE-TO-HAVE | **Học từ**: Gemini CLI advanced

### Features

#### 3.1 Multi-modal Input 🟠
**From:** Gemini CLI
**Effort:** 4-5 days

**Support:**
- File attachments
- Image uploads
- PDF documents
- Drag & drop

**Use Cases:**
- "Review this code: [app.ts]"
- "Analyze: [screenshot.png]"
- "Summarize: [design.pdf]"

---

#### 3.2 Output Format Options 🟢
**From:** Gemini CLI
**Effort:** 2-3 days

**Formats:**
- `text` (default)
- `json` (structured)
- `markdown` (raw)

**CLI:**
```bash
codeh -p "list files" --format json | jq
```

---

#### 3.3 Virtual Scrolling 🟢
**From:** Docs
**Effort:** 2-3 days

**When:**
- > 40 messages
- Render only visible + buffer
- Smooth performance với 1000+ messages

---

#### 3.4 Context Menu & Quick Actions 🟢
**New feature**
**Effort:** 3-4 days

**Actions:**
- Copy message
- Edit & resend
- Delete message
- Save as snippet
- Export conversation

---

### Phase 3 Deliverables
- ✅ Multi-modal capabilities
- ✅ Flexible output formats
- ✅ Performance optimizations
- ✅ Advanced user actions

---

## 🚀 Future Vision (v2.0.0+)
> **Timeline**: TBD | **Priority**: INNOVATION | **Beyond current scope**

### Ideas

#### 4.1 MCP Server Integration
**From:** Gemini CLI
**Features:**
- Plugin system
- Custom tools
- External integrations (GitHub, Slack, etc.)

---

#### 4.2 Collaborative Sessions
**New concept**
**Features:**
- Share session URL
- Real-time collaboration
- Comments & annotations

---

#### 4.3 AI Model Switching
**New concept**
**Features:**
- Switch between Claude/GPT/Gemini
- Compare responses
- Model-specific features

---

#### 4.4 Advanced Analytics
**New concept**
**Features:**
- Token usage trends
- Cost tracking over time
- Productivity metrics
- Session analytics dashboard

---

#### 4.5 Voice Input/Output
**New concept**
**Features:**
- Speech-to-text input
- Text-to-speech output
- Voice commands

---

## 📋 Implementation Priority Matrix

```
         │ Impact
         │ HIGH        │ MEDIUM       │ LOW
─────────┼─────────────┼──────────────┼──────────
Effort   │             │              │
HIGH     │ Multi-modal │ Virtual      │ Voice
         │             │ Scrolling    │ I/O
─────────┼─────────────┼──────────────┼──────────
MEDIUM   │ Conversation│ Markdown     │ Output
         │ History     │ Rendering    │ Formats
         │ Streaming   │ Todos        │
─────────┼─────────────┼──────────────┼──────────
LOW      │ Slash Cmds  │ Help Overlay │ Char
         │ Session     │ Keyboard     │ Counter
         │ Save/Load   │ Shortcuts    │
─────────┴─────────────┴──────────────┴──────────

Priority: Start from bottom-right, move to top-left
```

---

## 🎯 Success Metrics

### v1.1.0 (Phase 1)
- [ ] Users can view full conversation history
- [ ] 6 slash commands working
- [ ] Streaming response < 100ms latency
- [ ] Session save/load < 500ms
- [ ] 0 critical bugs

### v1.2.0 (Phase 2)
- [ ] Markdown rendering for 100% of responses
- [ ] Todos tracking for AI-generated tasks
- [ ] Help accessible within 1 keystroke
- [ ] Stats update realtime
- [ ] User satisfaction > 8/10

### v1.3.0 (Phase 3)
- [ ] File upload success rate > 95%
- [ ] Virtual scrolling handles 1000+ messages
- [ ] JSON output parseable by tools
- [ ] Performance: 60fps scrolling

---

## 📝 Documentation Updates

Sau mỗi phase, cập nhật:

### Phase 1
- [x] `CURRENT_STATE.md` - Update implemented features
- [ ] `functional/01-overview.md` - Add conversation area
- [ ] `functional/02-main-features.md` - Add streaming, sessions
- [ ] `technical/02-components.md` - Document new components
- [ ] `quick-reference.md` - Update with commands

### Phase 2
- [ ] `functional/04-detailed-features.md` - Markdown, todos
- [ ] `technical/07-keyboard.md` - Full shortcuts table
- [ ] `functional/06-error-handling.md` - Enhanced errors

### Phase 3
- [ ] `functional/02-main-features.md` - Multi-modal
- [ ] `technical/09-best-practices.md` - Performance tips

---

## 🤝 Contributing

### For Each Feature
1. Create feature branch: `feature/conversation-history`
2. Update docs FIRST
3. Implement with tests
4. Update CURRENT_STATE.md
5. Submit PR with:
   - Implementation
   - Tests (coverage > 70%)
   - Docs updates
   - Screenshots/demos

### Code Standards
- TypeScript strict mode
- MVP pattern compliance
- Component size < 200 lines
- 70%+ test coverage

---

## 📊 Progress Tracking

### Phase 1 Progress: 0% (0/4)
- [ ] 1.1 Conversation History
- [ ] 1.2 Slash Commands
- [ ] 1.3 Streaming Response
- [ ] 1.4 Session Persistence

### Phase 2 Progress: 0% (0/6)
- [ ] 2.1 Keyboard Shortcuts
- [ ] 2.2 Markdown Rendering
- [ ] 2.3 Todos Display
- [ ] 2.4 Enhanced Footer
- [ ] 2.5 Help Overlay
- [ ] 2.6 Character Counter

### Phase 3 Progress: 0% (0/4)
- [ ] 3.1 Multi-modal Input
- [ ] 3.2 Output Formats
- [ ] 3.3 Virtual Scrolling
- [ ] 3.4 Context Menu

---

**Related Documents:**
- [CURRENT_STATE.md](./CURRENT_STATE.md) - Current implementation status
- [GEMINI_COMPARISON.md](./GEMINI_COMPARISON.md) - Comparison with Gemini CLI
- [README.md](./README.md) - Documentation index

**Version**: 1.0.0
**Last Updated**: 2025-01-08
**Next Review**: After Phase 1 completion
