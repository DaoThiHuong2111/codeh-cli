# Infrastructure API Reference

API reference for infrastructure layer components (TypeScript analyzer, shell execution, logging, etc.)

## 📚 Table of Contents

- [TypeScript Symbol Analyzer](#typescript-symbol-analyzer)
- [Shell Execution](#shell-execution)
- [Logging System](#logging-system)
- [Circuit Breaker](#circuit-breaker)
- [API Clients](#api-clients)

---

## TypeScript Symbol Analyzer

**Location:** `source/infrastructure/typescript/TypeScriptSymbolAnalyzer.ts`

**Purpose:** Low-level TypeScript Compiler API wrapper for symbol analysis

### Constructor

```typescript
constructor(projectRoot: string)
```

Creates a TypeScript program from `tsconfig.json` in the project root.

### Methods

#### `findSymbol(name: string, options): Symbol[]`

Find symbols using TypeScript's type checker.

**Implementation:** Uses TS Compiler API to traverse AST and find matching symbols.

#### `findReferences(symbolName: string, filePath: string): Reference[]`

Find all references to a symbol using TS language service.

**Implementation:** Uses `findReferences()` from TypeScript language service.

#### `getTypeInformation(filePath: string, symbolName: string, line?: number): TypeInfo | null`

Get detailed type information using type checker.

**Implementation:**
- Loads source file
- Finds symbol at position
- Uses type checker to get type
- Extracts signature, documentation, etc.

#### `invalidateAll(): void`

Invalidate all caches and reload TypeScript program.

**Use case:** After file changes, before validation.

### Performance

- **Caching:** Symbol lookups are cached
- **Lazy loading:** Source files loaded on-demand
- **Incremental:** Supports incremental compilation

---

## Shell Execution

### ShellExecutor

**Location:** `source/infrastructure/process/ShellExecutor.ts`

**Purpose:** Base class for shell command execution

#### `execute(command: string, options?: CommandOptions): Promise<CommandResult>`

Execute a shell command.

**Parameters:**
```typescript
interface CommandOptions {
  cwd?: string;          // Working directory
  timeout?: number;      // Execution timeout (ms)
  env?: Record<string, string>;  // Environment variables
}
```

**Returns:**
```typescript
interface CommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;  // Execution time in ms
}
```

---

### SandboxedShellExecutor

**Location:** `source/infrastructure/process/SandboxedShellExecutor.ts`

**Purpose:** Secure shell executor with safety constraints

#### Constructor

```typescript
constructor(config?: SandboxConfig)

interface SandboxConfig {
  allowedCommands?: Set<string>;
  maxOutputSize?: number;           // Default: 10MB
  maxExecutionTime?: number;        // Default: 30s
  detectDangerousPatterns?: boolean; // Default: true
}
```

#### Security Features

**1. Command Whitelist**

Default allowed commands:
```typescript
['ls', 'cat', 'grep', 'find', 'git', 'npm', 'node', 'tsc',
 'echo', 'pwd', 'mkdir', 'touch', 'mv', 'cp', 'which',
 'whoami', 'date', 'head', 'tail', 'wc', 'sort', 'uniq', 'diff']
```

**2. Dangerous Pattern Detection**

Blocked patterns:
- `rm -rf /`
- `>  /dev/sda`
- `curl ... | sh`
- `eval(...)`
- `exec(...)`
- Fork bombs
- Disk formatting

**3. Command Injection Prevention**

Detects and blocks:
- Semicolons (;)
- Ampersands (&)
- Newlines (\n, \r)
- Command substitution ($(), `)

**Safe patterns allowed:**
- Pipe to safe commands: `| grep`, `| head`, `| wc`
- File redirection: `> file.txt`
- Stderr redirect: `2>&1`

**4. Resource Limits**

- Output size limit: 10MB
- Execution timeout: 30 seconds

#### Methods

##### `addAllowedCommand(command: string): void`

Add a command to the whitelist.

##### `removeAllowedCommand(command: string): void`

Remove a command from the whitelist.

##### `getAl​lowedCommands(): string[]`

Get current whitelist.

##### `isCommandAllowed(command: string): boolean`

Check if a command is allowed.

---

### SandboxModeManager

**Location:** `source/infrastructure/process/SandboxModeManager.ts`

**Purpose:** Global sandbox mode state management

#### Modes

```typescript
enum SandboxMode {
  ENABLED = 'enabled',   // Safe, restricted
  DISABLED = 'disabled'  // Unrestricted
}
```

#### Methods

##### `isEnabled(): boolean`

Check if sandbox is enabled.

##### `enable(): void`

Enable sandbox mode.

##### `disable(): void`

Disable sandbox mode (use with caution!).

##### `toggle(): SandboxMode`

Toggle between modes.

##### `getMode(): SandboxMode`

Get current mode.

##### `getModeDescription(): string`

Get human-readable mode description.

##### `addListener(listener: SandboxModeChangeListener): void`

Add listener for mode changes.

**Listener interface:**
```typescript
interface SandboxModeChangeListener {
  onModeChanged(newMode: SandboxMode, oldMode: SandboxMode): void;
}
```

---

## Logging System

**Location:** `source/infrastructure/logging/`

### StructuredLogger

**Purpose:** Structured logging with multiple transports

#### Methods

##### `info(message: string, meta?: Record<string, any>): void`

Log info message.

##### `warn(message: string, meta?: Record<string, any>): void`

Log warning message.

##### `error(message: string, error?: Error, meta?: Record<string, any>): void`

Log error with stack trace.

##### `debug(message: string, meta?: Record<string, any>): void`

Log debug message (development only).

#### Log Format

```json
{
  "timestamp": "2025-11-12T10:30:00.000Z",
  "level": "info",
  "message": "Tool execution completed",
  "meta": {
    "toolName": "get_type_information",
    "duration": 150,
    "success": true
  }
}
```

---

## Circuit Breaker

**Location:** `source/infrastructure/resilience/CircuitBreaker.ts`

**Purpose:** Prevent cascading failures in external calls

### States

```typescript
enum CircuitState {
  CLOSED,      // Normal operation
  OPEN,        // Failing, reject calls
  HALF_OPEN    // Testing recovery
}
```

### Constructor

```typescript
constructor(config: CircuitBreakerConfig)

interface CircuitBreakerConfig {
  failureThreshold: number;     // Failures before opening
  successThreshold: number;     // Successes to close from half-open
  timeout: number;              // Time to wait before half-open
  onStateChange?: (state: CircuitState) => void;
}
```

### Methods

#### `async execute<T>(fn: () => Promise<T>): Promise<T>`

Execute function with circuit breaker protection.

**Behavior:**
- **CLOSED**: Execute normally, track failures
- **OPEN**: Reject immediately with CircuitOpenError
- **HALF_OPEN**: Try execution, close on success, open on failure

#### `getState(): CircuitState`

Get current state.

#### `reset(): void`

Force reset to CLOSED state.

---

## API Clients

### Base API Client

**Location:** `source/infrastructure/api/BaseAPIClient.ts`

**Purpose:** Base class for LLM API clients

#### Methods

##### `async request<T>(options: RequestOptions): Promise<T>`

Make HTTP request with retries and circuit breaker.

**Features:**
- Automatic retries with exponential backoff
- Circuit breaker protection
- Request/response logging
- Error handling

##### `async chat(request: ChatRequest): Promise<ChatResponse>`

Send chat request (abstract method, implemented by providers).

---

### Provider Clients

#### AnthropicAPIClient

**Location:** `source/infrastructure/api/anthropic/AnthropicAPIClient.ts`

Anthropic Claude API client.

#### OpenAIAPIClient

**Location:** `source/infrastructure/api/openai/OpenAIAPIClient.ts`

OpenAI GPT API client.

#### GoogleAPIClient

**Location:** `source/infrastructure/api/google/GoogleAPIClient.ts`

Google Gemini API client.

#### OllamaAPIClient

**Location:** `source/infrastructure/api/ollama/OllamaAPIClient.ts`

Ollama local API client.

---

## Usage Examples

### Example 1: TypeScript Analysis

```typescript
import {TypeScriptSymbolAnalyzer} from '@/infrastructure/typescript';

const analyzer = new TypeScriptSymbolAnalyzer('/path/to/project');

// Find symbols
const symbols = analyzer.findSymbol('UserService');

// Get type info
const typeInfo = analyzer.getTypeInformation(
  'src/app.ts',
  'userConfig'
);

// Find references
const refs = analyzer.findReferences('UserService', 'src/services/UserService.ts');

// Invalidate cache after changes
analyzer.invalidateAll();
```

### Example 2: Safe Shell Execution

```typescript
import {SandboxedShellExecutor} from '@/infrastructure/process';

const executor = new SandboxedShellExecutor({
  maxOutputSize: 5 * 1024 * 1024,  // 5MB
  maxExecutionTime: 10000           // 10s
});

try {
  // This will work - ls is whitelisted
  const result = await executor.execute('ls -la');
  console.log(result.stdout);

  // This will throw SecurityError - rm not whitelisted
  await executor.execute('rm -rf /tmp/foo');
} catch (error) {
  if (error instanceof SecurityError) {
    console.error('Security violation:', error.message);
  }
}
```

### Example 3: Sandbox Mode Management

```typescript
import {globalSandboxModeManager} from '@/infrastructure/process';

// Check mode
if (globalSandboxModeManager.isEnabled()) {
  console.log('Sandbox is enabled');
}

// Add listener
globalSandboxModeManager.addListener({
  onModeChanged(newMode, oldMode) {
    console.log(`Mode changed from ${oldMode} to ${newMode}`);
  }
});

// Toggle mode
const newMode = globalSandboxModeManager.toggle();
console.log(`New mode: ${newMode}`);
```

### Example 4: Structured Logging

```typescript
import {logger} from '@/infrastructure/logging';

// Info log
logger.info('User logged in', {
  userId: '123',
  timestamp: Date.now()
});

// Warning log
logger.warn('API rate limit approaching', {
  current: 950,
  limit: 1000
});

// Error log
try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed', error, {
    operation: 'riskyOperation',
    context: {...}
  });
}
```

### Example 5: Circuit Breaker

```typescript
import {CircuitBreaker} from '@/infrastructure/resilience';

const breaker = new CircuitBreaker({
  failureThreshold: 5,      // Open after 5 failures
  successThreshold: 2,       // Close after 2 successes
  timeout: 60000,           // 60s before half-open
  onStateChange: (state) => {
    console.log(`Circuit breaker state: ${state}`);
  }
});

// Wrap API call with circuit breaker
try {
  const result = await breaker.execute(async () => {
    return await apiClient.chat(request);
  });
} catch (error) {
  if (error instanceof CircuitOpenError) {
    console.log('Circuit open, service unavailable');
  }
}
```

---

## Configuration

### TypeScript Analyzer Configuration

Reads from `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["source/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Sandbox Configuration

Environment variables:
```bash
SANDBOX_MODE=enabled           # enabled | disabled
SANDBOX_MAX_OUTPUT=10485760    # 10MB in bytes
SANDBOX_MAX_TIME=30000         # 30s in ms
```

### Logging Configuration

```typescript
// source/infrastructure/logging/config.ts
export const loggingConfig = {
  level: process.env.LOG_LEVEL || 'info',
  file: process.env.LOG_FILE || 'logs/app.log',
  console: process.env.LOG_CONSOLE === 'true'
};
```

---

## Error Types

### Security Errors

```typescript
class SecurityError extends Error {
  constructor(
    message: string,
    public code: SecurityErrorCode
  ) {
    super(message);
    this.name = 'SecurityError';
  }
}

type SecurityErrorCode =
  | 'COMMAND_NOT_ALLOWED'
  | 'DANGEROUS_COMMAND_PATTERN'
  | 'COMMAND_INJECTION'
  | 'OUTPUT_SIZE_EXCEEDED'
  | 'EXECUTION_TIMEOUT';
```

### Circuit Breaker Errors

```typescript
class CircuitOpenError extends Error {
  constructor() {
    super('Circuit breaker is open');
    this.name = 'CircuitOpenError';
  }
}
```

---

## Performance Considerations

### TypeScript Analyzer

- **First analysis:** ~2-5s (loads entire program)
- **Subsequent queries:** <100ms (cached)
- **Memory usage:** ~100-200MB for medium projects
- **Recommendation:** Keep one instance alive, invalidate when needed

### Shell Execution

- **Sandboxed:** +10-20ms overhead (validation)
- **Unrestricted:** Direct execution, no overhead
- **Recommendation:** Keep sandbox enabled by default

### Circuit Breaker

- **Overhead:** <1ms per call
- **Memory:** ~100 bytes per breaker instance
- **Recommendation:** One instance per external service

---

## Testing

### Mocking Infrastructure

```typescript
import test from 'ava';
import {TypeScriptSymbolAnalyzer} from '@/infrastructure/typescript';

test('TypeScript analyzer finds symbols', t => {
  const analyzer = new TypeScriptSymbolAnalyzer('./test-project');
  const symbols = analyzer.findSymbol('TestClass');

  t.is(symbols.length, 1);
  t.is(symbols[0].name, 'TestClass');
});
```

---

## See Also

- [API Overview](../README.md)
- [Tools API](../tools/README.md)
- [Core Services API](../core/README.md)
- [Security Model](../../architecture/security.md)
- [Performance Guide](../../guides/performance.md)
