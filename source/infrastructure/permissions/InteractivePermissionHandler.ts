/**
 * Interactive Permission Handler
 * Shows UI dialog and waits for user decision
 */

import {
	IToolPermissionHandler,
	PermissionResult,
	ToolPermissionContext,
} from '../../core/domain/interfaces/IToolPermissionHandler';

export interface PermissionUICallback {
	requestPermission: (
		context: ToolPermissionContext,
	) => Promise<PermissionResult>;
}

export class InteractivePermissionHandler implements IToolPermissionHandler {
	private preApprovedTools: Set<string> = new Set();
	private uiCallback?: PermissionUICallback;

	/**
	 * Set UI callback for showing permission dialog
	 * This is called from the presentation layer
	 */
	setUICallback(callback: PermissionUICallback) {
		this.uiCallback = callback;
	}

	async requestPermission(
		context: ToolPermissionContext,
	): Promise<PermissionResult> {
		// Check pre-approval first
		if (this.hasPreApproval(context.toolCall.name)) {
			console.log(`\n✅ Pre-approved: ${context.toolCall.name}\n`);
			return {
				approved: true,
				reason: 'Pre-approved by user preference',
			};
		}

		// If no UI callback, fallback to console approval (shouldn't happen in production)
		if (!this.uiCallback) {
			console.warn(
				'⚠️  No UI callback registered for permission handler. Auto-approving.',
			);
			return {
				approved: true,
				reason: 'No UI callback available',
			};
		}

		// Delegate to UI layer
		console.log(
			`\n🔧 Requesting permission for tool: ${context.toolCall.name}...`,
		);
		const result = await this.uiCallback.requestPermission(context);
		console.log(
			result.approved
				? `✅ Permission granted`
				: ` Permission denied: ${result.reason || 'User rejected'}`,
		);
		console.log('');

		return result;
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
			console.log(`✅ "${toolName}" added to pre-approved tools`);
		} else {
			this.preApprovedTools.delete(toolName);
			console.log(`🗑️  "${toolName}" removed from pre-approved tools`);
		}
	}

	async clearPreferences(): Promise<void> {
		this.preApprovedTools.clear();
		console.log('🗑️  All permission preferences cleared');
	}

	/**
	 * Get list of pre-approved tools (for UI display)
	 */
	getPreApprovedTools(): string[] {
		return Array.from(this.preApprovedTools);
	}
}
