# Contributing to Codeh CLI

Thank you for your interest in contributing! This guide will help you get started.

## 📋 Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Commit Convention](#commit-convention)

## 🚀 Development Setup

### Prerequisites
- Node.js 16+
- npm 7+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/codeh-cli.git
   cd codeh-cli
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Link for local testing**
   ```bash
   npm link
   codeh --version
   ```

5. **Run tests**
   ```bash
   npm test
   ```

## 📁 Project Structure

```
codeh-cli/
├── source/
│   ├── cli/                    # Presentation Layer
│   │   ├── screens/           # UI Screens
│   │   ├── components/        # React components
│   │   └── hooks/             # Custom hooks
│   ├── core/                  # Core Layer
│   │   ├── application/       # Use cases & services
│   │   ├── domain/            # Business logic & models
│   │   └── tools/             # Tool implementations
│   └── infrastructure/        # Infrastructure Layer
│       ├── api/               # API clients
│       ├── config/            # Configuration
│       ├── typescript/        # TS analyzer
│       ├── logging/           # Logging system
│       ├── monitoring/        # Performance monitoring
│       ├── process/           # Shell execution
│       └── resilience/        # Circuit breaker
├── test/                      # Test files
├── docs/                      # Documentation
└── dist/                      # Build output
```

## 🔄 Development Workflow

### 1. Create a Feature Branch
```bash
git checkout -b feature/my-new-feature
```

### 2. Make Changes
- Write code following our [coding standards](#coding-standards)
- Add tests for new functionality
- Update documentation as needed

### 3. Run Quality Checks
```bash
# Format code
npm run format

# Run linter
npm run lint

# Run tests
npm test

# Build project
npm run build
```

### 4. Commit Changes
```bash
git add .
git commit -m "feat: add new feature"
```

### 5. Push and Create PR
```bash
git push origin feature/my-new-feature
# Create PR on GitHub
```

## 📝 Coding Standards

### TypeScript

- **Use strict mode** - Enable all strict checks
- **Prefer interfaces over types** for object shapes
- **Use descriptive names** - Clear, self-documenting code
- **Avoid `any`** - Use proper types or `unknown`

```typescript
//  Bad
const data: any = fetchData();

// ✅ Good
const data: UserData = await fetchData();
```

### Code Organization

- **One class per file** - Keep files focused
- **Group related functionality** - Logical organization
- **Use barrel exports** - Simplify imports

```typescript
//  Bad
import {Tool} from '../../tools/base/Tool';
import {ToolDefinition} from '../../domain/interfaces/IToolExecutor';

// ✅ Good
import {Tool, ToolDefinition} from '@/core/tools';
```

### Error Handling

- **Use custom error types** - From `CodehErrors.ts`
- **Provide context** - Include relevant information
- **Log errors properly** - Use structured logger

```typescript
// ✅ Good
try {
  const result = await operation();
} catch (error) {
  logger.error('Operation failed', error, {context: args});
  throw new ToolExecutionError('toolName', error);
}
```

### Naming Conventions

- **PascalCase** - Classes, interfaces, types, components
- **camelCase** - Functions, variables, methods
- **SCREAMING_CASE** - Constants
- **kebab-case** - File names (except components)

```typescript
// Classes & Interfaces
class UserService { }
interface IApiClient { }

// Functions & Variables
function fetchUser() { }
const userName = 'john';

// Constants
const MAX_RETRIES = 3;
```

## 🧪 Testing Guidelines

### Test Structure

```typescript
import test from 'ava';

test('ToolName: should handle success case', async t => {
  // Arrange
  const tool = new MyTool(dependencies);
  const input = {param: 'value'};

  // Act
  const result = await tool.execute(input);

  // Assert
  t.true(result.success);
  t.is(result.output, 'expected output');
});

test('ToolName: should handle error case', async t => {
  // Test error scenarios
});
```

### Coverage Goals

- **Target: 80%+** code coverage
- **Must test:**
  - Happy path (success scenarios)
  - Error cases
  - Edge cases
  - Validation logic

### Test Files Location

```
test/
├── unit/                # Unit tests
│   └── tools/          # Tool unit tests
├── integration/        # Integration tests
└── fixtures/           # Test data
```

## 🔀 Pull Request Process

### Before Creating PR

1. ✅ Code follows style guidelines
2. ✅ Tests added and passing
3. ✅ Documentation updated
4. ✅ Build succeeds
5. ✅ No linting errors

### PR Title Format

Use conventional commits format:

```
feat: add new tool for type analysis
fix: resolve race condition in cache
docs: update API documentation
test: add tests for retry strategy
refactor: simplify error handling
perf: optimize symbol search
```

### PR Description Template

```markdown
## Summary
Brief description of changes

## Changes
- Change 1
- Change 2
- Change 3

## Testing
- [ ] Unit tests added
- [ ] Integration tests added
- [ ] Manual testing completed

## Documentation
- [ ] Code comments added
- [ ] API docs updated
- [ ] User docs updated (if needed)

## Breaking Changes
List any breaking changes (if applicable)
```

### Review Process

1. **Automated checks** - CI must pass
2. **Code review** - At least one approval
3. **Address feedback** - Make requested changes
4. **Merge** - Squash and merge

## 📌 Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Commit Types

- **feat:** New feature
- **fix:** Bug fix
- **docs:** Documentation changes
- **style:** Code style changes (formatting)
- **refactor:** Code refactoring
- **perf:** Performance improvements
- **test:** Adding/updating tests
- **chore:** Maintenance tasks
- **ci:** CI/CD changes

### Commit Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Examples

```bash
# Simple commit
feat: add GetTypeInformationTool

# With scope
fix(shell): resolve command injection vulnerability

# With body
feat: implement retry strategy

Add exponential backoff retry mechanism with configurable
options for maxRetries, backoff delays, and retry predicates.

Includes presets for common scenarios (FAST, STANDARD, AGGRESSIVE).

# Breaking change
feat!: change tool parameter validation

BREAKING CHANGE: Tool.validateParameters now requires unknown type
instead of Record<string, any> for better type safety.
```

## 🎯 How to Add a New Tool

See [docs/development/adding-new-tools.md](docs/development/adding-new-tools.md) for detailed guide.

### Quick Steps

1. **Create tool file**
   ```typescript
   // source/core/tools/MyNewTool.ts
   export class MyNewTool extends Tool { }
   ```

2. **Implement required methods**
   - `getDefinition()`
   - `validateParameters()`
   - `execute()`

3. **Add Zod schema**
   ```typescript
   // source/core/tools/schemas/ToolSchemas.ts
   export const MyNewToolArgsSchema = z.object({ });
   ```

4. **Register in DI container**
   ```typescript
   // source/core/di/setup.ts
   registry.register(new MyNewTool(dependencies));
   ```

5. **Add system prompt**
   ```typescript
   // source/core/application/prompts/CodeNavigationSystemPrompt.ts
   ```

6. **Write tests**
   ```typescript
   // test/tools/MyNewTool.test.ts
   ```

## 🐛 Reporting Bugs

### Bug Report Template

```markdown
**Describe the bug**
Clear description of the bug

**To Reproduce**
Steps to reproduce:
1. Run command '...'
2. See error

**Expected behavior**
What you expected to happen

**Actual behavior**
What actually happened

**Environment**
- OS: [e.g., macOS 13.0]
- Node version: [e.g., 18.0.0]
- Codeh CLI version: [e.g., 1.0.0]

**Additional context**
Any other relevant information
```

## 💡 Feature Requests

We welcome feature requests! Please:

1. **Check existing issues** - Avoid duplicates
2. **Describe the use case** - Why is this needed?
3. **Propose a solution** - How should it work?
4. **Consider alternatives** - Other approaches?

## 📚 Resources

- [Architecture Overview](docs/architecture/overview.md)
- [Tool System Guide](docs/architecture/tool-system.md)
- [API Documentation](docs/api/README.md)
- [Testing Guide](docs/development/testing-guide.md)

## 🤝 Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow

## ❓ Questions?

- Open a [GitHub Discussion](https://github.com/your-org/codeh-cli/discussions)
- Join our [Discord](https://discord.gg/codeh-cli)
- Email: support@codeh.dev

---

Thank you for contributing to Codeh CLI! 🎉
