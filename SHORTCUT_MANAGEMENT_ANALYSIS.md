# Shortcut Management Analysis

## 📋 Executive Summary

Sau khi review toàn bộ source code, tôi phát hiện **project hiện tại KHÔNG có hệ thống quản lý shortcuts tập trung**. Các `useInput` hooks được sử dụng độc lập ở nhiều nơi, dẫn đến:

- ⚠️ **Potential conflicts**: Multiple hooks active cùng lúc
- ⚠️ **No priority system**: Không có cách kiểm soát thứ tự xử lý
- ⚠️ **Scattered logic**: Input handling logic phân tán khắp codebase
- ⚠️ **Hard to maintain**: Khó theo dõi và debug conflicts

**Kết luận**: Cần một **Shortcut Manager** tập trung để quản lý.

---

## 🔍 Current State Analysis

### 1. Inventory of useInput Hooks

| File | Component | Purpose | isActive? | Shortcuts |
|------|-----------|---------|-----------|-----------|
| `NavigationProvider.tsx` | Global | Exit app | ❌ No | Ctrl+C |
| `HomeNew.tsx` | Screen | Main shortcuts | ❌ No | Shift+Tab, ?, Esc, ↑/↓, Tab, Enter |
| `HomeScreenContent.tsx` | Alt Screen | Alt shortcuts | ❌ No | Ctrl+C, Esc |
| `InputBox.tsx` | Component | Text input | ✅ Yes | All chars, Enter, Backspace |
| `ToolPermissionDialog.tsx` | Dialog | Dialog nav | ✅ Yes | Tab, ←/→, Enter, Y/N/A |
| `useWelcomeLogic.ts` | Screen | Welcome nav | ❌ No | Enter, C |
| `useDebouncedInput.ts` | Utility | Debounce wrapper | N/A | - |

**Key Findings:**

1. **6 active useInput hooks** (excluding debounce wrapper)
2. **Only 2 use isActive flag** (InputBox, ToolPermissionDialog)
3. **4 hooks ALWAYS active** (global + screens)
4. **No coordination** between hooks

---

### 2. Hierarchy và Component Tree

```
App (cli.tsx)
  └─ NavigationProvider              [useInput: Ctrl+C]
       ├─ Welcome
       │    └─ useWelcomeLogic        [useInput: Enter, C]
       │
       └─ HomeNew                     [useInput: Shift+Tab, ?, Esc, ↑/↓, Tab, Enter]
            ├─ InputBox               [useInput: text input, isActive: enabled]
            │
            ├─ ConversationArea
            │    └─ MessageBubble
            │         └─ ToolCallDisplay
            │
            └─ (future) ToolPermissionDialog  [useInput: Tab, ←/→, Enter, Y/N/A, isActive: !!request]

Alternative:
App
  └─ NavigationProvider              [useInput: Ctrl+C]
       └─ HomeScreen
            └─ HomeScreenContent     [useInput: Ctrl+C, Esc]
                 ├─ InputBox          [useInput: text input, isActive: disabled]
                 └─ Footer
```

**Observations:**

- **NavigationProvider** và **Screen-level hooks** cùng active
- Có thể **conflict** nếu shortcuts overlap
- **InputBox** tự quản lý state (enabled flag)
- **ToolPermissionDialog** chưa được hiển thị (future)

---

### 3. Potential Conflicts

#### 🔴 Critical Conflicts

**Ctrl+C Duplication:**
```typescript
// NavigationProvider.tsx
useInput((input, key) => {
  if (key.ctrl && input === 'c') {
    process.exit(0);  // ← Handler 1
  }
});

// HomeScreenContent.tsx
useInput((input, key) => {
  if (key.ctrl && input === 'c') {
    exit();  // ← Handler 2 (same shortcut!)
  }
});
```

**Problem:** CẢ 2 handlers đều fire → undefined behavior (which one runs first?)

#### 🟡 Future Conflicts

**Tab Key:**
```typescript
// HomeNew.tsx (suggestions)
if (key.tab) {
  presenter.handleSuggestionSelect();  // Select suggestion
}

// ToolPermissionDialog.tsx (when shown)
if (key.tab) {
  setFocusedButton(next);  // Navigate buttons
}
```

**Problem:** Khi dialog xuất hiện, Tab có trigger CẢ 2 handlers không?

**Esc Key:**
```typescript
// HomeNew.tsx
if (key.escape) {
  if (presenter.showHelp) {
    presenter.toggleHelp();  // Close help
  } else if (presenter.input) {
    presenter.handleInputChange('');  // Clear input
  }
}

// HomeScreenContent.tsx
if (key.escape && isStreaming) {
  cancelStream();  // Cancel stream
}
```

**Problem:** Logic phụ thuộc vào state, nhưng không coordinate với nhau.

---

### 4. How Ink useInput Works

Từ Ink documentation:

```typescript
// Multiple useInput hooks CAN run concurrently
// They are called in the order components are rendered
// NO built-in priority system
// NO built-in conflict resolution
```

**Ink's Behavior:**
1. **All active hooks receive input** (unless isActive=false)
2. **Execution order = component render order** (parent → child)
3. **No stopPropagation** - all hooks run
4. **Each hook decides** whether to handle input

**What Ink DOES provide:**
- `useFocus` - Focus management system (Tab/Shift+Tab navigation)
- `isActive` flag - Conditional hook activation
- `useFocusManager` - Programmatic focus control

**What Ink DOES NOT provide:**
- ❌ Global shortcut registry
- ❌ Priority/layer system
- ❌ Conflict detection
- ❌ Event bubbling/stopping

---

## 🚨 Problems Identified

### Problem 1: No Control Over Execution Order

**Current State:**
```
User presses Ctrl+C:
  1. NavigationProvider hook fires (process.exit)
  2. HomeScreenContent hook fires (exit)
  → Both execute, undefined which runs first
```

**Why it's a problem:**
- Unpredictable behavior
- Race conditions
- Can't guarantee clean shutdown

---

### Problem 2: No Context Awareness

**Current State:**
```
User presses Tab in HomeNew:
  - If suggestions visible → handleSuggestionSelect()
  - If ToolPermissionDialog shown → navigate buttons
  → BOTH could fire!
```

**Why it's a problem:**
- Components don't know about each other
- No way to "disable" screen shortcuts when dialog opens
- Manual state management required everywhere

---

### Problem 3: Scattered State Management

**Current State:**
```
Esc key behavior spread across:
  - HomeNew.tsx (help/input logic)
  - HomeScreenContent.tsx (stream cancel)
  - ToolPermissionDialog.tsx (potentially close dialog)
```

**Why it's a problem:**
- Hard to understand complete behavior
- Easy to introduce bugs when adding features
- No single source of truth

---

### Problem 4: No Debugging Tools

**Current State:**
- No logging của active shortcuts
- No way to see which handlers fired
- No conflict detection
- Must manually trace through code

**Why it's a problem:**
- Debugging takes longer
- Can't visualize shortcut tree
- Hard to onboard new developers

---

## 💡 Proposed Solutions

### Option 1: Centralized Shortcut Manager (Recommended)

**Concept:** Single manager coordinates all shortcuts with priority layers.

#### Architecture

```typescript
// Shortcut Registry
type ShortcutLayer = 'global' | 'screen' | 'dialog' | 'input';

interface ShortcutDefinition {
  key: string;              // 'ctrl+c', 'shift+tab', '?', 'escape'
  handler: () => void;
  layer: ShortcutLayer;
  enabled: () => boolean;   // Conditional activation
  description?: string;
}

class ShortcutManager {
  private registry: Map<ShortcutLayer, ShortcutDefinition[]>;
  private activeLayer: ShortcutLayer = 'screen';

  // Register shortcut
  register(definition: ShortcutDefinition): void;

  // Unregister shortcut
  unregister(key: string, layer: ShortcutLayer): void;

  // Set active layer (disables lower layers)
  setLayer(layer: ShortcutLayer): void;

  // Handle input (called by single useInput hook)
  handleInput(input: string, key: any): void;

  // Debug tools
  getActiveShortcuts(): ShortcutDefinition[];
  logState(): void;
}
```

#### Priority Layers

```
┌─────────────────────────────────────┐
│ Layer 4: INPUT (highest priority)  │ ← Text input (InputBox)
├─────────────────────────────────────┤
│ Layer 3: DIALOG                     │ ← Modal dialogs (ToolPermissionDialog)
├─────────────────────────────────────┤
│ Layer 2: SCREEN                     │ ← Screen-specific (HomeNew, Welcome)
├─────────────────────────────────────┤
│ Layer 1: GLOBAL (lowest priority)  │ ← Always-active (Ctrl+C exit)
└─────────────────────────────────────┘

Rules:
- Higher layers block lower layers
- Within same layer, first match wins
- Global layer ALWAYS receives input (emergency exits)
```

#### Usage Example

```typescript
// In HomeNew.tsx
const shortcutManager = useShortcutManager();

useEffect(() => {
  // Register shortcuts for this screen
  const shortcuts = [
    {
      key: 'shift+tab',
      handler: () => modeManager.toggleMode(),
      layer: 'screen',
      enabled: () => !presenter.isLoading,
      description: 'Toggle permission mode'
    },
    {
      key: '?',
      handler: () => presenter.toggleHelp(),
      layer: 'screen',
      enabled: () => !presenter.isLoading,
      description: 'Toggle help'
    },
    {
      key: 'escape',
      handler: () => {
        if (presenter.showHelp) presenter.toggleHelp();
        else if (presenter.input) presenter.handleInputChange('');
      },
      layer: 'screen',
      enabled: () => true,
      description: 'Close help or clear input'
    }
  ];

  shortcuts.forEach(s => shortcutManager.register(s));

  return () => {
    // Cleanup on unmount
    shortcuts.forEach(s => shortcutManager.unregister(s.key, s.layer));
  };
}, []);

// When dialog opens
useEffect(() => {
  if (dialogVisible) {
    shortcutManager.setLayer('dialog');  // Disable screen shortcuts
  } else {
    shortcutManager.setLayer('screen');
  }
}, [dialogVisible]);
```

#### Benefits

✅ **Single source of truth** - All shortcuts in one place
✅ **Priority system** - Clear layering prevents conflicts
✅ **Context aware** - Automatically handles active layer
✅ **Easy debugging** - Can log all active shortcuts
✅ **Declarative** - Register/unregister like useEffect
✅ **Type-safe** - Full TypeScript support
✅ **Testable** - Can unit test manager logic

#### Drawbacks

⚠️ **Refactoring required** - Must update all components
⚠️ **Learning curve** - New pattern for team
⚠️ **Overhead** - Extra abstraction layer

---

### Option 2: Enhanced isActive Flags

**Concept:** Use isActive more extensively + manual coordination.

#### Implementation

```typescript
// In HomeNew.tsx
const [screenShortcutsActive, setScreenShortcutsActive] = useState(true);

// Disable screen shortcuts when dialog opens
useEffect(() => {
  setScreenShortcutsActive(!dialogVisible);
}, [dialogVisible]);

useInput((input, key) => {
  // Screen shortcuts
  if (key.shift && key.tab) {
    modeManager.toggleMode();
  }
  // ... other shortcuts
}, {
  isActive: screenShortcutsActive && !presenter.isLoading
});

// In ToolPermissionDialog.tsx
useInput((input, key) => {
  // Dialog shortcuts
}, {
  isActive: !!request  // Already doing this
});
```

#### Benefits

✅ **Minimal refactoring** - Build on existing pattern
✅ **No new abstractions** - Uses Ink built-ins
✅ **Incremental** - Can add gradually

#### Drawbacks

⚠️ **Manual coordination** - Must track state everywhere
⚠️ **Still scattered** - Logic spread across files
⚠️ **Hard to debug** - No centralized view
⚠️ **Brittle** - Easy to forget isActive checks

---

### Option 3: Hybrid Approach

**Concept:** Shortcut manager for screens + isActive for components.

#### Implementation

```
Global Layer:
  - ShortcutManager handles screen-level shortcuts
  - Automatic layer switching
  - Centralized registry

Component Layer:
  - Components use isActive as usual
  - InputBox, ToolPermissionDialog manage own state
  - Manager doesn't micromanage components
```

#### Benefits

✅ **Best of both worlds** - Centralized + flexible
✅ **Pragmatic** - Manager for complex, isActive for simple
✅ **Less refactoring** - Components keep current pattern

#### Drawbacks

⚠️ **Two patterns** - Team needs to know when to use which
⚠️ **Still some complexity** - Not as clean as pure manager

---

## 🎯 Recommendation

### Recommended: **Option 1 - Centralized Shortcut Manager**

**Lý do:**

1. **Scalability** - Project đang grow, sẽ có thêm screens/dialogs
2. **Maintainability** - Single source of truth dễ maintain
3. **Developer Experience** - Clear API, easy to add shortcuts
4. **Debugging** - Can add dev tools (shortcut visualizer, logger)
5. **Future-proof** - Ready for features like:
   - Customizable shortcuts (user config)
   - Shortcut cheat sheet (auto-generated from registry)
   - Accessibility (screen reader announcements)
   - Recording/playback (testing)

**Implementation Phases:**

#### Phase 1: Create Manager (No Breaking Changes)
```
- Implement ShortcutManager class
- Add useShortcutManager hook
- Create types and interfaces
- Add unit tests
- Document API
```

#### Phase 2: Migrate Global Layer
```
- Register Ctrl+C in global layer
- Remove from NavigationProvider
- Verify behavior unchanged
```

#### Phase 3: Migrate Screen Layers
```
- Migrate HomeNew shortcuts
- Migrate Welcome shortcuts
- Migrate HomeScreenContent shortcuts
- Test navigation flows
```

#### Phase 4: Add Dialog Layer
```
- Wire ToolPermissionDialog into manager
- Implement layer switching
- Test dialog interactions
```

#### Phase 5: Developer Tools
```
- Add shortcut visualizer (press ` to show)
- Add logging (debug mode)
- Generate docs from registry
```

---

## 📊 Comparison Matrix

| Criteria | Option 1: Manager | Option 2: isActive | Option 3: Hybrid |
|----------|-------------------|-------------------|------------------|
| **Conflict Prevention** | ⭐⭐⭐⭐⭐ Automatic | ⭐⭐ Manual | ⭐⭐⭐⭐ Mixed |
| **Maintainability** | ⭐⭐⭐⭐⭐ Centralized | ⭐⭐ Scattered | ⭐⭐⭐⭐ Good |
| **Debugging** | ⭐⭐⭐⭐⭐ Easy | ⭐ Hard | ⭐⭐⭐ Okay |
| **Developer Experience** | ⭐⭐⭐⭐⭐ Clear API | ⭐⭐ Manual | ⭐⭐⭐⭐ Good |
| **Refactoring Effort** | ⭐⭐ High | ⭐⭐⭐⭐⭐ Low | ⭐⭐⭐ Medium |
| **Learning Curve** | ⭐⭐⭐ New pattern | ⭐⭐⭐⭐⭐ Familiar | ⭐⭐⭐⭐ Mixed |
| **Scalability** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐ Poor | ⭐⭐⭐⭐ Good |
| **Type Safety** | ⭐⭐⭐⭐⭐ Full | ⭐⭐⭐ Partial | ⭐⭐⭐⭐ Good |

---

## 📝 Implementation Checklist

### Before Implementation

- [ ] Review này document với team
- [ ] Discuss trade-offs của các options
- [ ] Choose final approach
- [ ] Create implementation plan với timeline
- [ ] Assign ownership

### During Implementation

- [ ] Write comprehensive tests
- [ ] Document API thoroughly
- [ ] Create migration guide
- [ ] Add examples to docs
- [ ] Update KEYBOARD_SHORTCUTS.md

### After Implementation

- [ ] Test all existing shortcuts
- [ ] Verify no regressions
- [ ] Monitor for conflicts
- [ ] Gather team feedback
- [ ] Iterate on API if needed

---

## 🔮 Future Enhancements

Nếu implement Shortcut Manager, có thể add:

### 1. User-Configurable Shortcuts
```typescript
// Save to config file
shortcutManager.setCustomShortcut('toggle_mode', 'ctrl+m');

// Load from config on startup
const config = await loadUserConfig();
shortcutManager.loadCustomShortcuts(config.shortcuts);
```

### 2. Shortcut Cheat Sheet
```typescript
// Auto-generate từ registry
const cheatSheet = shortcutManager.generateCheatSheet();

// Display với `
if (input === '`') {
  showShortcutOverlay(cheatSheet);
}
```

### 3. Recording/Playback (Testing)
```typescript
// Record user actions
shortcutManager.startRecording();
// ... user interacts ...
const recording = shortcutManager.stopRecording();

// Playback for testing
await shortcutManager.playback(recording);
```

### 4. Accessibility Announcements
```typescript
// Screen reader support
shortcutManager.onShortcutExecuted((shortcut) => {
  if (isScreenReaderEnabled) {
    announce(shortcut.description);
  }
});
```

---

## 🎓 References

### Ink Documentation
- [useInput Hook](https://github.com/vadimdemedes/ink#useinput)
- [useFocus Hook](https://github.com/vadimdemedes/ink#usefocus)
- [useFocusManager Hook](https://github.com/vadimdemedes/ink#usefocusmanager)

### Similar Patterns
- VS Code: [Keybinding Service](https://code.visualstudio.com/api/references/vscode-api#commands)
- Vim: Command mapping system
- Electron: [globalShortcut](https://www.electronjs.org/docs/latest/api/global-shortcut)

### Best Practices
- Command Pattern (GoF Design Patterns)
- Priority Queue pattern
- Observer pattern (for state changes)

---

## ❓ Questions for Discussion

1. **Priority**: Có cần implement ngay hay defer sau?
2. **Scope**: Full manager hay incremental isActive first?
3. **API**: Prefer declarative (hooks) hay imperative (class methods)?
4. **Testing**: Unit tests đủ hay cần integration tests?
5. **Migration**: All-at-once hay gradual migration?
6. **Backward compat**: Có cần support cả old và new patterns không?

---

## 📄 Appendix: Current Shortcut Inventory

### Global (Always Active)
- `Ctrl+C` - Exit app (NavigationProvider, HomeScreenContent)

### Welcome Screen
- `Enter` - Continue to home
- `C` - Go to config

### HomeNew Screen
- `Shift+Tab` - Toggle permission mode (MVP/Interactive)
- `?` - Toggle help overlay
- `Esc` - Close help / Clear input
- `↑` - Navigate suggestions/history up
- `↓` - Navigate suggestions/history down
- `Tab` - Select suggestion
- `Enter` - Select suggestion

### HomeScreen (Alt UI)
- `Ctrl+C` - Exit app
- `Esc` - Cancel stream (when streaming)

### InputBox Component
- All characters - Add to input
- `Backspace`/`Delete` - Remove character
- `Enter` - Submit input

### ToolPermissionDialog (Future)
- `Tab` - Next button
- `→` - Next button
- `←` - Previous button
- `Enter` - Confirm focused button
- `Y` - Approve
- `N` - Deny
- `A` - Always allow

**Total Unique Shortcuts:** 18 keys/combinations
**Total Handlers:** 7 useInput hooks
**Conflicts Detected:** 2 (Ctrl+C, potential Tab)

---

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Status:** Analysis Complete - Awaiting Decision
