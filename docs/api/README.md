# API Documentation

Comprehensive API documentation for Codeh CLI internal components.

## 📚 Table of Contents

- [Tools API](./tools/README.md) - Code intelligence and manipulation tools
- [Core Services](./core/README.md) - Business logic and application services
- [Infrastructure](./infrastructure/README.md) - Low-level infrastructure components

## 🎯 Quick Reference

### Advanced Code Intelligence Tools

| Tool | Purpose | Key Use Case |
|------|---------|-------------|
| [get_type_information](./tools/get-type-information.md) | Get TypeScript type info | Understanding variable/function types |
| [get_call_hierarchy](./tools/get-call-hierarchy.md) | Analyze function calls | Finding who calls a function |
| [find_implementations](./tools/find-implementations.md) | Find interface implementations | Understanding polymorphism |
| [validate_code_changes](./tools/validate-code-changes.md) | Validate TypeScript code | Checking for errors after changes |
| [smart_context_extractor](./tools/smart-context-extractor.md) | Extract symbol context | Getting complete context for AI |
| [get_dependency_graph](./tools/get-dependency-graph.md) | Analyze module dependencies | Finding module relationships |

### Symbol Manipulation Tools

| Tool | Purpose |
|------|---------|
| [find_symbol](./tools/find-symbol.md) | Find symbols by name pattern |
| [replace_symbol_body](./tools/replace-symbol-body.md) | Replace symbol implementation |
| [rename_symbol](./tools/rename-symbol.md) | Rename symbols codebase-wide |
| [insert_after_symbol](./tools/insert-after-symbol.md) | Insert code after symbol |
| [insert_before_symbol](./tools/insert-before-symbol.md) | Insert code before symbol |
| [find_references](./tools/find-references.md) | Find all symbol references |

### Code Search Tools

| Tool | Purpose |
|------|---------|
| [symbol_search](./tools/symbol-search.md) | Search for symbols |
| [search_for_pattern](./tools/search-for-pattern.md) | Regex-based code search |
| [find_file](./tools/find-file.md) | Find files by pattern |

### File Operations

| Tool | Purpose |
|------|---------|
| [get_symbols_overview](./tools/get-symbols-overview.md) | Get file symbol overview |
| [replace_regex](./tools/replace-regex.md) | Regex-based text replacement |

### System Tools

| Tool | Purpose |
|------|---------|
| [shell](./tools/shell.md) | Execute shell commands (sandboxed) |

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────┐
│         Presentation Layer          │
│      (CLI Screens & Commands)       │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│          Core Layer                 │
│  ┌──────────────────────────────┐   │
│  │   Tools (Public API)         │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │   Application Services       │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │   Domain Models & Logic      │   │
│  └──────────────────────────────┘   │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│      Infrastructure Layer           │
│  - TypeScript Analyzer              │
│  - Shell Execution                  │
│  - API Clients                      │
│  - Logging & Monitoring             │
│  - Resilience (Circuit Breaker)     │
└─────────────────────────────────────┘
```

## 🔧 Usage Patterns

### 1. Type-Safe Parameter Validation

All tools use Zod schemas for runtime validation:

```typescript
import {GetTypeInfoArgsSchema, validateAndParse} from './schemas/ToolSchemas.js';

validateParameters(parameters: unknown): parameters is GetTypeInfoArgs {
  const result = validateAndParse(GetTypeInfoArgsSchema, parameters);
  if (!result.success) {
    console.error('Validation failed:', result.error);
    return false;
  }
  return true;
}
```

### 2. Error Handling

All tools return consistent result format:

```typescript
interface ToolExecutionResult {
  success: boolean;
  output: string;
  metadata?: any;
}

// Success case
return {
  success: true,
  output: 'Operation completed',
  metadata: { /* result data */ }
};

// Error case
return {
  success: false,
  output: 'Error: description'
};
```

### 3. Dependency Injection

Tools are registered in DI container:

```typescript
// source/core/di/setup.ts
const analyzer = container.resolve<TypeScriptSymbolAnalyzer>('TypeScriptSymbolAnalyzer');
registry.register(new GetTypeInformationTool(projectRoot, analyzer));
```

## 🔐 Security Features

### Sandboxed Shell Execution

The shell tool uses sandboxed execution by default:

- **Command whitelist** - Only safe commands allowed
- **Pattern detection** - Blocks dangerous patterns (rm -rf, curl|sh)
- **Command injection prevention** - Validates all inputs
- **Output limits** - 10MB max output size
- **Execution timeout** - 30 second max runtime

Toggle sandbox mode: Use `/sandbox` slash command

## 📊 Performance Considerations

### Type Analysis Caching

TypeScript analyzer caches results:

```typescript
// Invalidate cache when needed
analyzer.invalidateAll();
```

### Lazy Loading

Tools are instantiated on-demand through DI container.

### Error Resilience

Circuit breaker pattern prevents cascading failures.

## 🧪 Testing

All tools have comprehensive test coverage:

```bash
# Run tool tests
npm test

# Run specific tool test
npx ava test/tools/GetTypeInformationTool.test.ts
```

## 📖 Further Reading

- [Tool System Architecture](../architecture/tool-system.md)
- [Adding New Tools](../development/adding-new-tools.md)
- [TypeScript Analyzer](./infrastructure/typescript-analyzer.md)
- [Security Model](../architecture/security.md)

## 🤝 Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines on:
- Adding new tools
- Coding standards
- Testing requirements
- Pull request process
