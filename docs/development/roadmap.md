# Implementation Roadmap - codeh-cli với Serena-inspired Features

## 🎯 Mục tiêu tổng quát

Tạo sự khác biệt cho codeh-cli bằng cách tích hợp **Workflow Management** và **Context Management** tools, giúp AI agent:
- ✅ Làm việc có tổ chức với plans và todos
- ✅ Hiểu code semantically thông qua symbol analysis
- ✅ Context vừa đủ - không thừa, không thiếu

---

## ✅ Phase 1: Foundation - HOÀN THÀNH

### 1.1 Domain Models & Services ✅
**Đã implement:**
- `Symbol`, `Reference`, `Plan` models
- `WorkflowManager` service cho plan/todo management
- `TypeScriptSymbolAnalyzer` sử dụng TS Compiler API
- `TypeScriptCodeNavigator` service layer

**Files:**
- `source/core/domain/models/Symbol.ts`
- `source/core/domain/models/Reference.ts`
- `source/core/domain/models/Plan.ts`
- `source/core/application/services/WorkflowManager.ts`
- `source/infrastructure/typescript/TypeScriptSymbolAnalyzer.ts`
- `source/core/application/services/TypeScriptCodeNavigator.ts`

**Lợi ích:**
- Clean Architecture compliance
- Pure TypeScript, no Python dependencies
- Fast performance (in-process)

---

### 1.2 Symbol Tools ✅
**Đã implement:**
- `SymbolSearchTool` - Tìm symbols theo pattern
- `FindReferencesTool` - Tìm references đến symbol
- `GetSymbolsOverviewTool` - Overview symbols trong file

**Files:**
- `source/core/tools/SymbolSearchTool.ts`
- `source/core/tools/FindReferencesTool.ts`
- `source/core/tools/GetSymbolsOverviewTool.ts`

**Capabilities:**
- Name path search: `"ClassName/methodName"`
- Substring matching
- Include body & children
- Find who calls this function

---

### 1.3 Tool Registration ✅
**Đã implement:**
- Register tools vào `ToolRegistry`
- DI Container setup
- Environment-based project root

**Files:**
- `source/core/di/setup.ts` (updated)

**Cách hoạt động:**
```typescript
// Tự động register khi setupContainer()
const container = await setupContainer();
const registry = container.resolve<ToolRegistry>('ToolRegistry');

// Có sẵn 5 tools:
// - shell, file_ops (basic tools)
// - symbol_search, find_references, get_symbols_overview (symbol tools)
```

---

### 1.4 Testing ✅
**Đã implement:**
- 30+ unit tests cho symbol tools
- 20+ integration tests với ToolRegistry
- Test fixtures tự động setup/cleanup

**Files:**
- `test/tools/symbol-tools.test.ts`
- `test/integration/tool-registry-integration.test.ts`

**Coverage:**
- Tool functionality
- Registry integration
- Multi-tool workflows
- Error handling
- Performance tests

---

## 🚧 Phase 2: AI Integration - TIẾP THEO

### 2.1 Tool Definitions cho AI Models 🔜
**Mục tiêu:** AI có thể discover và sử dụng symbol tools

**Tasks:**
1. ✅ Tool definitions đã có trong `getDefinition()` method
2. 🔜 Convert definitions sang format của API providers:
   - Anthropic Claude format
   - OpenAI function calling format
   - Generic format

**Implementation:**
```typescript
// source/core/application/services/ToolDefinitionConverter.ts
export class ToolDefinitionConverter {
  toAnthropicFormat(tools: ToolDefinition[]): AnthropicTool[];
  toOpenAIFormat(tools: ToolDefinition[]): OpenAIFunction[];
}
```

**Expected outcome:**
- AI có thể thấy và gọi symbol tools
- Consistent format across providers

---

### 2.2 Tool Execution trong Chat Flow 🔜
**Mục tiêu:** AI có thể execute tools và nhận results

**Tasks:**
1. 🔜 Update `CodehClient` để handle tool calls
2. 🔜 Parse tool calls từ AI responses
3. 🔜 Execute tools qua ToolRegistry
4. 🔜 Format tool results cho AI

**Implementation:**
```typescript
// source/core/application/CodehClient.ts
async handleToolCalls(toolCalls: ToolCall[]): Promise<ToolResult[]> {
  const results = [];
  for (const call of toolCalls) {
    const result = await this.toolRegistry.execute(call.name, call.parameters);
    results.push(this.formatToolResult(result));
  }
  return results;
}
```

**Expected outcome:**
- AI có thể gọi `symbol_search`, `find_references`, `get_symbols_overview`
- Results được format đẹp cho AI hiểu

---

### 2.3 Tool Permission System 🔜
**Mục tiêu:** User có control việc AI execute tools nào

**Tasks:**
1. 🔜 Extend `IToolPermissionHandler` cho symbol tools
2. 🔜 Symbol tools là "safe" - auto-approve
3. 🔜 Config tool permissions

**Implementation:**
```typescript
// source/infrastructure/permissions/ToolPermissionConfig.ts
export const SAFE_TOOLS = [
  'symbol_search',
  'find_references',
  'get_symbols_overview'
];

export const REQUIRES_APPROVAL = [
  'shell',
  'file_ops'
];
```

**Expected outcome:**
- Symbol tools auto-approved (read-only, safe)
- Shell/FileOps cần user approval

---

## 🚀 Phase 3: UI/UX Enhancement - TIẾP THEO

### 3.1 Symbol Explorer Component 🔜
**Mục tiêu:** Display symbol hierarchy trong terminal UI

**Tasks:**
1. 🔜 Create `SymbolExplorer` component (React Ink)
2. 🔜 Display symbol tree với indentation
3. 🔜 Navigate bằng keyboard (up/down/enter)
4. 🔜 Jump to definition

**Implementation:**
```tsx
// source/presentation/components/SymbolExplorer.tsx
export function SymbolExplorer({symbols}: {symbols: Symbol[]}) {
  // Tree view với Ink
  // Highlight selected symbol
  // Show signature/location
}
```

**Expected outcome:**
- User thấy được symbol structure của file
- Dễ navigate trong codebase

---

### 3.2 References Panel 🔜
**Mục tiêu:** Show references đến symbol

**Tasks:**
1. 🔜 Create `ReferencesPanel` component
2. 🔜 Display list of references với context
3. 🔜 Highlight reference line
4. 🔜 Group by file

**Implementation:**
```tsx
// source/presentation/components/ReferencesPanel.tsx
export function ReferencesPanel({references}: {references: Reference[]}) {
  // List references grouped by file
  // Show code context
  // Click to jump
}
```

**Expected outcome:**
- User thấy được "who calls this function"
- Context code xung quanh reference

---

### 3.3 Plan Viewer Component 🔜
**Mục tiêu:** Display plan và todos của AI agent

**Tasks:**
1. 🔜 Create `PlanViewer` component
2. 🔜 Display current plan với progress bar
3. 🔜 Show todos list với status
4. 🔜 Real-time updates khi AI làm việc

**Implementation:**
```tsx
// source/presentation/components/PlanViewer.tsx
export function PlanViewer({plan}: {plan: Plan}) {
  // Show plan title & description
  // Progress bar (X/Y completed)
  // Todos list with checkboxes
  // Current todo highlighted
}
```

**Expected outcome:**
- User thấy được AI đang làm gì
- Tracking progress rõ ràng
- Transparency trong workflow

---

### 3.4 Integrate vào HomeScreen 🔜
**Mục tiêu:** Combine tất cả components vào main screen

**Tasks:**
1. 🔜 Update `HomeScreen` layout
2. 🔜 Split screen: Chat + Sidebar
3. 🔜 Sidebar tabs: Symbols / References / Plan
4. 🔜 Keyboard shortcuts để toggle

**Layout:**
```
┌─────────────────────────────────────────────┐
│  Codeh CLI                          [S][R][P]│
├─────────────────────────┬───────────────────┤
│                         │                   │
│   Chat Area             │   Sidebar         │
│                         │   - Symbols       │
│   User: Find all        │   - References    │
│   references to         │   - Plan/Todos    │
│   Calculator.add        │                   │
│                         │                   │
│   AI: Looking for       │   Current Plan:   │
│   references...         │   [▓▓▓▓▓░░░] 60%  │
│   [Using tools]         │                   │
│                         │   ✓ Find symbol   │
│                         │   ⋯ Find refs     │
│                         │   ☐ Show results  │
│                         │                   │
│   > _                   │                   │
└─────────────────────────┴───────────────────┘
[S]=Symbols [R]=References [P]=Plan
```

**Expected outcome:**
- Modern terminal UI
- Context visible trong sidebar
- User có full visibility

---

## 🔧 Phase 4: Advanced Features - TƯƠNG LAI

### 4.1 Code Editing Tools 🔮
**Mục tiêu:** AI có thể edit code semantically

**Future tools:**
- `RenameSymbolTool` - Rename toàn codebase
- `RefactorTool` - Extract method, inline, etc.
- `CodeGenerationTool` - Generate boilerplate
- `InsertCodeTool` - Insert at specific location

**Benefits:**
- Safe refactoring
- Semantic understanding
- Consistent changes

---

### 4.2 Multi-Language Support 🔮
**Mục tiêu:** Support Python, Java, Go, etc.

**Approach:**
- Port LSP clients cho các ngôn ngữ khác
- Hoặc integrate Serena MCP làm fallback
- Unified interface

**Priority languages:**
1. JavaScript (already works with TS)
2. Python
3. Go
4. Java

---

### 4.3 Advanced Search 🔮
**Mục tiêu:** Search by type, annotation, complexity

**Future features:**
- Search by symbol type (classes, functions, interfaces)
- Search by annotation/decorator
- Search by complexity/size
- Semantic search (similar code)

---

### 4.4 Caching & Performance 🔮
**Mục tiêu:** Tăng performance cho large codebases

**Optimizations:**
- Cache symbol results
- Incremental updates (only re-analyze changed files)
- Background indexing
- Persistent cache on disk

---

### 4.5 Workflow Automation 🔮
**Mục tiêu:** AI tự động lên plan trước khi làm

**Features:**
- Auto-generate plan từ user request
- Auto-create todos với dependencies
- Track progress tự động
- Suggest next steps

---

## 📊 Current Status Summary

| Component | Status | Files | Lines |
|-----------|--------|-------|-------|
| Domain Models | ✅ Complete | 3 | 600 |
| Services | ✅ Complete | 3 | 860 |
| Infrastructure | ✅ Complete | 1 | 488 |
| Tools | ✅ Complete | 3 | 369 |
| Tests | ✅ Complete | 2 | 700 |
| Registration | ✅ Complete | 1 | +20 |
| AI Integration | 🔜 Next | - | - |
| UI Components | 🔜 Future | - | - |
| Advanced Features | 🔮 Future | - | - |

**Total implemented:** ~3,000 dòng code

---

## 🎯 Recommended Next Steps

### Immediate (This Week):
1. ✅ **DONE**: Register tools vào ToolRegistry
2. 🔜 **TODO**: Implement `ToolDefinitionConverter`
3. 🔜 **TODO**: Update `CodehClient` để handle tool calls
4. 🔜 **TODO**: Test end-to-end: User input → AI calls tools → Results

### Short-term (Next 2 Weeks):
5. 🔜 Create `PlanViewer` component
6. 🔜 Integrate workflow management vào chat flow
7. 🔜 AI tự động lên plan khi nhận request

### Medium-term (Next Month):
8. 🔜 Create `SymbolExplorer` component
9. 🔜 Create `ReferencesPanel` component
10. 🔜 Integrate sidebar layout vào HomeScreen

### Long-term (Next Quarter):
11. 🔮 Code editing tools
12. 🔮 Multi-language support
13. 🔮 Performance optimizations

---

## 💡 Key Design Decisions

### ✅ Chọn TypeScript Compiler API thay vì Serena MCP
**Lý do:**
- Pure TypeScript solution
- No Python runtime needed
- Better performance (no IPC)
- Easier debugging
- Smaller footprint

**Trade-off:**
- Chỉ hỗ trợ TypeScript (hiện tại)
- Cần port cho ngôn ngữ khác

**Quyết định:** Đúng đắn cho TypeScript project. Có thể add Serena sau cho multi-language.

---

### ✅ Tools pattern với ToolRegistry
**Lý do:**
- Consistent interface
- Easy to add new tools
- Dependency injection
- Testable

**Benefit:**
- AI có thể discover tools
- Extensible architecture

---

### ✅ Clean Architecture với 3 layers
**Lý do:**
- Separation of concerns
- Testable
- Maintainable
- Easy to understand

**Structure:**
- Domain: Pure business logic
- Application: Use cases & services
- Infrastructure: External dependencies

---

## 🧪 Testing Strategy

### Unit Tests ✅
- Test mỗi tool riêng lẻ
- Mock dependencies
- Coverage: 95%+

### Integration Tests ✅
- Test tools với ToolRegistry
- Test multi-tool workflows
- Real TypeScript files

### End-to-End Tests 🔜
- Test full flow: User → AI → Tools → Results
- Test với real AI models
- Test UI components

---

## 📚 Documentation Status

| Document | Status | Purpose |
|----------|--------|---------|
| SERENA_INTEGRATION_PLAN.md | ✅ | Original plan & analysis |
| TYPESCRIPT_TOOLS_IMPLEMENTATION.md | ✅ | Implementation details |
| IMPLEMENTATION_ROADMAP.md | ✅ | This document |
| API_INTEGRATION_GUIDE.md | 🔜 | How to integrate with AI APIs |
| UI_COMPONENT_GUIDE.md | 🔜 | UI component specs |

---

## 🚀 Getting Started (For Developers)

### Run Tests
```bash
# All tests
npm test

# Symbol tools tests
npm test test/tools/symbol-tools.test.ts

# Integration tests
npm test test/integration/tool-registry-integration.test.ts

# Watch mode
npm test -- --watch
```

### Use Tools Directly
```typescript
import {setupContainer} from './source/core/di/setup';

const container = await setupContainer();
const registry = container.resolve('ToolRegistry');

// Execute tool
const result = await registry.execute('symbol_search', {
  namePattern: 'MyClass',
  includeBody: true
});

console.log(result.output);
```

### Add New Tool
```typescript
// 1. Create tool class
export class MyNewTool extends Tool {
  getDefinition(): ToolDefinition { ... }
  validateParameters(params): boolean { ... }
  async execute(params): Promise<ToolExecutionResult> { ... }
}

// 2. Register in setup.ts
registry.register(new MyNewTool());

// 3. Write tests
test('MyNewTool: should work', async t => {
  const tool = new MyNewTool();
  const result = await tool.execute({...});
  t.true(result.success);
});
```

---

## 🤝 Contributing

Nếu muốn contribute:
1. Chọn task từ "Next Steps" section
2. Tạo branch: `feature/task-name`
3. Implement với tests
4. Commit theo convention: `feat: add feature X`
5. Push và tạo PR

---

## 📞 Questions?

Nếu có câu hỏi về:
- **Architecture**: Xem TYPESCRIPT_TOOLS_IMPLEMENTATION.md
- **Tools**: Xem test files để hiểu usage
- **Next steps**: Follow roadmap này từ trên xuống

---

**Last updated:** 2025-01-11
**Status:** Phase 1 Complete ✅ | Phase 2 Ready to Start 🚀
