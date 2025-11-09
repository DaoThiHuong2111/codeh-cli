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
  - `screens/` - Main UI screens (Home, Welcome, Config)
  - `presenters/` - Presentation logic (separates UI from business logic)
  - `hooks/` - Custom React hooks for DI container access
  - `app.tsx` - Root component
  - `cli.tsx` - Entry point

### LAYER 2: Core Layer (Business Logic)

- **Location**: `source/core/`
- **Purpose**: Business rules and domain logic
- **Components**:
  - `domain/` - Domain models, value objects, and interfaces
    - `models/` - Message, Conversation, Turn, Configuration
    - `valueObjects/` - Provider, ModelInfo
    - `interfaces/` - IApiClient, IConfigRepository, etc.
  - `application/` - Application services and orchestrators
    - `CodehClient.ts` - Main orchestrator for AI interactions
    - `CodehChat.ts` - Conversation management
    - `services/` - Input classifier, output formatter, etc.
  - `tools/` - Tool system (shell execution, file operations)
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
  - `history/` - Conversation history persistence
  - `filesystem/` - File operations
  - `process/` - Shell command execution

## Project Structure

```
source/
├── cli/                      # LAYER 1: Presentation
│   ├── components/
│   │   ├── atoms/           # Basic UI elements
│   │   ├── molecules/       # Composite components
│   │   └── organisms/       # Complex components
│   ├── screens/             # Main screens
│   ├── presenters/          # Presentation logic
│   ├── hooks/               # Custom hooks
│   ├── app.tsx              # Root component
│   └── cli.tsx              # Entry point
├── core/                    # LAYER 2: Business Logic
│   ├── domain/
│   │   ├── models/          # Domain entities
│   │   ├── valueObjects/    # Value objects
│   │   └── interfaces/      # Contracts
│   ├── application/         # Application services
│   ├── tools/               # Tool system
│   └── di/                  # Dependency injection
└── infrastructure/          # LAYER 3: External Services
    ├── api/                 # API clients
    ├── config/              # Configuration
    ├── history/             # History persistence
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
| Anthropic (Claude)        | ✅               | ❌      | ✅        |
| OpenAI (GPT)              | ✅               | ❌      | ✅        |
| Ollama                    | ❌               | ✅      | ✅        |
| Generic OpenAI-compatible | ✅               | Depends | ✅        |

## Key Technologies

- **React + Ink**: Terminal UI framework
- **TypeScript**: Type safety
- **Babel**: Transpilation
- **Dependency Injection**: Custom DI container
- **Clean Architecture**: 3-layer separation
- **Atomic Design**: Component organization
- **Presenter Pattern**: Business logic separation

## License

MIT
