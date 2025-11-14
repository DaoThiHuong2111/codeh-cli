# Shortcut System Architecture

> Consolidated from: SHORTCUT_ARCHITECTURE_VISUAL.md, SHORTCUT_MANAGER_GUIDE.md, SHORTCUT_MANAGEMENT_ANALYSIS.md, SHORTCUT_MANAGER_IMPLEMENTATION.md

## 📋 Overview

The Shortcut Manager is a centralized keyboard shortcut management system with layer-based priority. It provides:

- ✅ **Conflict Prevention** - Automatic conflict detection and prevention
- ✅ **Layer System** - Priority-based execution (Global → Screen → Dialog → Input)
- ✅ **Centralized Management** - Single source of truth for all shortcuts
- ✅ **Type-Safe** - Full TypeScript support
- ✅ **Easy to Use** - Declarative API with React hooks
- ✅ **Debugging** - Built-in tools to debug and visualize shortcuts

---

## 🏗️ Architecture

### Layer System

The shortcut system uses a 4-layer priority hierarchy:

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
1. Higher layers block lower layers
2. Global layer ALWAYS receives input (for emergency exits)
3. Within same layer: priority number or first-match wins
4. Handlers can return `true` to stop propagation within same layer

### Component Tree

```
┌──────────────────────────────────────────────────────────────┐
│                         App Root                             │
│                  ┌──────────────────┐                        │
│                  │ ShortcutManager  │ ← Single Source of Truth│
│                  │   [Registry]     │                        │
│                  └──────────────────┘                        │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    [Single useInput Hook]
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│              Priority Layer System                           │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Layer 4: INPUT (Highest Priority)                  │    │
│  │ - Text input in focused components                 │    │
│  │ - Blocks all lower layers when active              │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Layer 3: DIALOG                                     │    │
│  │ - Modal dialogs (ToolPermissionDialog)             │    │
│  │ - Blocks screen layer when active                  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Layer 2: SCREEN                                     │    │
│  │ - Screen-specific shortcuts                        │    │
│  │ - Help (?), History (↑↓), Mode (Shift+Tab)        │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Layer 1: GLOBAL (Always Active)                    │    │
│  │ - Ctrl+C to exit                                   │    │
│  │ - Never blocked                                    │    │
│  └────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

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

---

## 🚀 Quick Start

### 1. Wrap App with ShortcutProvider

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

### 2. Register Shortcuts with useShortcut

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

  // High priority shortcut
  useShortcut({
    key: 'ctrl+c',
    handler: () => {
      emergencyExit();
    },
    layer: 'global',
    priority: 1000,
    description: 'Emergency exit',
  });

  return <div>...</div>;
}
```

### 3. Use ShortcutContext for Layer Control

```tsx
import {useShortcutContext} from '../core/input/index.js';

function InputBox() {
  const {setActiveLayer} = useShortcutContext();

  return (
    <TextInput
      onFocus={() => setActiveLayer('input')}
      onBlur={() => setActiveLayer('screen')}
    />
  );
}
```

---

## 📚 API Reference

### ShortcutProvider

Context provider that manages shortcut registration and execution.

```tsx
interface ShortcutProviderProps {
  children: React.ReactNode;
  debug?: boolean; // Enable debug logging
}
```

### useShortcut Hook

Register a shortcut for your component.

```tsx
interface ShortcutConfig {
  key: string;                    // Key combination (e.g., 'ctrl+c', '?')
  handler: () => boolean | void;  // Handler function (return true to stop propagation)
  layer: ShortcutLayer;           // 'global' | 'screen' | 'dialog' | 'input'
  enabled?: () => boolean;        // Optional condition to enable shortcut
  priority?: number;              // Optional priority (higher = first)
  description?: string;           // Optional description for help
}

useShortcut(config: ShortcutConfig): void;
```

### useShortcutContext Hook

Access shortcut context for layer control.

```tsx
interface ShortcutContextValue {
  activeLayer: ShortcutLayer;
  setActiveLayer: (layer: ShortcutLayer) => void;
  getShortcuts: (layer?: ShortcutLayer) => ShortcutInfo[];
}

useShortcutContext(): ShortcutContextValue;
```

---

## 🎯 Usage Examples

### Example 1: Global Shortcuts (Always Active)

```tsx
function NavigationProvider() {
  useShortcut({
    key: 'ctrl+c',
    handler: () => {
      process.exit(0);
    },
    layer: 'global',
    priority: 1000,
    description: 'Exit application',
  });

  return <>{children}</>;
}
```

### Example 2: Screen Shortcuts

```tsx
function HomeScreen() {
  const [showHelp, setShowHelp] = useState(false);

  useShortcut({
    key: '?',
    handler: () => {
      setShowHelp(!showHelp);
    },
    layer: 'screen',
    description: 'Toggle help',
  });

  useShortcut({
    key: 'shift+tab',
    handler: () => {
      togglePermissionMode();
    },
    layer: 'screen',
    enabled: () => !isLoading,
    description: 'Toggle permission mode',
  });

  return <div>...</div>;
}
```

### Example 3: Dialog Shortcuts

```tsx
function ToolPermissionDialog({onApprove, onReject}) {
  useShortcut({
    key: 'y',
    handler: () => {
      onApprove();
      return true; // Stop propagation
    },
    layer: 'dialog',
    description: 'Approve',
  });

  useShortcut({
    key: 'n',
    handler: () => {
      onReject();
      return true;
    },
    layer: 'dialog',
    description: 'Reject',
  });

  return <div>...</div>;
}
```

### Example 4: Input Layer

```tsx
function InputBox() {
  const {setActiveLayer} = useShortcutContext();
  const [value, setValue] = useState('');

  return (
    <TextInput
      value={value}
      onChange={setValue}
      onFocus={() => setActiveLayer('input')}
      onBlur={() => setActiveLayer('screen')}
    />
  );
}
```

---

## 🐛 Debugging

### Enable Debug Mode

```tsx
<ShortcutProvider debug={true}>
  <App />
</ShortcutProvider>
```

Debug output includes:
- Registered shortcuts per layer
- Active layer changes
- Key press events
- Matched shortcuts
- Execution results

### Get All Shortcuts

```tsx
const {getShortcuts} = useShortcutContext();

// Get all shortcuts
const all = getShortcuts();

// Get shortcuts for specific layer
const screenShortcuts = getShortcuts('screen');
```

---

## 🔧 Implementation Details

### ShortcutManager Class

**Location:** `source/core/input/ShortcutManager.ts`

Key methods:
```typescript
class ShortcutManager {
  register(config: ShortcutConfig): string;
  unregister(id: string): void;
  handleInput(key: string): boolean;
  setActiveLayer(layer: ShortcutLayer): void;
  getShortcuts(layer?: ShortcutLayer): ShortcutInfo[];
}
```

### ShortcutProvider Component

**Location:** `source/core/input/ShortcutProvider.tsx`

Provides:
- Shortcut registration context
- Single `useInput` hook from Ink
- Layer management state
- Debug logging

### Key Parsing

Supported key formats:
- Single keys: `'a'`, `'?'`, `'escape'`
- Modifiers: `'ctrl+c'`, `'shift+tab'`, `'alt+f4'`
- Special keys: `'return'`, `'upArrow'`, `'downArrow'`, `'leftArrow'`, `'rightArrow'`
- Meta key: `'meta+k'` (Cmd on Mac, Win on Windows)

---

## 📊 Current Shortcuts by Screen

### Global (Always Active)
| Key | Action | Priority |
|-----|--------|----------|
| Ctrl+C | Exit application | 1000 |

### Home Screen
| Key | Action | Condition |
|-----|--------|-----------|
| ? | Toggle help | Always |
| Esc | Close help / Clear input | Conditional |
| Shift+Tab | Toggle permission mode | When not loading |
| ↑ | Previous command | When no suggestions |
| ↓ | Next command | When no suggestions |

### Welcome Screen
| Key | Action |
|-----|--------|
| Enter | Start setup |
| c | Continue to home |

### Config Screen
| Key | Action |
|-----|--------|
| Esc | Go back |
| s | Save configuration |

---

## ✅ Best Practices

### 1. Choose the Right Layer

- **Global**: Emergency exits, app-wide actions
- **Screen**: Screen-specific navigation and actions
- **Dialog**: Modal dialog confirmations
- **Input**: Text input (auto-managed by InputBox)

### 2. Use Conditional Shortcuts

```tsx
// ✅ Good - Conditional based on state
useShortcut({
  key: 'escape',
  enabled: () => showHelp,
  handler: closeHelp,
  layer: 'screen',
});

//  Bad - Manually checking in handler
useShortcut({
  key: 'escape',
  handler: () => {
    if (showHelp) closeHelp();
  },
  layer: 'screen',
});
```

### 3. Return True to Stop Propagation

```tsx
useShortcut({
  key: 'y',
  handler: () => {
    handleApproval();
    return true; // Stop other 'y' handlers
  },
  layer: 'dialog',
});
```

### 4. Use Descriptive Keys

```tsx
// ✅ Good
useShortcut({key: '?', description: 'Show help', ...});

//  Bad
useShortcut({key: '?', ...}); // No description
```

---

## 🔍 Troubleshooting

### Problem: Shortcut not firing

**Solution:**
1. Check if layer is active: Use debug mode
2. Verify key format: `'ctrl+c'` not `'Ctrl+C'`
3. Check `enabled` condition
4. Check if blocked by higher layer

### Problem: Multiple handlers firing

**Solution:**
1. Return `true` from handler to stop propagation
2. Use higher priority for important handlers
3. Check layer assignment

### Problem: Input not working

**Solution:**
1. Ensure active layer is `'input'`
2. Check `setActiveLayer('input')` on focus
3. Reset to `'screen'` on blur

---

## 📝 Migration Guide

### From Old useInput to useShortcut

**Before:**
```tsx
useInput((input, key) => {
  if (key.ctrl && input === 'c') {
    exit();
  }
  if (input === '?') {
    toggleHelp();
  }
});
```

**After:**
```tsx
useShortcut({
  key: 'ctrl+c',
  handler: exit,
  layer: 'global',
});

useShortcut({
  key: '?',
  handler: toggleHelp,
  layer: 'screen',
});
```

---

## 🚀 Future Enhancements

- [ ] Shortcut chords (e.g., `'g' → 'h'` for GitHub)
- [ ] Vim-style modes (normal, insert, visual)
- [ ] Customizable keybindings
- [ ] Shortcut help overlay component
- [ ] Recording and replay for testing

---

## 📚 Related Documentation

- [Keyboard Shortcuts Guide](../guides/keyboard-shortcuts.md) - Complete list of all shortcuts
- [UI Components Guide](../guides/ui-components.md) - UI components using shortcuts
- [Development Guide](../guides/development.md) - Development workflow
