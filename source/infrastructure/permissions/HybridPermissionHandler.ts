/**
 * Hybrid Permission Handler
 * Delegates to SimplePermissionHandler or InteractivePermissionHandler
 * based on current PermissionMode
 */

import {
	IToolPermissionHandler,
	PermissionResult,
	ToolPermissionContext,
} from '../../core/domain/interfaces/IToolPermissionHandler';
import {SimplePermissionHandler} from './SimplePermissionHandler';
import {InteractivePermissionHandler} from './InteractivePermissionHandler';
import {PermissionModeManager} from './PermissionModeManager';

export class HybridPermissionHandler implements IToolPermissionHandler {
	private simpleHandler: SimplePermissionHandler;
	private interactiveHandler: InteractivePermissionHandler;

	constructor(private modeManager: PermissionModeManager) {
		this.simpleHandler = new SimplePermissionHandler();
		this.interactiveHandler = new InteractivePermissionHandler();
	}

	/**
	 * Get the interactive handler for UI callback setup
	 */
	getInteractiveHandler(): InteractivePermissionHandler {
		return this.interactiveHandler;
	}

	/**
	 * Delegate to appropriate handler based on current mode
	 */
	async requestPermission(
		context: ToolPermissionContext,
	): Promise<PermissionResult> {
		const handler = this.modeManager.isMVPMode()
			? this.simpleHandler
			: this.interactiveHandler;

		return handler.requestPermission(context);
	}

	hasPreApproval(toolName: string): boolean {
		// Only check pre-approval in interactive mode
		if (this.modeManager.isInteractiveMode()) {
			return this.interactiveHandler.hasPreApproval(toolName);
		}
		// In MVP mode, everything is pre-approved
		return true;
	}

	async savePermissionPreference(
		toolName: string,
		alwaysAllow: boolean,
	): Promise<void> {
		// Only save preferences in interactive mode
		if (this.modeManager.isInteractiveMode()) {
			await this.interactiveHandler.savePermissionPreference(
				toolName,
				alwaysAllow,
			);
		} else {
			console.log(
				'⚠️  Permission preferences are only available in Interactive mode',
			);
		}
	}

	async clearPreferences(): Promise<void> {
		await this.interactiveHandler.clearPreferences();
	}
}
