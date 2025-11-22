# UNUSED CODE ANALYSIS REPORT - codeh-cli

## Summary
- **Total Unused Exports Found**: 66
- **Unused Index.ts Re-exports**: 19
- **Analysis Date**: 2024

## Key Findings

### 1. CORE LAYER - 26 Unused Exports

#### Critical Unused Exports:
1. **ModelRegistry** (/source/core/domain/valueObjects/ModelInfo.ts)
   - Status: Exported from core/index.ts but never instantiated or used
   - Risk: Safe to remove (appears to be abandoned)

2. **createContainer** (/source/core/di/setup.ts)
   - Status: Exported from core/index.ts but never called
   - Usage: Only empty factory function
   - Risk: Safe to remove (no external dependencies)

3. **setupContainerWithLazyLoading** (/source/core/di/setupLazy.ts)
   - Status: Never imported or used anywhere
   - Risk: Safe to remove

4. **Type Guard Functions** (CodehErrors.ts) - 10 unused
   - isCodehError, isToolExecutionError, isApiClientError, isConfigurationError, 
     isSymbolNotFoundError, isFileOperationError, isValidationError, isSecurityError, 
     isRateLimitError, isTimeoutError
   - Status: Exported but never used for type checking
   - Risk: Safe to remove (error types are created but guards aren't used)

5. **Use Case Classes** (application/usecases/) - 5 unused
   - ExecuteTool, LoadSession, ManageHistory, ProcessUserInput, SaveSession, StreamResponse
   - Status: These appear to be use case classes that might be leftover architecture
   - Risk: Need review - may be part of abandoned DDD architecture

#### Services Not Used:
6. **CodeNavigator & TypeScriptCodeNavigator** (/source/core/application/services/)
   - Status: Navigation services that are not used
   - Risk: Likely abandoned feature

7. **Tool Schemas** (GetCallHierarchyArgsSchema, DependencyGraphArgsSchema)
   - Status: Exported but tools register their own schemas
   - Risk: Duplicate/unused schema definitions

### 2. CLI LAYER - 7 Unused Exports

#### Unused Hooks:
1. **useConfigKeyboard** (/source/cli/hooks/)
   - Status: Unused hook
   - Risk: Dead code

2. **useConfigWizard & useHomeLogic** 
   - Status: Unused hooks and their return types
   - Risk: Dead code from abandoned UI flow

#### Unused Type Exports:
3. **ViewModel, ConversationViewModel, ExecutionResult** (/source/cli/presenters/types.ts)
   - Status: Exported types that are never imported
   - Risk: Safe to remove

### 3. INFRASTRUCTURE LAYER - 10 Unused Exports

#### Critical Unused:
1. **HttpClient** (/source/infrastructure/api/)
   - Status: Exported but never instantiated or used
   - Risk: Safe to remove (API calls go through ApiClientFactory)
   - Note: Has debug logging that should be cleaned up

2. **A2AServer** (/source/infrastructure/integrations/a2a/)
   - Status: Never instantiated or used
   - Risk: Incomplete feature

3. **Logging Utilities** (6 functions unused) - /source/infrastructure/logging/Logger.ts
   - generateRequestId, NullLogger, createLogger, withLogging, withLoggingSync, cleanupOldLogs
   - Status: Logger exports helpers that are never used
   - Risk: Dead code

4. **globalSandboxModeManager** (/source/infrastructure/process/)
   - Status: Re-export that's never used
   - Risk: Safe to remove

5. **CircuitBreakerPresets** (/source/infrastructure/resilience/)
   - Status: Preset configuration never referenced
   - Risk: Safe to remove

### 4. PRESENTATION LAYER - 22 Unused Exports

#### Type Exports Unused (5):
1. UseHistoryOptions, UseHistoryReturn, StreamState, StreamingOptions, StreamControl
   - Status: Type definitions exported but not imported
   - Risk: Dead types

#### Utility Functions Unused (17):
2. **Color/Formatting Utils** (8 functions):
   - getProviderColor, getProviderIcon, getSyntaxColor, getStreamingCursorFrame
   - highlightCode, isLanguageSupported, getSupportedLanguages
   - parseMarkdown
   - Status: Never called from components
   - Risk: Dead utility code

3. **Text/Storage Utils** (9 functions):
   - parseInlineTokens, hasInlineMarkdown, stripInlineMarkdown
   - truncateText, padText, stripAnsi, calculateLineCount
   - listHistoryFiles, getHistoryFileInfo
   - Status: Never called
   - Risk: Dead code

### 5. OTHER LAYER - 1 Unused Export

1. **formatDuration** (/source/utils/timeFormat.ts)
   - Status: Utility function never called
   - Risk: Safe to remove

## Index.ts Re-exports Analysis

### core/index.ts Unused Re-exports:
- ProviderInfo, ModelInfo, ModelRegistry, OutputFormatter, OutputType, createContainer
- Status: These are re-exported from core/index.ts but not imported by other modules

### cli/index.ts Unused Re-exports:
- Logo, Button, StatusIndicator, ProgressBar, InputBox, InfoSection, Menu, Card
- Welcome, Config, ConfigPresenter, WelcomePresenter
- useCodehClient, useCodehChat, useConfiguration, usePresenter
- ViewModel
- Status: Component/hook library exports that are not imported internally
- Note: These might be intended for external consumption

### infrastructure/index.ts Unused Re-exports:
- HttpClient

## Recommendations

### High Priority (Remove - Safe):
1. ✅ `createContainer` - Unused factory
2. ✅ `ModelRegistry` - Unused class
3. ✅ `HttpClient` - Unused HTTP wrapper
4. ✅ All error type guards (10 functions) - Never used for runtime checks
5. ✅ All logging utilities - Dead code
6. ✅ `A2AServer` - Incomplete feature
7. ✅ `CircuitBreakerPresets` - Unused configuration
8. ✅ `globalSandboxModeManager` - Unused re-export
9. ✅ Unused CLI hooks - useConfigKeyboard, useConfigWizard, useHomeLogic
10. ✅ Unused type exports (ViewModel, ConversationViewModel, ExecutionResult, UseHistoryOptions, UseHistoryReturn, etc.)

### Medium Priority (Review - May be intentional):
1. 🔄 CLI component exports (Logo, Button, etc.) - May be intended for external API
2. 🔄 Use case classes (ExecuteTool, LoadSession, etc.) - Review if part of active architecture
3. 🔄 CodeNavigator & TypeScriptCodeNavigator - May be abandoned feature

### Low Priority (Cleanup):
1. 📝 Presentation utility functions - Consider consolidating or removing unused ones
2. 📝 Tool schema definitions - Consider consolidating with tool definitions

## Dead Code Patterns Found

### 1. Unused Services/Navigators
- CodeNavigator.ts
- TypeScriptCodeNavigator.ts
- These appear to be alternative navigation implementations that were superseded

### 2. Abandoned Architecture
- UseCase classes (ExecuteTool, LoadSession, etc.) in application/usecases/
- Appear to be from DDD/Clean Architecture pattern that's not actively used

### 3. Unused UI Library
- CLI component library exports may indicate abandoned UI framework refactoring
- Components exist but are not imported/used internally

### 4. Debug/Utility Code
- HttpClient class has extensive debug logging (console.log)
- Logging utilities (withLogging, withLoggingSync, etc.) are exported but never called

## Action Items

1. Remove all 10 error type guards from CodehErrors.ts
2. Remove createContainer from exports
3. Remove ModelRegistry class
4. Remove HttpClient from exports (use ApiClientFactory instead)
5. Remove all unused logging utilities
6. Remove A2AServer and related integrations if incomplete
7. Review and potentially remove CodeNavigator services
8. Clean up unused CLI component/hook exports
9. Clean up unused presentation utility functions
10. Remove unused type definitions from module exports

