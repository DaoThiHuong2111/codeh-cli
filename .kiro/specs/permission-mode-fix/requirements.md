# Requirements Document

## Introduction

Hệ thống permission modes (MVP/YOLO vs Interactive/Ask-before-edits) cho phép người dùng kiểm soát việc AI có thể tự động thực thi tools hay cần xin phép trước. Hiện tại, khi chuyển sang Interactive mode, dialog xin quyền không hiển thị do UI callback chưa được kết nối với permission handler.

## Glossary

- **Permission_System**: Hệ thống quản lý quyền thực thi tools trong ứng dụng
- **MVP_Mode**: Chế độ tự động approve tất cả tool calls (YOLO mode)
- **Interactive_Mode**: Chế độ yêu cầu user approval trước khi thực thi tools (Ask-before-edits)
- **ToolPermissionDialog**: Component UI hiển thị dialog xin quyền thực thi tool
- **HybridPermissionHandler**: Handler chuyển đổi giữa SimplePermissionHandler và InteractivePermissionHandler
- **UI_Callback**: Callback function kết nối permission handler với UI layer

## Requirements

### Requirement 1

**User Story:** As a user, I want to see a permission dialog when Interactive mode is enabled, so that I can approve or deny tool executions before they happen.

#### Acceptance Criteria

1. WHEN the Permission_System is in Interactive_Mode AND a tool execution is requested THEN the Permission_System SHALL display the ToolPermissionDialog with tool name, description, and arguments
2. WHEN the ToolPermissionDialog is displayed THEN the Permission_System SHALL pause tool execution until user responds
3. WHEN user approves the tool execution THEN the Permission_System SHALL proceed with tool execution and return approved result
4. WHEN user denies the tool execution THEN the Permission_System SHALL cancel tool execution and return rejected result
5. WHEN user selects "Always Allow" for a tool THEN the Permission_System SHALL add the tool to pre-approved list and skip dialog for future calls

### Requirement 2

**User Story:** As a user, I want tools to execute automatically when MVP mode is enabled, so that I can work faster without interruptions.

#### Acceptance Criteria

1. WHEN the Permission_System is in MVP_Mode AND a tool execution is requested THEN the Permission_System SHALL auto-approve the tool without showing dialog
2. WHEN switching from Interactive_Mode to MVP_Mode THEN the Permission_System SHALL immediately apply auto-approve behavior for subsequent tool calls

### Requirement 3

**User Story:** As a user, I want to toggle between MVP and Interactive modes using keyboard shortcut, so that I can quickly change permission behavior.

#### Acceptance Criteria

1. WHEN user presses Shift+Tab THEN the Permission_System SHALL toggle between MVP_Mode and Interactive_Mode
2. WHEN mode changes THEN the Permission_System SHALL update the Footer display to show current mode
3. WHEN mode changes THEN the Permission_System SHALL apply new permission behavior immediately for next tool call

### Requirement 4

**User Story:** As a developer, I want the UI callback to be properly connected to the permission handler, so that the permission dialog can be displayed.

#### Acceptance Criteria

1. WHEN the Home screen initializes THEN the Permission_System SHALL register UI_Callback with InteractivePermissionHandler
2. WHEN UI_Callback is not registered AND Interactive_Mode requests permission THEN the Permission_System SHALL log a warning and fallback to auto-approve
3. WHEN UI_Callback is registered THEN the Permission_System SHALL use the callback to display ToolPermissionDialog

### Requirement 5

**User Story:** As a user, I want to see clear visual feedback about the current permission mode, so that I know whether tools will be auto-approved or require my approval.

#### Acceptance Criteria

1. WHEN MVP_Mode is active THEN the Permission_System SHALL display "🚀 MVP" indicator in Footer
2. WHEN Interactive_Mode is active THEN the Permission_System SHALL display "🔒 Interactive" indicator in Footer
3. WHEN mode changes THEN the Permission_System SHALL update the indicator immediately

### Requirement 6

**User Story:** As a user, I want the permission dialog to be keyboard-navigable with simple vertical layout, so that I can quickly approve or deny tools using arrow keys and Enter.

#### Acceptance Criteria

1. WHEN ToolPermissionDialog is displayed THEN the Permission_System SHALL show options in vertical list format (Allow, Deny, Always Allow)
2. WHEN user presses Up/Down arrow keys THEN the Permission_System SHALL move selection highlight between options
3. WHEN user presses Enter THEN the Permission_System SHALL confirm the currently selected option
4. WHEN user presses Y key THEN the Permission_System SHALL approve the tool execution (shortcut)
5. WHEN user presses N key THEN the Permission_System SHALL deny the tool execution (shortcut)
6. WHEN user presses A key THEN the Permission_System SHALL always allow the tool (shortcut)
7. WHEN user presses Escape THEN the Permission_System SHALL deny the tool execution and close dialog

### Requirement 7

**User Story:** As a user, I want the permission dialog to show minimal but essential information, so that I can make quick decisions without information overload.

#### Acceptance Criteria

1. WHEN ToolPermissionDialog is displayed THEN the Permission_System SHALL show tool name prominently at the top
2. WHEN ToolPermissionDialog is displayed THEN the Permission_System SHALL show tool arguments in compact JSON format
3. WHEN ToolPermissionDialog is displayed THEN the Permission_System SHALL show keyboard shortcuts hint at the bottom
4. WHEN tool has description THEN the Permission_System SHALL show description in dimmed text below tool name

### Requirement 8

**User Story:** As a user, I want the dialog to have clear visual focus indicator, so that I know which option is currently selected.

#### Acceptance Criteria

1. WHEN an option is selected THEN the Permission_System SHALL highlight it with distinct background color
2. WHEN an option is not selected THEN the Permission_System SHALL display it in dimmed style
3. WHEN dialog opens THEN the Permission_System SHALL focus on "Allow" option by default

### Requirement 9

**User Story:** As a user, I want rejected tools to be reported back to the LLM, so that the AI can try alternative approaches.

#### Acceptance Criteria

1. WHEN user denies a tool execution THEN the Permission_System SHALL send rejection feedback to LLM
2. WHEN LLM receives rejection feedback THEN the Permission_System SHALL allow LLM to continue conversation with alternative approach
3. WHEN multiple tools are requested AND some are rejected THEN the Permission_System SHALL execute approved tools and report rejected ones

### Requirement 10

**User Story:** As a user, I want the permission request to block UI input until I respond, so that I don't accidentally send messages while dialog is open.

#### Acceptance Criteria

1. WHEN ToolPermissionDialog is displayed THEN the Permission_System SHALL disable the main input box
2. WHEN ToolPermissionDialog is closed THEN the Permission_System SHALL re-enable the main input box
3. WHEN ToolPermissionDialog is displayed THEN the Permission_System SHALL capture all keyboard input for dialog navigation

### Requirement 11

**User Story:** As a developer, I want the permission flow to use Promise-based async/await pattern, so that tool execution waits for user response.

#### Acceptance Criteria

1. WHEN requestPermission is called THEN the Permission_System SHALL return a Promise that resolves when user responds
2. WHEN user approves THEN the Permission_System SHALL resolve Promise with {approved: true}
3. WHEN user denies THEN the Permission_System SHALL resolve Promise with {approved: false}
4. WHEN user selects "Always Allow" THEN the Permission_System SHALL resolve Promise with {approved: true, rememberChoice: true}
