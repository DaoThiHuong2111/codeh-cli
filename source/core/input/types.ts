/**
 * Shortcut Management System - Type Definitions
 * Centralized keyboard shortcut management with layer-based priority
 */

/**
 * Shortcut layers define priority levels for input handling
 * Higher layers block lower layers (except global which always receives input)
 */
export type ShortcutLayer =
	| 'global' // Always active - emergency exits (Ctrl+C)
	| 'screen' // Screen-specific shortcuts
	| 'dialog' // Modal dialogs (ToolPermissionDialog)
	| 'input'; // Text input fields (InputBox)

/**
 * Layer priority from highest to lowest
 * INPUT > DIALOG > SCREEN > GLOBAL
 */
export const LAYER_PRIORITY: Record<ShortcutLayer, number> = {
	input: 4,
	dialog: 3,
	screen: 2,
	global: 1,
};

/**
 * Key combination string format
 * Examples: 'ctrl+c', 'shift+tab', 'escape', 'enter', '?', 'y'
 */
export type KeyCombo = string;

/**
 * Shortcut handler function
 * Returns true if handled (to stop propagation within same layer)
 */
export type ShortcutHandler = () => boolean | void;

/**
 * Condition function to determine if shortcut is enabled
 */
export type ShortcutCondition = () => boolean;

/**
 * Shortcut definition
 */
export interface ShortcutDefinition {
	/** Unique ID (auto-generated if not provided) */
	id?: string;

	/** Key combination (e.g., 'ctrl+c', 'shift+tab', 'escape') */
	key: KeyCombo;

	/** Handler function to execute */
	handler: ShortcutHandler;

	/** Layer this shortcut belongs to */
	layer: ShortcutLayer;

	/** Optional condition to check before execution */
	enabled?: ShortcutCondition;

	/** Priority within the same layer (higher = earlier execution) */
	priority?: number;

	/** Human-readable description for documentation */
	description?: string;

	/** Component/screen that registered this shortcut (for debugging) */
	source?: string;
}

/**
 * Registered shortcut with internal metadata
 */
export interface RegisteredShortcut extends ShortcutDefinition {
	id: string;
	registeredAt: Date;
}

/**
 * Shortcut conflict information
 */
export interface ShortcutConflict {
	key: KeyCombo;
	layer: ShortcutLayer;
	shortcuts: RegisteredShortcut[];
}

/**
 * Ink key object (from useInput hook)
 */
export interface InkKey {
	upArrow?: boolean;
	downArrow?: boolean;
	leftArrow?: boolean;
	rightArrow?: boolean;
	return?: boolean;
	escape?: boolean;
	ctrl?: boolean;
	shift?: boolean;
	tab?: boolean;
	backspace?: boolean;
	delete?: boolean;
	meta?: boolean;
	pageDown?: boolean;
	pageUp?: boolean;
}

/**
 * Parsed key combination from Ink input
 */
export interface ParsedKeyCombo {
	key: string;
	ctrl: boolean;
	shift: boolean;
	meta: boolean;
	alt: boolean;
}

/**
 * Shortcut manager configuration
 */
export interface ShortcutManagerConfig {
	/** Enable debug logging */
	debug?: boolean;

	/** Enable conflict detection */
	detectConflicts?: boolean;

	/** Global layer always receives input (even when blocked) */
	globalAlwaysActive?: boolean;
}

/**
 * Layer state information
 */
export interface LayerState {
	layer: ShortcutLayer;
	active: boolean;
	shortcutCount: number;
}
