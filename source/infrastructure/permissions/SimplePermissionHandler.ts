/**
 * Simple Permission Handler (Backward Compatibility)
 * Delegates to ConfigurablePermissionHandler with AUTO_APPROVE mode
 *
 * For advanced permission control, use ConfigurablePermissionHandler directly
 */

import {
	IToolPermissionHandler,
	PermissionResult,
	ToolPermissionContext,
} from '../../core/domain/interfaces/IToolPermissionHandler.js';
import {
	ConfigurablePermissionHandler,
	PermissionMode,
} from './ConfigurablePermissionHandler.js';

export class SimplePermissionHandler implements IToolPermissionHandler {
	private handler: ConfigurablePermissionHandler;

	constructor() {
		// Delegate to ConfigurablePermissionHandler in AUTO_APPROVE mode
		this.handler = new ConfigurablePermissionHandler({
			mode: PermissionMode.AUTO_APPROVE,
			dangerousToolsRequireApproval: false, // For backward compatibility
		});
	}

	async requestPermission(
		context: ToolPermissionContext,
	): Promise<PermissionResult> {
		return this.handler.requestPermission(context);
	}

	hasPreApproval(toolName: string): boolean {
		return this.handler.hasPreApproval(toolName);
	}

	async savePermissionPreference(
		toolName: string,
		alwaysAllow: boolean,
	): Promise<void> {
		return this.handler.savePermissionPreference(toolName, alwaysAllow);
	}

	async clearPreferences(): Promise<void> {
		return this.handler.clearPreferences();
	}
}
