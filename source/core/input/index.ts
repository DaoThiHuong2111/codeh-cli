/**
 * Centralized Shortcut Management System
 * Export all public APIs
 */

// Core
export {ShortcutManager} from './ShortcutManager';
export {
	ShortcutProvider,
	useShortcutManager,
	useShortcut,
	useShortcuts,
	useLayerSwitch,
	useShortcutDebug,
} from './ShortcutContext';

// Types
export type {
	ShortcutLayer,
	KeyCombo,
	ShortcutHandler,
	ShortcutCondition,
	ShortcutDefinition,
	RegisteredShortcut,
	ShortcutConflict,
	ShortcutManagerConfig,
	LayerState,
	InkKey,
	ParsedKeyCombo,
} from './types';

// Utilities
export {
	parseKeyCombo,
	parseKeyComboString,
	matchKeyCombo,
	normalizeKeyCombo,
	formatKeyComboForDisplay,
} from './keyParser';
