# HomeScreen - LLM Chat Interface

Comprehensive terminal-based chat interface for interacting with multiple AI providers (Anthropic Claude, OpenAI, Ollama, and generic OpenAI-compatible APIs).

## Features

### 🤖 Multi-Provider Support
- **Anthropic Claude** (✦) - Cyan branding
- **OpenAI** (◆) - Teal branding
- **Ollama** (◉) - Red branding
- **Generic** (●) - Gray branding

### 📝 Rich Markdown Rendering
- **Syntax highlighting** for 15+ programming languages
- **Tables** with auto-sizing and borders
- **Lists** (ordered and unordered)
- **Blockquotes** and horizontal rules
- **Inline formatting**: **bold**, *italic*, `code`, [links](url)
- **Code blocks** with line numbers

### ⚡ Real-time Streaming
- Chunk-by-chunk response display
- Debounced updates (50ms) for optimal performance
- Cancellable streams (Esc key)
- Streaming cursor animation

### 💬 Complete UI/UX
- Provider-specific icons and colors
- Token usage display (input/output/total)
- Connection status (connected/streaming/disconnected)
- Responsive terminal sizing
- Welcome screen

### ⌨️ Keyboard Shortcuts
- **Ctrl+C**: Exit application
- **Ctrl+L**: Clear chat history
- **Esc**: Cancel streaming
- **Enter**: Send message

## Installation

```bash
# Dependencies already installed in project
npm install lowlight highlight.js ink-text-input
```

## Quick Start

```tsx
import {HomeScreen} from '@/presentation/screens/HomeScreen';
import {AnthropicClient} from '@/infrastructure/api/clients/AnthropicClient';

const apiClient = new AnthropicClient({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Render the chat interface
<HomeScreen
  apiClient={apiClient}
  initialProvider="anthropic"
  initialModel="claude-3-5-sonnet-20241022"
/>
```

## Architecture

```
HomeScreen/
├── types/              # TypeScript type definitions
│   ├── index.ts        # Base types (Provider, HistoryItem, Message)
│   ├── markdown.ts     # Markdown-specific types
│   └── streaming.ts    # Streaming-related types
│
├── utils/              # Utility functions
│   ├── colors.ts       # Theme colors and provider styling
│   ├── textUtils.ts    # Text wrapping, truncation, padding
│   ├── markdownParser.ts    # Parse markdown into blocks
│   ├── highlighter.ts       # Syntax highlighting setup
│   └── syntaxTokenToInk.tsx # Convert HAST tokens to Ink elements
│
├── components/
│   ├── markdown/       # Markdown rendering components
│   │   ├── CodeBlock.tsx            # Syntax-highlighted code blocks
│   │   ├── TableRenderer.tsx        # Markdown tables
│   │   ├── InlineMarkdownRenderer.tsx   # Inline formatting
│   │   └── MarkdownDisplay.tsx      # Main markdown orchestrator
│   │
│   ├── messages/       # Message display components
│   │   ├── AssistantMessage.tsx     # AI responses
│   │   ├── UserMessage.tsx          # User inputs
│   │   ├── SystemMessage.tsx        # System notifications
│   │   └── HistoryItemDisplay.tsx   # Wrapper for all messages
│   │
│   └── layout/         # Layout components
│       ├── MainContent.tsx   # Chat history display
│       ├── InputBox.tsx      # User input field
│       └── Footer.tsx        # Status bar
│
├── hooks/              # React hooks
│   ├── useStreamChat.ts         # Streaming chat management
│   ├── useDebouncedStreamContent.ts   # Debounced updates
│   ├── useHistory.ts            # Chat history management
│   └── useTerminalSize.ts       # Terminal dimensions
│
├── contexts/           # React Context for state management
│   ├── ChatContext.tsx      # Chat state (history, streaming)
│   └── SettingsContext.tsx  # Settings (provider, model, params)
│
├── HomeScreen.tsx      # Main entry component
├── HomeScreenContent.tsx   # Internal UI layout
├── index.ts            # Public exports
│
├── PERFORMANCE.md      # Performance optimization guide
└── README.md           # This file
```

## Component Flow

```
┌─────────────────────────────────────────┐
│ HomeScreen                              │
│  ├─ SettingsProvider                    │
│  │   └─ ChatProvider                    │
│  │       └─ HomeScreenContent           │
│  │           ├─ MainContent             │
│  │           │   ├─ Static (history)    │
│  │           │   │   └─ HistoryItem[]   │
│  │           │   │       ├─ UserMessage │
│  │           │   │       └─ Assistant...│
│  │           │   └─ PendingItem         │
│  │           │       └─ MarkdownDisplay │
│  │           ├─ InputBox                │
│  │           └─ Footer                  │
└─────────────────────────────────────────┘
```

## Usage Examples

### Example 1: Basic Usage with Anthropic

```tsx
import React from 'react';
import {render} from 'ink';
import {HomeScreen} from '@/presentation/screens/HomeScreen';
import {AnthropicClient} from '@/infrastructure/api/clients/AnthropicClient';

const apiClient = new AnthropicClient({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

function App() {
  return (
    <HomeScreen
      apiClient={apiClient}
      initialProvider="anthropic"
      initialModel="claude-3-5-sonnet-20241022"
    />
  );
}

const app = render(<App />);

app.waitUntilExit().then(() => {
  process.exit(0);
});
```

### Example 2: Using OpenAI

```tsx
import {OpenAIClient} from '@/infrastructure/api/clients/OpenAIClient';

const apiClient = new OpenAIClient({
  apiKey: process.env.OPENAI_API_KEY || '',
});

function App() {
  return (
    <HomeScreen
      apiClient={apiClient}
      initialProvider="openai"
      initialModel="gpt-4-turbo-preview"
    />
  );
}
```

### Example 3: Using Local Ollama

```tsx
import {OllamaClient} from '@/infrastructure/api/clients/OllamaClient';

const apiClient = new OllamaClient({
  baseURL: 'http://localhost:11434',
});

function App() {
  return (
    <HomeScreen
      apiClient={apiClient}
      initialProvider="ollama"
      initialModel="llama2"
    />
  );
}
```

### Example 4: Provider Switching Pattern

For applications that need to switch between multiple providers:

```tsx
import {AnthropicClient} from '@/infrastructure/api/clients/AnthropicClient';
import {OpenAIClient} from '@/infrastructure/api/clients/OpenAIClient';
import {OllamaClient} from '@/infrastructure/api/clients/OllamaClient';

// Create all provider clients
const providers = {
  anthropic: new AnthropicClient({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  }),
  openai: new OpenAIClient({
    apiKey: process.env.OPENAI_API_KEY || '',
  }),
  ollama: new OllamaClient({
    baseURL: 'http://localhost:11434',
  }),
};

// Select active provider
const currentProvider: keyof typeof providers = 'anthropic';
const apiClient = providers[currentProvider];

function App() {
  return (
    <HomeScreen
      apiClient={apiClient}
      initialProvider={currentProvider}
    />
  );
}
```

## API Reference

### HomeScreen Props

```tsx
interface HomeScreenProps {
  /** API client instance implementing IApiClient */
  apiClient: IApiClient;

  /** Initial provider (default: 'anthropic') */
  initialProvider?: Provider;

  /** Initial model name */
  initialModel?: string;
}
```

### Provider Types

```tsx
type Provider = 'anthropic' | 'openai' | 'ollama' | 'generic';
```

### IApiClient Interface

All API clients must implement:

```tsx
interface IApiClient {
  chat(request: ApiRequest): Promise<ApiResponse>;
  streamChat(request: ApiRequest, onChunk: (chunk: StreamChunk) => void): Promise<ApiResponse>;
  healthCheck(): Promise<boolean>;
  getProviderName(): string;
  getAvailableModels(): Promise<string[]>;
}
```

## State Management

### ChatContext

Manages chat history, streaming, and message handling:

```tsx
const {
  history,           // HistoryItem[]
  pendingItem,       // PendingItem | null
  isStreaming,       // boolean
  error,             // Error | null
  provider,          // Provider
  sendMessage,       // (content: string) => Promise<void>
  cancelStream,      // () => void
  clearHistory,      // () => void
} = useChat();
```

### SettingsContext

Manages provider and generation settings:

```tsx
const {
  provider,          // Provider
  model,             // string
  temperature,       // number
  maxTokens,         // number
  systemPrompt,      // string | undefined
  setProvider,       // (provider: Provider) => void
  setModel,          // (model: string) => void
  // ... other setters
} = useSettings();
```

## Performance

### Optimizations Applied

1. **React.memo** for expensive components
2. **Debounced streaming** (50ms) reduces re-renders by ~20x
3. **Ink Static** component for completed history items
4. **Separated pending item** from history array
5. **useCallback** in all custom hooks
6. **Context separation** (Chat + Settings)

### Recommendations

See [PERFORMANCE.md](./PERFORMANCE.md) for detailed optimization strategies.

## Supported Languages (Syntax Highlighting)

- JavaScript/TypeScript
- Python
- Java
- C/C++
- Go
- Rust
- Ruby
- PHP
- Shell/Bash
- SQL
- HTML/CSS
- JSON
- YAML
- Markdown

## Environment Variables

```bash
# For Anthropic
ANTHROPIC_API_KEY=your_api_key_here

# For OpenAI
OPENAI_API_KEY=your_api_key_here

# Ollama runs locally, no key needed
```

## Limitations

1. **History Persistence**: Currently in-memory only (configurable for file-based storage)
2. **Max History**: Limited to 100 items (configurable)
3. **Virtualization**: Not yet implemented for very long histories (>100 items)
4. **Provider Switching**: Requires app restart (dynamic switching planned)

## Testing

```bash
# Type check
npx tsc --noEmit

# Run example
npm run dev

# Test with specific provider
ANTHROPIC_API_KEY=xxx npm run dev
```

## Troubleshooting

### "Cannot find module IApiClient"
- Check import paths are correct (4 levels from types/ folder)
- Ensure IApiClient.ts exists at `source/core/domain/interfaces/`

### TypeScript errors with JSX
- Ensure files with JSX use `.tsx` extension
- Check `tsconfig.json` includes JSX support

### Streaming not working
- Verify API client implements `streamChat()` method
- Check API key is set correctly
- Ensure provider supports streaming

### Markdown not rendering
- Check lowlight and highlight.js are installed
- Verify language is supported (see list above)

## Contributing

See main project CONTRIBUTING.md for guidelines.

## License

See main project LICENSE file.

## Related Documentation

- [LLM API Integration](../../../docs/architecture/llm-api-integration.md)
- [UI/UX Design](../../../docs/screens/home/llm-ui-ux.md)
- [Performance Optimization](./PERFORMANCE.md)
