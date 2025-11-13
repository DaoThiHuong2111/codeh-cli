# Core Services API Reference

API reference for core application services and business logic.

## 📚 Table of Contents

- [TypeScript Code Navigator](#typescript-code-navigator)
- [Workflow Manager](#workflow-manager)
- [Tool Definition Converter](#tool-definition-converter)
- [Dependency Injection Container](#dependency-injection-container)

---

## TypeScript Code Navigator

**Location:** `source/core/application/services/TypeScriptCodeNavigator.ts`

**Purpose:** High-level service layer for TypeScript code navigation and analysis

### Methods

#### `findSymbol(name: string, options?): Symbol[]`

Find symbols by name pattern.

**Parameters:**
```typescript
{
  name: string;                  // Symbol name or pattern
  filePath?: string;             // Optional: restrict to file
  includeBody?: boolean;         // Include symbol body
  depth?: number;                // Depth for children
  substringMatching?: boolean;   // Substring matching
}
```

**Returns:** Array of `Symbol` objects

#### `findReferences(symbolName: string, filePath: string): Reference[]`

Find all references to a symbol.

**Parameters:**
- `symbolName`: Name of the symbol
- `filePath`: File containing the symbol

**Returns:** Array of `Reference` objects

#### `getTypeInformation(filePath: string, symbolName: string, line?: number): TypeInfo | null`

Get type information for a symbol.

**Returns:** `TypeInfo` object or null if not found

#### `getSymbolsOverview(filePath: string): Symbol[]`

Get top-level symbols in a file.

**Returns:** Array of top-level `Symbol` objects (without bodies)

---

## Workflow Manager

**Location:** `source/core/application/services/WorkflowManager.ts`

**Purpose:** Manage plans and todos for AI workflow

### Methods

#### `createPlan(name: string, description: string): Plan`

Create a new plan.

**Returns:** `Plan` object with unique ID

#### `getPlan(id: string): Plan | undefined`

Get a plan by ID.

#### `updatePlanStatus(id: string, status: PlanStatus): void`

Update plan status.

**Status values:**
- `'planning'`
- `'in_progress'`
- `'completed'`
- `'failed'`

#### `addTodoToPlan(planId: string, todo: Todo): void`

Add a todo item to a plan.

**Todo structure:**
```typescript
{
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  activeForm: string;  // Present continuous form
}
```

#### `updateTodoStatus(planId: string, todoId: string, status: TodoStatus): void`

Update todo status within a plan.

#### `listPlans(): Plan[]`

List all plans.

---

## Tool Definition Converter

**Location:** `source/core/application/services/ToolDefinitionConverter.ts`

**Purpose:** Convert tool definitions between different LLM API formats

### Methods

#### `toAnthropicFormat(tools: ToolDefinition[]): AnthropicTool[]`

Convert to Anthropic Claude format.

**Output format:**
```typescript
{
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: {...};
    required: string[];
  }
}
```

#### `toOpenAIFormat(tools: ToolDefinition[]): OpenAITool[]`

Convert to OpenAI format.

**Output format:**
```typescript
{
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: {...};
      required: string[];
    }
  }
}
```

#### `toGenericFormat(tools: ToolDefinition[]): GenericTool[]`

Convert to generic simplified format.

**Output format:**
```typescript
{
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: {...};
    required: string[];
  }
}
```

#### `getFormatForProvider(tools: ToolDefinition[], provider: string): any[]`

Auto-select format based on provider.

**Supported providers:**
- `'anthropic'` → Anthropic format
- `'openai'` → OpenAI format
- `'generic'` → Generic format

---

## Dependency Injection Container

**Location:** `source/core/di/DIContainer.ts`

**Purpose:** Manage dependency injection for services and tools

### Methods

#### `register<T>(key: string, factory: () => T, singleton?: boolean): void`

Register a service or dependency.

**Parameters:**
- `key`: Unique identifier
- `factory`: Factory function that creates the instance
- `singleton`: Whether to cache the instance (default: false)

**Example:**
```typescript
container.register('Logger', () => new ConsoleLogger(), true);
```

#### `resolve<T>(key: string): T`

Resolve and retrieve a registered dependency.

**Example:**
```typescript
const logger = container.resolve<ILogger>('Logger');
```

#### `has(key: string): boolean`

Check if a key is registered.

#### `clear(): void`

Clear all registrations (useful for testing).

---

## Domain Models

### Symbol

**Location:** `source/core/domain/models/Symbol.ts`

```typescript
interface Symbol {
  name: string;
  kind: string;              // 'class', 'function', 'variable', etc.
  location: {
    relativePath: string;
    startLine: number;
    endLine: number;
  };
  body?: string;             // Source code body
  children?: Symbol[];       // Nested symbols
}
```

### Reference

**Location:** `source/core/domain/models/Reference.ts`

```typescript
interface Reference {
  symbol: Symbol;                    // The referencing symbol
  line: number;                      // Line where reference occurs
  contentAroundReference: string;    // Code snippet around reference
}
```

### Plan

**Location:** `source/core/domain/models/Plan.ts`

```typescript
interface Plan {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'in_progress' | 'completed' | 'failed';
  todos: Todo[];
  createdAt: Date;
  updatedAt: Date;
}

interface Todo {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  activeForm: string;
}
```

---

## Usage Examples

### Example 1: Navigate TypeScript Code

```typescript
import {TypeScriptCodeNavigator} from '@/core/application/services';

const navigator = new TypeScriptCodeNavigator(projectRoot, analyzer);

// Find all classes matching pattern
const classes = navigator.findSymbol('*Service', {
  substringMatching: true,
  depth: 1
});

// Get type information
const typeInfo = navigator.getTypeInformation(
  'src/app.ts',
  'userConfig'
);

// Find references
const refs = navigator.findReferences('UserService', 'src/services/UserService.ts');
```

### Example 2: Manage Workflow

```typescript
import {WorkflowManager} from '@/core/application/services';

const workflow = new WorkflowManager();

// Create a plan
const plan = workflow.createPlan(
  'Implement Authentication',
  'Add JWT-based auth system'
);

// Add todos
workflow.addTodoToPlan(plan.id, {
  id: '1',
  content: 'Create Auth service',
  status: 'pending',
  activeForm: 'Creating Auth service'
});

workflow.addTodoToPlan(plan.id, {
  id: '2',
  content: 'Add login endpoint',
  status: 'pending',
  activeForm: 'Adding login endpoint'
});

// Update status
workflow.updateTodoStatus(plan.id, '1', 'in_progress');
```

### Example 3: Convert Tool Definitions

```typescript
import {ToolDefinitionConverter} from '@/core/application/services';

const converter = new ToolDefinitionConverter();
const tools = registry.getAllTools().map(t => t.getDefinition());

// Convert for Claude
const claudeTools = converter.toAnthropicFormat(tools);

// Convert for OpenAI
const openaiTools = converter.toOpenAIFormat(tools);

// Auto-select
const tools = converter.getFormatForProvider(tools, 'anthropic');
```

### Example 4: Dependency Injection

```typescript
import {container} from '@/core/di';

// Setup (in setup.ts)
container.register('TypeScriptAnalyzer',
  () => new TypeScriptSymbolAnalyzer(projectRoot),
  true  // singleton
);

container.register('CodeNavigator',
  () => new TypeScriptCodeNavigator(
    projectRoot,
    container.resolve('TypeScriptAnalyzer')
  ),
  true
);

// Usage (anywhere)
const navigator = container.resolve<TypeScriptCodeNavigator>('CodeNavigator');
```

---

## Error Handling

### Standard Errors

All services throw standard error types from `CodehErrors.ts`:

```typescript
// Tool execution error
throw new ToolExecutionError('toolName', originalError);

// Validation error
throw new ValidationError('Invalid parameter: filePath');

// Configuration error
throw new ConfigurationError('Missing required config: apiKey');

// Security error (sandbox)
throw new SecurityError('Command not allowed', 'COMMAND_NOT_ALLOWED');
```

### Error Handling Pattern

```typescript
try {
  const result = await service.operation();
} catch (error) {
  if (error instanceof ToolExecutionError) {
    logger.error('Tool execution failed', error);
  } else if (error instanceof ValidationError) {
    logger.warn('Validation failed', error);
  } else {
    logger.error('Unexpected error', error);
  }
  throw error;
}
```

---

## Testing

### Unit Testing Services

```typescript
import test from 'ava';
import {WorkflowManager} from '@/core/application/services';

test('WorkflowManager: create and manage plan', t => {
  const manager = new WorkflowManager();

  const plan = manager.createPlan('Test Plan', 'Description');
  t.truthy(plan.id);
  t.is(plan.status, 'planning');

  manager.updatePlanStatus(plan.id, 'in_progress');
  const updated = manager.getPlan(plan.id);
  t.is(updated?.status, 'in_progress');
});
```

---

## See Also

- [API Overview](../README.md)
- [Tools API](../tools/README.md)
- [Infrastructure API](../infrastructure/README.md)
- [Architecture Overview](../../architecture/overview.md)
