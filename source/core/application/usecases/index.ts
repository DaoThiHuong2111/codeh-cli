/**
 * Core Application Use Cases
 * Business logic orchestration for specific user actions
 */

// Input Processing
export {ProcessUserInput} from './ProcessUserInput.js';
export type {
	InputValidationResult,
	ProcessUserInputRequest,
	ProcessUserInputResponse,
} from './ProcessUserInput.js';

// Streaming
export {StreamResponse} from './StreamResponse.js';
export type {
	StreamResponseRequest,
	StreamResponseResponse,
} from './StreamResponse.js';

// History Management
export {ManageHistory} from './ManageHistory.js';
export type {
	AddMessagesRequest,
	GetHistoryRequest,
	ClearHistoryRequest,
	SearchHistoryRequest,
} from './ManageHistory.js';

// Session Management
export {SaveSession} from './SaveSession.js';
export type {SaveSessionRequest, SaveSessionResponse} from './SaveSession.js';

export {LoadSession} from './LoadSession.js';
export type {LoadSessionRequest, LoadSessionResponse} from './LoadSession.js';

// Tool Execution
export {ExecuteTool} from './ExecuteTool.js';
export type {
	ToolCall,
	ExecuteToolRequest,
	ExecuteToolResponse,
} from './ExecuteTool.js';
