/**
 * Configurable Permission Handler
 * Provides flexible permission control with multiple modes
 */

import {
	IToolPermissionHandler,
	PermissionResult,
	ToolPermissionContext,
} from '../../core/domain/interfaces/IToolPermissionHandler.js';

export enum PermissionMode {
	/** Auto-approve all tools (for trusted usage) */
	AUTO_APPROVE = 'auto_approve',
	/** Require pre-approval for each tool */
	REQUIRE_APPROVAL = 'require_approval',
	/** Deny all tools by default */
	DENY_BY_DEFAULT = 'deny_by_default',
}

export interface PermissionConfig {
	mode: PermissionMode;
	preApprovedTools: string[];
	dangerousToolsRequireApproval: boolean;
}

const DANGEROUS_TOOLS = new Set([
	'shell',
	'file_write',
	'file_delete',
	'execute_code',
]);

export class ConfigurablePermissionHandler implements IToolPermissionHandler {
	private config: PermissionConfig;
	private preApprovedTools: Set<string>;

	constructor(config?: Partial<PermissionConfig>) {
		this.config = {
			mode: config?.mode ?? PermissionMode.AUTO_APPROVE,
			preApprovedTools: config?.preApprovedTools ?? [],
			dangerousToolsRequireApproval:
				config?.dangerousToolsRequireApproval ?? true,
		};

		this.preApprovedTools = new Set(this.config.preApprovedTools);
	}

	async requestPermission(
		context: ToolPermissionContext,
	): Promise<PermissionResult> {
		const toolName = context.toolCall.name;
		const isDangerous = DANGEROUS_TOOLS.has(toolName);

		// Check pre-approval
		if (this.preApprovedTools.has(toolName)) {
			this.logPermission(context, 'approved', 'Pre-approved tool');
			return {
				approved: true,
				reason: 'Pre-approved tool',
			};
		}

		// Handle dangerous tools
		if (isDangerous && this.config.dangerousToolsRequireApproval) {
			this.logPermission(
				context,
				'denied',
				'Dangerous tool requires explicit approval',
			);
			return {
				approved: false,
				reason:
					'Dangerous tool requires explicit approval. Add to preApprovedTools to enable.',
			};
		}

		// Apply permission mode
		switch (this.config.mode) {
			case PermissionMode.AUTO_APPROVE:
				this.logPermission(
					context,
					'approved',
					'Auto-approved (mode: auto_approve)',
				);
				return {
					approved: true,
					reason: 'Auto-approved',
				};

			case PermissionMode.REQUIRE_APPROVAL:
				if (this.preApprovedTools.has(toolName)) {
					this.logPermission(context, 'approved', 'Pre-approved');
					return {
						approved: true,
						reason: 'Pre-approved',
					};
				} else {
					this.logPermission(
						context,
						'denied',
						'Tool not in pre-approved list (mode: require_approval)',
					);
					return {
						approved: false,
						reason:
							'Tool requires pre-approval. Add to preApprovedTools to enable.',
					};
				}

			case PermissionMode.DENY_BY_DEFAULT:
				this.logPermission(
					context,
					'denied',
					'Denied by default (mode: deny_by_default)',
				);
				return {
					approved: false,
					reason:
						'Permission denied by default. Change mode or add to preApprovedTools.',
				};

			default:
				this.logPermission(context, 'denied', 'Unknown permission mode');
				return {
					approved: false,
					reason: 'Unknown permission mode',
				};
		}
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
			this.config.preApprovedTools.push(toolName);
		} else {
			this.preApprovedTools.delete(toolName);
			this.config.preApprovedTools = this.config.preApprovedTools.filter(
				t => t !== toolName,
			);
		}
	}

	async clearPreferences(): Promise<void> {
		this.preApprovedTools.clear();
		this.config.preApprovedTools = [];
	}

	/**
	 * Update permission mode
	 */
	setMode(mode: PermissionMode): void {
		this.config.mode = mode;
	}

	/**
	 * Get current configuration
	 */
	getConfig(): PermissionConfig {
		return {...this.config};
	}

	/**
	 * Log permission decision
	 */
	private logPermission(
		context: ToolPermissionContext,
		status: 'approved' | 'denied',
		reason: string,
	): void {
		const icon = status === 'approved' ? '✅' : '❌';
		const args = JSON.stringify(context.toolCall.arguments, null, 2);

		console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log('🔧 Tool Permission Request');
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log(`Tool: ${context.toolCall.name}`);
		console.log(`Arguments:`, args);
		console.log(`Status: ${icon} ${status.toUpperCase()}`);
		console.log(`Reason: ${reason}`);
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
	}
}
