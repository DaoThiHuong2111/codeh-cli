# Sandbox Mode Toggle Command

Toggle Docker-based sandbox mode between ENABLED (isolated) and DISABLED (direct).

## What you should do:

1. **Check if Dockerfile exists** in current directory
   - If NO Dockerfile: Show error "❌ Không tìm thấy Dockerfile trong thư mục hiện tại" using `presenter.showTempError()`
   - If Dockerfile exists: Proceed to toggle

2. **Toggle sandbox mode** by calling `await sandboxModeManager.toggle()`
   - This is async - builds Docker image and starts container when enabling
   - Stops and removes container when disabling

3. **Display the result** to the user:
   - Show old mode → new mode
   - Explain what the new mode means
   - Show any errors if toggle failed

## Sandbox Modes:

### 🐳 ENABLED (Docker Container - Isolated)
- Commands run inside Docker container
- Workspace mounted at `/workspace`
- Container filesystem isolated from host
- Dangerous commands (rm -rf /) only affect container
- Requires Dockerfile in project directory

**How it works:**
- Builds Docker image from your Dockerfile
- Starts long-running container with workspace mounted
- Executes commands via `docker exec`
- Container auto-cleanup on app exit

### 💻 DISABLED (Direct - Host System)
- Commands run directly on host system
- Full system access
- No isolation
- User takes full responsibility

## Example Responses:

### Success - Enabling:
```
Sandbox mode toggled!

Old mode: 💻 DISABLED (Commands run on host)
New mode: 🐳 ENABLED (Commands run in Docker container)

Your shell commands will now run in an isolated Docker container.
The container is built from your Dockerfile and your workspace is mounted at /workspace.

To disable sandbox mode, run /sandbox again.
```

### Success - Disabling:
```
Sandbox mode toggled!

Old mode: 🐳 ENABLED (Commands run in Docker container)
New mode: 💻 DISABLED (Commands run on host)

Your shell commands will now run directly on your host system.
Be careful as commands can affect your system directly.

To re-enable sandbox protection, run /sandbox again.
```

### Error - No Dockerfile:
```
❌ Không tìm thấy Dockerfile trong thư mục hiện tại

Sandbox mode requires a Dockerfile in your project directory.
Create a Dockerfile to enable Docker-based sandbox isolation.
```

### Error - Toggle Failed:
```
❌ Failed to enable sandbox: Docker image build failed

Please check:
- Your Dockerfile syntax is correct
- Docker is installed and running
- You have sufficient disk space

Error details: [show error from toggle result]
```

## Implementation:

```typescript
// 1. Get sandbox mode manager from presenter
const sandboxManager = presenter.sandboxModeManager;

// 2. Check if available (Dockerfile exists)
if (!sandboxManager.isSandboxAvailable()) {
    presenter.showTempError('Không tìm thấy Dockerfile trong thư mục hiện tại');
    return;
}

// 3. Get current mode
const oldMode = sandboxManager.getMode();
const oldDescription = sandboxManager.getModeDescription();

// 4. Toggle mode (async!)
const result = await sandboxManager.toggle();

// 5. Show result
if (!result.success) {
    // Toggle failed
    presenter.showTempError(`Failed to toggle sandbox: ${result.error}`);
    return;
}

// Success - show new mode
const newMode = result.mode;
const newDescription = sandboxManager.getModeDescription();

// Display old → new mode change
// Explain what happened
// Give user guidance
```

## Important:

- **ALWAYS check `isSandboxAvailable()` first** before toggling
- **Use `presenter.showTempError()`** for error messages (auto-clears after 5s)
- **Handle async** - `toggle()` returns a Promise
- **Check `result.success`** - toggle can fail (Docker not installed, build errors, etc.)
- Container lifecycle is automatic - no manual cleanup needed
