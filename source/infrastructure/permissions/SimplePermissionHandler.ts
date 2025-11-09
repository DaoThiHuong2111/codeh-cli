/**
 * Simple Permission Handler (MVP Implementation)
 * Auto-approves all tool executions for initial testing
 * TODO: Replace with interactive dialog in Phase 4
 */

import {
	IToolPermissionHandler,
	PermissionResult,
	ToolPermissionContext,
} from '../../core/domain/interfaces/IToolPermissionHandler';

export class SimplePermissionHandler implements IToolPermissionHandler {
	private preApprovedTools: Set<string> = new Set();

	async requestPermission(
		context: ToolPermissionContext,
	): Promise<PermissionResult> {
		// MVP: Auto-approve all tools
		// TODO: Show dialog and ask user
		console.log(`[MVP] Auto-approving tool: ${context.toolCall.name}`);
		console.log(`Arguments:`, JSON.stringify(context.toolCall.arguments, null, 2));

		return {
			approved: true,
			reason: 'Auto-approved (MVP mode)',
		};
	}

	hasPreApproval(toolName: string): boolean {
		return this.preApprovedTools.has(toolName);
	}

	async savePermissionPreference(
		toolName: string,
		alwaysAllow: boolean,
	): Promise<void> {
		if (alwaysAllow) {
			this.preApprovedTools.add(toolName);
		} else {
			this.preApprovedTools.delete(toolName);
		}
	}

	async clearPreferences(): Promise<void> {
		this.preApprovedTools.clear();
	}
}
