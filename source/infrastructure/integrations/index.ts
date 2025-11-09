/**
 * Infrastructure Integrations
 * External service integrations (VS Code, MCP, A2A)
 */

export { VSCodeExtension } from './vscode/VSCodeExtension.js';
export type { VSCodeMessage } from './vscode/VSCodeExtension.js';

export { MCPClient } from './mcp/MCPClient.js';
export type { MCPServer, MCPResource, MCPTool } from './mcp/MCPClient.js';

export { A2AServer } from './a2a/A2AServer.js';
export type { A2ARequest, A2AResponse } from './a2a/A2AServer.js';
