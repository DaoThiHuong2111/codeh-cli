# Top Unused Exports by Impact

## 🔴 CRITICAL (Remove Immediately - Safe)

### 1. Error Type Guards (10 items) - CodehErrors.ts
**Why unused**: Never called for runtime type checking
**Risk**: None
**Action**: Remove entire collection of type guards

```
isCodehError
isToolExecutionError
isApiClientError
isConfigurationError
isSymbolNotFoundError
isFileOperationError
isValidationError
isSecurityError
isRateLimitError
isTimeoutError
```

### 2. ModelRegistry - ModelInfo.ts
**Why unused**: Class never instantiated
**Risk**: None - appears abandoned
**Action**: Delete class entirely
**Impact**: ~15 lines removed

```typescript
export class ModelRegistry {
  private static models: Record<string, ModelInfo> = {};
  // No hardcoded models - all models come from user configuration
  static get(modelName: string): ModelInfo | undefined { ... }
  static register(modelName: string, info: ModelInfo): void { ... }
  static getAll(): Record<string, ModelInfo> { ... }
}
```

### 3. HttpClient - HttpClient.ts
**Why unused**: All API calls go through ApiClientFactory
**Risk**: None - ApiClientFactory is the standard
**Action**: Remove from exports or delete class
**Impact**: ~230 lines - Contains debug console.log statements
**Note**: Heavy debugging code that should be cleaned up

### 4. Logging Utilities (6 items) - Logger.ts
**Why unused**: Never called anywhere
**Risk**: None
**Action**: Delete all 6 functions
**Impact**: ~50 lines removed

```
generateRequestId
NullLogger (class)
createLogger
withLogging
withLoggingSync
cleanupOldLogs
```

### 5. DI Factory Functions (3 items)
**Why unused**: Never imported or called
**Risk**: None
**Action**: Consolidate or remove
**Impact**: ~20 lines

```
createContainer (in setup.ts) - Empty factory
createContainer (in setupLazy.ts) - Duplicate
setupContainerWithLazyLoading (in setupLazy.ts) - Redundant
```

---

## 🟠 MEDIUM (Review Before Removal)

### 6. Use Case Classes (6 items) - application/usecases/
**Why potentially unused**: Classes exported but never instantiated
**Risk**: Medium - May be part of abandoned DDD pattern
**Action**: Review before removal
**Classes**:
- ExecuteTool
- LoadSession
- ManageHistory
- ProcessUserInput
- SaveSession
- StreamResponse

### 7. Navigation Services (2 items)
**Why potentially unused**: Alternative implementations not integrated
**Risk**: Medium - Possible hidden dependencies
**Action**: Review usage before removal
**Services**:
- CodeNavigator (service)
- TypeScriptCodeNavigator (service)

### 8. A2AServer - integrations/a2a/
**Why unused**: Integration feature never instantiated
**Risk**: Low-Medium - Incomplete feature
**Action**: Remove if not in roadmap
**Impact**: ~50 lines

---

## 🟡 LOW PRIORITY (Utilities & Types)

### 9. Presentation Utility Functions (18+ items)
**Why unused**: Utility functions never called from components
**Risk**: Low - Isolated functions
**Action**: Can be removed or consolidated

**Categories**:
- **Color/Syntax Utils** (4): getProviderColor, getProviderIcon, getSyntaxColor, getStreamingCursorFrame
- **Code Formatting** (3): highlightCode, isLanguageSupported, getSupportedLanguages
- **Text Utils** (4): truncateText, padText, stripAnsi, calculateLineCount
- **Text Parsing** (3): parseInlineTokens, hasInlineMarkdown, stripInlineMarkdown
- **Markdown** (1): parseMarkdown
- **Storage** (2): listHistoryFiles, getHistoryFileInfo

### 10. Unused Type Definitions (13+ items)
**Why unused**: Types exported but never imported
**Risk**: Low - Can be removed safely
**Action**: Safe to remove

**Types**:
- ViewModel
- ConversationViewModel
- ExecutionResult
- UseHistoryOptions
- UseHistoryReturn
- StreamState
- StreamingOptions
- StreamControl
- NavigationResult
- UseConfigWizardReturn
- UseHomeLogicReturn

### 11. Other Unused Items
- RetryPresets (config object)
- CircuitBreakerPresets (config object)
- globalSandboxModeManager (singleton)
- Tool schemas (GetCallHierarchyArgsSchema, DependencyGraphArgsSchema)
- formatDuration (utility function)

---

## Removal Impact Summary

| Category | Count | Risk | LOC | Priority |
|----------|-------|------|-----|----------|
| Error Type Guards | 10 | None | ~30 | 🔴 |
| DI/Factory | 3 | None | ~20 | 🔴 |
| HTTP Client | 1 | None | 230 | 🔴 |
| Logging Utils | 6 | None | ~50 | 🔴 |
| ModelRegistry | 1 | None | ~15 | 🔴 |
| Use Cases | 6 | Medium | ~200 | 🟠 |
| Navigation Services | 2 | Medium | ~150 | 🟠 |
| A2AServer | 1 | Low-Medium | ~50 | 🟠 |
| Presentation Utils | 18+ | Low | ~300 | 🟡 |
| Type Definitions | 13+ | Low | ~50 | 🟡 |
| **TOTAL** | **66** | - | ~1,095 | - |

**Estimated total lines of code that could be safely removed: 500-600 lines**

---

## Quick Removal Checklist

### Phase 1: Zero-Risk Removals (30 mins)
- [ ] Remove all 10 error type guards
- [ ] Remove logging utilities (6 functions)
- [ ] Remove ModelRegistry
- [ ] Remove createContainer factories (3)
- [ ] Remove RetryPresets & CircuitBreakerPresets

### Phase 2: Safe Removals (1-2 hours)
- [ ] Remove HttpClient class
- [ ] Remove unused CLI hooks (3)
- [ ] Remove unused CLI types (3)
- [ ] Remove globalSandboxModeManager
- [ ] Remove tool schemas

### Phase 3: Review & Remove (2-4 hours)
- [ ] Review navigation services
- [ ] Review use case classes
- [ ] Review A2AServer
- [ ] Remove presentation utilities
- [ ] Remove unused types

### Phase 4: Consolidation (4+ hours)
- [ ] Consolidate remaining utility functions
- [ ] Update module exports
- [ ] Add unused export detection to CI/CD

---

**Total Estimated Effort**: 8-10 hours spread across 4 phases

