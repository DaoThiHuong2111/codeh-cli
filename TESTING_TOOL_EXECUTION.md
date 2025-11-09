# Testing Tool Execution Pipeline

This document provides instructions for testing the end-to-end tool execution pipeline.

## Overview

The tool execution pipeline has been fully implemented with the following components:

- ✅ **Tool Definitions**: JSON Schema format sent to LLM
- ✅ **Tool Call Parsing**: Extract tool requests from API responses
- ✅ **Permission System**: Auto-approve (MVP) with logging
- ✅ **Tool Execution**: Execute shell commands and file operations
- ✅ **Agentic Loop**: Send results back to LLM for continuation (max 5 iterations)
- ✅ **Comprehensive Logging**: Track every step with visual indicators

## Registered Tools

Currently registered tools in the system:

### 1. ShellTool (`shell`)
Execute shell commands in the system.

**Parameters:**
- `command` (string, required): The shell command to execute

**Example:**
```json
{
  "name": "shell",
  "arguments": {
    "command": "ls -la"
  }
}
```

### 2. FileOpsTool (`file_ops`)
Perform file operations (read, write, list).

**Parameters:**
- `operation` (string, required): Operation type: "read", "write", "list"
- `path` (string, required): File or directory path
- `content` (string, optional): Content for write operations

**Example:**
```json
{
  "name": "file_ops",
  "arguments": {
    "operation": "read",
    "path": "./package.json"
  }
}
```

## Prerequisites

1. **API Configuration**: Set up your API credentials
   ```bash
   export ANTHROPIC_API_KEY="your-api-key-here"
   # or configure via: npm start -- config
   ```

2. **Build the project**:
   ```bash
   npm install
   npm run build
   ```

## Testing Scenarios

### Scenario 1: Simple Shell Command

**Prompt:** "list files in current directory"

**Expected Flow:**
1. User sends prompt to LLM
2. LLM receives tool definitions (shell, file_ops)
3. LLM responds with tool_use for `shell` command "ls"
4. Permission auto-approved (MVP mode)
5. Shell command executed
6. Results sent back to LLM
7. LLM formats response in natural language

**Console Output Example:**
```
🤖 Starting Tool Execution Orchestration
Max iterations: 5

📍 Iteration 1/5
🔍 Detected 1 tool call(s)
⚙️  Executing tools...

  [1/1] Processing tool: shell

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 Tool Execution Request
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tool: shell
Arguments: {
  "command": "ls"
}
Status: ✅ Auto-approved (MVP mode)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ⚙️  Executing shell...
  ✅ shell completed (45ms)
     Output preview: README.md
package.json
source
dist
node_modules

  Summary: 1/1 succeeded

✅ Tools executed successfully. Sending results back to LLM...
📨 Received LLM response
✅ LLM completed without requesting more tools. Orchestration complete.

🎯 Orchestration Summary:
   - Total iterations: 1
   - Tools executed: 1
   - Final response length: 156 chars
```

### Scenario 2: File Read Operation

**Prompt:** "read the package.json file"

**Expected Flow:**
1. LLM requests `file_ops` with operation="read", path="./package.json"
2. File read executed
3. Content sent back to LLM
4. LLM summarizes the package.json content

### Scenario 3: Multi-Step Agentic Loop

**Prompt:** "find all TypeScript files in the source directory and tell me how many there are"

**Expected Flow:**
1. LLM requests `shell` with command like "find source -name '*.ts'"
2. Results sent back
3. LLM may request another tool to count or analyze
4. Final response with count

### Scenario 4: Multiple Tool Calls

**Prompt:** "check if dist folder exists and list its contents"

**Expected Flow:**
1. LLM requests multiple tools (may execute sequentially or in iterations)
2. Each tool logged separately
3. All results aggregated
4. Final comprehensive response

## Running Tests

### Manual Testing

1. **Start the application:**
   ```bash
   npm start
   ```

2. **Try test prompts:**
   - "list files in current directory"
   - "show me the content of README.md"
   - "what is in package.json?"
   - "run pwd command"

### Monitoring Execution

Watch the console output for:
- 🔧 Tool execution requests (permission checks)
- ⚙️  Tool execution progress
- ✅ Success indicators
- ❌ Failure indicators
- 🎯 Orchestration summaries

### Expected Behaviors

**Success Case:**
- Tool definitions sent to API ✅
- Tool calls parsed from response ✅
- Permission auto-approved ✅
- Tool executed successfully ✅
- Results formatted and sent to LLM ✅
- Final natural language response ✅

**Error Cases to Handle:**
- Tool not found → Error logged, execution skipped
- Permission denied → Execution skipped, user notified
- Execution failure → Error logged, sent to LLM
- Max iterations reached → Loop stops, last response returned

## Debugging

### Enable Detailed Logging

The system already logs to console. To add more debugging:

1. **Check tool registration:**
   ```typescript
   // In source/core/di/setup.ts
   const registry = container.resolve<ToolRegistry>('ToolRegistry');
   console.log('Registered tools:', registry.getAllNames());
   ```

2. **Inspect tool definitions:**
   ```typescript
   // In CodehClient.executeWithStreaming()
   console.log('Tool definitions:', JSON.stringify(tools, null, 2));
   ```

3. **Monitor API requests:**
   Add logging in AnthropicClient.streamChat() to see request body

### Common Issues

**Issue: LLM doesn't call tools**
- Check if tool definitions are being sent
- Verify JSON Schema format is correct
- Try more explicit prompts: "use the shell tool to list files"

**Issue: Tool execution hangs**
- Check command validity
- Verify file paths exist
- Look for infinite loops in agentic iteration

**Issue: Permission always denied**
- Check SimplePermissionHandler is registered
- Verify PermissionHandler is injected into CodehClient

## Future Improvements

- [ ] Interactive permission dialog (replace SimplePermissionHandler)
- [ ] UI display for tool calls and results in chat
- [ ] Stream tool execution progress to UI
- [ ] Tool execution timeout handling
- [ ] Retry logic for failed tools
- [ ] Tool execution analytics

## Architecture Reference

```
User Input
    ↓
HomePresenterNew.handleSubmit()
    ↓
CodehClient.executeWithStreaming()
    ↓
[Get tool definitions from ToolRegistry]
    ↓
[Convert to API format via ToolDefinitionConverter]
    ↓
AnthropicClient.streamChat() with tools parameter
    ↓
[LLM returns tool_use content blocks]
    ↓
[Parse tool calls in AnthropicClient]
    ↓
[Detect tool calls in CodehClient]
    ↓
ToolExecutionOrchestrator.orchestrate()
    ↓
HandleToolCalls.execute()
    ↓
SimplePermissionHandler.requestPermission() → Auto-approve
    ↓
ToolRegistry.execute()
    ↓
ShellExecutor / FileOperations
    ↓
[Format results]
    ↓
[Send back to LLM via continueWithToolResults()]
    ↓
[Loop if LLM requests more tools]
    ↓
Final Turn returned to presenter
    ↓
Display to user
```

## Notes

- **MVP Limitation**: Tool execution is not streamed. Only initial LLM response and final response after tools complete are streamed.
- **Auto-Approve**: All tools are automatically approved in MVP. Users see permission logs in console but don't interact.
- **Console-Only Feedback**: Tool execution progress is only visible in console logs, not in the UI chat.
