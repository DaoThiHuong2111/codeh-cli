# Codeh CLI

A powerful command-line interface for interacting with multiple AI providers (Claude, GPT, Ollama) built with clean architecture principles.

## Features

- 🤖 Support for multiple AI providers (Claude/Anthropic, OpenAI, Ollama, Generic OpenAI-compatible APIs)
- 🎨 Beautiful terminal UI built with React/Ink
- 💬 Interactive conversation management with history
- 🛠️ Tool execution support (shell commands, file operations)
- 📝 Configuration wizard for easy setup
- 🏗️ Clean 3-layer architecture (CLI → Core → Infrastructure)
- 🔒 Type-safe with TypeScript
- 💾 Persistent conversation history
- 📋 Built-in Todos tracking and management
- ⌨️ Layer-based keyboard shortcuts system
- 🔐 Permission modes (MVP/Interactive) for tool execution
- 🎯 Slash commands with auto-suggestions
- 🔌 Extensible integrations (VS Code, MCP, A2A)

## Installation

```bash
npm install --global codeh-cli
```

Or for development:

```bash
git clone <repository-url>
cd codeh-cli
npm install
npm run build
npm link
```

## Configuration

### Environment Variables

Configure via environment variables (highest priority):

```bash
# Required: Provider Selection
export CODEH_PROVIDER=anthropic  # anthropic | openai | ollama | generic

# Required: Model Name
export CODEH_MODEL=claude-3-5-sonnet-20241022

# Required: API Base URL
export CODEH_BASE_URL=https://api.anthropic.com

# Required: API Key (not needed for Ollama)
export CODEH_API_KEY=sk-ant-...

# Optional: Max Tokens (default: 4096)
export CODEH_MAX_TOKEN=4096

# Optional: Temperature (default: 0.7)
export CODEH_TEMPERATURE=0.7
```

**Example configurations:**

```bash
# Anthropic/Claude
export CODEH_PROVIDER=anthropic
export CODEH_MODEL=claude-3-5-sonnet-20241022
export CODEH_BASE_URL=https://api.anthropic.com
export CODEH_API_KEY=sk-ant-...

# OpenAI/GPT
export CODEH_PROVIDER=openai
export CODEH_MODEL=gpt-4
export CODEH_BASE_URL=https://api.openai.com
export CODEH_API_KEY=sk-...

# Ollama (local - no API key needed)
export CODEH_PROVIDER=ollama
export CODEH_MODEL=llama2
export CODEH_BASE_URL=http://localhost:11434

# Generic OpenAI-compatible API
export CODEH_PROVIDER=generic
export CODEH_MODEL=your-model
export CODEH_BASE_URL=https://your-api.com
export CODEH_API_KEY=your-key
```

### Configuration File

Or use the interactive configuration wizard:

```bash
codeh config
```

Configuration is saved to `~/.codeh/configs.json`.

## Usage

```bash
# Start interactive chat
codeh

# Show welcome screen
codeh welcome

# Open configuration wizard
codeh config

# Show help
codeh --help
```

## Architecture

This project follows Clean Architecture with 3 layers:

### LAYER 1: CLI Layer (Presentation)

- **Location**: `source/cli/`
- **Purpose**: User interface and interaction
- **Components**:
  - `components/` - Atomic Design components (atoms, molecules, organisms)
    - `atoms/` - Button, Spinner, ProgressBar, StatusIndicator, Logo
    - `molecules/` - InputBox, MessageBubble, MarkdownText, ToolCallDisplay, ToolResultDisplay
    - `organisms/` - ConversationArea, TodosDisplay, SlashSuggestions, Navigation, Footer, Card
  - `screens/` - Main UI screens (Home, Welcome, Config)
  - `presenters/` - Presentation logic (separates UI from business logic)
  - `hooks/` - Custom React hooks (useHomeLogic, useExitConfirmation)
  - `app.tsx` - Root component with ShortcutProvider
  - `cli.tsx` - Entry point

### LAYER 2: Core Layer (Business Logic)

- **Location**: `source/core/`
- **Purpose**: Business rules and domain logic
- **Components**:
  - `domain/` - Domain models, value objects, and interfaces
    - `models/` - Message, Conversation, Turn, Configuration, Todo, ToolExecutionContext, UpgradeInfo
    - `valueObjects/` - Provider, ModelInfo
    - `interfaces/` - IApiClient, IConfigRepository, etc.
  - `application/` - Application services and orchestrators
    - `CodehClient.ts` - Main orchestrator for AI interactions
    - `CodehChat.ts` - Conversation management
    - `ToolExecutionOrchestrator.ts` - Tool execution workflow orchestration
    - `services/` - Input classifier, output formatter, etc.
  - `tools/` - Tool system (shell execution, file operations)
  - `input/` - Keyboard shortcuts system (ShortcutManager, ShortcutContext)
  - `di/` - Dependency injection container

### LAYER 3: Infrastructure Layer (External Services)

- **Location**: `source/infrastructure/`
- **Purpose**: External integrations and data access
- **Components**:
  - `api/` - API clients for different providers
    - `clients/` - AnthropicClient, OpenAIClient, OllamaClient, GenericClient
    - `ApiClientFactory.ts` - Factory for creating clients
  - `config/` - Configuration repositories
    - `EnvConfigRepository.ts` - Environment variables
    - `FileConfigRepository.ts` - File-based config
    - `ConfigLoader.ts` - Config merging strategy
  - `permissions/` - Permission mode management (MVP/Interactive)
    - `PermissionModeManager.ts` - Runtime permission mode switching
  - `session/` - Session management and persistence
  - `history/` - Conversation history persistence
  - `integrations/` - External tool integrations
    - `vscode/` - VS Code extension integration
    - `mcp/` - Model Context Protocol client
    - `a2a/` - Agent-to-Agent server
  - `filesystem/` - File operations
  - `process/` - Shell command execution

## Project Structure

```
source/
├── cli/                      # LAYER 1: Presentation
│   ├── components/
│   │   ├── atoms/           # Basic UI elements (Button, Spinner, ProgressBar)
│   │   ├── molecules/       # Composite components (InputBox, MessageBubble)
│   │   └── organisms/       # Complex components (TodosDisplay, SlashSuggestions, Footer)
│   ├── screens/             # Main screens (Home, Welcome, Config)
│   ├── presenters/          # Presentation logic
│   ├── hooks/               # Custom hooks (useHomeLogic, useExitConfirmation)
│   ├── app.tsx              # Root component with ShortcutProvider
│   └── cli.tsx              # Entry point
├── core/                    # LAYER 2: Business Logic
│   ├── domain/
│   │   ├── models/          # Domain entities (Message, Todo, Turn, ToolExecutionContext)
│   │   ├── valueObjects/    # Value objects (Provider, ModelInfo)
│   │   └── interfaces/      # Contracts (IApiClient, IConfigRepository)
│   ├── application/         # Application services
│   │   ├── CodehClient.ts   # Main orchestrator
│   │   ├── CodehChat.ts     # Conversation management
│   │   └── ToolExecutionOrchestrator.ts  # Tool execution workflow
│   ├── tools/               # Tool system (FileOps, Shell)
│   ├── input/               # Keyboard shortcuts (ShortcutManager, ShortcutContext)
│   └── di/                  # Dependency injection container
└── infrastructure/          # LAYER 3: External Services
    ├── api/                 # API clients (Anthropic, OpenAI, Ollama, Generic)
    ├── config/              # Configuration (EnvConfig, FileConfig, ConfigLoader)
    ├── permissions/         # Permission mode management (PermissionModeManager)
    ├── session/             # Session management
    ├── history/             # History persistence
    ├── integrations/        # External integrations (vscode, mcp, a2a)
    ├── filesystem/          # File operations
    └── process/             # Process execution
```

## Development

### Build

```bash
# Full build (TypeScript + Babel)
npm run build

# TypeScript only
npm run build:ts

# Babel only
npm run build:babel

# Watch mode
npm run dev
```

### Test

```bash
npm test
```

### Lint

```bash
npm run lint
```

### Start

```bash
npm start
```

## Supported Providers

| Provider                  | API Key Required | Local   | Streaming |
| ------------------------- | ---------------- | ------- | --------- |
| Anthropic (Claude)        | ✅               |       | ✅        |
| OpenAI (GPT)              | ✅               |       | ✅        |
| Ollama                    |                | ✅      | ✅        |
| Generic OpenAI-compatible | ✅               | Depends | ✅        |

## Key Features

### Todos Management

Track AI-generated tasks and subtasks directly in the CLI:

```typescript
// Domain model
class Todo {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  timestamp: Date;
}
```

Features:
- Real-time progress tracking with visual indicators
- Status-based grouping (In Progress, Pending, Completed)
- Progress bar showing overall completion
- Automatic parsing from AI responses

### Permission Modes

Control tool execution with two modes:

- **MVP Mode (YOLO)**: Auto-approve all tool executions - fast development workflow
- **Interactive Mode**: Require user approval before executing tools - safe production workflow

Toggle between modes with `Shift+Tab` during runtime. Mode is displayed in the footer.

### Keyboard Shortcuts System

Layer-based keyboard shortcut management:

```typescript
useShortcut({
  key: 'shift+tab',
  handler: () => toggleMode(),
  layer: 'input',  // or 'screen' or 'global'
  description: 'Toggle permission mode',
  source: 'Home'
});
```

Features:
- Layer-based priority system (input > screen > global)
- Conditional shortcuts with `enabled` function
- Centralized shortcut management
- Conflict detection and resolution

### Slash Commands

Quick actions via command palette:

- Type `/` to show available commands
- Fuzzy search and auto-suggestions
- Tab or Enter to select
- Command history

### Integrations

Extend CODEH with external tools:

- **VS Code Extension**: Bidirectional communication with VS Code
- **MCP Client**: Connect to Model Context Protocol servers
- **A2A Server**: Expose CODEH as an agent-to-agent service

## Key Technologies

- **React + Ink**: Terminal UI framework
- **TypeScript**: Type safety
- **Babel**: Transpilation
- **Dependency Injection**: Custom DI container
- **Clean Architecture**: 3-layer separation
- **Atomic Design**: Component organization
- **Presenter Pattern**: Business logic separation
- **Immutable Domain Models**: Pure functional domain layer

## License

MIT
