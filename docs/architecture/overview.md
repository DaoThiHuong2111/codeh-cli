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
  - Atoms: Button, Spinner, ProgressBar, StatusIndicator, Logo
  - Molecules: Menu, InputBox, MessageBubble, MarkdownText, ToolCallDisplay, ToolResultDisplay, ToolPermissionDialog
  - Organisms: Navigation, ConversationArea, TodosDisplay, SlashSuggestions, Footer, Card
- **Screens**: Welcome, Home, Config
- **Presenters**: MVP pattern presenters (HomePresenter, WelcomePresenter, ConfigPresenter)
- **Hooks**: Custom React hooks (useHomeLogic, useExitConfirmation)
- **Contexts**: NavigationContext
- **Providers**: ShortcutProvider (from core/input)

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

- **Domain Models**: Message, Turn, Configuration, Conversation, Todo, ToolExecutionContext, UpgradeInfo
- **Interfaces**: IApiClient, IHistoryRepository, ISessionManager, IConfigRepository
- **Application Services**:
  - CodehClient.ts - Main orchestrator for AI interactions
  - CodehChat.ts - Conversation management
  - ToolExecutionOrchestrator.ts - Tool execution workflow and permission handling
- **Services**: CommandService, InputClassifier, MarkdownService, OutputFormatter
- **Tools**: ToolRegistry, FileOps, Shell (base tools)
- **Input System**: ShortcutManager, ShortcutContext, keyParser (layer-based keyboard shortcuts)
- **DI Container**: Dependency injection container

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
  - ApiClientFactory.ts - Factory pattern for creating clients
- **Config**:
  - FileConfigRepository - File-based configuration (~/.codeh/configs.json)
  - EnvConfigRepository - Environment variable configuration
  - ConfigLoader - Configuration merging strategy (env > file)
- **Permissions**:
  - PermissionModeManager - Runtime permission mode switching (MVP/Interactive)
- **Session**: SessionManager - Session lifecycle and persistence
- **History**: FileHistoryRepository, InMemoryHistoryRepository
- **Integrations**:
  - vscode/ - VSCodeExtension: VS Code integration (WebSocket/stdio)
  - mcp/ - MCPClient: Model Context Protocol client (JSON-RPC)
  - a2a/ - A2AServer: Agent-to-Agent server (HTTP/WebSocket)
- **Filesystem**: File operations and workspace management
- **Process**: Shell command execution with security

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

#### Message Model

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

#### Todo Model

```typescript
export type TodoStatus = 'pending' | 'in_progress' | 'completed';

export class Todo {
	constructor(
		public readonly id: string,
		public readonly content: string,
		public readonly status: TodoStatus,
		public readonly timestamp: Date,
		public readonly metadata?: Record<string, any>,
	) {}

	static create(content: string, options?: {status?: TodoStatus}): Todo {
		return new Todo(
			this.generateId(),
			content,
			options?.status || 'pending',
			new Date(),
		);
	}

	// Immutable state updates
	withStatus(newStatus: TodoStatus): Todo {
		return new Todo(this.id, this.content, newStatus, this.timestamp, this.metadata);
	}

	complete(): Todo { return this.withStatus('completed'); }
	start(): Todo { return this.withStatus('in_progress'); }

	// Status checkers
	isPending(): boolean { return this.status === 'pending'; }
	isInProgress(): boolean { return this.status === 'in_progress'; }
	isCompleted(): boolean { return this.status === 'completed'; }
}
```

#### ToolExecutionContext Model

```typescript
export class ToolExecutionContext {
	// Context for tool execution including:
	// - Tool metadata
	// - Execution environment
	// - Permission state
	// - Approval callbacks
}
```

#### UpgradeInfo Model

```typescript
export class UpgradeInfo {
	// Information about CLI upgrades:
	// - Current version
	// - Latest version
	// - Upgrade instructions
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

## Advanced Features

### Permission Mode System

CODEH hỗ trợ 2 permission modes cho tool execution:

**MVP Mode (YOLO)**:
- Auto-approve tất cả tool executions
- Fast development workflow
- No user interruption
- Icon: 🚀
- Display: "YOLO"

**Interactive Mode**:
- Require user approval trước khi execute tools
- Safe production workflow
- User has full control
- Icon: 🔒
- Display: "Ask before edits"

**Implementation**:

```typescript
export class PermissionModeManager {
	private currentMode: PermissionMode = 'mvp'; // Default
	private listeners: ModeChangeListener[] = [];

	toggleMode(): void {
		const newMode = this.currentMode === 'mvp' ? 'interactive' : 'mvp';
		this.setMode(newMode);
	}

	isMVPMode(): boolean {
		return this.currentMode === 'mvp';
	}

	isInteractiveMode(): boolean {
		return this.currentMode === 'interactive';
	}
}
```

**Usage**:
- Toggle với `Shift+Tab` keyboard shortcut
- Mode hiển thị trong Footer component
- Runtime switching không cần restart

### Keyboard Shortcuts System

Layer-based keyboard shortcut management với priority system:

**Architecture**:

```typescript
// ShortcutManager - centralized shortcut registry
export class ShortcutManager {
	private shortcuts: Map<ShortcutLayer, ShortcutRegistration[]>;

	register(registration: ShortcutRegistration): void {
		// Register shortcut với layer
	}

	handleInput(input: string, layer: ShortcutLayer): boolean {
		// Process input và execute handler nếu match
	}
}

// ShortcutContext - React context provider
export const ShortcutProvider: React.FC = ({children}) => {
	const manager = useMemo(() => new ShortcutManager(), []);
	return <ShortcutContext.Provider value={manager}>{children}</ShortcutContext.Provider>;
};

// useShortcut - React hook for registering shortcuts
export function useShortcut(config: ShortcutConfig): void {
	const manager = useContext(ShortcutContext);

	useEffect(() => {
		const registration = manager.register(config);
		return () => manager.unregister(registration);
	}, [config.key, config.layer]);
}
```

**Features**:
- **Layer-based priority**: `input` > `screen` > `global`
- **Conditional shortcuts**: `enabled()` function để enable/disable dynamically
- **Conflict detection**: Warn nếu có conflicting shortcuts
- **Centralized management**: Single source of truth
- **React integration**: `useShortcut` hook

**Example Usage**:

```typescript
// In Home screen
useShortcut({
	key: 'shift+tab',
	handler: () => modeManager.toggleMode(),
	layer: 'input',
	description: 'Toggle permission mode',
	source: 'Home',
});

useShortcut({
	key: 'escape',
	handler: () => presenter.handleInputChange(''),
	layer: 'input',
	enabled: () => presenter !== null && presenter.input !== '',
	description: 'Clear input',
	source: 'Home',
});
```

**Supported Key Patterns**:
- Single keys: `a`, `enter`, `escape`
- Modified keys: `ctrl+c`, `shift+tab`, `alt+f`
- Arrow keys: `up`, `down`, `left`, `right`
- Special keys: `tab`, `space`, `backspace`

### Todos Management System

Built-in task tracking với visual progress indicators:

**Features**:
- Real-time todos từ AI responses
- Status tracking: `pending`, `in_progress`, `completed`
- Visual progress bar
- Status-based grouping
- Immutable domain model

**Components**:

```typescript
// TodosDisplay - organism component
export const TodosDisplay: React.FC<TodosDisplayProps> = ({
	todos,
	showProgress = true,
}) => {
	const total = todos.length;
	const completed = todos.filter(t => t.isCompleted()).length;

	return (
		<Box flexDirection="column" borderStyle="single" borderColor="blue">
			<Text bold>📋 Tasks ({completed}/{total} completed)</Text>
			{showProgress && <ProgressBar current={completed} total={total} />}
			<TodosList todos={todos} />
		</Box>
	);
};
```

**Display**:
- ⚡ In Progress (yellow)
- ⏳ Pending (gray)
- ✓ Completed (green, dimmed)

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
