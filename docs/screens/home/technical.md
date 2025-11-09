# Home Screen - Technical Documentation

Implementation details của Home Screen.

## Component Architecture

```
HomeScreen (Container)
├── ConversationArea
│   ├── MessageBubble[] (mapped)
│   │   └── MarkdownText
│   └── Spinner (when streaming)
├── SlashSuggestions (conditional)
├── InputBox
├── TodosDisplay (conditional)
├── HelpOverlay (conditional)
└── Footer
```

## State Management

### Presenter Pattern

```typescript
class HomePresenter {
  constructor(
    private model: HomeModel,
    private apiClient: IApiClient,
    private historyRepo: IHistoryRepository
  ) {}

  async sendMessage(text: string): Promise<void> {
    // 1. Validate input
    // 2. Add user message
    // 3. Call API with streaming
    // 4. Update state on each chunk
    // 5. Save to history
  }
}
```

### Hooks

- `useHomeLogic`: Main business logic hook
- `usePresenter`: MVP presenter hook
- `useDebouncedInput`: Debounced input handling
- `useCodehChat`: Chat integration hook

## Streaming Implementation

### Protocol: Server-Sent Events (SSE)

```typescript
async streamChat(request: ApiRequest, onChunk: (chunk: StreamChunk) => void) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

    for (const line of lines) {
      const data = JSON.parse(line.substring(6));
      onChunk({ content: data.delta.content, done: false });
    }
  }

  onChunk({ done: true });
}
```

### State Updates During Streaming

```typescript
// Initial state
setState({ isStreaming: true, streamingContent: '' });

// On each chunk
setState(prev => ({
  streamingContent: prev.streamingContent + chunk.content
}));

// On complete
setState({
  isStreaming: false,
  messages: [...prev.messages, Message.assistant(fullContent)]
});
```

## Slash Commands Processing

### Detection

```typescript
function detectSlashCommand(input: string): Command | null {
  if (!input.startsWith('/')) return null;

  const parts = input.substring(1).split(' ');
  const commandName = parts[0];
  const args = parts.slice(1);

  return { name: commandName, args };
}
```

### Execution

```typescript
async function executeCommand(command: Command): Promise<void> {
  switch (command.name) {
    case 'save':
      await saveSession(command.args[0]);
      break;
    case 'load':
      await loadSession(command.args[0]);
      break;
    case 'clear':
      clearMessages();
      break;
    // ...
  }
}
```

### Auto-suggestions

```typescript
function getSuggestions(input: string): Command[] {
  const query = input.substring(1).toLowerCase();
  return ALL_COMMANDS.filter(cmd =>
    cmd.name.toLowerCase().includes(query) ||
    cmd.description.toLowerCase().includes(query)
  ).slice(0, 5); // Top 5 matches
}
```

## Todos Management

### Data Structure

```typescript
interface Todo {
  id: string;
  content: string;
  completed: boolean;
  createdAt: Date;
}
```

### Detection from Chat

```typescript
function detectTodoCommand(message: string): string | null {
  const pattern = /add todo:\s*(.+)/i;
  const match = message.match(pattern);
  return match ? match[1] : null;
}
```

### Persistence

Todos saved trong session metadata:

```typescript
interface SessionMetadata {
  todos: Todo[];
  // ...
}
```

## Performance Optimizations

### 1. Message List Virtualization

```typescript
// Only render visible messages
const visibleMessages = messages.slice(
  Math.max(0, messages.length - MAX_VISIBLE),
  messages.length
);
```

### 2. Memoization

```typescript
const MemoizedMessageBubble = React.memo(MessageBubble, (prev, next) => {
  return prev.message.id === next.message.id &&
         prev.message.content === next.message.content;
});
```

### 3. Debounced Input

```typescript
const debouncedHandleInput = useMemo(
  () => debounce((value: string) => {
    setInput(value);
    updateSuggestions(value);
  }, 100),
  []
);
```

## Error Handling

### Network Errors

```typescript
try {
  await apiClient.streamChat(request, onChunk);
} catch (error) {
  if (error instanceof NetworkError) {
    // Retry with exponential backoff
    await retryWithBackoff(() => apiClient.streamChat(request, onChunk));
  } else {
    // Show error to user
    setError(error.message);
  }
}
```

### Validation Errors

```typescript
function validateInput(input: string): ValidationResult {
  if (input.trim().length === 0) {
    return { valid: false, error: 'Input cannot be empty' };
  }

  if (input.length > MAX_INPUT_LENGTH) {
    return { valid: false, error: `Input too long (max ${MAX_INPUT_LENGTH})` };
  }

  return { valid: true };
}
```

## Testing

### Component Tests

```typescript
import { render } from 'ink-testing-library';

test('HomeScreen renders messages', t => {
  const { lastFrame } = render(<HomeScreen messages={mockMessages} />);

  t.true(lastFrame().includes('Hello'));
  t.true(lastFrame().includes('Hi there'));
});
```

### Streaming Tests

```typescript
test('Streaming updates UI in real-time', async t => {
  const mockClient = createMockStreamingClient();
  const { rerender } = render(<HomeScreen apiClient={mockClient} />);

  await sendMessage('Hello');

  // Wait for first chunk
  await waitFor(() => {
    t.true(lastFrame().includes('▊')); // Streaming indicator
  });

  // Wait for completion
  await waitFor(() => {
    t.false(lastFrame().includes('▊'));
    t.true(lastFrame().includes('Complete response'));
  });
});
```

See [Features](./features.md) and [Flows](./flows.md) for more details.
