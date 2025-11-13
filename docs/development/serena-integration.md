# Serena Integration Plan for codeh-cli

## Mục tiêu tích hợp

Tích hợp các công cụ từ [Serena](https://github.com/oraios/serena) vào codeh-cli để tạo sự khác biệt:

1. **Workflow Management**: Plan, todos, tracking - đảm bảo AI agent hoạt động có tổ chức
2. **Context Management**: LSP-based semantic search/edit - tối ưu hóa context, không thừa không thiếu

## Phân tích Serena

### Kiến trúc Serena
- **Ngôn ngữ**: Python
- **Core**: Language Server Protocol (LSP) integration qua solidlsp
- **MCP Server**: Cung cấp tools qua Model Context Protocol
- **Hỗ trợ**: 30+ ngôn ngữ lập trình (bao gồm TypeScript)

### Các Tools quan trọng từ Serena

#### 1. Workflow Tools
- `CheckOnboardingPerformedTool`: Kiểm tra project đã onboard chưa
- `OnboardingTool`: Thực hiện onboarding project
- `ThinkAboutCollectedInformationTool`: Suy nghĩ về thông tin đã thu thập
- `ThinkAboutTaskAdherenceTool`: Kiểm tra đang đi đúng hướng không
- `ThinkAboutWhetherYouAreDoneTool`: Kiểm tra đã hoàn thành chưa
- `SummarizeChangesTool`: Tóm tắt thay đổi

#### 2. Context Management Tools (LSP-based)
- `GetSymbolsOverviewTool`: Xem overview symbols trong file (classes, functions, methods)
- `FindSymbolTool`: Tìm symbols theo name_path với pattern matching phức tạp
- `FindReferencingSymbolsTool`: Tìm nơi sử dụng một symbol (who calls this function?)
- `ReplaceSymbolBodyTool`: Thay thế body của symbol
- `InsertAfterSymbolTool`: Thêm code sau symbol
- `InsertBeforeSymbolTool`: Thêm code trước symbol
- `RenameSymbolTool`: Rename symbol toàn codebase

#### 3. File Tools
- `SearchForPatternTool`: Search pattern với context lines
- `ListDirTool`: List directory
- `FindFileTool`: Tìm file theo pattern

#### 4. Memory Tools
- `WriteMemoryTool`: Lưu thông tin về project
- `ReadMemoryTool`: Đọc thông tin đã lưu
- `ListMemoriesTool`: Liệt kê memories

## Kiến trúc hiện tại của codeh-cli

### Clean Architecture Layers
```
┌─────────────────────────────────────────┐
│         CLI (Presentation)              │
│  Screens, Components, Hooks             │
├─────────────────────────────────────────┤
│      Core (Application/Domain)          │
│  Use Cases, Business Logic, Models      │
├─────────────────────────────────────────┤
│      Infrastructure (Adapters)          │
│  API Clients, Config, File System       │
└─────────────────────────────────────────┘
```

### Điểm mạnh hiện có
- ✅ MCPClient đã có sẵn: `/source/infrastructure/integrations/mcp/MCPClient.ts`
- ✅ Tool system: `ToolRegistry`, `Tool` base class
- ✅ Dependency Injection: `Container` pattern
- ✅ TypeScript, React Ink UI

## Thiết kế tích hợp

### Phương án: Sử dụng Serena MCP Server

**Ưu điểm:**
- Không cần rewrite LSP logic
- Tận dụng serena đã được test kỹ
- Cập nhật serena dễ dàng
- Hỗ trợ đầy đủ 30+ ngôn ngữ

**Kiến trúc tích hợp:**

```
┌────────────────────────────────────────────┐
│         codeh-cli (TypeScript)             │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │  Presentation Layer                  │ │
│  │  - HomeScreen (hiển thị plan/todos)  │ │
│  │  - SymbolExplorer (hiển thị symbols) │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │  Core Layer                          │ │
│  │  - WorkflowManager (plan, todos)     │ │
│  │  - CodeNavigator (tìm symbols)       │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │  Infrastructure Layer                │ │
│  │  - SerenaMCPAdapter                  │ │
│  │  - MCPClient (đã có)                 │ │
│  └──────────────────────────────────────┘ │
│                 │                          │
└─────────────────┼──────────────────────────┘
                  │ MCP Protocol
                  ▼
┌────────────────────────────────────────────┐
│      Serena MCP Server (Python)            │
│  - LSP Integration                         │
│  - Symbol Tools                            │
│  - File Tools                              │
│  - Memory Tools                            │
└────────────────────────────────────────────┘
```

### Implementation Plan

#### Phase 1: Infrastructure Layer
1. **SerenaMCPAdapter** (`source/infrastructure/integrations/mcp/SerenaMCPAdapter.ts`)
   - Connect to Serena MCP server
   - Wrapper methods cho serena tools
   - Error handling & reconnection

2. **LSPToolExecutor** (`source/infrastructure/lsp/LSPToolExecutor.ts`)
   - Execute LSP-based tools qua SerenaMCPAdapter
   - Type-safe interfaces

#### Phase 2: Core Layer - Context Management
1. **CodeNavigator** (`source/core/application/services/CodeNavigator.ts`)
   - `getSymbolsOverview(filePath): Promise<Symbol[]>`
   - `findSymbol(namePattern, options): Promise<Symbol[]>`
   - `findReferences(symbol): Promise<Reference[]>`
   - `getSymbolDefinition(symbol): Promise<Location>`

2. **CodeEditor** (`source/core/application/services/CodeEditor.ts`)
   - `replaceSymbolBody(symbol, newBody): Promise<void>`
   - `insertAfterSymbol(symbol, code): Promise<void>`
   - `renameSymbol(oldName, newName): Promise<void>`

#### Phase 3: Core Layer - Workflow Management
1. **WorkflowManager** (`source/core/application/services/WorkflowManager.ts`)
   - `createPlan(task): Plan`
   - `addTodo(todo): void`
   - `markTodoCompleted(id): void`
   - `getCurrentProgress(): Progress`

2. **Domain Models** (`source/core/domain/models/`)
   - `Plan.ts`: Plan model
   - `Task.ts`: Task model (đã có Todo.ts)
   - `Symbol.ts`: Symbol model (LSP symbol)
   - `Reference.ts`: Reference model

#### Phase 4: Tools Integration
1. **LSP Tools** (`source/core/tools/`)
   - `SymbolSearch.ts`: extends `Tool`
   - `SymbolReferences.ts`: extends `Tool`
   - `CodeNavigation.ts`: extends `Tool`

2. **Workflow Tools** (`source/core/tools/`)
   - `PlanManager.ts`: extends `Tool`
   - `TaskTracker.ts`: extends `Tool`

3. **Register vào ToolRegistry**

#### Phase 5: Presentation Layer
1. **SymbolExplorer Component**
   - Display symbol hierarchy
   - Jump to definition
   - Show references

2. **PlanViewer Component**
   - Display plan
   - Show todos with progress
   - Track completion

3. **Update HomeScreen**
   - Integrate SymbolExplorer
   - Integrate PlanViewer

#### Phase 6: Testing & Documentation
1. Unit tests cho các tools mới
2. Integration tests với Serena MCP
3. Update documentation
4. Create examples

## Công nghệ cần thiết

### Dependencies mới
```json
{
  "devDependencies": {
    "@types/node": "^20.0.0"
  }
}
```

### Serena MCP Server Setup
```bash
# Install serena via uv
uvx --from git+https://github.com/oraios/serena serena start-mcp-server --help

# Config trong .mcp.json
{
  "mcpServers": {
    "serena": {
      "command": "uvx",
      "args": [
        "--from",
        "git+https://github.com/oraios/serena",
        "serena",
        "start-mcp-server",
        "--project-root",
        "."
      ]
    }
  }
}
```

## Lợi ích

### 1. Workflow Management
- ✅ AI agent luôn lên plan trước khi làm
- ✅ Tracking progress rõ ràng
- ✅ Không bỏ sót tasks
- ✅ User có visibility vào quá trình làm việc

### 2. Context Management (LSP-based)
- ✅ **Không cần đọc toàn bộ file** - chỉ đọc symbols cần thiết
- ✅ **Jump to definition** - tìm định nghĩa function/class nhanh
- ✅ **Find references** - biết ai đang dùng function này
- ✅ **Semantic search** - tìm kiếm theo ý nghĩa code, không chỉ text
- ✅ **Safe refactoring** - rename symbol toàn codebase
- ✅ **Context vừa đủ** - +5 lines trước/sau khi cần

### 3. Sự khác biệt so với các AI CLI khác
- 🎯 **Efficient context usage** - tiết kiệm tokens
- 🎯 **Better code understanding** - hiểu structure thay vì đọc text
- 🎯 **Organized workflow** - có kế hoạch rõ ràng
- 🎯 **Multi-language support** - 30+ ngôn ngữ qua LSP

## Next Steps

1. ✅ Phân tích serena (DONE)
2. ✅ Thiết kế kiến trúc (DONE)
3. ⏳ Implement SerenaMCPAdapter
4. ⏳ Implement Core services
5. ⏳ Create Tools
6. ⏳ Update UI
7. ⏳ Testing
8. ⏳ Documentation

## Tham khảo
- Serena repo: https://github.com/oraios/serena
- Serena docs: https://oraios.github.io/serena/
- LSP specification: https://microsoft.github.io/language-server-protocol/
- MCP specification: https://modelcontextprotocol.io/
