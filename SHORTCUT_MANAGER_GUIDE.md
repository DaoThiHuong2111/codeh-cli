# Shortcut Manager - Hệ Thống Quản Lý Shortcut Tập Trung

## 📋 Tổng Quan

Shortcut Manager là hệ thống quản lý keyboard shortcuts tập trung với layer-based priority system. Nó giải quyết các vấn đề:

- ✅ **Conflict Prevention**: Tự động detect và prevent conflicts
- ✅ **Layer System**: Priority-based execution (Global → Screen → Dialog → Input)
- ✅ **Centralized Management**: Single source of truth cho tất cả shortcuts
- ✅ **Type-Safe**: Full TypeScript support
- ✅ **Easy to Use**: Declarative API với React hooks
- ✅ **Debugging**: Built-in tools để debug và visualize shortcuts

## 🏗️ Architecture

### Layer System

```
┌─────────────────────────────────────┐
│ Layer 4: INPUT (highest priority)  │ ← Text input (InputBox)
├─────────────────────────────────────┤   Blocks all lower layers
│ Layer 3: DIALOG                     │ ← Modal dialogs (ToolPermissionDialog)
├─────────────────────────────────────┤   Blocks screen layer
│ Layer 2: SCREEN                     │ ← Screen shortcuts (Home, Welcome, Config)
├─────────────────────────────────────┤   Default active layer
│ Layer 1: GLOBAL (always active)    │ ← Emergency exits (Ctrl+C)
└─────────────────────────────────────┘   Always receives input
```

**Priority Rules:**
- Higher layers block lower layers
- Global layer ALWAYS receives input (emergency exits)
- Within same layer: priority number or first-match wins
- Handlers can return `true` to stop propagation within same layer

### Execution Flow

```
User presses a key
    ↓
Ink's useInput (in ShortcutProvider)
    ↓
ShortcutManager.handleInput()
    ↓
Parse key combo (e.g., 'ctrl+c', 'escape', 'shift+tab')
    ↓
Find matching shortcuts
    ↓
Filter by active layer
    ↓
Sort by priority (layer priority → shortcut priority)
    ↓
Execute handlers (highest priority first)
    ↓
Stop if handler returns true
```

## 🚀 Quick Start

### 1. Wrap App với ShortcutProvider

```tsx
import {ShortcutProvider} from '../core/input/index.js';

function App() {
  return (
    <ShortcutProvider debug={false}>
      <YourApp />
    </ShortcutProvider>
  );
}
```

### 2. Register Shortcuts với useShortcut

```tsx
import {useShortcut} from '../core/input/index.js';

function MyScreen() {
  const [isLoading, setIsLoading] = useState(false);

  // Simple shortcut
  useShortcut({
    key: '?',
    handler: () => {
      showHelp();
    },
    layer: 'screen',
    description: 'Show help',
  });

  // Conditional shortcut
  useShortcut({
    key: 'escape',
    handler: () => {
      closeDialog();
    },
    layer: 'screen',
    enabled: () => !isLoading,
    description: 'Close dialog',
  });

  // Combination shortcut
  useShortcut({
    key: 'shift+tab',
    handler: () => {
      toggleMode();
    },
    layer: 'screen',
    description: 'Toggle mode',
  });

  return <div>...</div>;
}
```

### 3. Layer Switching

```tsx
import {useLayerSwitch} from '../core/input/index.js';

function Dialog({visible}) {
  // Auto switch to dialog layer when visible
  useLayerSwitch('dialog', visible, 'screen');

  return visible ? <div>Dialog content</div> : null;
}
```

## 📚 API Reference

### ShortcutProvider

Provider component that wraps the app.

```tsx
<ShortcutProvider
  debug={false}           // Enable debug logging
  config={{
    detectConflicts: true,     // Auto-detect conflicts
    globalAlwaysActive: true   // Global layer always active
  }}
>
  <App />
</ShortcutProvider>
```

### useShortcut

Register a single shortcut with automatic cleanup.

```tsx
useShortcut({
  key: 'ctrl+c',                    // Key combination
  handler: () => { ... },           // Handler function
  layer: 'global',                  // Layer: global | screen | dialog | input
  enabled: () => true,              // Optional: condition to enable
  priority: 10,                     // Optional: priority within layer (higher = earlier)
  description: 'Exit app',          // Optional: description for docs
  source: 'MyComponent'             // Optional: source component (for debugging)
});
```

**Key Formats:**
- Single keys: `'a'`, `'?'`, `'escape'`, `'enter'`, `'tab'`
- Arrow keys: `'up'`, `'down'`, `'left'`, `'right'`
- Modifiers: `'ctrl+c'`, `'shift+tab'`, `'meta+k'`
- Multiple modifiers: `'ctrl+shift+p'`

### useShortcuts

Register multiple shortcuts at once.

```tsx
useShortcuts([
  {
    key: '?',
    handler: () => showHelp(),
    layer: 'screen',
  },
  {
    key: 'escape',
    handler: () => closeHelp(),
    layer: 'screen',
  },
]);
```

### useLayerSwitch

Automatically switch active layer based on condition.

```tsx
// Switch to dialog layer when dialog is open
useLayerSwitch('dialog', isDialogOpen, 'screen');

// Switch to input layer when input is focused
useLayerSwitch('input', isInputFocused, 'screen');
```

### useShortcutManager

Access ShortcutManager instance directly (advanced usage).

```tsx
const {manager, setActiveLayer, getActiveLayer} = useShortcutManager();

// Manual layer control
setActiveLayer('dialog');

// Get active shortcuts
const active = manager.getActiveShortcuts();

// Debug state
manager.logState();
```

### useShortcutDebug

Debugging utilities.

```tsx
const {logState, getActiveShortcuts} = useShortcutDebug();

// Log all shortcuts
logState();

// Get active shortcuts
const shortcuts = getActiveShortcuts();
```

## 🎯 Best Practices

### 1. Use Correct Layers

```tsx
// ✅ Good: Global shortcuts for emergency exits
useShortcut({
  key: 'ctrl+c',
  handler: () => exit(),
  layer: 'global',
});

// ✅ Good: Screen shortcuts for navigation
useShortcut({
  key: '?',
  handler: () => showHelp(),
  layer: 'screen',
});

// ✅ Good: Dialog shortcuts for modal actions
useShortcut({
  key: 'enter',
  handler: () => confirmAction(),
  layer: 'dialog',
  enabled: () => dialogVisible,
});

// ❌ Bad: Using screen layer for global action
useShortcut({
  key: 'ctrl+c',
  handler: () => exit(),
  layer: 'screen', // Should be 'global'
});
```

### 2. Use Enabled Conditions

```tsx
// ✅ Good: Conditional shortcuts
useShortcut({
  key: 'enter',
  handler: () => submit(),
  layer: 'screen',
  enabled: () => !isLoading && formValid,
});

// ❌ Bad: Manual checks in handler
useShortcut({
  key: 'enter',
  handler: () => {
    if (isLoading || !formValid) return;
    submit();
  },
  layer: 'screen',
});
```

### 3. Provide Descriptions

```tsx
// ✅ Good: Clear descriptions
useShortcut({
  key: 'shift+tab',
  handler: () => toggleMode(),
  layer: 'screen',
  description: 'Toggle permission mode (MVP/Interactive)',
  source: 'Home',
});

// ❌ Bad: No description
useShortcut({
  key: 'shift+tab',
  handler: () => toggleMode(),
  layer: 'screen',
});
```

### 4. Use Layer Switching

```tsx
// ✅ Good: Auto layer switching
function InputBox({enabled}) {
  useLayerSwitch('input', enabled, 'screen');
  return <input />;
}

// ❌ Bad: Manual layer management
function InputBox({enabled}) {
  const {setActiveLayer} = useShortcutManager();

  useEffect(() => {
    if (enabled) {
      setActiveLayer('input');
    } else {
      setActiveLayer('screen');
    }
  }, [enabled]);

  return <input />;
}
```

## 🔍 Debugging

### Enable Debug Mode

```tsx
<ShortcutProvider debug={true}>
  <App />
</ShortcutProvider>
```

Debug output:
```
[ShortcutManager] Registered: shortcut_1_123 - shift+tab (screen)
[ShortcutManager] Input: "shift+tab"
[ShortcutManager] Executing: shortcut_1_123 - shift+tab (screen)
[ShortcutManager] Layer changed: screen -> dialog
```

### Log Current State

```tsx
const {manager} = useShortcutManager();
manager.logState();
```

Output:
```json
{
  "activeLayer": "screen",
  "totalShortcuts": 15,
  "conflicts": [],
  "layerStates": [
    {"layer": "global", "active": false, "shortcutCount": 1},
    {"layer": "screen", "active": true, "shortcutCount": 8},
    {"layer": "dialog", "active": false, "shortcutCount": 4},
    {"layer": "input", "active": false, "shortcutCount": 2}
  ],
  "shortcuts": [...]
}
```

### Detect Conflicts

Conflicts are automatically detected and logged:

```
[ShortcutManager] Conflict detected for key "escape" in layer "screen":
  ['shortcut_1_123', 'shortcut_2_456']
```

## 📖 Migration Guide

### From useInput to useShortcut

**Before:**
```tsx
useInput((input, key) => {
  if (key.shift && key.tab) {
    toggleMode();
  }
  if (input === '?') {
    showHelp();
  }
  if (key.escape) {
    closeDialog();
  }
});
```

**After:**
```tsx
useShortcut({
  key: 'shift+tab',
  handler: () => toggleMode(),
  layer: 'screen',
});

useShortcut({
  key: '?',
  handler: () => showHelp(),
  layer: 'screen',
});

useShortcut({
  key: 'escape',
  handler: () => closeDialog(),
  layer: 'screen',
});
```

### Components That Keep useInput

Some components should keep using `useInput` directly:
- InputBox (complex text input handling)
- Components using `isActive` flag effectively
- Components with custom input logic

But add layer switching:
```tsx
function InputBox({enabled}) {
  useLayerSwitch('input', enabled, 'screen');

  useInput((input, key) => {
    // Custom input handling
  }, {isActive: enabled});

  return <input />;
}
```

## 🎓 Examples

### Example 1: Welcome Screen

```tsx
function Welcome() {
  const {navigateHome, navigateConfig} = useNavigation();

  useShortcut({
    key: 'enter',
    handler: () => navigateHome(),
    layer: 'screen',
    description: 'Continue to Home',
  });

  useShortcut({
    key: 'c',
    handler: () => navigateConfig(),
    layer: 'screen',
    description: 'Go to Config',
  });

  return <div>Welcome screen</div>;
}
```

### Example 2: Home Screen với Multiple Shortcuts

```tsx
function Home() {
  const [showHelp, setShowHelp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Toggle help
  useShortcut({
    key: '?',
    handler: () => setShowHelp(prev => !prev),
    layer: 'screen',
    enabled: () => !isLoading,
    description: 'Toggle help',
  });

  // Close help
  useShortcut({
    key: 'escape',
    handler: () => setShowHelp(false),
    layer: 'screen',
    enabled: () => showHelp,
    description: 'Close help',
  });

  // Navigation
  useShortcut({
    key: 'up',
    handler: () => navigateUp(),
    layer: 'screen',
    enabled: () => !isLoading,
  });

  useShortcut({
    key: 'down',
    handler: () => navigateDown(),
    layer: 'screen',
    enabled: () => !isLoading,
  });

  return <div>...</div>;
}
```

### Example 3: Dialog với Layer Switching

```tsx
function ToolPermissionDialog({request, onApprove, onDeny}) {
  const [focusedButton, setFocusedButton] = useState('allow');

  // Auto switch to dialog layer
  useLayerSwitch('dialog', !!request, 'screen');

  // Dialog shortcuts
  useShortcut({
    key: 'y',
    handler: () => onApprove(),
    layer: 'dialog',
    enabled: () => !!request,
    description: 'Approve',
  });

  useShortcut({
    key: 'n',
    handler: () => onDeny(),
    layer: 'dialog',
    enabled: () => !!request,
    description: 'Deny',
  });

  useShortcut({
    key: 'tab',
    handler: () => setFocusedButton(next => ...),
    layer: 'dialog',
    enabled: () => !!request,
  });

  if (!request) return null;

  return <div>Dialog...</div>;
}
```

## 🐛 Troubleshooting

### Error: "useShortcutManager must be used within ShortcutProvider"

**Problem:** Trying to use `useShortcut` outside of `ShortcutProvider`.

**Solution:** Wrap your app with `ShortcutProvider`:

```tsx
// app.tsx
function App() {
  return (
    <ShortcutProvider>
      <YourApp />
    </ShortcutProvider>
  );
}
```

### Shortcut Not Working

**Check:**
1. Is the layer active? (`screen` is default)
2. Is the `enabled` condition returning `true`?
3. Is a higher-priority layer blocking it?

**Debug:**
```tsx
const {manager} = useShortcutManager();
console.log('Active layer:', manager.getActiveLayer());
console.log('Active shortcuts:', manager.getActiveShortcuts());
```

### Conflicts Not Detected

**Check:**
1. Are shortcuts in same layer?
2. Is `detectConflicts` enabled? (default: true)

**Enable debug mode:**
```tsx
<ShortcutProvider debug={true} />
```

## 📝 Changelog

### v1.0.0 (2025-11-10)

**Initial Release:**
- ✅ Centralized ShortcutManager with layer system
- ✅ React hooks (useShortcut, useShortcuts, useLayerSwitch)
- ✅ Automatic conflict detection
- ✅ Debug tools and logging
- ✅ Full TypeScript support
- ✅ Migration from scattered useInput hooks completed

**Migrated Components:**
- Global: useExitConfirmation (Ctrl+C exit)
- Home screen: All navigation shortcuts
- HomeScreenContent: Esc cancel stream
- Welcome screen: Enter, C navigation
- InputBox: Layer switching
- ToolPermissionDialog: Layer switching

## 🔗 Related Files

- Core: `source/core/input/`
  - `ShortcutManager.ts` - Core manager class
  - `ShortcutContext.tsx` - React context and hooks
  - `types.ts` - Type definitions
  - `keyParser.ts` - Key parsing utilities
  - `index.ts` - Public API exports

- Usage Examples:
  - `source/cli/hooks/useExitConfirmation.ts`
  - `source/cli/screens/Home.tsx`
  - `source/cli/hooks/useWelcomeLogic.ts`
  - `source/cli/components/molecules/InputBox.tsx`
  - `source/cli/components/molecules/ToolPermissionDialog.tsx`

## 🎉 Summary

Shortcut Manager cung cấp:
- **Centralized Management**: Single source of truth
- **Conflict Prevention**: Automatic detection
- **Layer System**: Priority-based execution
- **Easy to Use**: Declarative API
- **Type-Safe**: Full TypeScript
- **Debuggable**: Built-in tools

**Before:**
- 6-7 scattered `useInput` hooks
- No conflict detection
- Hard to debug
- No priority system

**After:**
- Centralized ShortcutManager
- Automatic conflict detection
- Layer-based priority
- Easy debugging
- Scalable architecture

🚀 **Ready to use!**
