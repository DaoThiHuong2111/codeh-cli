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
 * Manages Docker-based sandbox state.
 * Sandbox = Docker container isolation (not whitelist validation)
 */
export interface ISandboxModeManager {
	/**
	 * Check if sandbox mode is enabled
	 *
	 * @returns True if sandbox is enabled
	 */
	isEnabled(): boolean;

	/**
	 * Enable sandbox mode (async - builds and starts Docker container)
	 *
	 * @returns Promise with success status and error message if failed
	 */
	enable(): Promise<{success: boolean; error?: string}>;

	/**
	 * Disable sandbox mode (async - stops and removes Docker container)
	 *
	 * @returns Promise with success status and error message if failed
	 */
	disable(): Promise<{success: boolean; error?: string}>;

	/**
	 * Toggle between enabled and disabled (async)
	 *
	 * @returns Promise with success status, new mode, and error message if failed
	 */
	toggle(): Promise<{success: boolean; mode: SandboxMode; error?: string}>;

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
