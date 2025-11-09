/**
 * Infrastructure Integrations
 * External service integrations (VS Code, MCP, A2A)
 */

// VS Code Extension Integration
export {VSCodeExtension} from './vscode/VSCodeExtension.js';
export type {VSCodeMessage, VSCodeConfig} from './vscode/VSCodeExtension.js';

// MCP (Model Context Protocol) Integration
export {MCPClient} from './mcp/MCPClient.js';
export type {
	MCPServer,
	MCPResource,
	MCPTool,
	MCPPrompt,
} from './mcp/MCPClient.js';

// Agent-to-Agent (A2A) Integration
export {A2AServer} from './a2a/A2AServer.js';
export type {
	A2ARequest,
	A2AResponse,
	A2AServerConfig,
} from './a2a/A2AServer.js';
