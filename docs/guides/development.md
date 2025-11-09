# Development Guide

Hướng dẫn phát triển CODEH CLI cho contributors.

## Prerequisites

- Node.js >= 18
- npm >= 9
- Git
- Terminal emulator hỗ trợ ANSI colors

## Setup Development Environment

```bash
# Clone repository
git clone https://github.com/your-org/codeh-cli.git
cd codeh-cli

# Install dependencies
npm install

# Build project
npm run build

# Run in development
npm run dev
```

## Project Structure

```
codeh-cli/
├── source/                    # Source code
│   ├── cli/                  # Layer 1: CLI (Presentation)
│   │   ├── components/      # React Ink components
│   │   ├── screens/         # Screen components
│   │   ├── hooks/           # React hooks
│   │   └── presenters/      # MVP presenters
│   ├── core/                # Layer 2: Core (Business Logic)
│   │   ├── application/     # Use cases, services
│   │   ├── domain/          # Domain models, interfaces
│   │   └── tools/           # Tool registry
│   └── infrastructure/      # Layer 3: Infrastructure
│       ├── api/             # API clients
│       ├── config/          # Configuration
│       ├── history/         # History storage
│       └── integrations/    # External integrations
├── test/                     # Tests
├── docs/                     # Documentation
└── dist/                     # Compiled output
```

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

Follow 3-layer architecture principles:

- **CLI Layer**: UI components only
- **Core Layer**: Business logic, no external dependencies
- **Infrastructure Layer**: External services, APIs, file I/O

### 3. Write Tests

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### 4. Build and Verify

```bash
# Build TypeScript
npm run build

# Format code
npm run format

# Lint
npm run lint
```

### 5. Commit

```bash
git add .
git commit -m "feat: add your feature"
```

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance

### 6. Push and Create PR

```bash
git push origin feature/your-feature-name
```

## Code Style Guide

### TypeScript

- Use strict mode
- Prefer `const` over `let`
- Use explicit types for function parameters and returns
- Use interfaces for object shapes

```typescript
// Good
interface UserConfig {
	apiKey: string;
	model: string;
}

function loadConfig(path: string): UserConfig {
	// ...
}

// Bad
function loadConfig(path) {
	// ...
}
```

### React Components

- Use functional components with hooks
- Keep components small (<200 lines)
- Extract complex logic to custom hooks

```typescript
// Good
export function MyComponent({title}: {title: string}) {
	const [state, setState] = useState('');

	return <Text>{title}</Text>;
}
```

### Naming Conventions

- **Files**: PascalCase for components, camelCase for utilities
  - `HomeScreen.tsx`, `useHomeLogic.ts`
- **Classes**: PascalCase
- **Functions/Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE

## Architecture Principles

### 3-Layer Architecture

1. **CLI (Presentation)**

   - React Ink components
   - User interface logic
   - No business logic
   - Dependency: Core layer only

2. **Core (Business Logic)**

   - Domain models
   - Use cases
   - Business rules
   - No external dependencies

3. **Infrastructure (External)**
   - API clients
   - File operations
   - Database
   - Integrations

### Dependency Rule

- CLI → Core
- Core → (independent)
- Infrastructure → Core
- **Never**: Core → CLI or Infrastructure

## Adding a New Screen

1. Create screen component in `source/cli/screens/`
2. Create presenter in `source/cli/presenters/`
3. Create custom hook in `source/cli/hooks/`
4. Register in navigation

Example:

```typescript
// source/cli/screens/NewScreen.tsx
export function NewScreen() {
	const {state, actions} = usePresenter(NewPresenter);
	return <Box>{/* UI */}</Box>;
}

// source/cli/presenters/NewPresenter.ts
export class NewPresenter {
	// Business logic
}

// source/cli/hooks/useNewScreen.ts
export function useNewScreen() {
	// Hook logic
}
```

## Adding a New Integration

1. Create integration in `source/infrastructure/integrations/`
2. Implement interface pattern
3. Add documentation to integrations guide
4. Write tests

See [Integrations Guide](../architecture/integrations.md) for details.

## Debugging

### Debug Output

```typescript
import {debug} from './utils/debug';

debug.log('My debug message', {data});
```

### VS Code Debug Configuration

```json
{
	"type": "node",
	"request": "launch",
	"name": "Debug CODEH",
	"program": "${workspaceFolder}/dist/cli.js",
	"outFiles": ["${workspaceFolder}/dist/**/*.js"]
}
```

## Testing

### Unit Tests

```typescript
import test from 'ava';
import {MyComponent} from './MyComponent';

test('should render correctly', t => {
	// Test implementation
	t.pass();
});
```

### Integration Tests

Test complete user flows:

```typescript
test('user can chat with AI', async t => {
	// Setup
	const app = createTestApp();

	// Act
	await app.sendMessage('Hello');

	// Assert
	t.is(app.getLastMessage().role, 'assistant');
});
```

## Common Tasks

### Add a New Provider

1. Create client in `source/infrastructure/api/clients/`
2. Implement `IApiClient` interface
3. Register in `ApiClientFactory`
4. Add tests

### Add a New Tool

1. Create tool in `source/core/tools/`
2. Extend `Tool` base class
3. Register in `ToolRegistry`
4. Document usage

### Update Configuration Schema

1. Update `Configuration` model in `source/core/domain/models/`
2. Update validator in `source/core/domain/validators/`
3. Update docs in `guides/configuration.md`

## Performance Tips

- Use `useMemo` for expensive computations
- Use `useCallback` for event handlers
- Lazy load heavy components
- Minimize re-renders with `React.memo`

## Troubleshooting

### Build Errors

```bash
# Clean build
rm -rf dist
npm run build
```

### Test Failures

```bash
# Run specific test
npm test -- test/path/to/test.ts

# Update snapshots
npm test -- --update-snapshots
```

### Type Errors

```bash
# Check types without building
npx tsc --noEmit
```

## Resources

- [Architecture Overview](../architecture/overview.md)
- [Integrations Guide](../architecture/integrations.md)
- [User Guide](./user-guide.md)
- [React Ink Documentation](https://github.com/vadimdemedes/ink)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

## Getting Help

- GitHub Issues: Bug reports and feature requests
- Discussions: Questions and general discussions
- Code Review: Submit PRs for review

## License

MIT - See LICENSE file for details
