## TypeScript Symbol Tools Implementation

### Tổng quan
Thay vì sử dụng Serena qua MCP (Python), tôi đã implement **native TypeScript tools** sử dụng **TypeScript Compiler API** trực tiếp.

### Lợi ích so với Serena MCP

✅ **Pure TypeScript** - Không cần Python runtime
✅ **No Process Spawning** - Không spawn MCP server process
✅ **Better Performance** - Không có IPC overhead
✅ **Native Integration** - Dùng chính TS Compiler của project
✅ **Easier Debugging** - All code trong cùng 1 runtime
✅ **Smaller Footprint** - Không cần thêm dependencies

### Architecture

```
┌────────────────────────────────────────────┐
│         codeh-cli (TypeScript)             │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │  Presentation Layer                  │ │
│  │  - Display symbols, references       │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │  Core Layer - Tools                  │ │
│  │  - SymbolSearchTool                  │ │
│  │  - FindReferencesTool                │ │
│  │  - GetSymbolsOverviewTool            │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │  Core Layer - Services               │ │
│  │  - TypeScriptCodeNavigator           │ │
│  │  - WorkflowManager                   │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │  Infrastructure Layer                │ │
│  │  - TypeScriptSymbolAnalyzer          │ │
│  │    (uses TS Compiler API)            │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │  TypeScript Compiler API             │ │
│  │  - ts.createProgram()                │ │
│  │  - TypeChecker                       │ │
│  │  - Language Service                  │ │
│  └──────────────────────────────────────┘ │
└────────────────────────────────────────────┘
```

### Components

#### 1. Infrastructure Layer

**TypeScriptSymbolAnalyzer** (`source/infrastructure/typescript/TypeScriptSymbolAnalyzer.ts`)
- Sử dụng TypeScript Compiler API
- Parse tsconfig.json
- Create TS Program và TypeChecker
- Core methods:
  - `getSymbolsOverview(filePath)` - Lấy top-level symbols
  - `findSymbol(namePattern, options)` - Tìm symbols theo pattern
  - `findReferences(namePath, filePath)` - Tìm references đến symbol
  - `getSymbolHierarchy(filePath)` - Lấy cây symbols

#### 2. Core Layer - Services

**TypeScriptCodeNavigator** (`source/core/application/services/TypeScriptCodeNavigator.ts`)
- Service layer trên TypeScriptSymbolAnalyzer
- Cung cấp high-level API
- Methods:
  - `getSymbolsOverview()`
  - `findSymbol()`, `findClasses()`, `findFunctions()`, `findMethodsInClass()`
  - `findReferences()`, `findReferencesByPath()`
  - `getDefinition()`, `getSymbolHierarchy()`

**WorkflowManager** (`source/core/application/services/WorkflowManager.ts`)
- Quản lý plans và todos
- Track progress
- Export/import workflow state

#### 3. Core Layer - Tools

**SymbolSearchTool** (`source/core/tools/SymbolSearchTool.ts`)
- Tool để search symbols theo pattern
- Hỗ trợ name path: `"ClassName/methodName"`
- Substring matching
- Include body và children

**FindReferencesTool** (`source/core/tools/FindReferencesTool.ts`)
- Tìm tất cả references đến symbol
- Show code context xung quanh reference
- Answer câu hỏi: "Ai đang gọi function này?"

**GetSymbolsOverviewTool** (`source/core/tools/GetSymbolsOverviewTool.ts`)
- Lấy overview các top-level symbols trong file
- Group theo kind (Class, Function, Interface, etc.)
- Show signatures và locations

#### 4. Domain Models

**Symbol** (`source/core/domain/models/Symbol.ts`)
- Represent code symbol (class, function, method, etc.)
- 26 SymbolKind theo LSP spec
- Methods: `isContainer()`, `isCallable()`, `getSignature()`, `findChild()`

**Reference** (`source/core/domain/models/Reference.ts`)
- Represent reference đến symbol
- Chứa context code xung quanh

**Plan** (`source/core/domain/models/Plan.ts`)
- Quản lý plan với todos
- Track progress, status, priority

### Testing

**Test suite** (`test/tools/symbol-tools.test.ts`)
- 30+ test cases cho các tools
- Test fixtures với real TypeScript code
- Coverage:
  - Get symbols overview
  - Symbol search (exact, substring, name path)
  - Find references
  - Include body, children
  - Error handling
  - Integration tests

### Usage Examples

#### 1. Get Symbols Overview
```typescript
const navigator = new TypeScriptCodeNavigator('/project/root');
const symbols = await navigator.getSymbolsOverview('source/services/UserService.ts');

// Output: Array of top-level symbols (classes, functions, interfaces)
```

#### 2. Search for Symbol
```typescript
const symbols = await navigator.findSymbol('UserService/createUser', {
  includeBody: true,
  depth: 0
});

// Output: Found UserService.createUser method with source code
```

#### 3. Find References
```typescript
const refs = await navigator.findReferences(symbol);

// Output: All places where this symbol is used
// - File path
// - Line number
// - Code context
```

#### 4. Using Tools
```typescript
const tool = new SymbolSearchTool('/project/root');
const result = await tool.execute({
  namePattern: 'Calculator/add',
  includeBody: true
});

console.log(result.output); // Formatted output
console.log(result.metadata); // Structured data
```

### Integration with Workflow

Tools có thể integrate với WorkflowManager:

```typescript
const workflow = new WorkflowManager();

// Create plan
const plan = workflow.createPlan(
  'Refactor UserService',
  'Refactor UserService to use new authentication',
  [],
  { complexity: 'moderate' }
);

// Add todos
workflow.addTodo('Find all references to UserService');
workflow.addTodo('Update authentication logic');
workflow.addTodo('Run tests');

// Track progress
const progress = workflow.getProgress();
console.log(progress.currentPlan?.getSummary());
```

### Khác biệt so với Serena

| Feature | Serena (via MCP) | TypeScript Tools (Native) |
|---------|------------------|--------------------------|
| Runtime | Python | TypeScript/Node.js |
| Performance | Process spawn + IPC | In-process, fast |
| Language Support | 30+ languages via LSP | TypeScript only |
| Setup | Install serena + uv | No extra setup |
| Debugging | Multi-process | Single process |
| Dependencies | Python, LSP servers | Just TypeScript |

### Khi nào dùng gì?

**Dùng TypeScript Tools (hiện tại)**:
- ✅ Project là TypeScript/JavaScript
- ✅ Cần performance tốt
- ✅ Muốn đơn giản, pure TS solution

**Dùng Serena MCP** (nếu cần trong tương lai):
- ✅ Cần hỗ trợ nhiều ngôn ngữ (Python, Java, Go, Rust, etc.)
- ✅ Đã có Serena setup sẵn
- ✅ Cần advanced LSP features

### Future Enhancements

1. **Add More Languages**: Port LSP clients cho Python, Go, etc.
2. **Code Editing**: Implement rename, refactor tools
3. **Advanced Search**: Search by symbol type, annotations, etc.
4. **Caching**: Cache symbol results để tăng performance
5. **Incremental Updates**: Chỉ re-analyze changed files

### Running Tests

```bash
# Run all tests
npm test

# Run only symbol tools tests
npm test -- test/tools/symbol-tools.test.ts

# Watch mode
npm test -- --watch
```

### Performance Notes

TypeScriptSymbolAnalyzer creates a TS Program once và reuses nó:
- First call: ~1-2s (parse tsconfig, create program)
- Subsequent calls: <100ms (cache program)

Để optimize:
- Reuse navigator instance
- Lazy load analyzer
- Cache symbol results

### Troubleshooting

**Issue: "Cannot find tsconfig.json"**
- Solution: Pass tsConfigPath explicitly hoặc đảm bảo có tsconfig.json trong project root

**Issue: "No symbols found"**
- Check file path là relative to project root
- Verify file exists và có valid TypeScript syntax
- Check tsconfig.json includes the file

**Issue: "References not found"**
- TypeScript Language Service có thể cần thêm time để index
- Verify symbol name path chính xác
- Check if symbol is actually used in code
