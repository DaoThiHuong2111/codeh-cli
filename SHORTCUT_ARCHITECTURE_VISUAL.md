# Shortcut Architecture - Visual Guide

## 🎨 Current State Visualization

### Component Tree với useInput Hooks

```
┌──────────────────────────────────────────────────────────────┐
│                         App Root                             │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                  NavigationProvider                          │
│                  [useInput: Ctrl+C]                          │
│                  isActive: ❌ No (always on)                 │
└──────────────────────────────────────────────────────────────┘
                              │
                 ┌────────────┴────────────┐
                 │                         │
                 ▼                         ▼
    ┌────────────────────────┐   ┌────────────────────────┐
    │    Welcome Screen      │   │     HomeNew Screen     │
    │  [useWelcomeLogic]     │   │  [useInput: multiple]  │
    │  useInput: Enter, C    │   │  isActive: ❌ No       │
    │  isActive: ❌ No        │   └────────────────────────┘
    └────────────────────────┘              │
                                            │
                        ┌───────────────────┼───────────────────┐
                        │                   │                   │
                        ▼                   ▼                   ▼
            ┌─────────────────┐ ┌─────────────────┐ ┌──────────────────┐
            │    InputBox     │ │ ConversationArea│ │ToolPermission    │
            │  [useInput]     │ │                 │ │    Dialog        │
            │  isActive: ✅    │ │                 │ │  [useInput]      │
            │  enabled check  │ │                 │ │  isActive: ✅     │
            └─────────────────┘ └─────────────────┘ │  !!request       │
                                                     └──────────────────┘
```

### Input Flow (Current State)

```
User Presses Key
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│                  Ink Runtime (stdin)                         │
└──────────────────────────────────────────────────────────────┘
       │
       ├─────────────────────────────────────────────────┐
       │                                                 │
       ▼                                                 ▼
[NavigationProvider Hook]                    [Welcome/HomeNew Hook]
   if (Ctrl+C) → exit                           if (?) → toggleHelp
   ALWAYS ACTIVE                                ALWAYS ACTIVE
       │                                                 │
       └─────────────────┬───────────────────────────────┘
                         │
                         ▼
              [Component-Level Hooks]
                InputBox (isActive check)
                ToolPermissionDialog (isActive check)

⚠️  PROBLEM: Multiple handlers can fire for same key!
⚠️  NO priority system to prevent conflicts!
```

---

## 🎯 Proposed Solution: Shortcut Manager

### New Architecture

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
│  │ - Screen-specific shortcuts (HomeNew, Welcome)     │    │
│  │ - Active when no dialog/input above                │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Layer 1: GLOBAL (Lowest, Always Active)            │    │
│  │ - Emergency shortcuts (Ctrl+C)                     │    │
│  │ - Never blocked                                    │    │
│  └────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

### Input Flow (With Manager)

```
User Presses Key (e.g., Tab)
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│              Ink Runtime (stdin)                             │
└──────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│         Single useInput Hook (in App Root)                   │
│         Delegates to ShortcutManager                         │
└──────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│                   ShortcutManager                            │
│                                                              │
│  1. Check INPUT layer (highest priority)                    │
│     ├─ InputBox focused? → Handle character input           │
│     └─ Not focused → Continue                               │
│                                                              │
│  2. Check DIALOG layer                                      │
│     ├─ Dialog visible? → Handle dialog shortcuts            │
│     │   (Tab → navigate buttons, Y/N/A → actions)           │
│     └─ No dialog → Continue                                 │
│                                                              │
│  3. Check SCREEN layer                                      │
│     ├─ Match screen shortcut? → Execute handler             │
│     │   (Shift+Tab → toggle mode, ? → help)                 │
│     └─ No match → Continue                                  │
│                                                              │
│  4. Check GLOBAL layer (always checked)                     │
│     └─ Ctrl+C → Exit app                                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘

✅ BENEFIT: Only ONE handler fires per key!
✅ BENEFIT: Priority automatically enforced!
✅ BENEFIT: Easy to debug (log active layer)!
```

---

## 📋 Registry Structure

### Shortcut Definition

```
┌─────────────────────────────────────────────────────────┐
│                  ShortcutDefinition                     │
├─────────────────────────────────────────────────────────┤
│ key:         'shift+tab' | '?' | 'escape' | 'ctrl+c'   │
│ handler:     () => void                                 │
│ layer:       'global' | 'screen' | 'dialog' | 'input'  │
│ enabled:     () => boolean (conditional check)          │
│ description: 'Toggle permission mode' (for docs)        │
└─────────────────────────────────────────────────────────┘
```

### Registry Map

```
Map<ShortcutLayer, ShortcutDefinition[]>
     │
     ├─ 'global'  → [Ctrl+C: exit]
     │
     ├─ 'screen'  → [Shift+Tab: toggle mode,
     │               ?: help,
     │               Esc: close/clear,
     │               ↑/↓: navigate]
     │
     ├─ 'dialog'  → [Tab: next button,
     │               ←/→: navigate,
     │               Enter: confirm,
     │               Y/N/A: actions]
     │
     └─ 'input'   → [all chars: type,
                     Backspace: delete,
                     Enter: submit]
```

---

## 🔄 State Transitions

### Layer Activation Flow

```
State: Normal Screen
┌────────────────────────┐
│  Active Layer: SCREEN  │
│  Shortcuts:            │
│  - Shift+Tab           │
│  - ?                   │
│  - Esc                 │
└────────────────────────┘
            │
            │ User opens ToolPermissionDialog
            ▼
┌────────────────────────┐
│  Active Layer: DIALOG  │ ← Screen shortcuts disabled!
│  Shortcuts:            │
│  - Tab                 │
│  - Y/N/A               │
│  - Enter               │
└────────────────────────┘
            │
            │ User clicks Allow/Deny
            ▼
┌────────────────────────┐
│  Active Layer: SCREEN  │ ← Back to screen shortcuts
│  Shortcuts:            │
│  - Shift+Tab           │
│  - ?                   │
│  - Esc                 │
└────────────────────────┘
            │
            │ User focuses InputBox
            ▼
┌────────────────────────┐
│  Active Layer: INPUT   │ ← All shortcuts disabled except input!
│  Shortcuts:            │
│  - Character input     │
│  - Backspace           │
│  - Enter               │
└────────────────────────┘
            │
            │ User submits / unfocuses
            ▼
┌────────────────────────┐
│  Active Layer: SCREEN  │
└────────────────────────┘

Note: GLOBAL layer (Ctrl+C) always active in all states!
```

---

## 🔍 Conflict Resolution Examples

### Example 1: Tab Key

#### Current State (Problematic)
```
User presses Tab:

HomeNew.tsx useInput:
   if (key.tab && hasSuggestions) {
      handleSuggestionSelect();  // ← Fires!
   }

ToolPermissionDialog.tsx useInput:
   if (key.tab) {
      navigateButtons();  // ← Also fires! 🔴 CONFLICT!
   }

Result: BOTH execute → undefined behavior
```

#### With Manager (Fixed)
```
User presses Tab:

ShortcutManager checks layers (highest to lowest):

1. INPUT layer: Not active → Continue
2. DIALOG layer:
   - Dialog visible? Yes!
   - Tab shortcut registered? Yes!
   - Execute: navigateButtons()  ✅
   - STOP (don't check lower layers)

3. SCREEN layer: SKIPPED (dialog active)
4. GLOBAL layer: SKIPPED (already handled)

Result: Only navigateButtons() executes ✅
```

---

### Example 2: Esc Key

#### Current State (Confusing)
```
User presses Esc:

HomeNew.tsx:
   if (key.escape) {
      if (showHelp) toggleHelp();        // Logic 1
      else if (input) clearInput();      // Logic 2
   }

HomeScreenContent.tsx:
   if (key.escape && isStreaming) {
      cancelStream();  // Logic 3
   }

Result: All logic executes in some order
        → Depends on component render order
        → Hard to predict
```

#### With Manager (Clear)
```
User presses Esc:

ShortcutManager:
   Current layer: SCREEN

   Registered handler:
   {
      key: 'escape',
      handler: () => {
         if (showHelp) return toggleHelp();
         if (input) return clearInput();
         if (isStreaming) return cancelStream();
      },
      layer: 'screen'
   }

Result: Single clear execution path ✅
        All logic in one place
        Easy to understand priority:
        1. Close help (highest)
        2. Clear input (medium)
        3. Cancel stream (lowest)
```

---

## 📊 Before/After Comparison

### Shortcut Handling Complexity

```
BEFORE (Current):
================
useInput hooks: 6 separate hooks
Coordination:   Manual, error-prone
State tracking: Scattered across components
Debugging:      Must trace through all hooks
Conflicts:      Undetected until runtime
Documentation:  Manual, can drift

Lines of code:  ~150 (scattered)
Complexity:     High (n² interactions)
```

```
AFTER (With Manager):
====================
useInput hooks: 1 centralized hook
Coordination:   Automatic via layer system
State tracking: Centralized in manager
Debugging:      Single log point, clear state
Conflicts:      Prevented by design
Documentation:  Auto-generated from registry

Lines of code:  ~200 (but organized)
Complexity:     Low (linear execution)
```

---

## 🎓 Developer Experience

### Adding New Shortcut (Before)

```typescript
// Step 1: Find the right component
// Step 2: Add useInput hook
useInput((input, key) => {
  if (key.ctrl && input === 'x') {
    // New shortcut
  }
  // ... existing shortcuts ...
});
// Step 3: Check for conflicts manually
// Step 4: Update docs manually
// Step 5: Test all interactions manually
```

**Pain points:**
- 😰 Where should I add this?
- 😰 Will it conflict with existing shortcuts?
- 😰 Do I need isActive?
- 😰 Did I update the docs?

---

### Adding New Shortcut (After)

```typescript
// Step 1: Register in appropriate place
const shortcutManager = useShortcutManager();

useEffect(() => {
  shortcutManager.register({
    key: 'ctrl+x',
    handler: () => { /* action */ },
    layer: 'screen',  // ← Clear which layer
    enabled: () => !loading,  // ← Clear conditions
    description: 'Do something'  // ← Auto-docs!
  });

  return () => shortcutManager.unregister('ctrl+x', 'screen');
}, []);

// Step 2: Run dev tools to check
// Press ` to see active shortcuts
// No conflicts shown! ✅

// Step 3: Docs auto-updated from registry
```

**Benefits:**
- 😊 Clear where to register
- 😊 Conflicts auto-detected
- 😊 isActive logic in one place
- 😊 Docs auto-generated

---

## 🛠️ Debug Tools Visualization

### Shortcut Visualizer (Press ` to show)

```
┌──────────────────────────────────────────────────────────────┐
│              Active Shortcuts (Screen Layer)                 │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  GLOBAL (always active):                                     │
│    Ctrl+C          Exit application                          │
│                                                              │
│  SCREEN (current layer):                                     │
│    Shift+Tab       Toggle permission mode (MVP/Interactive)  │
│    ?               Toggle help overlay                       │
│    Esc             Close help / Clear input                  │
│    ↑               Navigate up                               │
│    ↓               Navigate down                             │
│    Tab             Select suggestion                         │
│    Enter           Confirm selection                         │
│                                                              │
│  DIALOG (inactive):                                          │
│    Tab             Next button                               │
│    ←/→             Navigate buttons                          │
│    Enter           Confirm                                   │
│    Y/N/A           Quick actions                             │
│                                                              │
│  INPUT (inactive):                                           │
│    (all keys)      Text input                                │
│                                                              │
│  Press ` again to close                                      │
└──────────────────────────────────────────────────────────────┘
```

### Layer Transition Logger

```
[ShortcutManager] Layer changed: SCREEN → DIALOG
[ShortcutManager] Disabled 7 screen shortcuts
[ShortcutManager] Enabled 6 dialog shortcuts
[ShortcutManager] Active shortcuts:
  - GLOBAL: Ctrl+C (always active)
  - DIALOG: Tab, ←, →, Enter, Y, N, A

[ShortcutManager] Input received: Tab
[ShortcutManager] Checking INPUT layer: inactive
[ShortcutManager] Checking DIALOG layer: active
[ShortcutManager] Match found: Tab → navigateButtons()
[ShortcutManager] Executed: navigateButtons() (2ms)
[ShortcutManager] Stopped (higher layer handled)
```

---

## 📈 Migration Path

### Phase-by-Phase Visualization

```
Phase 0: Current State
┌───────────────────────────────────────────┐
│  6 useInput hooks                         │
│  Scattered logic                          │
│  Manual coordination                      │
│  Conflicts possible                       │
└───────────────────────────────────────────┘

Phase 1: Create Manager (No Changes)
┌───────────────────────────────────────────┐
│  ShortcutManager implemented              │
│  Tests written                            │
│  API documented                           │
│  ← Old code still works!                  │
└───────────────────────────────────────────┘

Phase 2: Migrate Global Layer
┌───────────────────────────────────────────┐
│  Ctrl+C in manager                        │
│  NavigationProvider cleaned up            │
│  5 hooks remain                           │
└───────────────────────────────────────────┘

Phase 3: Migrate Screens
┌───────────────────────────────────────────┐
│  HomeNew shortcuts in manager             │
│  Welcome shortcuts in manager             │
│  3 hooks remain                           │
└───────────────────────────────────────────┘

Phase 4: Migrate Dialog Layer
┌───────────────────────────────────────────┐
│  ToolPermissionDialog in manager          │
│  2 hooks remain (InputBox + manager)      │
└───────────────────────────────────────────┘

Phase 5: Dev Tools
┌───────────────────────────────────────────┐
│  Visualizer added                         │
│  Logger added                             │
│  Docs auto-generated                      │
│  ✅ Complete!                             │
└───────────────────────────────────────────┘
```

---

## 🎯 Summary Diagram

```
CURRENT STATE:                    PROPOSED STATE:
=============                     ===============

Multiple useInput hooks      →    Single useInput + Manager
No coordination             →    Automatic layers
Manual state tracking       →    Centralized registry
Conflicts possible          →    Conflicts prevented
Hard to debug              →    Easy debug tools
Scattered docs             →    Auto-generated docs

Technical Debt: HIGH        →    Technical Debt: LOW
Maintainability: POOR       →    Maintainability: EXCELLENT
Scalability: LIMITED        →    Scalability: GREAT
```

---

**Document Version:** 1.0
**Visual Guide For:** SHORTCUT_MANAGEMENT_ANALYSIS.md
**Created:** 2025-11-10
