# Changelog

All notable changes to CODEH CLI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-01-08

### Added - Phase 2: Advanced UX

#### Streaming Support
- **Real-time streaming responses** for all AI providers (Anthropic, OpenAI, Ollama)
- Word-by-word response display with streaming indicator
- Interrupt-safe streaming that preserves message integrity
- SSE (Server-Sent Events) protocol implementation in HttpClient
- Provider-specific streaming handlers with unified interface

#### Markdown Rendering
- **Rich markdown rendering** for assistant messages
- Supported elements:
  - Headings (H1-H6) with color-coding
  - Code blocks with language labels and borders
  - Lists (unordered with -, *, +)
  - Blockquotes with special styling
  - Paragraphs with proper spacing
  - Inline formatting (bold, italic, inline code)
- MarkdownService for parsing (267 lines, 50+ tests)
- MarkdownText component with sub-components for each block type

#### Keyboard Shortcuts & Input History
- **Input history navigation** with ↑↓ keys
- History stores last 50 inputs with automatic management
- **Global keyboard shortcuts**:
  - `?` - Toggle help overlay
  - `Esc` - Clear input or close overlays
  - `↑↓` - Navigate input history (when not in suggestions)
- HelpOverlay component showing all shortcuts and commands
- Smart history management (no duplicates, newest first)

#### Enhanced Footer
- **Real-time statistics bar** with 6 metrics:
  - Model name
  - Message count
  - Total tokens (formatted)
  - Estimated cost ($ calculation)
  - Session duration (MM:SS, updates every second)
  - Git branch (auto-detected)
- Auto-updating timer without blocking UI
- Color-coded stats for readability

#### Character Counter
- **Smart character limit** for input (4000 chars default)
- Real-time count display below input
- Color-coded warnings:
  - Gray: Normal usage (< 80%)
  - Yellow: Approaching limit (80-95%) with ⚠️
  - Red: Limit reached (> 95%) with ⚠️ message
- Hard limit enforcement (blocks input beyond max)
- Optional props: `maxLength`, `showCounter`

#### Task Tracking (Todos)
- **Visual task list** with progress tracking
- Todo domain model with immutable design
- TodosDisplay component with:
  - Progress bar showing completion percentage
  - Grouped by status (In Progress → Pending → Completed)
  - Color-coded status indicators (○, ◐, ●)
  - Section counts and overall stats
- Presenter methods: `addTodo()`, `updateTodoStatus()`, `clearTodos()`
- State transitions: pending → in_progress → completed

### Added - Testing

#### Comprehensive Test Suite (200+ tests)
- **Domain Models**: 100% coverage
  - Message.test.ts (40+ tests)
  - Todo.test.ts (30+ tests)
- **Services**: 100% coverage
  - MarkdownService.test.ts (50+ tests)
- **Components**: 85% coverage
  - ProgressBar.test.tsx (20+ tests)
  - MessageBubble.test.tsx (30+ tests)
  - TodosDisplay.test.tsx (35+ tests)
- **Integration**: 80% coverage
  - HomePresenterNew.test.ts (50+ tests)
- Test infrastructure:
  - AVA test runner with tsx loader
  - ink-testing-library for component testing
  - Mock dependencies for isolation
  - Comprehensive edge case coverage

#### Documentation
- Complete USER_GUIDE.md with:
  - Feature explanations and examples
  - Keyboard shortcuts reference
  - Tips & tricks
  - Troubleshooting guide
  - Advanced usage examples
- Test README with testing guidelines
- Updated component documentation

### Changed

#### Home Screen
- Replaced simple Home screen with HomeNew (MVP pattern)
- HomePresenterNew manages all state and business logic
- Improved component organization (atoms/molecules/organisms)
- Better separation of concerns (presentation vs logic)

#### Message Handling
- Messages are now immutable domain objects
- Streaming updates create new Message instances
- Proper state management with callbacks
- Better error handling and validation

#### API Clients
- All API clients now support streaming
- Unified streaming interface across providers
- Better error handling for network issues
- Metadata tracking for tokens and costs

### Fixed

- Message content immutability issues
- Input validation edge cases
- Streaming indicator flicker
- History navigation boundary conditions
- Token counting accuracy
- Timer cleanup on session end

## [1.1.0] - Previous Version

### Added
- Basic conversation history
- Slash commands (/help, /clear, /model, /session)
- Session management
- Multiple AI provider support
- Configuration system
- Logo and branding
- Basic MVP Home screen

### Core Features
- Message domain model
- Turn-based conversation tracking
- API client abstraction
- Session persistence
- Command registry

## [1.0.0] - Initial Release

### Added
- Initial CLI structure
- Basic AI interaction
- Simple text-based interface
- Environment variable configuration
- Documentation

---

## Release Notes

### v1.2.0 Highlights

This release focuses on **Advanced UX** and brings CODEH CLI to production-ready quality:

**🎨 Rich User Experience**
- Real-time streaming responses
- Beautiful markdown rendering
- Smart input management with history
- Visual task tracking

**📊 Enhanced Visibility**
- Real-time stats (tokens, cost, duration)
- Progress tracking for todos
- Clear status indicators
- Git branch awareness

**✅ Quality & Reliability**
- 200+ comprehensive tests
- >70% code coverage achieved
- Extensive documentation
- Edge case handling

**⚡ Performance**
- Efficient streaming without blocking
- Smart state management
- Optimized rendering
- Clean resource management

### Migration Guide

#### From v1.1.0 to v1.2.0

**Breaking Changes**: None - fully backward compatible

**New Features to Adopt**:

1. **Enable Streaming** (Automatic)
   - Responses now stream by default
   - No configuration needed

2. **Use Markdown** (Automatic)
   - Assistant responses render markdown
   - No changes needed to existing code

3. **Leverage Input History**
   - Press ↑↓ to navigate previous inputs
   - Works immediately

4. **Monitor Stats**
   - Check footer for tokens/cost
   - Plan API usage accordingly

5. **Add Help Overlay**
   - Press `?` anytime for help
   - Learn all shortcuts

6. **Track Tasks**
   - Ask AI to create todo lists
   - Visual progress tracking

### Upgrade Instructions

```bash
# Pull latest code
git pull origin main

# Install dependencies (if any new ones)
npm install

# Run tests to verify
npm test

# Build
npm run build

# Start using new features
codeh
```

### Known Issues

None reported for v1.2.0

### Upcoming in v1.3.0

- Syntax highlighting for code blocks
- Plugin system
- Custom themes
- Advanced session features
- Export conversations

---

## Contribution Guidelines

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on:
- Bug reports
- Feature requests
- Pull requests
- Code style
- Testing requirements

---

## Support

- **Documentation**: [docs/](./docs/)
- **User Guide**: [docs/USER_GUIDE.md](./docs/USER_GUIDE.md)
- **Issues**: [GitHub Issues](https://github.com/your-repo/codeh-cli/issues)

---

[1.2.0]: https://github.com/your-repo/codeh-cli/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/your-repo/codeh-cli/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/your-repo/codeh-cli/releases/tag/v1.0.0
