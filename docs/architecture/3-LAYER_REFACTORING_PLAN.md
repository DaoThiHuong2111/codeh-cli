# KẾ HOẠCH TÁI CẤU TRÚC 3-LAYER ARCHITECTURE

**Ngày:** 2025-11-02
**Phiên bản:** 1.0
**Trạng thái:** Planning

---

## 📋 MỤC TIÊU

Tái cấu trúc codebase từ kiến trúc hỗn hợp hiện tại sang kiến trúc 3-layer rõ ràng:

- **LAYER 1:** CLI Layer (Presentation/User Interface)
- **LAYER 2:** Core Layer (Business Logic/Domain)
- **LAYER 3:** External Services Layer (Infrastructure)

---

## 🎯 NGUYÊN TẮC THIẾT KẾ

### 1. Separation of Concerns

- Mỗi layer có trách nhiệm riêng biệt, không chồng chéo
- Layer trên chỉ phụ thuộc vào layer dưới (Dependency Rule)
- Infrastructure details không ảnh hưởng đến business logic

### 2. Dependency Direction

```
LAYER 1 (CLI)
    ↓ depends on
LAYER 2 (Core)
    ↓ depends on
LAYER 3 (External Services)
```

### 3. Clean Architecture Principles

- **Independence of Frameworks:** Business logic không phụ thuộc Ink/React
- **Testability:** Core logic có thể test mà không cần UI hay external services
- **Independence of UI:** Có thể thay Ink bằng web UI mà không đổi core
- **Independence of Database/External:** Dễ dàng thay đổi API providers

---

## 🏗️ KIẾN TRÚC 3-LAYER CHI TIẾT

### LAYER 1: CLI LAYER (Presentation/User Interface)

**Vai trò:** Tương tác với người dùng, hiển thị thông tin, nhận input

```
source/cli/
├── app.tsx                      # Root component
├── cli.tsx                      # Entry point
├── components/                  # Reusable UI components
│   ├── atoms/                   # Basic components
│   │   ├── Button.tsx
│   │   ├── Logo.tsx
│   │   ├── ProgressBar.tsx
│   │   └── StatusIndicator.tsx
│   ├── molecules/               # Composite components
│   │   ├── InfoSection.tsx
│   │   ├── InputBox.tsx
│   │   ├── Menu.tsx
│   │   └── TipsSection.tsx
│   └── organisms/               # Complex components
│       ├── Card.tsx
│       └── Navigation.tsx
├── screens/                     # Screen-level components
│   ├── Welcome.tsx
│   ├── Home.tsx
│   └── Config.tsx
├── hooks/                       # React hooks
│   ├── useGeminiStream.ts       # Streaming AI responses
│   ├── useHistoryManager.ts     # Conversation history
│   ├── useInput.ts              # Input handling
│   └── useConfig.ts             # Configuration
├── presenters/                  # Presentation logic (NEW)
│   ├── HomePresenter.ts         # Home screen logic
│   ├── ConfigPresenter.ts       # Config screen logic
│   └── types.ts                 # View models & DTOs
└── index.ts                     # CLI exports
```

**Responsibilities:**

- ✅ Render UI với Ink framework
- ✅ Handle keyboard events
- ✅ Display data (formatted từ Core layer)
- ✅ Collect user input
- ✅ Navigation/routing
- ❌ **KHÔNG chứa business logic**
- ❌ **KHÔNG gọi trực tiếp external APIs**

**Dependencies:**

- `ink`, `react` (UI framework)
- `LAYER 2` interfaces (Core layer)

---

### LAYER 2: CORE LAYER (Business Logic/Domain)

**Vai trò:** Chứa toàn bộ business logic, domain models, use cases

```
source/core/
├── domain/                      # Domain models & entities
│   ├── models/
│   │   ├── Conversation.ts      # Conversation entity
│   │   ├── Message.ts           # Message entity
│   │   ├── Turn.ts              # Request-Response cycle
│   │   ├── Configuration.ts     # Config model
│   │   └── Tool.ts              # Tool definition
│   ├── valueObjects/            # Value objects
│   │   ├── Provider.ts          # API provider enum
│   │   ├── ModelInfo.ts         # Model metadata
│   │   └── InputType.ts         # Input classification
│   └── interfaces/              # Domain interfaces
│       ├── IApiClient.ts
│       ├── IConfigRepository.ts
│       ├── IToolExecutor.ts
│       └── IHistoryRepository.ts
├── application/                 # Application services (orchestration)
│   ├── CodehClient.ts           # Main orchestrator
│   ├── CodehChat.ts             # Conversation manager
│   ├── usecases/                # Use cases
│   │   ├── ProcessUserInput.ts
│   │   ├── ExecuteTool.ts
│   │   ├── ManageHistory.ts
│   │   └── StreamResponse.ts
│   └── services/                # Application services
│       ├── InputClassifier.ts   # Classify input type
│       ├── OutputFormatter.ts   # Format output
│       ├── LoopDetector.ts      # Detect infinite loops
│       ├── CompressionService.ts # Context compression
│       └── RoutingService.ts    # Route requests
├── tools/                       # Tool implementations
│   ├── base/
│   │   ├── Tool.ts              # Base tool interface
│   │   └── ToolRegistry.ts      # Tool management
│   ├── Shell.ts                 # Shell command execution
│   ├── FileOps.ts               # File operations
│   ├── WebSearch.ts             # Web search
│   └── MCP.ts                   # MCP integration
└── index.ts                     # Core exports
```

**Responsibilities:**

- ✅ Business rules & validation
- ✅ Domain models & entities
- ✅ Use cases (application logic)
- ✅ Tool definitions & orchestration
- ✅ Services (loop detection, compression, routing)
- ❌ **KHÔNG biết về UI framework (Ink/React)**
- ❌ **KHÔNG implement infrastructure details**

**Dependencies:**

- Pure TypeScript/JavaScript
- `LAYER 3` interfaces (dependency injection)

---

### LAYER 3: EXTERNAL SERVICES LAYER (Infrastructure)

**Vai trò:** Implement infrastructure, external integrations, data persistence

```
source/infrastructure/
├── api/                         # API client implementations
│   ├── clients/
│   │   ├── AnthropicClient.ts   # Anthropic API
│   │   ├── OpenAIClient.ts      # OpenAI API
│   │   ├── OllamaClient.ts      # Ollama local
│   │   └── GenericClient.ts     # Generic API
│   ├── ApiClientFactory.ts      # Factory cho API clients
│   └── HttpClient.ts            # Base HTTP client
├── config/                      # Configuration persistence
│   ├── FileConfigRepository.ts  # File-based config (~/.codeh/)
│   ├── EnvConfigRepository.ts   # Environment variables
│   └── ConfigLoader.ts          # Config loading strategy
├── history/                     # History persistence
│   ├── FileHistoryRepository.ts # File-based history
│   └── InMemoryHistory.ts       # In-memory (testing)
├── integrations/                # External integrations
│   ├── vscode/                  # VS Code Extension
│   │   ├── VSCodeExtension.ts
│   │   └── protocol.ts
│   ├── mcp/                     # MCP Servers
│   │   ├── MCPClient.ts
│   │   ├── MCPServer.ts
│   │   └── servers/             # MCP server implementations
│   │       ├── SerenaServer.ts
│   │       └── Context7Server.ts
│   └── a2a/                     # Agent-to-Agent server
│       ├── A2AServer.ts
│       └── A2AClient.ts
├── filesystem/                  # File system operations
│   ├── FileOperations.ts
│   └── PathResolver.ts
├── process/                     # Process execution
│   ├── ShellExecutor.ts
│   └── CommandValidator.ts
└── index.ts                     # Infrastructure exports
```

**Responsibilities:**

- ✅ API communication (HTTP requests)
- ✅ File system operations
- ✅ Process execution
- ✅ External service integrations
- ✅ Data persistence (config, history)
- ✅ Implement interfaces từ LAYER 2
- ❌ **KHÔNG chứa business logic**

**Dependencies:**

- `node-fetch`, `axios` (HTTP)
- `fs`, `path` (File system)
- `child_process` (Shell commands)
- External SDKs (nếu cần)

---

## 📊 SO SÁNH: HIỆN TẠI vs MỚI

### Hiện Tại (Structure cũ)

```
source/
├── cli.js                    # Entry + setup
├── app.js                    # Root component
├── components/               # UI components
├── screens/                  # Screens
├── services/                 # MIXED: Business + Infrastructure
│   ├── api/                  # Infrastructure (API calls)
│   ├── config/               # Infrastructure (File/Env)
│   ├── input/                # Business logic (Classification)
│   ├── output/               # Business logic (Formatting)
│   └── system/               # Infrastructure (System info)
└── utils/                    # Utilities

❌ Problems:
- Business logic lẫn lộn với infrastructure
- Khó test business logic độc lập
- Tight coupling giữa UI và services
- Khó mở rộng/thay đổi
```

### Mới (3-Layer Architecture)

```
source/
├── cli/                      # LAYER 1: Presentation
│   ├── components/
│   ├── screens/
│   ├── hooks/
│   └── presenters/
├── core/                     # LAYER 2: Business Logic
│   ├── domain/
│   ├── application/
│   └── tools/
└── infrastructure/           # LAYER 3: External Services
    ├── api/
    ├── config/
    ├── integrations/
    └── filesystem/

✅ Benefits:
- Rõ ràng, dễ hiểu
- Business logic độc lập, dễ test
- Dễ thay đổi UI hoặc infrastructure
- Tuân thủ SOLID principles
```

---

## 🔄 MIGRATION PLAN (Chi Tiết)

### PHASE 1: Chuẩn Bị (Preparation)

**Timeline:** 1-2 hours

#### Step 1.1: Tạo cấu trúc thư mục mới

```bash
mkdir -p source/cli/{components/{atoms,molecules,organisms},screens,hooks,presenters}
mkdir -p source/core/{domain/{models,valueObjects,interfaces},application/{usecases,services},tools/base}
mkdir -p source/infrastructure/{api/clients,config,history,integrations/{vscode,mcp/servers,a2a},filesystem,process}
```

#### Step 1.2: Tạo base interfaces & types

- `source/core/domain/interfaces/` - Domain interfaces
- `source/core/domain/valueObjects/` - Value objects
- `source/cli/presenters/types.ts` - View models

#### Step 1.3: Tạo index files

- `source/cli/index.ts`
- `source/core/index.ts`
- `source/infrastructure/index.ts`

---

### PHASE 2: Refactor LAYER 3 (Infrastructure)

**Timeline:** 3-4 hours
**Priority:** HIGH (Dependencies của layers khác)

#### Step 2.1: API Clients

**Di chuyển:**

```
source/services/api/manager.js
    → source/infrastructure/api/ApiClientFactory.ts
    → source/infrastructure/api/clients/AnthropicClient.ts
    → source/infrastructure/api/clients/OpenAIClient.ts
    → source/infrastructure/api/clients/OllamaClient.ts
    → source/infrastructure/api/clients/GenericClient.ts
```

**Refactor:**

- Tách provider-specific logic thành separate clients
- Implement `IApiClient` interface từ LAYER 2
- Di chuyển HTTP logic vào `HttpClient.ts`
- Hooks → Event system hoặc Observers

#### Step 2.2: Configuration

**Di chuyển:**

```
source/services/config/manager.js
    → source/infrastructure/config/FileConfigRepository.ts
source/services/config/env.js
    → source/infrastructure/config/EnvConfigRepository.ts
source/utils/configChecker.js
    → source/infrastructure/config/ConfigLoader.ts
```

**Refactor:**

- Implement `IConfigRepository` interface
- Tách file operations khỏi business logic
- Priority strategy trong `ConfigLoader`

#### Step 2.3: File System & Process

**Tạo mới:**

```
source/infrastructure/filesystem/FileOperations.ts
source/infrastructure/process/ShellExecutor.ts
source/infrastructure/process/CommandValidator.ts
```

**Extract từ:**

- `services/input/handler.js` (shell execution)
- Utilities hiện tại

#### Step 2.4: External Integrations (Skeleton)

**Tạo:**

```
source/infrastructure/integrations/vscode/VSCodeExtension.ts
source/infrastructure/integrations/mcp/MCPClient.ts
source/infrastructure/integrations/a2a/A2AClient.ts
```

---

### PHASE 3: Refactor LAYER 2 (Core/Business Logic)

**Timeline:** 4-5 hours
**Priority:** CRITICAL

#### Step 3.1: Domain Models

**Tạo models:**

```typescript
// source/core/domain/models/Message.ts
export class Message {
  constructor(
    public id: string,
    public role: 'user' | 'assistant' | 'system',
    public content: string,
    public timestamp: Date,
    public metadata?: Record<string, any>
  ) {}
}

// source/core/domain/models/Conversation.ts
export class Conversation {
  private messages: Message[] = [];

  addMessage(message: Message): void { ... }
  getHistory(): Message[] { ... }
  clear(): void { ... }
}

// source/core/domain/models/Turn.ts
export class Turn {
  constructor(
    public request: Message,
    public response?: Message,
    public toolCalls?: ToolCall[]
  ) {}
}
```

#### Step 3.2: Application Services

**Di chuyển & Refactor:**

```
source/services/input/handler.js + validator.js
    → source/core/application/services/InputClassifier.ts
    → source/core/application/usecases/ProcessUserInput.ts

source/services/output/classifier.js
    → source/core/application/services/OutputFormatter.ts
```

**Tạo orchestrators:**

```typescript
// source/core/application/CodehClient.ts
export class CodehClient {
  constructor(
    private apiClient: IApiClient,
    private configRepo: IConfigRepository,
    private historyRepo: IHistoryRepository,
    private toolRegistry: ToolRegistry
  ) {}

  async execute(input: string): Promise<Turn> { ... }
}

// source/core/application/CodehChat.ts
export class CodehChat {
  private conversation: Conversation;

  async sendMessage(content: string): Promise<Message> { ... }
  getHistory(): Message[] { ... }
}
```

#### Step 3.3: Tools

**Tạo tool system:**

```typescript
// source/core/tools/base/Tool.ts
export interface Tool {
	name: string;
	description: string;
	execute(params: any): Promise<any>;
}

// source/core/tools/Shell.ts
// source/core/tools/FileOps.ts
// source/core/tools/WebSearch.ts
// source/core/tools/MCP.ts
```

#### Step 3.4: Services

**Tạo các services:**

```
source/core/application/services/LoopDetector.ts
source/core/application/services/CompressionService.ts
source/core/application/services/RoutingService.ts
```

---

### PHASE 4: Refactor LAYER 1 (CLI/Presentation)

**Timeline:** 2-3 hours
**Priority:** MEDIUM

#### Step 4.1: Reorganize Components

**Di chuyển theo Atomic Design:**

```
source/components/Button.js
    → source/cli/components/atoms/Button.tsx

source/components/InputBox.js
    → source/cli/components/molecules/InputBox.tsx

source/components/Navigation.js
    → source/cli/components/organisms/Navigation.tsx
```

#### Step 4.2: Create Presenters

**Tách logic khỏi components:**

```typescript
// source/cli/presenters/HomePresenter.ts
export class HomePresenter {
	constructor(
		private codehClient: CodehClient,
		private codehChat: CodehChat,
	) {}

	async handleUserInput(input: string): Promise<ViewModel> {
		const turn = await this.codehClient.execute(input);
		return this.formatForView(turn);
	}
}
```

#### Step 4.3: Update Screens

**Refactor screens để dùng presenters:**

```typescript
// source/cli/screens/Home.tsx
const Home = () => {
  const presenter = usePresenter(HomePresenter);
  const [output, setOutput] = useState('');

  const handleInput = async (input: string) => {
    const viewModel = await presenter.handleUserInput(input);
    setOutput(viewModel.formattedOutput);
  };

  return <Box>...</Box>;
};
```

#### Step 4.4: Create Custom Hooks

**Tạo hooks cho state management:**

```
source/cli/hooks/useGeminiStream.ts
source/cli/hooks/useHistoryManager.ts
source/cli/hooks/useInput.ts
source/cli/hooks/useConfig.ts
```

---

### PHASE 5: Integration & Testing

**Timeline:** 2-3 hours

#### Step 5.1: Dependency Injection Setup

**Tạo DI container:**

```typescript
// source/core/di/container.ts
export class Container {
  private instances = new Map();

  register<T>(token: string, factory: () => T): void { ... }
  resolve<T>(token: string): T { ... }
}

// source/core/di/setup.ts
export function setupContainer(): Container {
  const container = new Container();

  // Layer 3
  container.register('IApiClient', () => new ApiClientFactory().create());
  container.register('IConfigRepository', () => new FileConfigRepository());

  // Layer 2
  container.register('CodehClient', () => new CodehClient(
    container.resolve('IApiClient'),
    container.resolve('IConfigRepository'),
    ...
  ));

  return container;
}
```

#### Step 5.2: Update Entry Point

**Refactor cli.tsx:**

```typescript
// source/cli/cli.tsx
import { setupContainer } from '../core/di/setup';
import { App } from './app';

const container = setupContainer();

render(<App container={container} />);
```

#### Step 5.3: Update Imports

**Mass update imports:**

```bash
# Replace old imports
@/services/api → @/infrastructure/api
@/services/config → @/infrastructure/config
@/components → @/cli/components
```

#### Step 5.4: Testing

- Unit tests cho Core layer
- Integration tests cho API clients
- E2E tests cho major flows

---

### PHASE 6: Cleanup & Documentation

**Timeline:** 1-2 hours

#### Step 6.1: Remove Old Code

```bash
rm -rf source/services/
rm -rf source/utils/
```

#### Step 6.2: Update Documentation

```
docs/architecture/
├── 3-LAYER_REFACTORING_PLAN.md (this file)
├── LAYER_1_CLI.md
├── LAYER_2_CORE.md
├── LAYER_3_INFRASTRUCTURE.md
└── MIGRATION_GUIDE.md
```

#### Step 6.3: Update package.json scripts

```json
{
	"scripts": {
		"build:cli": "babel source/cli -d dist/cli",
		"build:core": "babel source/core -d dist/core",
		"build:infra": "babel source/infrastructure -d dist/infrastructure"
	}
}
```

---

## 🎯 IMPLEMENTATION CHECKLIST

### Pre-Refactoring

- [ ] Backup current codebase
- [ ] Create feature branch: `refactor/3-layer-architecture`
- [ ] Review existing tests
- [ ] Document current behavior

### PHASE 1: Preparation

- [ ] Create folder structure
- [ ] Create base interfaces
- [ ] Create index files
- [ ] Setup TypeScript configs

### PHASE 2: Layer 3 (Infrastructure)

- [ ] Refactor API clients
- [ ] Refactor configuration
- [ ] Create file system operations
- [ ] Create process executor
- [ ] Create integration skeletons

### PHASE 3: Layer 2 (Core)

- [ ] Create domain models
- [ ] Create value objects
- [ ] Create application services
- [ ] Create use cases
- [ ] Create tool system
- [ ] Create orchestrators (CodehClient, CodehChat)

### PHASE 4: Layer 1 (CLI)

- [ ] Reorganize components (Atomic Design)
- [ ] Create presenters
- [ ] Update screens
- [ ] Create custom hooks
- [ ] Update navigation

### PHASE 5: Integration

- [ ] Setup DI container
- [ ] Update entry point
- [ ] Update all imports
- [ ] Run tests
- [ ] Fix bugs

### PHASE 6: Cleanup

- [ ] Remove old code
- [ ] Update documentation
- [ ] Update build scripts
- [ ] Final testing

---

## 📈 SUCCESS CRITERIA

### Technical Metrics

- ✅ All layers are independent
- ✅ No circular dependencies
- ✅ Core layer has 0 external dependencies
- ✅ Test coverage ≥ 80% for Core layer
- ✅ All existing features work

### Code Quality

- ✅ Clear separation of concerns
- ✅ Consistent naming conventions
- ✅ Comprehensive documentation
- ✅ Type safety (TypeScript)

### Maintainability

- ✅ Easy to add new features
- ✅ Easy to change UI framework
- ✅ Easy to swap API providers
- ✅ Easy to test

---

## ⚠️ RISKS & MITIGATION

| Risk                   | Impact | Mitigation                             |
| ---------------------- | ------ | -------------------------------------- |
| Breaking changes       | HIGH   | Thorough testing, feature parity check |
| Import path errors     | MEDIUM | Automated find-replace, careful review |
| Performance regression | LOW    | Benchmark critical paths               |
| Missing functionality  | HIGH   | Feature checklist, user testing        |

---

## 📝 NOTES

### Naming Conventions

- **Files:** PascalCase for classes/components (e.g., `CodehClient.ts`)
- **Folders:** camelCase (e.g., `usecases/`)
- **Interfaces:** Prefix với `I` (e.g., `IApiClient`)
- **Types:** PascalCase (e.g., `InputType`)

### Import Aliases (tsconfig.json)

```json
{
	"compilerOptions": {
		"baseUrl": ".",
		"paths": {
			"@/cli/*": ["source/cli/*"],
			"@/core/*": ["source/core/*"],
			"@/infrastructure/*": ["source/infrastructure/*"]
		}
	}
}
```

---

## 🚀 NEXT STEPS

1. Review plan với team
2. Estimate effort (12-15 hours total)
3. Create GitHub issues/tasks
4. Start PHASE 1

---

**Người tạo:** Claude Code
**Phê duyệt:** Chờ review
**Dự kiến hoàn thành:** TBD
