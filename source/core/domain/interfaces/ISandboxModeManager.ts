/**
 * Sandbox Mode Manager Interface
 *
 * Interface for managing sandbox security mode.
 * This allows Core layer to depend on abstraction instead of concrete implementation.
 *
 * @interface ISandboxModeManager
 */

/**
 * Sandbox mode enumeration
 */
export enum SandboxMode {
	ENABLED = 'enabled',
	DISABLED = 'disabled',
}

/**
 * Listener for sandbox mode changes
 */
export interface SandboxModeChangeListener {
	onModeChanged(newMode: SandboxMode, oldMode: SandboxMode): void;
}

/**
 * Sandbox mode manager interface
 *
 * Manages the global sandbox security state.
 */
export interface ISandboxModeManager {
	/**
	 * Check if sandbox mode is enabled
	 *
	 * @returns True if sandbox is enabled
	 */
	isEnabled(): boolean;

	/**
	 * Enable sandbox mode
	 *
	 * Restricts shell commands to whitelist.
	 */
	enable(): void;

	/**
	 * Disable sandbox mode
	 *
	 * Allows all shell commands (use with caution).
	 */
	disable(): void;

	/**
	 * Toggle between enabled and disabled
	 *
	 * @returns New mode after toggle
	 */
	toggle(): SandboxMode;

	/**
	 * Get current mode
	 *
	 * @returns Current sandbox mode
	 */
	getMode(): SandboxMode;

	/**
	 * Get human-readable mode description
	 *
	 * @returns Description of current mode
	 */
	getModeDescription(): string;

	/**
	 * Add a listener for mode changes
	 *
	 * @param listener - Listener to add
	 */
	addListener(listener: SandboxModeChangeListener): void;

	/**
	 * Remove a listener
	 *
	 * @param listener - Listener to remove
	 */
	removeListener(listener: SandboxModeChangeListener): void;
}
