# Keyboard Shortcuts Guide

Danh sách đầy đủ tất cả keyboard shortcuts trong project, được tổ chức theo màn hình và context.

---

## 🌐 Global Shortcuts (Toàn Ứng Dụng)

| Shortcut | Chức Năng | Context | File |
|----------|-----------|---------|------|
| **Ctrl+C** | Thoát ứng dụng | Bất kỳ đâu | NavigationProvider.tsx |

---

## 🏠 Home Screen (HomeNew.tsx)

### Core Navigation

| Shortcut | Chức Năng | Context | Ghi Chú |
|----------|-----------|---------|---------|
| **Shift+Tab** | Toggle Permission Mode | Bất kỳ lúc nào | Chuyển giữa MVP (🚀) và Interactive (🔒) |
| **?** | Toggle Help Overlay | Khi không loading | Hiển thị/ẩn help menu |
| **Esc** | Multi-purpose | Conditional | - Đóng help nếu đang mở<br>- Clear input nếu có text |

### Slash Command Suggestions

Khi đang gõ slash command (ví dụ: `/help`, `/config`):

| Shortcut | Chức Năng | Ghi Chú |
|----------|-----------|---------|
| **↑ (Up Arrow)** | Navigate up in suggestions | Di chuyển lên item trước |
| **↓ (Down Arrow)** | Navigate down in suggestions | Di chuyển xuống item sau |
| **Enter** | Select suggestion | Chọn suggestion đang focus |
| **Tab** | Select suggestion | Tương tự Enter |

### Input History Navigation

Khi KHÔNG có suggestions và KHÔNG loading:

| Shortcut | Chức Năng | Ghi Chú |
|----------|-----------|---------|
| **↑ (Up Arrow)** | Previous command | Quay lại lệnh trước đó |
| **↓ (Down Arrow)** | Next command | Tiến tới lệnh tiếp theo |

---

## 🎨 HomeScreen (Presentation Layer - HomeScreenContent.tsx)

Alternative implementation của Home screen với shortcuts khác:

| Shortcut | Chức Năng | Context | Ghi Chú |
|----------|-----------|---------|---------|
| **Ctrl+C** | Exit app | Bất kỳ lúc nào | Thoát ứng dụng |
| **Ctrl+L** | Clear history | Bất kỳ lúc nào | Xóa toàn bộ lịch sử chat |
| **Esc** | Cancel stream | Khi đang streaming | Hủy bỏ response đang stream |

**Placeholder text:** `"Type your message... (Ctrl+L: clear, Esc: cancel)"`

---

## 🔧 Tool Permission Dialog (ToolPermissionDialog.tsx)

Khi dialog yêu cầu permission xuất hiện (Interactive Mode):

### Button Navigation

| Shortcut | Chức Năng | Ghi Chú |
|----------|-----------|---------|
| **Tab** | Next button | Allow → Deny → Always → Allow |
| **→ (Right Arrow)** | Next button | Tương tự Tab |
| **← (Left Arrow)** | Previous button | Always → Deny → Allow → Always |

### Direct Actions

| Shortcut | Chức Năng | Button Equivalent | Ghi Chú |
|----------|-----------|-------------------|---------|
| **Enter** | Confirm focused button | - | Execute action của button đang focus |
| **Y** | Approve | Allow | Cho phép tool execution |
| **N** | Deny | Deny | Từ chối tool execution |
| **A** | Always Allow | Always | Approve và lưu pre-approval |

**Visual Layout:**
```
┌──────────────────────────────────────────────┐
│ 🔧 Tool Execution Permission Required       │
│ Tool: shell                                  │
│ Arguments: {...}                             │
│                                              │
│ ┌─────────────┐ ┌────────────┐ ┌──────────┐│
│ │ ✓ Allow (Y) │ │ ✗ Deny (N) │ │ ✓ Always││
│ └─────────────┘ └────────────┘ └──────────┘│
└──────────────────────────────────────────────┘
```

---

## 👋 Welcome Screen (useWelcomeLogic.ts)

| Shortcut | Chức Năng | Ghi Chú |
|----------|-----------|---------|
| **Enter** | Continue to Home | Vào Home screen |
| **C** | Go to Config | Vào Config screen |

---

## 📊 Tổng Hợp Shortcuts Theo Chức Năng

### Navigation & Screen Control

| Shortcut | Chức Năng | Screen |
|----------|-----------|--------|
| Ctrl+C | Exit app | Global |
| Enter | Continue/Proceed | Welcome |
| C | Config screen | Welcome |
| ? | Toggle help | HomeNew |
| Esc | Close/Clear/Cancel | HomeNew, HomeScreen |

### Permission Management

| Shortcut | Chức Năng | Screen |
|----------|-----------|--------|
| **Shift+Tab** | **Toggle Permission Mode** | **HomeNew** |
| Y | Approve tool | ToolPermissionDialog |
| N | Deny tool | ToolPermissionDialog |
| A | Always allow tool | ToolPermissionDialog |

### History & Suggestions

| Shortcut | Chức Năng | Screen | Context |
|----------|-----------|--------|---------|
| ↑ | Previous/Up | HomeNew | Suggestions hoặc History |
| ↓ | Next/Down | HomeNew | Suggestions hoặc History |
| Tab | Select suggestion | HomeNew | Trong suggestions |
| Enter | Confirm/Select | HomeNew, Dialog | - |

### Content Management

| Shortcut | Chức Năng | Screen |
|----------|-----------|--------|
| Ctrl+L | Clear history | HomeScreen |
| Esc | Cancel stream | HomeScreen (khi streaming) |

---

## 🎯 Context-Aware Behavior

### Esc Key (Multi-purpose)

**HomeNew:**
1. Nếu help đang mở → Đóng help overlay
2. Nếu có text trong input → Clear input
3. Otherwise → Không làm gì

**HomeScreen:**
1. Nếu đang streaming → Cancel stream
2. Otherwise → Không làm gì

### Up/Down Arrows (Context-dependent)

**HomeNew:**
1. Nếu có slash suggestions → Navigate trong suggestions
2. Nếu KHÔNG có suggestions và KHÔNG loading → Navigate trong input history
3. Otherwise → Không làm gì

### Tab Key

**HomeNew:**
1. Nếu có slash suggestions → Select suggestion
2. Otherwise → Không làm gì (default behavior)

**ToolPermissionDialog:**
1. Navigate giữa các buttons (Allow/Deny/Always)

**Shift+Tab (HomeNew):**
1. Toggle Permission Mode (MVP ↔ Interactive)

---

## 🔍 Shortcuts By Frequency

### Thường Dùng Nhất

| Shortcut | Chức Năng | Tần Suất |
|----------|-----------|----------|
| **Shift+Tab** | Toggle permission mode | ⭐⭐⭐⭐⭐ |
| **Enter** | Submit/Confirm | ⭐⭐⭐⭐⭐ |
| **Esc** | Cancel/Close/Clear | ⭐⭐⭐⭐ |
| **↑/↓** | Navigate suggestions/history | ⭐⭐⭐⭐ |
| **?** | Toggle help | ⭐⭐⭐ |

### Dành Cho Power Users

| Shortcut | Chức Năng | Use Case |
|----------|-----------|----------|
| Ctrl+L | Clear history | Khi muốn reset conversation |
| Y/N/A | Quick approve/deny | Trong Interactive mode |
| Tab/Arrow | Navigate buttons | Trong dialogs |

### Emergency/Exit

| Shortcut | Chức Năng | Ghi Chú |
|----------|-----------|---------|
| Ctrl+C | Force exit | Thoát ngay lập tức |

---

## 💡 Pro Tips

### 1. **Mode Switching Workflow**
```bash
# Development: Dùng MVP mode (fast)
[Shift+Tab to MVP] → Code/Test quickly

# Before committing: Switch to Interactive (safe)
[Shift+Tab to Interactive] → Verify tool executions
```

### 2. **Slash Command Efficiency**
```bash
Type: /h
[↓] to navigate
[Enter] to select
# Faster than typing full command
```

### 3. **Quick Tool Approval**
```bash
# Trong Interactive mode, thay vì:
[Tab] → [Tab] → [Enter]

# Dùng shortcut:
[Y] # Immediate approval
```

### 4. **History Navigation**
```bash
# Reuse previous commands:
[↑] → Find command
[Enter] → Re-execute
```

---

## 🎨 Visual Hints trong UI

### Footer Shortcuts Displayed
```
Model: claude | Messages: 5 | 🚀 MVP (Shift+Tab)
```

### Input Box Placeholders
```
HomeNew: "Ask me anything... (type / for commands)"
HomeScreen: "Type your message... (Ctrl+L: clear, Esc: cancel)"
```

### Help Overlay Hints
```
Press ? for help | Ctrl+C to exit
```

### Dialog Button Labels
```
[✓ Allow (Y)]  [✗ Deny (N)]  [✓ Always (A)]
```

---

## 📱 Keyboard Layout Support

### Standard Keys
- ✅ Letters: Y, N, A, C, ?
- ✅ Arrows: ↑, ↓, →, ←
- ✅ Special: Tab, Shift, Ctrl, Esc, Enter

### No Special Requirements
- ❌ Không cần function keys (F1-F12)
- ❌ Không cần numpad
- ❌ Không cần meta/command keys

**Compatible với:** Mac, Linux, Windows terminals

---

## 🔧 Implementation Details

### Shortcut Registration Locations

| File | Component | Shortcuts |
|------|-----------|-----------|
| `NavigationProvider.tsx` | Global handler | Ctrl+C |
| `HomeNew.tsx` | Main screen | Shift+Tab, ?, Esc, ↑/↓, Tab, Enter |
| `HomeScreenContent.tsx` | Alt screen | Ctrl+C, Ctrl+L, Esc |
| `ToolPermissionDialog.tsx` | Dialog | Tab, ←/→, Enter, Y/N/A |
| `useWelcomeLogic.ts` | Welcome screen | Enter, C |

### Input Handling Framework

**Ink's useInput hook:**
```typescript
useInput((input: string, key: KeyboardKey) => {
  // input: character pressed
  // key: object with modifiers (ctrl, shift, etc.) and special keys
});
```

---

## ⚠️ Known Behaviors

### Shift+Tab Special Case
- **In most terminals:** Tab moves focus forward, Shift+Tab moves backward
- **In our app:** Shift+Tab triggers Permission Mode toggle
- **Impact:** Không conflict vì không có tab-navigable elements ở top level

### Esc Key Priority
- **Help has priority** - Nếu help đang mở, Esc đóng help trước
- **Then input** - Nếu không có help nhưng có text, Esc clear input
- **Last stream cancellation** (trong HomeScreen)

### Arrow Keys Context
- **Suggestions mode:** Navigate trong suggestions list
- **Normal mode:** Navigate trong input history
- **Never both at once**

---

## 📚 Related Files

- **Implementation:**
  - `source/cli/screens/HomeNew.tsx`
  - `source/presentation/screens/HomeScreen/HomeScreenContent.tsx`
  - `source/cli/components/molecules/ToolPermissionDialog.tsx`
  - `source/cli/providers/NavigationProvider.tsx`
  - `source/cli/hooks/useWelcomeLogic.ts`

- **Documentation:**
  - `MODE_SWITCHING_GUIDE.md` - Permission modes chi tiết
  - `UI_COMPONENTS_GUIDE.md` - UI components và interactions

---

## 🎉 Quick Reference Card

```
╔════════════════════════════════════════════════════════════╗
║              CODEH CLI - KEYBOARD SHORTCUTS                ║
╠════════════════════════════════════════════════════════════╣
║  GLOBAL                                                    ║
║  Ctrl+C          Exit application                          ║
╠════════════════════════════════════════════════════════════╣
║  HOME SCREEN                                               ║
║  Shift+Tab       Toggle Permission Mode (MVP/Interactive)  ║
║  ?               Toggle help overlay                       ║
║  Esc             Close help / Clear input                  ║
║  ↑/↓             Navigate suggestions/history              ║
║  Tab/Enter       Select suggestion                         ║
║  Ctrl+L          Clear chat history (Alt UI)               ║
╠════════════════════════════════════════════════════════════╣
║  TOOL PERMISSION DIALOG                                    ║
║  Y               Approve tool execution                    ║
║  N               Deny tool execution                       ║
║  A               Always allow (pre-approve)                ║
║  Tab/←/→         Navigate buttons                          ║
║  Enter           Confirm focused button                    ║
╠════════════════════════════════════════════════════════════╣
║  WELCOME SCREEN                                            ║
║  Enter           Continue to home                          ║
║  C               Go to config                              ║
╚════════════════════════════════════════════════════════════╝
```

---

**Last Updated:** Implementation complete with dual permission modes
**Total Shortcuts:** 20+ keyboard combinations
**Screens Covered:** 5 (Global, HomeNew, HomeScreen, Dialog, Welcome)
