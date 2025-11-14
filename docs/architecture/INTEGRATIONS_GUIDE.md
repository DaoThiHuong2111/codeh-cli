# CODEH Integrations Guide

Hướng dẫn sử dụng các integration trong CODEH CLI: VS Code Extension, MCP Client, và A2A Server.

## Mục lục

- [1. VS Code Extension Integration](#1-vs-code-extension-integration)
- [2. MCP Client Integration](#2-mcp-client-integration)
- [3. A2A Server Integration](#3-a2a-server-integration)

---

## 1. VS Code Extension Integration

### 1.1. Tổng quan

VSCodeExtension cho phép CODEH CLI giao tiếp với VS Code extension qua WebSocket hoặc stdio.

**Đặc điểm:**

- Hỗ trợ 2 modes: WebSocket và stdio
- Request/Response/Notification protocol
- Timeout handling và error recovery
- Event-driven architecture

### 1.2. Cài đặt và khởi tạo

```typescript
import {VSCodeExtension} from './infrastructure/integrations';

// WebSocket mode (default)
const vscode = new VSCodeExtension({
	mode: 'websocket',
	port: 9000,
	timeout: 30000, // 30 seconds
});

// Stdio mode (for child process)
const vscode = new VSCodeExtension({
	mode: 'stdio',
	timeout: 30000,
});
```

### 1.3. Kết nối

```typescript
// Connect to VS Code extension
try {
	const connected = await vscode.connect();
	if (connected) {
		console.log('Connected to VS Code extension');
	}
} catch (error) {
	console.error('Failed to connect:', error);
}

// Listen to connection events
vscode.on('connected', () => {
	console.log('VS Code extension connected');
});

vscode.on('disconnected', () => {
	console.log('VS Code extension disconnected');
});

vscode.on('error', error => {
	console.error('VS Code error:', error);
});
```

### 1.4. Gửi requests

```typescript
// Get extension capabilities
const capabilities = await vscode.getCapabilities();
console.log('Features:', capabilities.features);
console.log('Version:', capabilities.version);

// Open file in VS Code
await vscode.openFile('/path/to/file.ts', 42, 10); // line 42, column 10

// Show message in VS Code
await vscode.showMessage('Hello from CODEH!', 'info'); // 'info' | 'warning' | 'error'

// Execute VS Code command
const result = await vscode.executeCommand('workbench.action.files.save');
```

### 1.5. Xử lý incoming requests từ VS Code

```typescript
// Handle requests from VS Code
vscode.on('request', async message => {
	console.log('Received request:', message.method);

	try {
		let result;

		// Handle different request methods
		switch (message.method) {
			case 'codeh/analyze':
				result = await analyzeCode(message.params);
				break;
			case 'codeh/suggest':
				result = await getSuggestions(message.params);
				break;
			default:
				throw new Error(`Unknown method: ${message.method}`);
		}

		// Send response back to VS Code
		vscode.sendResponse(message.id!, result);
	} catch (error) {
		// Send error response
		vscode.sendResponse(message.id!, undefined, {
			code: -1,
			message: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});
```

### 1.6. Gửi notifications

```typescript
// Send notification (no response expected)
vscode.sendNotification('codeh/status', {
	status: 'processing',
	progress: 50,
});
```

### 1.7. Ngắt kết nối

```typescript
// Disconnect from VS Code
vscode.disconnect();

// Check connection status
if (vscode.isConnected()) {
	console.log('Still connected');
}
```

### 1.8. Ví dụ hoàn chỉnh

```typescript
import {VSCodeExtension} from './infrastructure/integrations';

async function main() {
	const vscode = new VSCodeExtension({
		mode: 'websocket',
		port: 9000,
		timeout: 30000,
	});

	// Setup event listeners
	vscode.on('connected', () => console.log('✓ Connected'));
	vscode.on('disconnected', () => console.log('✗ Disconnected'));
	vscode.on('error', error => console.error('Error:', error));

	// Handle incoming requests
	vscode.on('request', async message => {
		if (message.method === 'codeh/analyze') {
			const result = await analyzeCode(message.params.code);
			vscode.sendResponse(message.id!, result);
		}
	});

	// Connect
	try {
		await vscode.connect();

		// Get capabilities
		const caps = await vscode.getCapabilities();
		console.log('Capabilities:', caps);

		// Open file
		await vscode.openFile('./src/main.ts', 1, 1);

		// Show message
		await vscode.showMessage('Analysis complete!', 'info');
	} catch (error) {
		console.error('Failed:', error);
	} finally {
		vscode.disconnect();
	}
}

async function analyzeCode(code: string) {
	// Your code analysis logic
	return {analyzed: true, issues: []};
}
```

---

## 2. MCP Client Integration

### 2.1. Tổng quan

MCPClient cho phép CODEH kết nối với các MCP (Model Context Protocol) servers qua stdio.

**Đặc điểm:**

- JSON-RPC 2.0 protocol
- Multi-server support
- Resources, Tools, Prompts management
- Process lifecycle management

### 2.2. Khởi tạo

```typescript
import {MCPClient} from './infrastructure/integrations';

const mcpClient = new MCPClient();

// Listen to events
mcpClient.on('serverConnected', ({server, capabilities}) => {
	console.log(`Server ${server} connected with capabilities:`, capabilities);
});

mcpClient.on('serverDisconnected', ({server, code}) => {
	console.log(`Server ${server} disconnected with code ${code}`);
});

mcpClient.on('error', ({server, error}) => {
	console.error(`Server ${server} error:`, error);
});

mcpClient.on('serverLog', ({server, log}) => {
	console.log(`[${server}] ${log}`);
});
```

### 2.3. Kết nối với MCP server

```typescript
// Connect to a server
await mcpClient.connectToServer({
	name: 'my-server',
	command: 'npx',
	args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/workspace'],
	env: {
		NODE_ENV: 'production',
	},
});

// Check connection
if (mcpClient.isConnected('my-server')) {
	console.log('Server is connected');
}

// Get server capabilities
const capabilities = mcpClient.getCapabilities('my-server');
console.log('Server capabilities:', capabilities);
```

### 2.4. Làm việc với Resources

```typescript
// List all resources
const resources = await mcpClient.listResources('my-server');
console.log('Available resources:', resources);
// Output: [{ uri: 'file:///path/to/file.txt', name: 'file.txt', ... }]

// Read a specific resource
const content = await mcpClient.readResource(
	'my-server',
	'file:///path/to/file.txt',
);
console.log('Resource content:', content);
```

### 2.5. Làm việc với Tools

```typescript
// List all tools
const tools = await mcpClient.listTools('my-server');
console.log('Available tools:', tools);
// Output: [{ name: 'analyze', description: '...', inputSchema: {...} }]

// Call a tool
const result = await mcpClient.callTool('my-server', 'analyze', {
	file: '/path/to/code.ts',
	depth: 'deep',
});
console.log('Tool result:', result);
```

### 2.6. Làm việc với Prompts

```typescript
// List all prompts
const prompts = await mcpClient.listPrompts('my-server');
console.log('Available prompts:', prompts);
// Output: [{ name: 'code-review', description: '...', arguments: [...] }]

// Get a specific prompt
const prompt = await mcpClient.getPrompt('my-server', 'code-review', {
	language: 'typescript',
	focus: 'security',
});
console.log('Prompt:', prompt);
```

### 2.7. Quản lý multiple servers

```typescript
// Connect to multiple servers
await mcpClient.connectToServer({
	name: 'filesystem',
	command: 'npx',
	args: ['-y', '@modelcontextprotocol/server-filesystem', './workspace'],
});

await mcpClient.connectToServer({
	name: 'github',
	command: 'npx',
	args: ['-y', '@modelcontextprotocol/server-github'],
});

// Get list of connected servers
const connectedServers = mcpClient.getConnectedServers();
console.log('Connected servers:', connectedServers); // ['filesystem', 'github']

// Work with specific server
const fsResources = await mcpClient.listResources('filesystem');
const ghTools = await mcpClient.listTools('github');
```

### 2.8. Ngắt kết nối

```typescript
// Disconnect from specific server
await mcpClient.disconnect('my-server');

// Disconnect from all servers
await mcpClient.disconnectAll();
```

### 2.9. Xử lý notifications từ server

```typescript
mcpClient.on('notification', ({server, method, params}) => {
	console.log(`Notification from ${server}:`, method, params);

	// Handle different notification types
	switch (method) {
		case 'notifications/resources/list_changed':
			console.log('Resources list changed, refreshing...');
			// Refresh resources list
			break;
		case 'notifications/progress':
			console.log('Progress update:', params);
			break;
	}
});
```

### 2.10. Ví dụ hoàn chỉnh

```typescript
import {MCPClient} from './infrastructure/integrations';

async function main() {
	const mcpClient = new MCPClient();

	// Setup event listeners
	mcpClient.on('serverConnected', ({server}) => {
		console.log(`✓ ${server} connected`);
	});

	mcpClient.on('error', ({server, error}) => {
		console.error(`✗ ${server} error:`, error);
	});

	mcpClient.on('notification', ({server, method, params}) => {
		console.log(`📬 [${server}] ${method}:`, params);
	});

	try {
		// Connect to filesystem server
		await mcpClient.connectToServer({
			name: 'fs',
			command: 'npx',
			args: ['-y', '@modelcontextprotocol/server-filesystem', './workspace'],
		});

		// List resources
		const resources = await mcpClient.listResources('fs');
		console.log(
			'Resources:',
			resources.map(r => r.name),
		);

		// List tools
		const tools = await mcpClient.listTools('fs');
		console.log(
			'Tools:',
			tools.map(t => t.name),
		);

		// Use a tool
		if (tools.find(t => t.name === 'read_file')) {
			const content = await mcpClient.callTool('fs', 'read_file', {
				path: './package.json',
			});
			console.log('File content:', content);
		}

		// List and get a prompt
		const prompts = await mcpClient.listPrompts('fs');
		if (prompts.length > 0) {
			const prompt = await mcpClient.getPrompt('fs', prompts[0].name);
			console.log('Prompt:', prompt);
		}
	} catch (error) {
		console.error('Failed:', error);
	} finally {
		await mcpClient.disconnectAll();
	}
}
```

---

## 3. A2A Server Integration

### 3.1. Tổng quan

A2AServer cho phép CODEH CLI hoạt động như một agent có thể giao tiếp với các agents khác.

**Đặc điểm:**

- HTTP và WebSocket support
- Method handler registration
- CORS support
- Timeout handling
- Client management

### 3.2. Khởi tạo và cấu hình

```typescript
import {A2AServer} from './infrastructure/integrations';

// Create server with configuration
const a2aServer = new A2AServer({
	port: 3000,
	enableWebSocket: true,
	enableHttp: true,
	cors: true,
	timeout: 60000, // 60 seconds
});

// Default configuration
const defaultServer = new A2AServer(); // port: 3000, all features enabled
```

### 3.3. Đăng ký method handlers

```typescript
// Register a simple handler
a2aServer.registerHandler('echo', async request => {
	return {message: request.params.message};
});

// Register a complex handler
a2aServer.registerHandler('analyze', async request => {
	const {code, language} = request.params;

	// Perform analysis
	const result = await analyzeCode(code, language);

	return {
		success: true,
		issues: result.issues,
		metrics: result.metrics,
	};
});

// Register with error handling
a2aServer.registerHandler('risky-operation', async request => {
	try {
		const result = await performRiskyOperation(request.params);
		return {success: true, data: result};
	} catch (error) {
		throw new Error(`Operation failed: ${error.message}`);
	}
});
```

### 3.4. Start server

```typescript
// Start the server
try {
	await a2aServer.start();
	console.log('A2A Server started on port', a2aServer.getConfig().port);
} catch (error) {
	console.error('Failed to start server:', error);
}

// Listen to server events
a2aServer.on('started', ({port}) => {
	console.log(`✓ Server started on port ${port}`);
});

a2aServer.on('stopped', () => {
	console.log('✗ Server stopped');
});

a2aServer.on('requestHandled', ({method, duration, success}) => {
	console.log(`${success ? '✓' : '✗'} ${method} handled in ${duration}ms`);
});
```

### 3.5. HTTP client usage

```typescript
// Client-side: Call server via HTTP
const response = await fetch('http://localhost:3000', {
	method: 'POST',
	headers: {'Content-Type': 'application/json'},
	body: JSON.stringify({
		method: 'analyze',
		params: {
			code: 'function hello() { console.log("hi"); }',
			language: 'javascript',
		},
		metadata: {
			requestId: 'req-123',
			timestamp: new Date().toISOString(),
			callerAgent: 'my-agent',
		},
	}),
});

const result = await response.json();
console.log('Result:', result);
// Output: { result: { success: true, issues: [...] }, metadata: { ... } }
```

### 3.6. WebSocket client usage

```typescript
// Client-side: Connect via WebSocket
import {WebSocket} from 'ws';

const ws = new WebSocket('ws://localhost:3000');

ws.on('open', () => {
	console.log('Connected to A2A server');

	// Send request
	ws.send(
		JSON.stringify({
			method: 'echo',
			params: {message: 'Hello from client!'},
			metadata: {requestId: 'ws-123'},
		}),
	);
});

ws.on('message', data => {
	const response = JSON.parse(data.toString());
	console.log('Response:', response);
	// Output: { result: { message: "Hello from client!" }, metadata: { ... } }
});

ws.on('error', error => {
	console.error('WebSocket error:', error);
});
```

### 3.7. Quản lý clients

```typescript
// Listen to client events
a2aServer.on('clientConnected', ({clientId}) => {
	console.log(`Client ${clientId} connected`);
});

a2aServer.on('clientDisconnected', ({clientId}) => {
	console.log(`Client ${clientId} disconnected`);
});

// Get client count
const clientCount = a2aServer.getClientCount();
console.log(`${clientCount} clients connected`);

// Get client IDs
const clientIds = a2aServer.getClientIds();
console.log('Connected clients:', clientIds);

// Send message to specific client
const sent = a2aServer.sendToClient('client-123', {
	type: 'notification',
	message: 'Hello client!',
});

// Broadcast to all clients
a2aServer.broadcast({
	type: 'announcement',
	message: 'Server will restart in 5 minutes',
});
```

### 3.8. Unregister handlers

```typescript
// Unregister a specific handler
a2aServer.unregisterHandler('echo');

// Get list of registered methods
const methods = a2aServer.getRegisteredMethods();
console.log('Available methods:', methods);
```

### 3.9. Server stats

```typescript
// Get server statistics
const stats = a2aServer.getStats();
console.log('Server stats:', stats);
// Output: {
//   running: true,
//   port: 3000,
//   connectedClients: 5,
//   registeredHandlers: 10,
//   uptime: 3600  // seconds
// }

// Check if server is running
if (a2aServer.isRunning()) {
	console.log('Server is running');
}
```

### 3.10. Stop server

```typescript
// Stop the server
await a2aServer.stop();
console.log('Server stopped');
```

### 3.11. Ví dụ hoàn chỉnh - CODEH as Agent

```typescript
import {A2AServer} from './infrastructure/integrations';

async function createCodehAgent() {
	const server = new A2AServer({
		port: 3000,
		enableWebSocket: true,
		enableHttp: true,
		cors: true,
		timeout: 60000,
	});

	// Register CODEH capabilities as methods

	// Code analysis
	server.registerHandler('codeh/analyze', async request => {
		const {code, language} = request.params;
		const analysis = await analyzeCode(code, language);
		return {
			issues: analysis.issues,
			complexity: analysis.complexity,
			suggestions: analysis.suggestions,
		};
	});

	// Code generation
	server.registerHandler('codeh/generate', async request => {
		const {prompt, language, style} = request.params;
		const code = await generateCode(prompt, language, style);
		return {code, metadata: {language, linesOfCode: code.split('\n').length}};
	});

	// Code explanation
	server.registerHandler('codeh/explain', async request => {
		const {code, language} = request.params;
		const explanation = await explainCode(code, language);
		return {explanation, summary: explanation.summary};
	});

	// Chat with CODEH
	server.registerHandler('codeh/chat', async request => {
		const {message, context} = request.params;
		const response = await chatWithCodeh(message, context);
		return {response, contextUsed: context?.length || 0};
	});

	// Setup event listeners
	server.on('started', ({port}) => {
		console.log(`🤖 CODEH Agent running on port ${port}`);
	});

	server.on('clientConnected', ({clientId}) => {
		console.log(`📱 Agent ${clientId} connected`);
	});

	server.on('requestHandled', ({method, duration, success}) => {
		const emoji = success ? '✅' : '';
		console.log(`${emoji} ${method} - ${duration}ms`);
	});

	// Start the server
	await server.start();

	return server;
}

// Run the agent
async function main() {
	const codehAgent = await createCodehAgent();

	// Handle graceful shutdown
	process.on('SIGTERM', async () => {
		console.log('Shutting down CODEH Agent...');
		await codehAgent.stop();
		process.exit(0);
	});
}

// Stub functions (implement with actual CODEH logic)
async function analyzeCode(code: string, language: string) {
	return {issues: [], complexity: 5, suggestions: []};
}

async function generateCode(prompt: string, language: string, style: string) {
	return `// Generated ${language} code\nfunction example() {}`;
}

async function explainCode(code: string, language: string) {
	return {summary: 'Code explanation', details: '...'};
}

async function chatWithCodeh(message: string, context: any) {
	return 'Response from CODEH';
}
```

---

## 4. Best Practices

### 4.1. VS Code Extension

- **Always handle disconnections**: VS Code có thể restart hoặc crash
- **Use timeouts**: Set reasonable timeout cho requests
- **Validate responses**: Check response data trước khi sử dụng
- **Error handling**: Wrap all async calls trong try-catch

```typescript
try {
	await vscode.openFile(path, line, col);
} catch (error) {
	console.error('Failed to open file:', error);
	// Fallback logic
}
```

### 4.2. MCP Client

- **Monitor server health**: Listen to disconnect events
- **Resource cleanup**: Always disconnect khi không dùng nữa
- **Error recovery**: Implement retry logic cho failed connections
- **Validate tool schemas**: Check inputSchema trước khi call tool

```typescript
mcpClient.on('serverDisconnected', async ({server, code}) => {
	if (code !== 0) {
		console.error(`Server ${server} crashed, attempting reconnect...`);
		// Implement reconnect logic
	}
});
```

### 4.3. A2A Server

- **Validate inputs**: Always validate request.params
- **Set timeouts**: Prevent long-running handlers from blocking
- **Monitor clients**: Track connected clients và cleanup
- **Security**: Implement authentication/authorization nếu cần

```typescript
server.registerHandler('sensitive-operation', async request => {
	// Validate authentication
	if (!request.metadata?.authToken) {
		throw new Error('Unauthorized');
	}

	// Validate inputs
	if (!request.params?.data) {
		throw new Error('Missing required parameter: data');
	}

	// Perform operation with timeout protection
	const result = await performOperation(request.params.data);
	return result;
});
```

---

## 5. Troubleshooting

### 5.1. VS Code Extension không kết nối được

**Nguyên nhân có thể:**

- Port đã được sử dụng
- VS Code extension chưa start
- Firewall blocking

**Giải pháp:**

```typescript
// Check if port is available
const vscode = new VSCodeExtension({mode: 'websocket', port: 9001}); // Try different port

// Enable debug logging
vscode.on('error', error => {
	console.error('VS Code connection error:', error);
});
```

### 5.2. MCP Server không response

**Nguyên nhân:**

- Server process crashed
- Invalid JSON-RPC message
- Timeout quá ngắn

**Giải pháp:**

```typescript
// Listen to server logs
mcpClient.on('serverLog', ({server, log}) => {
	console.log(`[${server}] ${log}`);
});

// Increase timeout nếu cần
await mcpClient.connectToServer({
	name: 'slow-server',
	command: 'npx',
	args: ['slow-mcp-server'],
	// Server có thể init chậm
});
```

### 5.3. A2A Server bị timeout

**Nguyên nhân:**

- Handler chạy quá lâu
- Blocking operations
- Network latency

**Giải pháp:**

```typescript
// Increase timeout cho complex operations
const server = new A2AServer({
	timeout: 120000, // 2 minutes
});

// Or implement streaming response
server.registerHandler('long-operation', async request => {
	// Send progress updates via WebSocket
	const result = await performLongOperation(request.params, progress => {
		server.broadcast({type: 'progress', value: progress});
	});
	return result;
});
```

---

## 6. Testing

### 6.1. Test VS Code Extension

```typescript
import {VSCodeExtension} from './infrastructure/integrations';

describe('VSCodeExtension', () => {
	let vscode: VSCodeExtension;

	beforeEach(() => {
		vscode = new VSCodeExtension({mode: 'websocket', port: 9999});
	});

	afterEach(() => {
		vscode.disconnect();
	});

	it('should connect successfully', async () => {
		// Start mock VS Code server on port 9999
		const mockServer = createMockVSCodeServer(9999);

		const connected = await vscode.connect();
		expect(connected).toBe(true);

		mockServer.close();
	});

	it('should send requests correctly', async () => {
		// Test request sending
	});
});
```

### 6.2. Test MCP Client

```typescript
import {MCPClient} from './infrastructure/integrations';

describe('MCPClient', () => {
	let client: MCPClient;

	beforeEach(() => {
		client = new MCPClient();
	});

	afterEach(async () => {
		await client.disconnectAll();
	});

	it('should connect to MCP server', async () => {
		// Start mock MCP server
		const mockServer = createMockMCPServer();

		await client.connectToServer({
			name: 'test',
			command: mockServer.command,
		});

		expect(client.isConnected('test')).toBe(true);
	});
});
```

### 6.3. Test A2A Server

```typescript
import {A2AServer} from './infrastructure/integrations';

describe('A2AServer', () => {
	let server: A2AServer;

	beforeEach(async () => {
		server = new A2AServer({port: 4000});
		await server.start();
	});

	afterEach(async () => {
		await server.stop();
	});

	it('should handle requests', async () => {
		server.registerHandler('test', async request => {
			return {result: 'ok'};
		});

		const response = await fetch('http://localhost:4000', {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({method: 'test', params: {}}),
		});

		const data = await response.json();
		expect(data.result).toEqual({result: 'ok'});
	});
});
```

---

## 7. Kết luận

Ba integrations này tạo nền tảng cho CODEH CLI để:

- **VSCodeExtension**: Tích hợp với VS Code IDE
- **MCPClient**: Kết nối với MCP ecosystem
- **A2AServer**: Hoạt động như một autonomous agent

Sử dụng đúng cách sẽ mở rộng khả năng của CODEH và cho phép tích hợp với nhiều tools khác trong ecosystem.
