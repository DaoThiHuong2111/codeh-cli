# Implementation Plan

## Phase 1: Core Permission Infrastructure

- [x] 1. Create usePermissionDialog hook
  - [x] 1.1 Create hook file at `source/cli/hooks/usePermissionDialog.ts`
    - Define PermissionDialogState interface
    - Implement showDialog function that returns Promise
    - Implement handleApprove, handleDeny, handleAlwaysAllow callbacks
    - _Requirements: 1.1, 1.2, 11.1, 11.2, 11.3, 11.4_
  - [x] 1.2 Write property test for Promise resolution
    - **Property 3: Dialog Blocks Execution Until Response**
    - **Validates: Requirements 1.2, 10.1, 10.3, 11.1**

- [x] 2. Connect UI callback in Home screen initialization
  - [x] 2.1 Modify `useHomeLogic.ts` to register UI callback
    - Get HybridPermissionHandler from container
    - Call getInteractiveHandler().setUICallback()
    - Pass showDialog function as callback
    - _Requirements: 4.1, 4.3_
  - [x] 2.2 Write property test for callback registration
    - **Property 2: Interactive Mode Shows Dialog**
    - **Validates: Requirements 1.1, 1.2, 4.3**

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 2: Permission Handler Logic

- [x] 4. Fix HybridPermissionHandler delegation
  - [x] 4.1 Review and verify HybridPermissionHandler correctly delegates
    - Ensure MVP mode uses SimplePermissionHandler
    - Ensure Interactive mode uses InteractivePermissionHandler
    - _Requirements: 2.1, 2.2_
  - [x] 4.2 Write property test for MVP mode auto-approval
    - **Property 1: MVP Mode Auto-Approves All Tools**
    - **Validates: Requirements 2.1, 2.2, 3.3**

- [x] 5. Implement pre-approval management
  - [x] 5.1 Verify InteractivePermissionHandler.savePermissionPreference works
    - Test adding tool to pre-approved list
    - Test removing tool from pre-approved list
    - _Requirements: 1.5_
  - [x] 5.2 Write property test for always-allow feature
    - **Property 6: Always-Allow Adds to Pre-Approved List**
    - **Validates: Requirements 1.5, 11.4**

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: UI Components

- [x] 7. Update ToolPermissionDialog with vertical layout
  - [x] 7.1 Modify `ToolPermissionDialog.tsx` layout
    - Change from horizontal buttons to vertical list
    - Add selection state (0: Allow, 1: Deny, 2: Always Allow)
    - Style selected option with highlight
    - Style unselected options with dimmed text
    - _Requirements: 6.1, 8.1, 8.2, 8.3_
  - [x] 7.2 Implement keyboard navigation
    - Up/Down arrows to move selection
    - Enter to confirm selection
    - Y/N/A shortcuts
    - Escape to deny and close
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_
  - [x] 7.3 Write property test for keyboard navigation
    - **Property 7: Keyboard Navigation Cycles Through Options**
    - **Validates: Requirements 6.2**
  - [x] 7.4 Write property test for shortcut keys
    - **Property 8: Shortcut Keys Trigger Correct Actions**
    - **Validates: Requirements 6.4, 6.5, 6.6, 6.7**

- [x] 8. Integrate ToolPermissionDialog into Home screen
  - [x] 8.1 Add dialog state to Home.tsx
    - Import usePermissionDialog hook
    - Render ToolPermissionDialog component
    - Pass callbacks from hook
    - _Requirements: 1.1, 7.1, 7.2, 7.3, 7.4_
  - [x] 8.2 Implement input blocking when dialog is open
    - Disable InputBox when dialog is open
    - Use layer switching for keyboard capture
    - _Requirements: 10.1, 10.2, 10.3_

- [x] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 4: Approval/Denial Flow

- [x] 10. Implement approval flow
  - [x] 10.1 Verify tool execution after approval
    - Test that approved tools are executed
    - Test that result is returned correctly
    - _Requirements: 1.3_
  - [x] 10.2 Write property test for approval execution
    - **Property 4: Approval Executes Tool**
    - **Validates: Requirements 1.3, 11.2**

- [x] 11. Implement denial flow
  - [x] 11.1 Verify tool is skipped after denial
    - Test that denied tools are not executed
    - Test that rejection is reported to LLM
    - _Requirements: 1.4, 9.1, 9.2_
  - [x] 11.2 Write property test for denial and LLM reporting
    - **Property 5: Denial Skips Tool and Reports to LLM**
    - **Validates: Requirements 1.4, 9.1, 9.2, 11.3**

- [x] 12. Implement partial approval handling
  - [x] 12.1 Test batch tool calls with mixed approval
    - Some tools approved, some denied
    - Verify only approved tools execute
    - _Requirements: 9.3_
  - [x] 12.2 Write property test for partial approval
    - **Property 10: Partial Approval Executes Approved Tools Only**
    - **Validates: Requirements 9.3**

- [x] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: Mode Switching

- [x] 14. Verify mode toggle functionality
  - [x] 14.1 Test Shift+Tab toggles mode
    - Verify mode changes from MVP to Interactive
    - Verify mode changes from Interactive to MVP
    - _Requirements: 3.1_
  - [x] 14.2 Verify Footer updates on mode change
    - Test "🚀 MVP" indicator in MVP mode
    - Test "🔒 Interactive" indicator in Interactive mode
    - _Requirements: 3.2, 5.1, 5.2, 5.3_
  - [x] 14.3 Write property test for mode toggle immediate effect
    - **Property 9: Mode Toggle Updates Behavior Immediately**
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [ ] 15. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 6: Integration Testing

- [x] 16. Write integration tests
  - [x] 16.1 Full flow integration test
    - LLM → Tool Call → Permission → Execution → Response
    - Test both MVP and Interactive modes
  - [x] 16.2 Mode switching during execution test
    - Verify in-progress requests are not affected by mode change
