# Sandbox Mode Toggle Command

Toggle shell command sandbox mode between ENABLED (safe, restricted) and DISABLED (unrestricted).

## What you should do:

1. **Check current sandbox mode status** by calling the `globalSandboxModeManager.getMode()` and `getModeDescription()`

2. **Toggle the sandbox mode** by calling `globalSandboxModeManager.toggle()`

3. **Display the result** to the user:
   - Show old mode → new mode
   - Explain what the new mode means
   - Show which commands are allowed/restricted

## Sandbox Modes:

### 🔒 ENABLED (Default - Safe)
- Only whitelisted commands are allowed
- Blocks dangerous patterns (rm -rf, curl|sh, etc.)
- Maximum output size limit (10MB)
- Execution timeout (30 seconds)
- Prevents command injection

**Allowed commands:** ls, cat, grep, find, git, npm, node, tsc, echo, pwd, mkdir, touch, mv, cp, which, date, head, tail, wc, sort, uniq, diff

### ⚠️  DISABLED (Unrestricted - Use with caution!)
- All commands are allowed
- No restrictions or safety checks
- User takes full responsibility
- Useful for advanced operations

## Example Response:

```
Sandbox mode toggled!

Old mode: 🔒 ENABLED (Commands restricted to whitelist)
New mode: ⚠️  DISABLED (All commands allowed - use with caution!)

The sandbox is now DISABLED. All shell commands are allowed without restrictions.
Be careful when running commands as they can affect your system.

To re-enable sandbox protection, run /sandbox again.
```

## Important:

- Always show both old and new modes
- Warn users when disabling sandbox
- Explain the security implications
- Make it easy to toggle back

## Access to Manager:

You can access the sandbox manager through the DI container or import it directly:

```typescript
import { globalSandboxModeManager } from '@/infrastructure/process/SandboxModeManager';

// Get current mode
const mode = globalSandboxModeManager.getMode();
const description = globalSandboxModeManager.getModeDescription();

// Toggle mode
const newMode = globalSandboxModeManager.toggle();
```
