# Unused Code Cleanup Checklist

## Critical - Safe to Remove (No Dependencies)

### Error Type Guards (10 items) - source/core/domain/errors/CodehErrors.ts
```
- [ ] isCodehError
- [ ] isToolExecutionError
- [ ] isApiClientError
- [ ] isConfigurationError
- [ ] isSymbolNotFoundError
- [ ] isFileOperationError
- [ ] isValidationError
- [ ] isSecurityError
- [ ] isRateLimitError
- [ ] isTimeoutError
```

### DI/Factory Functions (3 items)
```
- [ ] createContainer (source/core/di/setup.ts)
- [ ] createContainer (source/core/di/setupLazy.ts) - duplicate
- [ ] setupContainerWithLazyLoading (source/core/di/setupLazy.ts)
```

### Unused Classes (3 items)
```
- [ ] ModelRegistry (source/core/domain/valueObjects/ModelInfo.ts)
- [ ] HttpClient (source/infrastructure/api/HttpClient.ts)
- [ ] A2AServer (source/infrastructure/integrations/a2a/A2AServer.ts)
```

### Logging Utilities (6 items) - source/infrastructure/logging/Logger.ts
```
- [ ] generateRequestId
- [ ] NullLogger
- [ ] createLogger
- [ ] withLogging
- [ ] withLoggingSync
- [ ] cleanupOldLogs
```

### Configuration/Presets (2 items)
```
- [ ] RetryPresets (source/core/application/strategies/RetryStrategy.ts)
- [ ] CircuitBreakerPresets (source/infrastructure/resilience/CircuitBreaker.ts)
- [ ] globalSandboxModeManager (source/infrastructure/process/SandboxModeManager.ts)
```

## Medium Priority - Review First (May Be Intentional)

### Navigation Services (2 items)
```
- [ ] CodeNavigator (source/core/application/services/CodeNavigator.ts)
- [ ] TypeScriptCodeNavigator (source/core/application/services/TypeScriptCodeNavigator.ts)
```

### Use Case Classes (6 items) - source/core/application/usecases/
```
- [ ] ExecuteTool
- [ ] LoadSession
- [ ] ManageHistory
- [ ] ProcessUserInput
- [ ] SaveSession
- [ ] StreamResponse
```

### CLI Hooks & Types (5 items)
```
- [ ] useConfigKeyboard (source/cli/hooks/useConfigKeyboard.ts)
- [ ] useConfigWizard (source/cli/hooks/useConfigWizard.ts)
- [ ] UseConfigWizardReturn (same file)
- [ ] useHomeLogic (source/cli/hooks/useHomeLogic.ts)
- [ ] UseHomeLogicReturn (same file)
```

## Low Priority - Presentation Layer (22 items)

### Utility Functions
```
- [ ] getProviderColor
- [ ] getProviderIcon
- [ ] getSyntaxColor
- [ ] getStreamingCursorFrame
- [ ] highlightCode
- [ ] isLanguageSupported
- [ ] getSupportedLanguages
- [ ] parseMarkdown
- [ ] parseInlineTokens
- [ ] hasInlineMarkdown
- [ ] stripInlineMarkdown
- [ ] truncateText
- [ ] padText
- [ ] stripAnsi
- [ ] calculateLineCount
- [ ] listHistoryFiles
- [ ] getHistoryFileInfo
- [ ] formatDuration
```

### Type Definitions
```
- [ ] ViewModel (source/cli/presenters/types.ts)
- [ ] ConversationViewModel (same)
- [ ] ExecutionResult (same)
- [ ] UseHistoryOptions (source/presentation/screens/HomeScreen/hooks/useHistory.ts)
- [ ] UseHistoryReturn (same)
- [ ] StreamState (source/presentation/screens/HomeScreen/types/streaming.ts)
- [ ] StreamingOptions (same)
- [ ] StreamControl (same)
```

## Categorized by Risk Level

### Low Risk (Can be safely removed)
- ✅ All error type guards (10)
- ✅ All logging utilities (6)
- ✅ createContainer functions (2)
- ✅ ModelRegistry
- ✅ HttpClient
- ✅ All presentation utility functions (17)
- ✅ All type exports (11)

### Medium Risk (Review before removal)
- 🔄 Navigation services (2)
- 🔄 Use case classes (6)
- 🔄 CLI hooks (3)
- 🔄 A2AServer

## Notes

- Total unused exports: 66
- Total unused type definitions: 18
- Total unused functions: 35
- Total unused classes: 13

## Removal Strategy

1. **Phase 1**: Remove all error type guards (easy, no dependencies)
2. **Phase 2**: Remove unused DI/factory functions
3. **Phase 3**: Remove unused logging utilities
4. **Phase 4**: Review and remove navigation services
5. **Phase 5**: Review and remove use case classes
6. **Phase 6**: Clean up presentation layer utilities
7. **Phase 7**: Review component/hook exports

