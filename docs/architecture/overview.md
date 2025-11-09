# Architecture Overview

CODEH CLI được xây dựng với **3-Layer Clean Architecture**, đảm bảo tách biệt concerns và dễ maintain.

## 3-Layer Architecture

```
┌─────────────────────────────────────────┐
│         Layer 1: CLI (Presentation)      │
│  React Ink Components, Screens, Hooks   │
└────────────────┬────────────────────────┘
                 │ depends on
┌────────────────▼────────────────────────┐
│      Layer 2: Core (Business Logic)     │
│   Domain Models, Use Cases, Services    │
└────────────────┬────────────────────────┘
                 │ depends on
┌────────────────▼────────────────────────┐
│    Layer 3: Infrastructure (External)   │
│   API Clients, File I/O, Integrations   │
└─────────────────────────────────────────┘
```

## Layer 1: CLI (Presentation)

**Mục đích**: Hiển thị UI và handle user interactions

**Thành phần**:

- **Components**: React Ink UI components
  - Atoms: Button, Spinner, ProgressBar
  - Molecules: Menu, InputBox, MessageBubble
  - Organisms: Navigation, ConversationArea, TodosDisplay
- **Screens**: Welcome, Home, Config
- **Presenters**: MVP pattern presenters
- **Hooks**: Custom React hooks

**Dependency**: Chỉ phụ thuộc vào Core layer

**Ví dụ**:

```typescript
// HomeScreen.tsx
export function HomeScreen() {
	const {state, actions} = usePresenter(HomePresenter);

	return (
		<Box flexDirection="column">
			<ConversationArea messages={state.messages} />
			<InputBox onSubmit={actions.sendMessage} />
		</Box>
	);
}
```

## Layer 2: Core (Business Logic)

**Mục đích**: Business logic, domain rules, use cases

**Thành phần**:

- **Domain Models**: Message, Turn, Configuration, Session
- **Interfaces**: IApiClient, IHistoryRepository, ISessionManager
- **Use Cases**: ProcessUserInput, StreamResponse, ManageHistory
- **Services**: CommandService, InputClassifier, MarkdownService
- **Tools**: ToolRegistry, FileOps, Shell

**Dependency**: KHÔNG phụ thuộc vào layer khác (pure business logic)

**Ví dụ**:

```typescript
// Use Case: StreamResponse
export class StreamResponse {
	constructor(private apiClient: IApiClient) {}

	async execute(request: StreamResponseRequest): Promise<Turn> {
		// Pure business logic
		const turn = await this.apiClient.streamChat(request.messages, chunk => {
			request.onChunk(chunk);
		});
		return turn;
	}
}
```

## Layer 3: Infrastructure (External Services)

**Mục đích**: Tương tác với thế giới bên ngoài

**Thành phần**:

- **API Clients**: AnthropicClient, OpenAIClient, OllamaClient, GenericClient
- **Config**: FileConfigRepository, EnvConfigRepository
- **History**: FileHistoryRepository, InMemoryHistoryRepository
- **Session**: SessionManager
- **Integrations**:
  - VSCodeExtension: VS Code integration
  - MCPClient: Model Context Protocol client
  - A2AServer: Agent-to-Agent server

**Dependency**: Implements interfaces từ Core layer

**Ví dụ**:

```typescript
// AnthropicClient implements IApiClient
export class AnthropicClient implements IApiClient {
	async streamChat(
		request: ApiRequest,
		onChunk: (chunk: StreamChunk) => void,
	): Promise<ApiResponse> {
		// External API call
		return await fetch(/* Anthropic API */);
	}
}
```

## Dependency Injection

Sử dụng Dependency Injection để inject implementations:

```typescript
// Setup DI container
const container = new Container();
container.register('apiClient', new AnthropicClient());
container.register('historyRepo', new FileHistoryRepository());

// Use in application
const streamResponse = new StreamResponse(container.get('apiClient'));
```

## Data Flow

### User Input Flow

```
User Input
  → CLI: InputBox component
  → Presenter: ProcessUserInput
  → Core: UseCase validates input
  → Infrastructure: API Client sends request
  → Core: Turn created
  → CLI: Display response
```

### Streaming Response Flow

```
API Response Stream
  → Infrastructure: AnthropicClient receives chunks
  → Core: StreamResponse use case processes
  → CLI: Presenter updates state
  → UI: ConversationArea displays in real-time
```

## Key Patterns

### 1. MVP Pattern (Model-View-Presenter)

```typescript
// View: React component
function HomeScreen() {
	const {state, actions} = usePresenter(HomePresenter);
	return <UI state={state} actions={actions} />;
}

// Presenter: Mediator between View and Model
class HomePresenter {
	constructor(private model: HomeModel) {}

	async sendMessage(text: string) {
		// Orchestrate business logic
		this.model.updateMessages(/*...*/);
	}
}

// Model: Business logic
class HomeModel {
	messages: Message[] = [];

	updateMessages(newMessages: Message[]) {
		this.messages = newMessages;
	}
}
```

### 2. Repository Pattern

```typescript
interface IHistoryRepository {
	save(conversation: ConversationHistory): Promise<void>;
	load(id: string): Promise<ConversationHistory | null>;
	list(): Promise<ConversationHistory[]>;
}

// Implementation can be swapped
class FileHistoryRepository implements IHistoryRepository {
	/* File-based storage */
}
class InMemoryHistoryRepository implements IHistoryRepository {
	/* In-memory storage */
}
```

### 3. Use Case Pattern

Each use case = single responsibility:

```typescript
// Use Case: SaveSession
export class SaveSession {
	constructor(private sessionManager: ISessionManager) {}

	async execute(request: SaveSessionRequest): Promise<SaveSessionResponse> {
		const session = Session.create(request.name, request.messages);
		await this.sessionManager.save(session);
		return {sessionId: session.id, success: true};
	}
}
```

## Domain Models

### Immutable Value Objects

```typescript
export class Message {
	readonly id: string;
	readonly role: MessageRole;
	readonly content: string;
	readonly timestamp: Date;

	private constructor(data: MessageData) {
		this.id = data.id;
		this.role = data.role;
		this.content = data.content;
		this.timestamp = data.timestamp;
	}

	static user(content: string): Message {
		return new Message({
			id: generateId(),
			role: 'user',
			content,
			timestamp: new Date(),
		});
	}

	static assistant(content: string): Message {
		return new Message({
			id: generateId(),
			role: 'assistant',
			content,
			timestamp: new Date(),
		});
	}
}
```

## Testing Strategy

### Unit Tests

- **Core Layer**: Pure business logic, easy to test
- **Infrastructure**: Mock external dependencies
- **CLI**: Snapshot testing cho components

```typescript
// Testing use case
test('StreamResponse should create Turn', async t => {
	const mockClient: IApiClient = {
		streamChat: async (req, onChunk) => {
			onChunk({content: 'Hello', done: false});
			return {content: 'Hello', model: 'claude'};
		},
	};

	const useCase = new StreamResponse(mockClient);
	const result = await useCase.execute({
		messages: [Message.user('Hi')],
		onChunk: chunk => console.log(chunk),
	});

	t.truthy(result.turn);
});
```

### Integration Tests

Test complete flows:

```typescript
test('User can chat end-to-end', async t => {
	// Setup with real implementations
	const app = createApp({
		apiClient: new AnthropicClient(),
		historyRepo: new InMemoryHistoryRepository(),
	});

	// Execute user flow
	await app.sendMessage('Hello');

	// Verify
	const history = await app.getHistory();
	t.is(history.length, 2); // User + Assistant messages
});
```

## Screens Architecture

### Welcome Screen

- **Purpose**: First-time setup và onboarding
- **State**: Provider selection, API key input
- **Navigation**: → Home Screen sau khi setup

### Home Screen

- **Purpose**: Main chat interface
- **State**: Messages, input, streaming status, todos
- **Features**: Chat, slash commands, todos, markdown rendering

### Config Screen

- **Purpose**: Configuration management
- **State**: Current config, validation errors
- **Features**: Provider selection, model config, advanced settings

## Extension Points

### Adding New Provider

1. Implement `IApiClient` interface
2. Register trong `ApiClientFactory`
3. Add configuration schema

### Adding New Screen

1. Create Screen component trong `cli/screens/`
2. Create Presenter trong `cli/presenters/`
3. Register trong navigation
4. Add documentation

### Adding New Use Case

1. Create use case class trong `core/application/usecases/`
2. Define request/response interfaces
3. Inject dependencies via constructor
4. Add tests

## Best Practices

### ✅ DO

- Keep layers independent
- Use dependency injection
- Write pure functions in Core
- Make domain models immutable
- Test business logic thoroughly

### ❌ DON'T

- Mix UI logic with business logic
- Access external services directly from Core
- Mutate domain objects
- Skip layer boundaries
- Create circular dependencies

## Performance Considerations

### Optimization Points

1. **Streaming**: Use callbacks để avoid buffering
2. **Re-renders**: Memoize expensive computations
3. **State updates**: Batch updates where possible
4. **File I/O**: Use async operations
5. **API calls**: Implement retry with exponential backoff

### Memory Management

- Clean up event listeners
- Dispose of subscriptions
- Clear large buffers after streaming
- Use WeakMap for caching when appropriate

## Security

### API Keys

- Never log API keys
- Store securely in config files
- Use environment variables for CI/CD
- Validate before use

### Input Validation

- Sanitize all user inputs
- Validate against schemas
- Prevent injection attacks
- Rate limit API calls

## See Also

- [Integrations Guide](./integrations.md)
- [Development Guide](../guides/development.md)
- [User Guide](../guides/user-guide.md)
