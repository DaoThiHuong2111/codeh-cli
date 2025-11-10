/**
 * Permission Mode Manager
 * Manages permission mode state (MVP vs Interactive)
 * Allows runtime switching between modes
 */

export type PermissionMode = 'mvp' | 'interactive';

export interface ModeChangeListener {
	onModeChanged: (mode: PermissionMode) => void;
}

export class PermissionModeManager {
	private currentMode: PermissionMode = 'mvp'; // Default to MVP mode
	private listeners: ModeChangeListener[] = [];

	/**
	 * Get current permission mode
	 */
	getCurrentMode(): PermissionMode {
		return this.currentMode;
	}

	/**
	 * Set permission mode
	 */
	setMode(mode: PermissionMode): void {
		if (this.currentMode !== mode) {
			this.currentMode = mode;
			this.notifyListeners();
		}
	}

	/**
	 * Toggle between MVP and Interactive modes
	 */
	toggleMode(): void {
		const newMode: PermissionMode = this.currentMode === 'mvp' ? 'interactive' : 'mvp';
		this.setMode(newMode);
	}

	/**
	 * Check if currently in MVP mode
	 */
	isMVPMode(): boolean {
		return this.currentMode === 'mvp';
	}

	/**
	 * Check if currently in Interactive mode
	 */
	isInteractiveMode(): boolean {
		return this.currentMode === 'interactive';
	}

	/**
	 * Register a listener for mode changes
	 */
	addListener(listener: ModeChangeListener): void {
		this.listeners.push(listener);
	}

	/**
	 * Remove a listener
	 */
	removeListener(listener: ModeChangeListener): void {
		const index = this.listeners.indexOf(listener);
		if (index !== -1) {
			this.listeners.splice(index, 1);
		}
	}

	/**
	 * Notify all listeners of mode change
	 */
	private notifyListeners(): void {
		this.listeners.forEach(listener => {
			listener.onModeChanged(this.currentMode);
		});
	}

	/**
	 * Get human-readable mode description
	 */
	getModeDescription(): string {
		return this.currentMode === 'mvp'
			? 'MVP (Auto-approve all tools)'
			: 'Interactive (User approval required)';
	}

	/**
	 * Get mode emoji indicator
	 */
	getModeIcon(): string {
		return this.currentMode === 'mvp' ? '🚀' : '🔒';
	}
}
