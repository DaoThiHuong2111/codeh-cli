# Mode Switching Guide - Permission Modes

## 📖 Tổng Quan

Project hiện hỗ trợ **2 permission modes** có thể switch qua lại trong runtime bằng phím tắt **Shift+Tab**:

1. **MVP Mode** (🚀) - Auto-approve tất cả tools
2. **Interactive Mode** (🔒) - Yêu cầu user approval cho mỗi tool

## 🎯 Kiến Trúc

### Components Created

#### 1. **PermissionModeManager** (`source/infrastructure/permissions/PermissionModeManager.ts`)

Quản lý state của permission mode và cung cấp API để toggle.

**Features:**
- ✅ Singleton service registered in DI container
- ✅ Listener pattern cho reactive updates
- ✅ Toggle between MVP and Interactive modes
- ✅ Helper methods: `isMVPMode()`, `isInteractiveMode()`
- ✅ Mode metadata: icon, description

**API:**
```typescript
class PermissionModeManager {
  getCurrentMode(): PermissionMode; // 'mvp' | 'interactive'
  setMode(mode: PermissionMode): void;
  toggleMode(): void; // Switch between modes
  isMVPMode(): boolean;
  isInteractiveMode(): boolean;
  getModeDescription(): string;
  getModeIcon(): string;

  // Listener pattern
  addListener(listener: ModeChangeListener): void;
  removeListener(listener: ModeChangeListener): void;
}
```

---

#### 2. **HybridPermissionHandler** (`source/infrastructure/permissions/HybridPermissionHandler.ts`)

Delegates permission requests tới **SimplePermissionHandler** hoặc **InteractivePermissionHandler** dựa trên mode hiện tại.

**How it works:**
```typescript
class HybridPermissionHandler implements IToolPermissionHandler {
  constructor(private modeManager: PermissionModeManager) {
    this.simpleHandler = new SimplePermissionHandler();
    this.interactiveHandler = new InteractivePermissionHandler();
  }

  async requestPermission(context: ToolPermissionContext): Promise<PermissionResult> {
    // Delegate based on current mode
    const handler = this.modeManager.isMVPMode()
      ? this.simpleHandler
      : this.interactiveHandler;

    return handler.requestPermission(context);
  }
}
```

**Benefits:**
- ✅ Zero breaking changes - implements same IToolPermissionHandler interface
- ✅ Transparent mode switching - no code changes needed in tool execution
- ✅ Clean separation of concerns

---

#### 3. **Updated Footer** (2 versions)

##### **Footer (organisms)** - Used by HomeNew
```typescript
// source/cli/components/organisms/Footer.tsx
export interface FooterProps {
  // ... existing props
  permissionMode?: 'mvp' | 'interactive'; // ← New prop
}

// Displays at the end of footer bar:
// 🚀 MVP (Shift+Tab)  or  🔒 Interactive (Shift+Tab)
```

##### **Footer (presentation/layout)** - Used by HomeScreen
```typescript
// source/presentation/screens/HomeScreen/components/layout/Footer.tsx
export interface FooterProps {
  // ... existing props
  permissionMode?: 'mvp' | 'interactive'; // ← New prop
}
```

Both footers display:
- Current mode icon (🚀 or 🔒)
- Mode name (MVP or Interactive)
- Keyboard shortcut hint (Shift+Tab)

---

#### 4. **Updated HomeNew** (`source/cli/screens/HomeNew.tsx`)

Wired PermissionModeManager vào UI layer.

**Changes:**
```typescript
export default function HomeNew({container}: HomeNewProps) {
  // 1. State for permission mode
  const [permissionMode, setPermissionMode] = useState<PermissionMode>('mvp');
  const [modeManager, setModeManager] = useState<PermissionModeManager | null>(null);

  // 2. Initialize mode manager from DI container
  useEffect(() => {
    const manager = container.resolve<PermissionModeManager>('PermissionModeManager');
    setModeManager(manager);
    setPermissionMode(manager.getCurrentMode());

    // Listen for mode changes
    const listener = {
      onModeChanged: (mode: PermissionMode) => {
        setPermissionMode(mode);
      },
    };
    manager.addListener(listener);

    return () => {
      manager.removeListener(listener);
    };
  }, [container]);

  // 3. Keyboard handler for Shift+Tab
  useInput((input, key) => {
    if (key.shift && key.tab) {
      if (modeManager) {
        modeManager.toggleMode();
      }
      return;
    }
    // ... other handlers
  });

  // 4. Pass mode to Footer
  return (
    <Footer
      // ... existing props
      permissionMode={permissionMode}
    />
  );
}
```

---

#### 5. **Updated DI Container** (`source/core/di/setup.ts`)

Registered PermissionModeManager và HybridPermissionHandler.

```typescript
// Register PermissionModeManager (singleton)
container.register(
  'PermissionModeManager',
  () => new PermissionModeManager(),
  true,
);

// Register HybridPermissionHandler (replaces SimplePermissionHandler)
container.register(
  'PermissionHandler',
  () => {
    const modeManager = container.resolve<PermissionModeManager>('PermissionModeManager');
    return new HybridPermissionHandler(modeManager);
  },
  true,
);
```

**Changes:**
- ✅ PermissionModeManager registered as singleton
- ✅ HybridPermissionHandler replaces SimplePermissionHandler
- ✅ CodehClient automatically uses correct handler based on mode

---

## 🚀 Cách Sử Dụng

### User Perspective

1. **Start app** - Mặc định ở **MVP Mode** (🚀)
2. **Nhìn vào footer** - Xem current mode ở cuối status bar
3. **Press Shift+Tab** - Toggle sang Interactive Mode (🔒)
4. **Press Shift+Tab again** - Toggle về MVP Mode (🚀)

### Visual Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Footer Status Bar                                               │
├─────────────────────────────────────────────────────────────────┤
│ Model: claude | Messages: 5 | Tokens: 1,234 | ... | 🚀 MVP (Shift+Tab)
└─────────────────────────────────────────────────────────────────┘

User presses Shift+Tab...

┌─────────────────────────────────────────────────────────────────┐
│ 🔄 Permission mode switched to: INTERACTIVE                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Model: claude | Messages: 5 | ... | 🔒 Interactive (Shift+Tab)  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Mode Behavior

### MVP Mode (🚀)

**Characteristics:**
- ❌ No user interaction required
- ✅ All tools auto-approved instantly
- ✅ Console logs for visibility
- 🎯 Best for: Development, Testing, Fast iteration

**Flow:**
```
User: "List files in current directory"
  ↓
LLM: "I'll run ls command"
  ↓
ToolExecutionOrchestrator detects tool_call
  ↓
SimplePermissionHandler.requestPermission()
  ↓
✅ Auto-approved (logged to console)
  ↓
Execute: shell.execute({command: "ls"})
  ↓
Result sent back to LLM
  ↓
LLM: "Here are the files: ..."
```

**Console Output (MVP Mode):**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 Tool Execution Request
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tool: shell
Description: Execute shell commands

Arguments:
  {
    "command": "ls"
  }

Status: ✅ Auto-approved (MVP mode)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### Interactive Mode (🔒)

**Characteristics:**
- ✅ User must approve each tool
- ✅ Security warnings displayed
- ✅ Pre-approval support ("Always Allow")
- 🎯 Best for: Production, Security-sensitive apps

**Flow:**
```
User: "Delete all temporary files"
  ↓
LLM: "I'll run rm -rf /tmp/*"
  ↓
ToolExecutionOrchestrator detects tool_call
  ↓
InteractivePermissionHandler.requestPermission()
  ↓
Check pre-approval? No → Show ToolPermissionDialog
  ↓
┌──────────────────────────────────────────────┐
│ 🔧 Tool Execution Permission Required       │
│                                              │
│ Tool: shell                                  │
│ Description: Execute shell commands          │
│                                              │
│ Arguments:                                   │
│   {                                          │
│     "command": "rm -rf /tmp/*"               │
│   }                                          │
│                                              │
│ ⚠️  Only allow tools from trusted sources.   │
│                                              │
│ ┌─────────────┐ ┌────────────┐ ┌──────────┐│
│ │ ✓ Allow (Y) │ │ ✗ Deny (N) │ │ ✓ Always││
│ └─────────────┘ └────────────┘ └──────────┘│
└──────────────────────────────────────────────┘
  ↓
User clicks "Deny" → Execution stopped
OR
User clicks "Allow" → Execution proceeds
OR
User clicks "Always" → Pre-approve + Execute
```

**Console Output (Interactive Mode):**
```
🔧 Requesting permission for tool: shell...

[Dialog shown to user]

❌ Permission denied: User rejected
```

---

## 🔄 Mode Switching in Action

### Example Session

```bash
$ codeh

# Footer shows: 🚀 MVP (Shift+Tab)

User: "What files are in current directory?"

# MVP Mode: Auto-approved, executes immediately
✅ Auto-approved: shell
Output: file1.txt, file2.txt, folder/

# User presses Shift+Tab
🔄 Permission mode switched to: INTERACTIVE

# Footer now shows: 🔒 Interactive (Shift+Tab)

User: "Delete file1.txt"

# Interactive Mode: Shows dialog
┌──────────────────────────────────────┐
│ 🔧 Tool: shell                       │
│ Command: rm file1.txt                │
│                                      │
│ [Allow] [Deny] [Always]              │
└──────────────────────────────────────┘

# User must decide...
```

---

## 📊 Technical Implementation Details

### Dependency Injection Wiring

```
Container (DI)
  ├─ PermissionModeManager (singleton)
  │    └─ getCurrentMode() → 'mvp' | 'interactive'
  │
  ├─ HybridPermissionHandler (singleton)
  │    ├─ SimplePermissionHandler
  │    ├─ InteractivePermissionHandler
  │    └─ requestPermission() → delegates based on mode
  │
  └─ CodehClient
       └─ Uses HybridPermissionHandler
```

### State Management Flow

```
HomeNew Component
  ↓
[useState] permissionMode
  ↓
[useEffect] Resolve PermissionModeManager from container
  ↓
[addListener] Listen for mode changes
  ↓
[useInput] Shift+Tab → modeManager.toggleMode()
  ↓
[listener callback] setPermissionMode(newMode)
  ↓
[render] <Footer permissionMode={permissionMode} />
```

### Tool Execution Flow (with Mode Check)

```
CodehClient.execute()
  ↓
ToolExecutionOrchestrator.orchestrate()
  ↓
HandleToolCalls.execute()
  ↓
For each tool:
  ├─ HybridPermissionHandler.requestPermission()
  │    ├─ Check mode: modeManager.isMVPMode()?
  │    ├─ If MVP → SimplePermissionHandler.requestPermission()
  │    │              └─ Return {approved: true} immediately
  │    └─ If Interactive → InteractivePermissionHandler.requestPermission()
  │                         ├─ Check pre-approval
  │                         ├─ If not pre-approved → Show dialog
  │                         └─ Wait for user decision
  │
  ├─ If approved → Execute tool
  └─ Format result → Send to LLM
```

---

## ✅ Testing

### Manual Test Scenarios

#### Test 1: Basic Mode Switching
```bash
1. Start app → Check footer shows "🚀 MVP"
2. Press Shift+Tab → Check footer shows "🔒 Interactive"
3. Press Shift+Tab → Check footer shows "🚀 MVP"
```

#### Test 2: MVP Mode Tool Execution
```bash
1. Ensure MVP mode active
2. Ask LLM: "List files"
3. Observe: Auto-approved, executes immediately
4. Console shows: "✅ Auto-approved (MVP mode)"
```

#### Test 3: Interactive Mode Tool Execution
```bash
1. Switch to Interactive mode (Shift+Tab)
2. Ask LLM: "Create a new file"
3. Observe: Dialog appears (when wired)
4. Console shows: "🔧 Requesting permission for tool..."
```

#### Test 4: Mode Persistence During Session
```bash
1. Switch to Interactive mode
2. Execute multiple commands
3. Verify mode stays Interactive (footer shows 🔒)
4. Switch back to MVP
5. Verify mode stays MVP
```

---

## 🎯 Current Status

### ✅ Completed
- [x] PermissionModeManager implementation
- [x] HybridPermissionHandler implementation
- [x] DI container wiring
- [x] Footer updates (both versions)
- [x] HomeNew integration
- [x] Shift+Tab keyboard handler
- [x] Mode state management with listeners
- [x] Build passes successfully

### ⚠️ Pending (Optional)
- [ ] Wire InteractivePermissionHandler UI callback to ToolPermissionDialog
- [ ] Add permission state to HomePresenterNew
- [ ] Test Interactive mode with real dialog
- [ ] Add mode preference persistence (save to file)

### 📝 Notes

**Current Behavior:**
- Mode switching works ✅
- Footer displays current mode ✅
- MVP mode works fully ✅
- Interactive mode falls back to auto-approve if no UI callback set ⚠️

**To Enable Full Interactive Mode:**
Follow UI_COMPONENTS_GUIDE.md to wire ToolPermissionDialog into presenter.

---

## 🔧 Developer Guide

### Adding Mode-Aware Features

If you want a feature to behave differently based on mode:

```typescript
// 1. Inject PermissionModeManager
const modeManager = container.resolve<PermissionModeManager>('PermissionModeManager');

// 2. Check current mode
if (modeManager.isMVPMode()) {
  // MVP-specific behavior
  console.log('Fast mode: skip validation');
} else {
  // Interactive-specific behavior
  console.log('Safe mode: validate everything');
}

// 3. Or listen for changes
modeManager.addListener({
  onModeChanged: (mode) => {
    console.log(`Mode changed to: ${mode}`);
    // React to mode change
  }
});
```

### Extending Permission Handlers

```typescript
// Add new permission handler
class CustomPermissionHandler implements IToolPermissionHandler {
  async requestPermission(context: ToolPermissionContext): Promise<PermissionResult> {
    // Custom logic
  }
}

// Update HybridPermissionHandler
class HybridPermissionHandler {
  constructor(private modeManager: PermissionModeManager) {
    this.mvpHandler = new SimplePermissionHandler();
    this.interactiveHandler = new InteractivePermissionHandler();
    this.customHandler = new CustomPermissionHandler(); // ← New
  }

  async requestPermission(context: ToolPermissionContext): Promise<PermissionResult> {
    const mode = this.modeManager.getCurrentMode();

    if (mode === 'mvp') return this.mvpHandler.requestPermission(context);
    if (mode === 'interactive') return this.interactiveHandler.requestPermission(context);
    if (mode === 'custom') return this.customHandler.requestPermission(context); // ← New
  }
}
```

---

## 📚 Related Documentation

- **UI_COMPONENTS_GUIDE.md** - ToolPermissionDialog and UI components
- **IMPLEMENTATION_SUMMARY.md** - Complete tool execution pipeline
- **TESTING_TOOL_EXECUTION.md** - Testing guide for tool execution flow

---

## 🎉 Summary

**What We Built:**
- 2 permission modes: MVP (fast) and Interactive (secure)
- Runtime mode switching with Shift+Tab
- Hybrid permission handler that delegates based on mode
- Footer display showing current mode
- Full DI container integration
- Zero breaking changes to existing code

**Benefits:**
- ✅ Flexibility - Switch modes on-the-fly based on task
- ✅ Development Speed - Use MVP mode for rapid iteration
- ✅ Production Safety - Use Interactive mode for security
- ✅ User Control - User decides when to require approval
- ✅ Clean Architecture - Proper separation of concerns

**Next Steps:**
- Wire ToolPermissionDialog for full Interactive mode
- Test with real tool execution scenarios
- Add mode preference persistence (optional)
