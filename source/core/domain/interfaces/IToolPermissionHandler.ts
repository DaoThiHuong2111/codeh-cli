/**
 * Interface for tool permission handling
 * Implementations handle user permission requests for tool execution
 */

import {ToolCall} from './IApiClient';

export interface PermissionResult {
	approved: boolean;
	reason?: string;
	rememberChoice?: boolean; // For "always allow" feature
}

export interface ToolPermissionContext {
	toolCall: ToolCall;
	toolDescription?: string;
	timestamp: Date;
	conversationContext?: string; // Why AI wants to use this tool
}

export interface IToolPermissionHandler {
	/**
	 * Request permission to execute a tool
	 * Returns permission result
	 */
	requestPermission(context: ToolPermissionContext): Promise<PermissionResult>;

	/**
	 * Check if a tool has been pre-approved
	 * Returns true if permission should be auto-granted
	 */
	hasPreApproval(toolName: string): boolean;

	/**
	 * Save permission preference for future use
	 */
	savePermissionPreference(
		toolName: string,
		alwaysAllow: boolean,
	): Promise<void>;

	/**
	 * Clear all permission preferences
	 */
	clearPreferences(): Promise<void>;
}
