/**
 * Sandbox Mode Manager
 * Manages sandbox mode state across the application
 */

export enum SandboxMode {
	ENABLED = 'enabled',
	DISABLED = 'disabled',
}

export interface SandboxModeChangeListener {
	(mode: SandboxMode): void;
}

/**
 * Singleton manager for sandbox mode
 */
export class SandboxModeManager {
	private mode: SandboxMode = SandboxMode.ENABLED; // Default: enabled for safety
	private listeners: SandboxModeChangeListener[] = [];

	/**
	 * Get current sandbox mode
	 */
	getMode(): SandboxMode {
		return this.mode;
	}

	/**
	 * Check if sandbox is enabled
	 */
	isEnabled(): boolean {
		return this.mode === SandboxMode.ENABLED;
	}

	/**
	 * Enable sandbox mode
	 */
	enable(): void {
		if (this.mode !== SandboxMode.ENABLED) {
			this.mode = SandboxMode.ENABLED;
			console.log('🔒 Sandbox mode ENABLED - Commands are restricted for safety');
			this.notifyListeners();
		}
	}

	/**
	 * Disable sandbox mode (use with caution!)
	 */
	disable(): void {
		if (this.mode !== SandboxMode.DISABLED) {
			this.mode = SandboxMode.DISABLED;
			console.log(
				'⚠️  Sandbox mode DISABLED - All commands are allowed (use with caution!)',
			);
			this.notifyListeners();
		}
	}

	/**
	 * Toggle sandbox mode
	 */
	toggle(): SandboxMode {
		if (this.isEnabled()) {
			this.disable();
		} else {
			this.enable();
		}

		return this.mode;
	}

	/**
	 * Add listener for mode changes
	 */
	addListener(listener: SandboxModeChangeListener): void {
		this.listeners.push(listener);
	}

	/**
	 * Remove listener
	 */
	removeListener(listener: SandboxModeChangeListener): void {
		this.listeners = this.listeners.filter(l => l !== listener);
	}

	/**
	 * Notify all listeners of mode change
	 */
	private notifyListeners(): void {
		for (const listener of this.listeners) {
			try {
				listener(this.mode);
			} catch (error) {
				console.error('Error notifying sandbox mode listener:', error);
			}
		}
	}

	/**
	 * Get mode description
	 */
	getModeDescription(): string {
		if (this.isEnabled()) {
			return '🔒 Sandbox ENABLED - Commands are restricted to safe whitelist';
		}

		return '⚠️  Sandbox DISABLED - All commands allowed (use with caution!)';
	}
}

/**
 * Global sandbox mode manager instance
 */
export const globalSandboxModeManager = new SandboxModeManager();
