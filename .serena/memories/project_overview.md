# Project Overview: codeh-cli

## Purpose

Codeh-cli is an interactive CLI application for AI chat interactions, built with React, Ink framework, and Clean Architecture principles. It provides a terminal-based interface for interacting with multiple AI providers (Anthropic, OpenAI, Ollama, Generic APIs).

## Tech Stack

- **Language**: TypeScript 5.x
- **UI Framework**: React 18.2.0 + Ink 4.1.0 (Terminal UI)
- **Build Tools**:
  - TypeScript Compiler (tsc)
  - Babel 7.x (with TypeScript preset)
- **Testing**: AVA + ink-testing-library
- **Linting**: XO with React + TypeScript config
- **Formatting**: Prettier with @vdemedes/prettier-config

## Architecture

### Clean Architecture Layers

```
┌─────────────────────────────────────────┐
│         CLI (Presentation)              │
│  Screens, Components, Hooks             │
├─────────────────────────────────────────┤
│      Core (Application/Domain)          │
│  Use Cases, Business Logic, Models      │
├─────────────────────────────────────────┤
│      Infrastructure (Adapters)          │
│  API Clients, Config, File System       │
└─────────────────────────────────────────┘
```

### Project Structure

```
source/
├── cli.tsx                    # Entry point
├── cli/                       # Presentation Layer
│   ├── app.tsx               # App root
│   ├── screens/              # UI Screens
│   │   ├── Welcome.tsx       # Welcome/auto-detect screen
│   │   ├── HomeNew.tsx       # Main chat screen
│   │   └── Config.tsx        # Configuration screen
│   ├── components/           # UI Components
│   │   ├── atoms/            # Basic components
│   │   ├── molecules/        # Composite components
│   │   └── organisms/        # Complex components
│   ├── hooks/                # React Hooks
│   │   ├── useCodehClient.ts
│   │   ├── useHomeLogicNew.ts
│   │   └── useWelcomeLogic.ts
│   ├── presenters/           # Presentation logic
│   │   ├── HomePresenterNew.ts
│   │   └── WelcomePresenter.ts
│   └── providers/            # React Context
│       └── NavigationProvider.tsx
│
├── core/                     # Core Layer (Domain + Application)
│   ├── domain/               # Domain Layer
│   │   ├── models/           # Domain models
│   │   │   ├── Configuration.ts
│   │   │   ├── Message.ts
│   │   │   └── Conversation.ts
│   │   ├── valueObjects/     # Value objects
│   │   │   └── Provider.ts
│   │   └── interfaces/       # Contracts
│   │       ├── IApiClient.ts
│   │       ├── IConfigRepository.ts
│   │       └── IHistoryRepository.ts
│   │
│   ├── application/          # Application Layer
│   │   ├── CodehClient.ts    # Main orchestrator
│   │   ├── CodehChat.ts      # Chat orchestrator
│   │   └── services/         # Application services
│   │       ├── CommandService.ts
│   │       ├── InputClassifier.ts
│   │       └── OutputFormatter.ts
│   │
│   ├── tools/                # Tool system
│   │   ├── base/
│   │   ├── Shell.ts
│   │   └── FileOps.ts
│   │
│   └── di/                   # Dependency Injection
│       ├── Container.ts
│       └── setup.ts
│
└── infrastructure/           # Infrastructure Layer
    ├── api/                  # API clients
    │   ├── ApiClientFactory.ts
    │   ├── clients/
    │   │   ├── AnthropicClient.ts
    │   │   ├── OpenAIClient.ts
    │   │   ├── OllamaClient.ts
    │   │   └── GenericClient.ts
    │   └── HttpClient.ts
    │
    ├── config/               # Configuration
    │   ├── ConfigLoader.ts
    │   ├── FileConfigRepository.ts
    │   └── EnvConfigRepository.ts
    │
    ├── history/              # History management
    │   └── FileHistoryRepository.ts
    │
    ├── filesystem/           # File operations
    │   └── FileOperations.ts
    │
    ├── process/              # Process execution
    │   ├── ShellExecutor.ts
    │   └── CommandValidator.ts
    │
    └── session/              # Session management
        └── SessionManager.ts
```

## Key Features

### 1. Multi-Provider Support

Supports multiple AI providers:

- **Anthropic** (Claude)
- **OpenAI** (GPT)
- **Ollama** (Local models)
- **Generic** (Custom OpenAI-compatible APIs)

### 2. Configuration System

Two-tier config with priority:

1. **Environment variables** (runtime override)
2. **File config** (`~/.codeh/configs.json`)

### 3. Auto-Navigation

Smart startup flow:

- Checks for config automatically
- Navigates to Home if config exists
- Shows Config screen if no config
- Handles upgrade notifications

### 4. Tool System

Extensible tool architecture:

- Shell command execution
- File operations
- More tools can be added via registry

### 5. Session Management

Persistent sessions:

- Saves conversation history
- Resumes previous sessions
- File-based storage

## Build & Development

### Commands

```bash
# Development
npm run dev              # Watch mode with rebuild

# Build
npm run build            # TypeScript + Babel compile

# Testing
npm test                 # Run all tests
npm run test:watch       # Watch mode

# Linting
npm run lint             # XO linter
npm run format           # Prettier format

# Local testing
npm link                 # Create global symlink
codeh                    # Run globally
```

### Build Process

1. **TypeScript compilation** (`tsc`)
   - Compiles `.ts` → `.js`
   - Generates `.d.ts` type definitions
   - Output: `dist/` directory

2. **Babel transformation** (`babel`)
   - Transforms JSX/TSX
   - Ensures ES2020 compatibility
   - Preserves ES modules

### Configuration Files

- `tsconfig.json` - TypeScript compiler options
- `.babelrc` - Babel transformation config
- `package.json` - Scripts and dependencies
- `.xo-config.json` - Linting rules
- `.prettierrc` - Code formatting

## Code Style & Conventions

### TypeScript

- **Strict mode** enabled
- **ES2020** target
- **ES Modules** (not CommonJS)
- **Path aliases** (@/core, @/cli, @/infrastructure)

### React

- **Functional components** only
- **Hooks** for state/effects
- **Custom hooks** for business logic
- **Presenters** for complex logic

### Architecture

- **Dependency Injection** via Container
- **Interface-based** design
- **Clean Architecture** layers
- **Repository pattern** for data

### Naming

- **PascalCase** for classes, interfaces, components
- **camelCase** for functions, variables
- **SCREAMING_CASE** for constants
- **kebab-case** for files (except components)

## Key Patterns

### 1. Lazy Initialization

API client created only when needed:

```typescript
const client = await initializeClient(); // Returns client directly
```

### 2. Repository Pattern

Data access abstraction:

```typescript
interface IConfigRepository {
	getAll(): Promise<ConfigData | null>;
	save(config: ConfigData): Promise<void>;
	exists(): Promise<boolean>;
}
```

### 3. Factory Pattern

Create instances based on config:

```typescript
const apiClient = factory.create(configuration);
```

### 4. Provider Pattern

React context for global state:

```typescript
<NavigationProvider container={container}>
  {children}
</NavigationProvider>
```

### 5. Hook Pattern

Encapsulate business logic:

```typescript
const {presenter, loading, error} = useHomeLogicNew(container);
```

## Critical Implementation Details

### React State Timing

**Problem:** State doesn't update immediately after `setState()`

**Solution:** Return values directly, don't rely on state:

```typescript
// ❌ Bad
const success = await initializeClient();
if (!success || !client) { ... } // client state not updated yet

// ✅ Good
const client = await initializeClient();
if (!client) { ... } // use returned value
```

### ES Module Extensions

**Important:** In source TypeScript:

- ✅ Import without `.js`: `from './Container'`
- ❌ Don't add `.ts`: `from './Container.ts'`

TypeScript compiler automatically adds `.js` when compiling.

### Dependency Injection

All dependencies injected via Container:

```typescript
container.register('ConfigLoader', () => new ConfigLoader(), true);
const loader = container.resolve<ConfigLoader>('ConfigLoader');
```

## Common Issues & Solutions

### Issue: "Failed to initialize API client"

**Cause:** React state not updated immediately  
**Fix:** Use returned client from `initializeClient()` directly

### Issue: Module not found

**Cause:** Missing `.js` extension in compiled output  
**Fix:** TypeScript automatically adds it, check `moduleResolution` in tsconfig

### Issue: Type errors in domain models

**Cause:** Interface mismatch between layers  
**Fix:** Update interfaces to match domain models (e.g., add 'error' to MessageRole)

## Environment Variables

```bash
# API Configuration
CODEH_PROVIDER=openai          # anthropic|openai|ollama|generic-chat-completion-api
CODEH_MODEL=gpt-4              # Model name
CODEH_API_KEY=sk-...           # API key
CODEH_BASE_URL=https://...     # Base URL (optional)
CODEH_MAX_TOKENS=128000        # Max tokens (default: 4096)
CODEH_TEMPERATURE=0.7          # Temperature (default: 0.7)
```

## Testing

### Unit Tests

Located in `test/` directory:

```bash
npm test                # Run all tests
npm run test:watch      # Watch mode
```

### Manual Testing

```bash
npm run build           # Build first
node dist/cli.js        # Run CLI
```

## Distribution

Package published to npm as `codeh-cli`:

```bash
npm install -g codeh-cli
codeh                    # Run globally
```

## Future Enhancements

- [ ] Multi-session support
- [ ] Plugin system
- [ ] Custom themes
- [ ] Export conversations
- [ ] RAG integration
- [ ] Voice input/output
