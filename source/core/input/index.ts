/**
 * Centralized Shortcut Management System
 * Export all public APIs
 */

export {ShortcutManager} from './ShortcutManager';
export {
	ShortcutProvider,
	useShortcutManager,
	useShortcut,
	useShortcuts,
	useLayerSwitch,
	useShortcutDebug,
} from './ShortcutContext';

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

export {
	parseKeyCombo,
	parseKeyComboString,
	matchKeyCombo,
	normalizeKeyCombo,
	formatKeyComboForDisplay,
} from './keyParser';
