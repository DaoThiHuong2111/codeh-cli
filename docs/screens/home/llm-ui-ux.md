# Home Screen - LLM UI/UX Implementation

Tài liệu chi tiết về việc hiển thị UI/UX cho streaming LLM responses trong CODEH CLI homescreen.

## Mục lục

- [1. Tổng quan](#1-tổng-quan)
- [2. Terminal UI Architecture](#2-terminal-ui-architecture)
- [3. Message Display Components](#3-message-display-components)
- [4. Markdown Rendering](#4-markdown-rendering)
- [5. Streaming Display](#5-streaming-display)
- [6. Layout System](#6-layout-system)
- [7. State Management](#7-state-management)
- [8. Performance Optimization](#8-performance-optimization)
- [9. Accessibility](#9-accessibility)
- [10. Implementation Guide](#10-implementation-guide)

---

## 1. Tổng quan

Homescreen cần hiển thị streaming responses từ 4 nhà cung cấp LLM khác nhau trong terminal interface. UI/UX implementation phải đáp ứng:

### 1.1. Requirements

**Functional Requirements:**
- ✅ Real-time streaming display (word-by-word)
- ✅ Markdown rendering với syntax highlighting
- ✅ Multi-provider support (Anthropic, OpenAI, Ollama, Generic)
- ✅ Conversation history management
- ✅ Responsive terminal layout

**Non-Functional Requirements:**
- ⚡ Performance: < 100ms render time per chunk
- 🎨 Visual: Clear message differentiation (user vs assistant)
- ♿ Accessibility: Screen reader support
- 📱 Responsive: Adaptive to terminal size

### 1.2. Tech Stack (Based on Gemini CLI Analysis)

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **UI Framework** | Ink (React for CLI) | Component-based terminal UI |
| **Rendering** | React 19 | State management & hooks |
| **Markdown** | lowlight + highlight.js | Syntax highlighting |
| **Layout** | Flexbox (Ink Box) | Responsive layout |
| **State** | React Context | App-wide state |

---

## 2. Terminal UI Architecture

### 2.1. Component Hierarchy

```
HomeScreen (Container)
├── MainContent
│   ├── Static (Historical Messages)
│   │   └── HistoryItemDisplay[]
│   │       ├── UserMessage
│   │       └── AssistantMessage
│   │           └── MarkdownDisplay
│   └── PendingMessages (Live Streaming)
│       └── HistoryItemDisplay (isPending=true)
│           └── AssistantMessage
│               └── MarkdownDisplay (with cursor)
├── InputBox
└── Footer (Stats, Shortcuts)
```

### 2.2. File Structure

```
source/presentation/screens/HomeScreen/
├── HomeScreen.tsx              # Main container
├── components/
│   ├── MainContent.tsx         # Scrollable content area
│   ├── messages/
│   │   ├── AssistantMessage.tsx   # AI response display
│   │   ├── UserMessage.tsx        # User input display
│   │   └── SystemMessage.tsx      # System notifications
│   ├── MarkdownDisplay.tsx     # Markdown renderer
│   ├── InputBox.tsx            # User input
│   └── Footer.tsx              # Status bar
├── hooks/
│   ├── useStreamChat.ts        # Streaming logic
│   ├── useHistory.ts           # History management
│   └── useMarkdown.ts          # Markdown parsing
└── utils/
    ├── CodeColorizer.ts        # Syntax highlighting
    ├── TableRenderer.ts        # Table rendering
    └── InlineMarkdownRenderer.ts # Inline formatting
```

---

## 3. Message Display Components

### 3.1. AssistantMessage Component

Component hiển thị AI responses với streaming support:

```typescript
// File: source/presentation/screens/HomeScreen/components/messages/AssistantMessage.tsx

import React from 'react';
import { Text, Box } from 'ink';
import { MarkdownDisplay } from '../MarkdownDisplay';

interface AssistantMessageProps {
  text: string;
  isPending: boolean;           // Streaming in progress
  provider: 'anthropic' | 'openai' | 'ollama' | 'generic';
  terminalWidth: number;
  availableHeight?: number;
}

export const AssistantMessage: React.FC<AssistantMessageProps> = ({
  text,
  isPending,
  provider,
  terminalWidth,
  availableHeight,
}) => {
  // Provider-specific prefix/icon
  const getPrefix = () => {
    switch (provider) {
      case 'anthropic': return '✦ ';    // Claude
      case 'openai': return '◆ ';       // OpenAI
      case 'ollama': return '◉ ';       // Ollama
      case 'generic': return '● ';      // Generic
    }
  };

  const prefix = getPrefix();
  const prefixWidth = prefix.length;

  return (
    <Box flexDirection="row">
      {/* Icon prefix */}
      <Box width={prefixWidth}>
        <Text color="cyan">{prefix}</Text>
      </Box>

      {/* Message content */}
      <Box flexGrow={1} flexDirection="column">
        <MarkdownDisplay
          text={text}
          isPending={isPending}
          terminalWidth={terminalWidth - prefixWidth}
          availableHeight={availableHeight}
        />

        {/* Streaming cursor */}
        {isPending && (
          <Text color="gray">▊</Text>
        )}
      </Box>
    </Box>
  );
};
```

### 3.2. UserMessage Component

Component hiển thị user inputs:

```typescript
// File: source/presentation/screens/HomeScreen/components/messages/UserMessage.tsx

import React from 'react';
import { Text, Box } from 'ink';

interface UserMessageProps {
  text: string;
  terminalWidth: number;
}

export const UserMessage: React.FC<UserMessageProps> = ({
  text,
  terminalWidth,
}) => {
  const prefix = '> ';
  const prefixWidth = prefix.length;

  return (
    <Box flexDirection="row">
      <Box width={prefixWidth}>
        <Text color="green" bold>{prefix}</Text>
      </Box>
      <Box flexGrow={1}>
        <Text wrap="wrap" color="white">
          {text}
        </Text>
      </Box>
    </Box>
  );
};
```

### 3.3. HistoryItemDisplay Component

Wrapper component cho cả user và assistant messages:

```typescript
// File: source/presentation/screens/HomeScreen/components/HistoryItemDisplay.tsx

import React from 'react';
import { Box } from 'ink';
import { UserMessage } from './messages/UserMessage';
import { AssistantMessage } from './messages/AssistantMessage';
import type { HistoryItem } from '../types';

interface HistoryItemDisplayProps {
  item: HistoryItem;
  isPending: boolean;
  terminalWidth: number;
  availableHeight?: number;
}

export const HistoryItemDisplay: React.FC<HistoryItemDisplayProps> = ({
  item,
  isPending,
  terminalWidth,
  availableHeight,
}) => {
  return (
    <Box flexDirection="column" paddingY={1}>
      {/* User message */}
      {item.userMessage && (
        <UserMessage
          text={item.userMessage}
          terminalWidth={terminalWidth}
        />
      )}

      {/* Assistant response */}
      {item.assistantMessage && (
        <Box marginTop={1}>
          <AssistantMessage
            text={item.assistantMessage}
            isPending={isPending}
            provider={item.provider}
            terminalWidth={terminalWidth}
            availableHeight={availableHeight}
          />
        </Box>
      )}
    </Box>
  );
};
```

---

## 4. Markdown Rendering

### 4.1. MarkdownDisplay Component

Component chính xử lý markdown rendering với streaming support:

```typescript
// File: source/presentation/screens/HomeScreen/components/MarkdownDisplay.tsx

import React from 'react';
import { Text, Box } from 'ink';
import { colorizeCode } from '../utils/CodeColorizer';
import { TableRenderer } from '../utils/TableRenderer';
import { RenderInline } from '../utils/InlineMarkdownRenderer';

interface MarkdownDisplayProps {
  text: string;
  isPending: boolean;
  terminalWidth: number;
  availableHeight?: number;
  renderMarkdown?: boolean;  // false = raw markdown mode
}

export const MarkdownDisplay: React.FC<MarkdownDisplayProps> = ({
  text,
  isPending,
  terminalWidth,
  availableHeight,
  renderMarkdown = true,
}) => {
  if (!text) return null;

  // Raw markdown mode - hiển thị syntax-highlighted markdown
  if (!renderMarkdown) {
    const colorized = colorizeCode(text, 'markdown', terminalWidth);
    return <Box flexDirection="column">{colorized}</Box>;
  }

  // Parse và render markdown
  const blocks = parseMarkdown(text);

  return (
    <Box flexDirection="column">
      {blocks.map((block, index) => (
        <RenderBlock
          key={`block-${index}`}
          block={block}
          isPending={isPending && index === blocks.length - 1}
          terminalWidth={terminalWidth}
          availableHeight={availableHeight}
        />
      ))}
    </Box>
  );
};

// Render individual markdown block
const RenderBlock: React.FC<{
  block: MarkdownBlock;
  isPending: boolean;
  terminalWidth: number;
  availableHeight?: number;
}> = ({ block, isPending, terminalWidth, availableHeight }) => {
  switch (block.type) {
    case 'heading':
      return <RenderHeading block={block} />;
    case 'code':
      return (
        <RenderCodeBlock
          code={block.content}
          language={block.language}
          terminalWidth={terminalWidth}
          availableHeight={availableHeight}
        />
      );
    case 'list':
      return <RenderList block={block} />;
    case 'table':
      return <TableRenderer table={block.table} />;
    case 'paragraph':
      return (
        <Box marginY={1}>
          <Text wrap="wrap">
            <RenderInline text={block.content} />
          </Text>
        </Box>
      );
    default:
      return null;
  }
};
```

### 4.2. Code Syntax Highlighting

```typescript
// File: source/presentation/screens/HomeScreen/utils/CodeColorizer.ts

import { createLowlight } from 'lowlight';
import { Text } from 'ink';

const lowlight = createLowlight();

// Import common languages
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';

lowlight.register('javascript', javascript);
lowlight.register('typescript', typescript);
lowlight.register('python', python);
lowlight.register('json', json);
lowlight.register('bash', bash);

export function colorizeCode(
  code: string,
  language: string,
  terminalWidth: number,
  availableHeight?: number,
  showLineNumbers: boolean = true,
): React.ReactNode {
  try {
    // Highlight code
    const result = lowlight.highlight(language, code);

    // Convert to Ink components with colors
    const lines = code.split('\n');
    const maxLineNumWidth = String(lines.length).length;

    return lines.map((line, index) => {
      const lineNum = String(index + 1).padStart(maxLineNumWidth, ' ');

      return (
        <Box key={`line-${index}`} flexDirection="row">
          {showLineNumbers && (
            <Box width={maxLineNumWidth + 1} marginRight={1}>
              <Text color="gray">{lineNum}</Text>
            </Box>
          )}
          <Box flexGrow={1}>
            <Text>{highlightLine(line, result.value, index)}</Text>
          </Box>
        </Box>
      );
    });
  } catch (error) {
    // Fallback to plain text
    return <Text>{code}</Text>;
  }
}

// Syntax highlighting color mapping
const colorMap: Record<string, string> = {
  keyword: 'magenta',
  string: 'green',
  number: 'cyan',
  comment: 'gray',
  function: 'blue',
  variable: 'yellow',
  operator: 'white',
  class: 'cyan',
};

function highlightLine(
  line: string,
  tokens: any[],
  lineIndex: number,
): React.ReactNode {
  // Transform tokens to colored text
  // Implementation details...
  return <Text>{line}</Text>;
}
```

### 4.3. Table Rendering

```typescript
// File: source/presentation/screens/HomeScreen/utils/TableRenderer.tsx

import React from 'react';
import { Box, Text } from 'ink';

interface TableProps {
  table: {
    headers: string[];
    rows: string[][];
  };
}

export const TableRenderer: React.FC<TableProps> = ({ table }) => {
  const { headers, rows } = table;

  // Calculate column widths
  const columnWidths = headers.map((header, colIndex) => {
    const headerWidth = header.length;
    const maxRowWidth = Math.max(
      ...rows.map(row => row[colIndex]?.length || 0)
    );
    return Math.max(headerWidth, maxRowWidth);
  });

  const renderRow = (cells: string[], isHeader: boolean = false) => (
    <Box flexDirection="row">
      {cells.map((cell, index) => (
        <Box
          key={`cell-${index}`}
          width={columnWidths[index] + 2}
          paddingX={1}
          borderStyle="single"
          borderLeft={index === 0}
          borderRight
          borderTop={isHeader}
          borderBottom={isHeader}
        >
          <Text bold={isHeader}>{cell}</Text>
        </Box>
      ))}
    </Box>
  );

  return (
    <Box flexDirection="column" marginY={1}>
      {/* Header */}
      {renderRow(headers, true)}

      {/* Separator */}
      <Box flexDirection="row">
        {columnWidths.map((width, index) => (
          <Box key={`sep-${index}`} width={width + 2}>
            <Text color="gray">{'─'.repeat(width + 2)}</Text>
          </Box>
        ))}
      </Box>

      {/* Rows */}
      {rows.map((row, rowIndex) => (
        <Box key={`row-${rowIndex}`}>
          {renderRow(row)}
        </Box>
      ))}
    </Box>
  );
};
```

### 4.4. Inline Markdown Rendering

```typescript
// File: source/presentation/screens/HomeScreen/utils/InlineMarkdownRenderer.tsx

import React from 'react';
import { Text } from 'ink';

interface RenderInlineProps {
  text: string;
  defaultColor?: string;
}

export const RenderInline: React.FC<RenderInlineProps> = ({
  text,
  defaultColor = 'white',
}) => {
  // Parse inline markdown: **bold**, *italic*, `code`, [link](url)
  const tokens = parseInlineMarkdown(text);

  return (
    <>
      {tokens.map((token, index) => {
        switch (token.type) {
          case 'bold':
            return <Text key={index} bold>{token.content}</Text>;
          case 'italic':
            return <Text key={index} italic>{token.content}</Text>;
          case 'code':
            return (
              <Text
                key={index}
                backgroundColor="gray"
                color="yellow"
              >
                {token.content}
              </Text>
            );
          case 'link':
            return (
              <Text key={index} color="blue" underline>
                {token.content}
              </Text>
            );
          case 'text':
          default:
            return (
              <Text key={index} color={defaultColor}>
                {token.content}
              </Text>
            );
        }
      })}
    </>
  );
};

// Parse inline markdown tokens
function parseInlineMarkdown(text: string) {
  const tokens: Array<{ type: string; content: string }> = [];

  // Regex patterns
  const patterns = {
    bold: /\*\*(.+?)\*\*/g,
    italic: /\*(.+?)\*/g,
    code: /`(.+?)`/g,
    link: /\[(.+?)\]\((.+?)\)/g,
  };

  // Parsing logic...
  // (Implementation using regex matching and token creation)

  return tokens;
}
```

---

## 5. Streaming Display

### 5.1. Streaming Hook

Custom hook để xử lý streaming logic:

```typescript
// File: source/presentation/screens/HomeScreen/hooks/useStreamChat.ts

import { useState, useCallback } from 'react';
import type { IApiClient, StreamChunk, ApiRequest } from '@/core/domain/interfaces/IApiClient';

interface UseStreamChatOptions {
  apiClient: IApiClient;
  onChunkReceived?: (chunk: string) => void;
  onComplete?: (fullContent: string) => void;
  onError?: (error: Error) => void;
}

export function useStreamChat({
  apiClient,
  onChunkReceived,
  onComplete,
  onError,
}: UseStreamChatOptions) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<Error | null>(null);

  const streamChat = useCallback(async (request: ApiRequest) => {
    setIsStreaming(true);
    setStreamingContent('');
    setError(null);

    try {
      await apiClient.streamChat(request, (chunk: StreamChunk) => {
        if (chunk.content) {
          // Append text chunk
          setStreamingContent(prev => {
            const newContent = prev + chunk.content;
            onChunkReceived?.(chunk.content);
            return newContent;
          });
        }

        if (chunk.done) {
          // Stream complete
          setIsStreaming(false);
          onComplete?.(streamingContent);
        }
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setIsStreaming(false);
      onError?.(error);
    }
  }, [apiClient, onChunkReceived, onComplete, onError, streamingContent]);

  const cancelStream = useCallback(() => {
    // Cancel streaming (if supported by provider)
    setIsStreaming(false);
  }, []);

  return {
    isStreaming,
    streamingContent,
    error,
    streamChat,
    cancelStream,
  };
}
```

### 5.2. Real-time Updates

Integrate streaming hook vào HomeScreen:

```typescript
// File: source/presentation/screens/HomeScreen/HomeScreen.tsx (simplified)

import React, { useState } from 'react';
import { Box } from 'ink';
import { MainContent } from './components/MainContent';
import { InputBox } from './components/InputBox';
import { Footer } from './components/Footer';
import { useStreamChat } from './hooks/useStreamChat';
import type { HistoryItem } from './types';

export const HomeScreen: React.FC<{ apiClient: IApiClient }> = ({
  apiClient,
}) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [pendingItem, setPendingItem] = useState<HistoryItem | null>(null);

  const {
    isStreaming,
    streamingContent,
    streamChat,
  } = useStreamChat({
    apiClient,
    onChunkReceived: (chunk) => {
      // Update pending item với mỗi chunk
      setPendingItem(prev => prev ? {
        ...prev,
        assistantMessage: (prev.assistantMessage || '') + chunk,
      } : null);
    },
    onComplete: (fullContent) => {
      // Move pending to history
      if (pendingItem) {
        setHistory(prev => [...prev, {
          ...pendingItem,
          assistantMessage: fullContent,
        }]);
        setPendingItem(null);
      }
    },
  });

  const handleSendMessage = async (text: string) => {
    // Create pending item
    const newItem: HistoryItem = {
      id: Date.now(),
      userMessage: text,
      assistantMessage: '',
      provider: 'anthropic', // from config
      timestamp: new Date(),
    };

    setPendingItem(newItem);

    // Start streaming
    await streamChat({
      messages: [{ role: 'user', content: text }],
      model: 'claude-sonnet-4-5-20250929',
    });
  };

  return (
    <Box flexDirection="column" height="100%">
      {/* Main content area */}
      <Box flexGrow={1}>
        <MainContent
          history={history}
          pendingItem={pendingItem}
          isStreaming={isStreaming}
        />
      </Box>

      {/* Input box */}
      <InputBox
        onSubmit={handleSendMessage}
        disabled={isStreaming}
      />

      {/* Footer */}
      <Footer isStreaming={isStreaming} />
    </Box>
  );
};
```

### 5.3. Streaming Indicators

Visual indicators cho streaming state:

```typescript
// File: source/presentation/screens/HomeScreen/components/StreamingIndicator.tsx

import React, { useState, useEffect } from 'react';
import { Text } from 'ink';

interface StreamingIndicatorProps {
  isStreaming: boolean;
}

export const StreamingIndicator: React.FC<StreamingIndicatorProps> = ({
  isStreaming,
}) => {
  const [frame, setFrame] = useState(0);
  const frames = ['▊', '▉', '█', '▉'];

  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      setFrame(prev => (prev + 1) % frames.length);
    }, 150); // Animate cursor

    return () => clearInterval(interval);
  }, [isStreaming]);

  if (!isStreaming) return null;

  return (
    <Text color="gray">
      {frames[frame]}
    </Text>
  );
};
```

---

## 6. Layout System

### 6.1. MainContent Layout

```typescript
// File: source/presentation/screens/HomeScreen/components/MainContent.tsx

import React from 'react';
import { Box, Static } from 'ink';
import { HistoryItemDisplay } from './HistoryItemDisplay';
import type { HistoryItem } from '../types';

interface MainContentProps {
  history: HistoryItem[];
  pendingItem: HistoryItem | null;
  isStreaming: boolean;
  terminalWidth: number;
  terminalHeight: number;
}

export const MainContent: React.FC<MainContentProps> = ({
  history,
  pendingItem,
  isStreaming,
  terminalWidth,
  terminalHeight,
}) => {
  // Calculate available height for pending message
  const historyHeight = history.length * 10; // Approximate
  const availableHeight = terminalHeight - historyHeight - 5; // Reserve for input/footer

  return (
    <Box flexDirection="column">
      {/* Static history - không re-render khi streaming */}
      <Static items={history}>
        {(item) => (
          <HistoryItemDisplay
            key={item.id}
            item={item}
            isPending={false}
            terminalWidth={terminalWidth}
          />
        )}
      </Static>

      {/* Pending streaming message */}
      {pendingItem && (
        <HistoryItemDisplay
          item={pendingItem}
          isPending={isStreaming}
          terminalWidth={terminalWidth}
          availableHeight={availableHeight}
        />
      )}
    </Box>
  );
};
```

### 6.2. Responsive Layout

Auto-adjust dựa trên terminal size:

```typescript
// File: source/presentation/screens/HomeScreen/hooks/useTerminalSize.ts

import { useState, useEffect } from 'react';
import { useStdout } from 'ink';

export function useTerminalSize() {
  const { stdout } = useStdout();
  const [size, setSize] = useState({
    width: stdout.columns,
    height: stdout.rows,
  });

  useEffect(() => {
    const handler = () => {
      setSize({
        width: stdout.columns,
        height: stdout.rows,
      });
    };

    stdout.on('resize', handler);
    return () => {
      stdout.off('resize', handler);
    };
  }, [stdout]);

  return size;
}
```

### 6.3. Scrolling Behavior

```typescript
// File: source/presentation/screens/HomeScreen/components/ScrollableContent.tsx

import React, { useRef, useEffect } from 'react';
import { Box } from 'ink';

interface ScrollableContentProps {
  children: React.ReactNode;
  autoScroll?: boolean;
  maxHeight?: number;
}

export const ScrollableContent: React.FC<ScrollableContentProps> = ({
  children,
  autoScroll = true,
  maxHeight,
}) => {
  const scrollRef = useRef<any>(null);

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [children, autoScroll]);

  return (
    <Box
      ref={scrollRef}
      flexDirection="column"
      overflowY="scroll"
      scrollTop={Number.MAX_SAFE_INTEGER} // Always scroll to bottom
      maxHeight={maxHeight}
    >
      {children}
    </Box>
  );
};
```

---

## 7. State Management

### 7.1. Context Structure

```typescript
// File: source/presentation/screens/HomeScreen/contexts/ChatContext.tsx

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { HistoryItem } from '../types';

interface ChatContextValue {
  history: HistoryItem[];
  addToHistory: (item: HistoryItem) => void;
  clearHistory: () => void;

  pendingItem: HistoryItem | null;
  setPendingItem: (item: HistoryItem | null) => void;

  isStreaming: boolean;
  setIsStreaming: (streaming: boolean) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [pendingItem, setPendingItem] = useState<HistoryItem | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const addToHistory = useCallback((item: HistoryItem) => {
    setHistory(prev => [...prev, item]);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setPendingItem(null);
  }, []);

  const value: ChatContextValue = {
    history,
    addToHistory,
    clearHistory,
    pendingItem,
    setPendingItem,
    isStreaming,
    setIsStreaming,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider');
  }
  return context;
}
```

### 7.2. Settings Context

```typescript
// File: source/presentation/screens/HomeScreen/contexts/SettingsContext.tsx

import React, { createContext, useContext } from 'react';
import type { Configuration } from '@/core/domain/models/Configuration';

interface SettingsContextValue {
  config: Configuration;
  updateConfig: (config: Partial<Configuration>) => void;

  // UI preferences
  renderMarkdown: boolean;
  showLineNumbers: boolean;
  syntaxHighlighting: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export const SettingsProvider: React.FC<{
  children: React.ReactNode;
  initialConfig: Configuration;
}> = ({ children, initialConfig }) => {
  const [config, setConfig] = useState(initialConfig);
  const [renderMarkdown, setRenderMarkdown] = useState(true);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [syntaxHighlighting, setSyntaxHighlighting] = useState(true);

  const updateConfig = useCallback((updates: Partial<Configuration>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const value: SettingsContextValue = {
    config,
    updateConfig,
    renderMarkdown,
    showLineNumbers,
    syntaxHighlighting,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}
```

---

## 8. Performance Optimization

### 8.1. Memo Components

```typescript
// Memoize message components to prevent unnecessary re-renders

import React from 'react';

export const AssistantMessage = React.memo<AssistantMessageProps>(
  ({ text, isPending, provider, terminalWidth }) => {
    // Component implementation...
  },
  (prev, next) => {
    // Only re-render if these props change
    return (
      prev.text === next.text &&
      prev.isPending === next.isPending &&
      prev.provider === next.provider &&
      prev.terminalWidth === next.terminalWidth
    );
  }
);
```

### 8.2. Virtualization for Long History

```typescript
// File: source/presentation/screens/HomeScreen/components/VirtualizedHistory.tsx

import React, { useMemo } from 'react';
import { Box } from 'ink';
import { HistoryItemDisplay } from './HistoryItemDisplay';

interface VirtualizedHistoryProps {
  history: HistoryItem[];
  terminalHeight: number;
  itemHeight: number; // Average height per item
}

export const VirtualizedHistory: React.FC<VirtualizedHistoryProps> = ({
  history,
  terminalHeight,
  itemHeight,
}) => {
  // Calculate visible range
  const visibleRange = useMemo(() => {
    const maxVisible = Math.ceil(terminalHeight / itemHeight) + 2; // +2 buffer
    const start = Math.max(0, history.length - maxVisible);
    const end = history.length;
    return { start, end };
  }, [history.length, terminalHeight, itemHeight]);

  // Only render visible items
  const visibleItems = useMemo(() => {
    return history.slice(visibleRange.start, visibleRange.end);
  }, [history, visibleRange]);

  return (
    <Box flexDirection="column">
      {visibleItems.map(item => (
        <HistoryItemDisplay key={item.id} item={item} />
      ))}
    </Box>
  );
};
```

### 8.3. Debounce Streaming Updates

```typescript
// Throttle chunk updates to reduce re-renders

import { useState, useCallback, useRef } from 'react';

function useDebouncedStreamingContent(delay: number = 50) {
  const [content, setContent] = useState('');
  const bufferRef = useRef('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const appendChunk = useCallback((chunk: string) => {
    // Add to buffer
    bufferRef.current += chunk;

    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Schedule update
    timerRef.current = setTimeout(() => {
      setContent(bufferRef.current);
    }, delay);
  }, [delay]);

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setContent(bufferRef.current);
  }, []);

  return { content, appendChunk, flush };
}
```

---

## 9. Accessibility

### 9.1. Screen Reader Support

```typescript
// Add ARIA labels for screen readers

import React from 'react';
import { Text } from 'ink';

export const AssistantMessage: React.FC<AssistantMessageProps> = ({
  text,
  provider,
}) => {
  return (
    <Box>
      <Text aria-label={`Response from ${provider}`}>
        {text}
      </Text>
    </Box>
  );
};
```

### 9.2. Keyboard Navigation

```typescript
// Support keyboard shortcuts

import { useInput } from 'ink';

export function useKeyboardShortcuts() {
  useInput((input, key) => {
    // Ctrl+C: Exit
    if (key.ctrl && input === 'c') {
      process.exit(0);
    }

    // Ctrl+L: Clear screen
    if (key.ctrl && input === 'l') {
      console.clear();
    }

    // Ctrl+R: Toggle raw markdown
    if (key.ctrl && input === 'r') {
      toggleRawMarkdown();
    }

    // Page Up/Down: Scroll history
    if (key.pageUp) {
      scrollHistory('up');
    }
    if (key.pageDown) {
      scrollHistory('down');
    }
  });
}
```

### 9.3. Color Contrast

```typescript
// Ensure sufficient color contrast

const colors = {
  user: {
    prefix: '#00FF00',      // Green (high contrast)
    text: '#FFFFFF',        // White
  },
  assistant: {
    prefix: '#00FFFF',      // Cyan (high contrast)
    text: '#E0E0E0',        // Light gray
  },
  code: {
    background: '#1E1E1E',  // Dark background
    text: '#D4D4D4',        // Light text
  },
};
```

---

## 10. Implementation Guide

### 10.1. Step-by-Step Implementation

**Phase 1: Basic Structure**
1. ✅ Setup Ink and React components
2. ✅ Create message display components
3. ✅ Implement basic layout (MainContent, InputBox, Footer)

**Phase 2: Markdown Rendering**
4. ✅ Integrate lowlight/highlight.js
5. ✅ Build MarkdownDisplay component
6. ✅ Add code syntax highlighting
7. ✅ Implement table rendering

**Phase 3: Streaming**
8. ✅ Create useStreamChat hook
9. ✅ Implement real-time updates
10. ✅ Add streaming indicators

**Phase 4: State Management**
11. ✅ Setup ChatContext
12. ✅ Setup SettingsContext
13. ✅ Integrate with API clients

**Phase 5: Optimization**
14. ✅ Add memoization
15. ✅ Implement virtualization
16. ✅ Optimize streaming updates

**Phase 6: Polish**
17. ✅ Add accessibility features
18. ✅ Implement keyboard shortcuts
19. ✅ Fine-tune colors and styling

### 10.2. Testing Strategy

**Unit Tests:**
- Component rendering
- Markdown parsing
- Streaming logic
- State management

**Integration Tests:**
- End-to-end streaming flow
- Multiple providers
- Error handling

**Visual Tests:**
- Screenshot comparisons
- Layout responsiveness
- Color contrast

### 10.3. Dependencies

```json
{
  "dependencies": {
    "ink": "^5.0.1",
    "react": "^19.0.0",
    "lowlight": "^3.1.0",
    "highlight.js": "^11.11.1"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "ink-testing-library": "^4.0.0"
  }
}
```

---

## Tham khảo

### Repositories
- [Gemini CLI](https://github.com/google-gemini/gemini-cli) - Reference implementation
- [Ink Documentation](https://github.com/vadimdemedes/ink)

### Related Documentation
- [LLM API Integration](../../architecture/llm-api-integration.md) - Backend API calls
- [Home Screen Technical](./technical.md) - Component architecture
- [Home Screen Features](./features.md) - Feature specifications
