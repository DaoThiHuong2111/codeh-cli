# Tools API Reference

Comprehensive reference for all code intelligence and manipulation tools in Codeh CLI.

## 📚 Table of Contents

- [Advanced Code Intelligence](#advanced-code-intelligence)
- [Symbol Manipulation](#symbol-manipulation)
- [Code Search](#code-search)
- [File Operations](#file-operations)
- [System Tools](#system-tools)

---

## Advanced Code Intelligence

### get_type_information

**Purpose:** Get TypeScript type information for symbols (variables, functions, parameters, etc.)

**Parameters:**
```typescript
{
  filePath: string;      // Path to file containing the symbol
  symbolName: string;    // Name of the symbol
  line?: number;         // Optional: specific line number
}
```

**Returns:**
```typescript
{
  success: boolean;
  output: string;
  metadata?: {
    typeString: string;       // The TypeScript type as string
    kind: string;             // Symbol kind (variable, function, etc.)
    isOptional: boolean;      // Whether the symbol is optional
    isAsync: boolean;         // Whether it's async (for functions)
    documentation?: string;   // JSDoc documentation
    signature?: string;       // Function signature
  }
}
```

**Example:**
```typescript
// Get type information for a variable
{
  filePath: "src/app.ts",
  symbolName: "userConfig",
  line: 15
}

// Response:
{
  success: true,
  output: 'Found type information for "userConfig"',
  metadata: {
    typeString: "UserConfig",
    kind: "variable",
    isOptional: false,
    isAsync: false
  }
}
```

**Use Cases:**
- Understanding variable types
- Checking function signatures
- Finding optional parameters
- Type validation

---

### get_call_hierarchy

**Purpose:** Analyze function call relationships - who calls this function (incoming) and what it calls (outgoing)

**Parameters:**
```typescript
{
  filePath: string;
  symbolName: string;
  direction: 'incoming' | 'outgoing' | 'both';  // Default: 'both'
  maxDepth?: number;                             // Default: 2
}
```

**Returns:**
```typescript
{
  success: boolean;
  output: string;
  metadata?: {
    symbolName: string;
    filePath: string;
    incomingCalls: Array<{
      file: string;
      symbol: string;
      line: number;
      context: string;      // Code snippet around the call
    }>;
    outgoingCalls: string[];
    direction: string;
    maxDepth: number;
  }
}
```

**Example:**
```typescript
// Find who calls getUserData function
{
  filePath: "src/services/user.ts",
  symbolName: "getUserData",
  direction: "incoming"
}

// Response shows all functions that call getUserData
```

**Use Cases:**
- Understanding code flow
- Finding function usage
- Refactoring preparation
- Impact analysis

---

### find_implementations

**Purpose:** Find all classes that implement an interface or extend an abstract class

**Parameters:**
```typescript
{
  filePath: string;        // File containing the interface
  interfaceName: string;   // Name of interface/abstract class
}
```

**Returns:**
```typescript
{
  success: boolean;
  output: string;
  metadata?: {
    interfaceName: string;
    count: number;
    implementations: Array<{
      className: string;
      file: string;
      line: number;
      snippet: string;
    }>;
  }
}
```

**Example:**
```typescript
// Find all implementations of ILogger
{
  filePath: "src/interfaces/ILogger.ts",
  interfaceName: "ILogger"
}

// Response:
{
  success: true,
  output: 'Found 3 implementation(s) of "ILogger"',
  metadata: {
    interfaceName: "ILogger",
    count: 3,
    implementations: [
      {
        className: "ConsoleLogger",
        file: "src/loggers/ConsoleLogger.ts",
        line: 5,
        snippet: "export class ConsoleLogger implements ILogger {"
      },
      // ... more implementations
    ]
  }
}
```

**Use Cases:**
- Understanding polymorphism
- Finding concrete implementations
- Architecture analysis
- Refactoring interfaces

---

### validate_code_changes

**Purpose:** Validate TypeScript code for syntax errors, type errors, and other issues

**Parameters:**
```typescript
{
  files?: string[];   // Optional: specific files to validate
                      // If not provided, validates entire project
}
```

**Returns:**
```typescript
{
  success: boolean;
  output: string;
  metadata?: {
    valid: boolean;
    errorCount: number;
    warningCount: number;
    errors: Array<{
      file: string;
      line: number;
      column: number;
      message: string;
      code: number;
    }>;
    warnings: Array<{...}>;
  }
}
```

**Example:**
```typescript
// Validate specific files after changes
{
  files: ["src/app.ts", "src/config.ts"]
}

// Response:
{
  success: true,
  output: "✅ Code validation passed! 2 warning(s), 0 errors.",
  metadata: {
    valid: true,
    errorCount: 0,
    warningCount: 2,
    errors: [],
    warnings: [...]
  }
}
```

**Use Cases:**
- Post-edit validation
- Pre-commit checks
- Refactoring validation
- Type safety verification

---

### smart_context_extractor

**Purpose:** Intelligently extract all relevant context needed to understand a symbol

**Parameters:**
```typescript
{
  filePath: string;
  symbolName: string;
  includeCallers?: boolean;        // Default: true
  includeDependencies?: boolean;   // Default: true
  includeTypes?: boolean;          // Default: true
  maxDepth?: number;               // Default: 2
}
```

**Returns:**
```typescript
{
  success: boolean;
  output: string;
  metadata?: {
    definition: {
      name: string;
      kind: string;
      file: string;
      line: number;
      body: string;
    };
    callers: Array<{
      symbol: string;
      file: string;
      line: number;
      context: string;
    }>;
    typeInfo: {
      type: string;
      isOptional: boolean;
      isAsync: boolean;
      signature?: string;
    };
    children: Array<{name: string; kind: string}>;
    stats: {
      callerCount: number;
      childrenCount: number;
      hasTypeInfo: boolean;
    }
  }
}
```

**Example:**
```typescript
// Get complete context for UserService class
{
  filePath: "src/services/UserService.ts",
  symbolName: "UserService",
  includeCallers: true,
  includeTypes: true
}

// Response includes:
// - Class definition with body
// - All methods (children)
// - Who uses this class (callers)
// - Type information
```

**Use Cases:**
- AI context gathering
- Code understanding
- Documentation generation
- Refactoring planning

---

### get_dependency_graph

**Purpose:** Analyze module dependencies (imports/exports)

**Parameters:**
```typescript
{
  filePath?: string;   // Optional: specific file
  module?: string;     // Optional: module directory (e.g., "src/auth")
}
```

**Returns:**
```typescript
{
  success: boolean;
  output: string;
  metadata?: {
    file: string;
    imports: string[];
    exports: string[];
    circularDeps: string[];
    stats: {
      importCount: number;
      exportCount: number;
      circularDepCount: number;
    }
  }
}
```

**Example:**
```typescript
// Analyze dependencies for a file
{
  filePath: "src/services/UserService.ts"
}

// Response:
{
  success: true,
  output: "Dependency graph for UserService.ts: 5 import(s), 2 export(s)",
  metadata: {
    file: "src/services/UserService.ts",
    imports: [
      "../interfaces/ILogger",
      "../models/User",
      "./AuthService"
    ],
    exports: ["UserService", "UserConfig"],
    circularDeps: [],
    stats: {
      importCount: 5,
      exportCount: 2,
      circularDepCount: 0
    }
  }
}
```

**Use Cases:**
- Module structure analysis
- Finding circular dependencies
- Refactoring modules
- Architecture review

---

## Symbol Manipulation

### find_symbol (MCP)

Find symbols by name pattern using Serena MCP.

**Parameters:**
```typescript
{
  name_path: string;         // Name pattern (e.g., "ClassName/methodName")
  relative_path?: string;    // Optional: restrict to file/directory
  substring_matching?: boolean;  // Default: false
  depth?: number;            // Default: 0
  include_body?: boolean;    // Default: false
}
```

### replace_symbol_body (MCP)

Replace the entire body of a symbol.

**Parameters:**
```typescript
{
  name_path: string;
  relative_path: string;
  body: string;
}
```

### rename_symbol (MCP)

Rename a symbol throughout the entire codebase.

**Parameters:**
```typescript
{
  name_path: string;
  relative_path: string;
  new_name: string;
}
```

### insert_after_symbol (MCP)

Insert code after a symbol.

**Parameters:**
```typescript
{
  name_path: string;
  relative_path: string;
  body: string;
}
```

### insert_before_symbol (MCP)

Insert code before a symbol.

**Parameters:**
```typescript
{
  name_path: string;
  relative_path: string;
  body: string;
}
```

### find_references (MCP)

Find all references to a symbol.

**Parameters:**
```typescript
{
  name_path: string;
  relative_path: string;
}
```

---

## Code Search

### search_for_pattern (MCP)

Regex-based code search.

**Parameters:**
```typescript
{
  substring_pattern: string;  // Regex pattern
  relative_path?: string;     // Optional: restrict to path
  restrict_search_to_code_files?: boolean;
  context_lines_before?: number;
  context_lines_after?: number;
}
```

### find_file (MCP)

Find files by name pattern.

**Parameters:**
```typescript
{
  file_mask: string;      // Filename pattern with wildcards
  relative_path: string;  // Directory to search in
}
```

---

## File Operations

### get_symbols_overview (MCP)

Get high-level overview of symbols in a file.

**Parameters:**
```typescript
{
  relative_path: string;
}
```

**Returns:** List of top-level symbols with metadata (name, kind, location).

---

## System Tools

### shell

Execute shell commands with sandbox protection.

**Parameters:**
```typescript
{
  command: string;
  cwd?: string;
}
```

**Security:**
- Default: Sandboxed mode (whitelist only)
- Toggle with `/sandbox` command
- See [Security Guide](../../architecture/shortcut-system.md#security) for details

**Whitelisted Commands (Sandbox Mode):**
- File operations: ls, cat, find, mkdir, touch, mv, cp
- Version control: git
- Build tools: npm, node, tsc
- Text processing: grep, head, tail, wc, sort, uniq, diff
- System: echo, pwd, which, whoami, date

---

## Common Patterns

### Pattern 1: Understanding a Function

```typescript
// 1. Get type information
await executeTool('get_type_information', {
  filePath: 'src/app.ts',
  symbolName: 'processUser'
});

// 2. Get call hierarchy
await executeTool('get_call_hierarchy', {
  filePath: 'src/app.ts',
  symbolName: 'processUser',
  direction: 'both'
});

// 3. Extract complete context
await executeTool('smart_context_extractor', {
  filePath: 'src/app.ts',
  symbolName: 'processUser'
});
```

### Pattern 2: Refactoring an Interface

```typescript
// 1. Find all implementations
const implementations = await executeTool('find_implementations', {
  filePath: 'src/interfaces/IService.ts',
  interfaceName: 'IService'
});

// 2. For each implementation, validate changes
for (const impl of implementations.metadata.implementations) {
  // Make changes...

  // Validate
  await executeTool('validate_code_changes', {
    files: [impl.file]
  });
}
```

### Pattern 3: Module Analysis

```typescript
// 1. Get dependency graph
await executeTool('get_dependency_graph', {
  module: 'src/services'
});

// 2. Find circular dependencies
// 3. Plan refactoring
```

---

## Error Handling

All tools return a consistent result format:

```typescript
interface ToolExecutionResult {
  success: boolean;
  output: string;
  metadata?: any;
}
```

**Success case:**
- `success: true`
- `output`: Human-readable message
- `metadata`: Structured result data

**Error case:**
- `success: false`
- `output`: Error message
- `metadata`: undefined

---

## Performance Tips

1. **Use Smart Context Extractor** instead of multiple separate calls
2. **Cache TypeScript analysis** results when possible
3. **Specify file paths** to limit search scope
4. **Use depth limits** to control recursion
5. **Validate incrementally** rather than entire project

---

## See Also

- [API Overview](../README.md)
- [Adding New Tools](../../development/adding-new-tools.md)
- [TypeScript Analyzer](../infrastructure/typescript-analyzer.md)
- [Tool System Architecture](../../architecture/tool-system.md)
