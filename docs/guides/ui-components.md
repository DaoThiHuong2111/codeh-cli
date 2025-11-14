# UI Components Guide - Tool Execution Display

This guide explains the new UI components created for displaying tool execution in the chat interface.

## 📦 Components Created

### 1. **ToolPermissionDialog** (`source/cli/components/molecules/ToolPermissionDialog.tsx`)

Interactive dialog for requesting user permission before tool execution.

**Features:**
- ✅ Displays tool name, description, and arguments
- ✅ Three action buttons: Allow, Deny, Always Allow
- ✅ Keyboard navigation (Tab/Arrow keys)
- ✅ Quick shortcuts (Y/N/A keys)
- ✅ Visual warning about security
- ✅ Bordered yellow box for visibility

**Props:**
```typescript
interface ToolPermissionDialogProps {
  request: ToolPermissionRequest | null;
  onApprove: () => void;
  onDeny: () => void;
  onAlwaysAllow: () => void;
}

interface ToolPermissionRequest {
  toolName: string;
  toolDescription?: string;
  arguments: Record<string, any>;
  timestamp: Date;
}
```

**Usage Example:**
```tsx
import ToolPermissionDialog from './components/molecules/ToolPermissionDialog';

<ToolPermissionDialog
  request={{
    toolName: 'shell',
    toolDescription: 'Execute shell commands',
    arguments: { command: 'ls -la' },
    timestamp: new Date()
  }}
  onApprove={() => console.log('Approved')}
  onDeny={() => console.log('Denied')}
  onAlwaysAllow={() => console.log('Always allow')}
/>
```

**Keyboard Controls:**
- `Tab` / `→` / `←`: Navigate between buttons
- `Enter`: Confirm selected button
- `Y`: Quick approve
- `N`: Quick deny
- `A`: Quick always allow

---

### 2. **ToolCallDisplay** (`source/cli/components/molecules/ToolCallDisplay.tsx`)

Displays tool execution requests in the chat.

**Features:**
- ✅ Shows tool name and ID
- ✅ Expandable arguments display
- ✅ Status indicator (pending/executing/completed/failed)
- ✅ Color-coded by status
- ✅ Supports multiple tool calls

**Props:**
```typescript
interface ToolCallDisplayProps {
  toolCalls: ToolCall[];
  status?: 'pending' | 'executing' | 'completed' | 'failed';
}

interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}
```

**Usage Example:**
```tsx
import ToolCallDisplay from './components/molecules/ToolCallDisplay';

<ToolCallDisplay
  toolCalls={[
    {
      id: 'call_1',
      name: 'shell',
      arguments: { command: 'ls' }
    }
  ]}
  status="executing"
/>
```

**Status Colors:**
- `pending`: Yellow (⏳)
- `executing`: Blue (⚙️)
- `completed`: Green (✅)
- `failed`: Red ()

---

### 3. **ToolResultDisplay** (`source/cli/components/molecules/ToolResultDisplay.tsx`)

Displays tool execution results with output/errors.

**Features:**
- ✅ Shows success/failure status
- ✅ Displays output or error message
- ✅ Execution duration
- ✅ Expandable/collapsible output
- ✅ Output preview (first 200 chars)

**Props:**
```typescript
interface ToolResultDisplayProps {
  results: ToolResult[];
  collapsible?: boolean;
}

interface ToolResult {
  toolName: string;
  success: boolean;
  output: string;
  error?: string;
  duration?: number;
  timestamp?: Date;
}
```

**Usage Example:**
```tsx
import ToolResultDisplay from './components/molecules/ToolResultDisplay';

<ToolResultDisplay
  results={[
    {
      toolName: 'shell',
      success: true,
      output: 'file1.txt\nfile2.txt\nfolder/',
      duration: 45
    }
  ]}
  collapsible={true}
/>
```

---

### 4. **Updated MessageBubble** (`source/cli/components/molecules/MessageBubble.tsx`)

Enhanced to automatically display tool calls when present in message.

**New Features:**
- ✅ Auto-detects and displays tool calls
- ✅ Shows ToolCallDisplay for messages with toolCalls
- ✅ Backward compatible (no breaking changes)

**How It Works:**
```typescript
// Message with tool calls
const message = Message.assistant(
  "I'll list the files",
  [{ id: 'call_1', name: 'shell', arguments: { command: 'ls' } }]
);

// MessageBubble automatically shows tool calls
<MessageBubble message={message} />
```

---

## 🔧 Integration with Permission Handler

### **InteractivePermissionHandler** (`source/infrastructure/permissions/InteractivePermissionHandler.ts`)

Replacement for SimplePermissionHandler that can show UI dialogs.

**Features:**
- ✅ Delegates permission requests to UI layer
- ✅ Supports pre-approved tools
- ✅ Callback-based architecture
- ✅ Fallback to console if no UI

**Usage:**
```typescript
import { InteractivePermissionHandler } from './infrastructure/permissions/InteractivePermissionHandler';

// 1. Create handler
const permissionHandler = new InteractivePermissionHandler();

// 2. Set UI callback from presentation layer
permissionHandler.setUICallback({
  requestPermission: async (context) => {
    // Show ToolPermissionDialog
    // Wait for user decision
    // Return result
    return { approved: true, reason: 'User approved' };
  }
});

// 3. Use in CodehClient
const client = new CodehClient(
  apiClient,
  historyRepo,
  toolRegistry,
  permissionHandler
);
```

---

## 🎯 Complete Integration Example

### Step 1: Setup Permission Handler

```typescript
// In DI setup or main app
import { InteractivePermissionHandler } from './infrastructure/permissions/InteractivePermissionHandler';

const permissionHandler = new InteractivePermissionHandler();
```

### Step 2: Create Permission State in Presenter

```typescript
// In HomePresenterNew or similar
class HomePresenter {
  private pendingPermissionRequest: ToolPermissionRequest | null = null;

  constructor(private permissionHandler: InteractivePermissionHandler) {
    // Register UI callback
    permissionHandler.setUICallback({
      requestPermission: async (context) => {
        return await this.showPermissionDialog(context);
      }
    });
  }

  private showPermissionDialog(context: ToolPermissionContext): Promise<PermissionResult> {
    return new Promise((resolve) => {
      // Set state to show dialog
      this.pendingPermissionRequest = {
        toolName: context.toolCall.name,
        toolDescription: context.toolDescription,
        arguments: context.toolCall.arguments,
        timestamp: context.timestamp
      };

      // Store resolver to call when user makes decision
      this.permissionResolver = resolve;

      // Notify view to re-render
      this.notifyView();
    });
  }

  handlePermissionApprove = () => {
    this.permissionResolver?.({ approved: true, reason: 'User approved' });
    this.pendingPermissionRequest = null;
    this.notifyView();
  };

  handlePermissionDeny = () => {
    this.permissionResolver?.({ approved: false, reason: 'User denied' });
    this.pendingPermissionRequest = null;
    this.notifyView();
  };

  handlePermissionAlways = () => {
    // Save preference
    this.permissionHandler.savePermissionPreference(
      this.pendingPermissionRequest!.toolName,
      true
    );

    // Approve this request
    this.permissionResolver?.({ approved: true, reason: 'Always allowed' });
    this.pendingPermissionRequest = null;
    this.notifyView();
  };
}
```

### Step 3: Render in View

```tsx
// In HomeScreen or similar
function HomeScreen({ presenter }) {
  return (
    <Box flexDirection="column">
      {/* Chat messages */}
      {messages.map(msg => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      {/* Permission dialog (when pending) */}
      <ToolPermissionDialog
        request={presenter.pendingPermissionRequest}
        onApprove={presenter.handlePermissionApprove}
        onDeny={presenter.handlePermissionDeny}
        onAlwaysAllow={presenter.handlePermissionAlways}
      />
    </Box>
  );
}
```

---

## 🎨 Visual Examples

### Permission Dialog
```
┌──────────────────────────────────────────────┐
│ 🔧 Tool Execution Permission Required       │
│                                              │
│ Tool: shell                                  │
│ Description: Execute shell commands          │
│                                              │
│ Arguments:                                   │
│   {                                          │
│     "command": "ls -la"                      │
│   }                                          │
│                                              │
│ ⚠️  Only allow tools from trusted sources.   │
│                                              │
│ ┌─────────────┐ ┌────────────┐ ┌──────────┐│
│ │ ✓ Allow (Y) │ │ ✗ Deny (N) │ │ ✓ Always││
│ └─────────────┘ └────────────┘ └──────────┘│
│                                              │
│ Navigate: Tab • Confirm: Enter • Quick: Y/N/A│
└──────────────────────────────────────────────┘
```

### Tool Call Display (Executing)
```
┌─────────────────────────────────────┐
│ ⚙️  Tool Execution - Executing     │
│                                     │
│ #1 shell                            │
│                                     │
│ ▶ Press E to expand details         │
└─────────────────────────────────────┘
```

### Tool Result Display
```
┌─────────────────────────────────────┐
│ ✓ shell                   (45ms)   │
│                                     │
│ Output:                             │
│   file1.txt                         │
│   file2.txt                         │
│   folder/                           │
│                                     │
│ ▼ Showing output                    │
└─────────────────────────────────────┘
```

---

## 🚀 Migration from SimplePermissionHandler

### Before (MVP - Auto-approve)
```typescript
import { SimplePermissionHandler } from './infrastructure/permissions/SimplePermissionHandler';

const permissionHandler = new SimplePermissionHandler();
// All tools auto-approved, logs to console
```

### After (Interactive - User decides)
```typescript
import { InteractivePermissionHandler } from './infrastructure/permissions/InteractivePermissionHandler';

const permissionHandler = new InteractivePermissionHandler();
permissionHandler.setUICallback(/* UI implementation */);
// User sees dialog and makes decision
```

---

## 📝 Notes

### When to Use Each Component

**ToolPermissionDialog:**
- Use when tool execution is about to happen
- Show BEFORE tool executes
- Blocks until user makes decision

**ToolCallDisplay:**
- Use in message bubble for assistant messages with tool calls
- Shows what tool was requested
- Can show status (pending → executing → completed)

**ToolResultDisplay:**
- Use after tool execution completes
- Shows output or errors
- Can be embedded in separate messages or in metadata

### MVP vs Full Implementation

**MVP (Current with SimplePermissionHandler):**
- ✅ All tools auto-approved
- ✅ Console logging only
- ✅ No user interaction required
-  No security checks
-  No permission dialog

**Full (With InteractivePermissionHandler):**
- ✅ User approves each tool
- ✅ Visual dialog with all info
- ✅ Keyboard navigation
- ✅ Always allow option
- ✅ Security warning
- ✅ Full control

---

## 🔮 Future Enhancements

- [ ] **Persistent Preferences**: Save pre-approved tools to file
- [ ] **Tool History**: Show previous executions of same tool
- [ ] **Risk Indicators**: Color-code tools by risk level
- [ ] **Timeout**: Auto-deny after N seconds
- [ ] **Batch Approval**: Approve multiple tools at once
- [ ] **Command Preview**: Show what command will actually run
- [ ] **Execution Logs**: Detailed logs panel for debugging
- [ ] **Cancel Running Tools**: Stop tool mid-execution

---

## ✅ Checklist for Implementation

- [x] Create ToolPermissionDialog component
- [x] Create InteractivePermissionHandler
- [x] Create ToolCallDisplay component
- [x] Create ToolResultDisplay component
- [x] Update MessageBubble to show tool calls
- [ ] Add permission state to presenter
- [ ] Wire dialog callbacks
- [ ] Add keyboard shortcuts to main app
- [ ] Test with real tool execution
- [ ] Document integration in main README

---

## 🎯 Summary

**Components Created:** 4 new + 1 updated
**Lines of Code:** ~600 lines
**Build Status:** ✅ Compiles successfully
**Test Coverage:** Integration tests in ToolExecutionFlow.test.ts

**Ready for Integration:**
- All components compile
- Props interfaces defined
- Backward compatible
- Documentation complete

**Next Steps:**
1. Wire InteractivePermissionHandler into DI
2. Add permission state to HomePresenterNew
3. Test complete flow with real tools
4. Optional: Add to existing screens
