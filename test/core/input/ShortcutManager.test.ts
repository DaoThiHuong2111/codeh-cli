/**
 * Shortcut Manager Tests
 * Tests for keyboard shortcut management with layer-based priority system
 */

import test from 'ava';
import {ShortcutManager} from '../../../dist/core/input/ShortcutManager.js';
import type {
	ShortcutDefinition,
	InkKey,
	ShortcutLayer,
} from '../../../dist/core/input/types.js';

// ========================================
// Initialization Tests
// ========================================

test('creates shortcut manager with default config', t => {
	const manager = new ShortcutManager();
	t.truthy(manager);
	t.is(manager.getActiveLayer(), 'screen');
});

test('creates shortcut manager with custom config', t => {
	const manager = new ShortcutManager({
		debug: true,
		detectConflicts: false,
		globalAlwaysActive: false,
	});
	t.truthy(manager);
});

// ========================================
// Shortcut Registration Tests
// ========================================

test('registers shortcut with key', t => {
	const manager = new ShortcutManager();
	let executed = false;

	const id = manager.register({
		key: 'ctrl+c',
		handler: () => {
			executed = true;
		},
		layer: 'global',
		description: 'Cancel operation',
	});

	t.truthy(id);
	t.regex(id, /^shortcut_/);
});

test('registers shortcut with layer', t => {
	const manager = new ShortcutManager();

	const id = manager.register({
		key: 'enter',
		handler: () => {},
		layer: 'input',
		description: 'Submit input',
	});

	const shortcuts = manager.getShortcutsByLayer('input');
	t.is(shortcuts.length, 1);
	t.is(shortcuts[0].id, id);
});

test('registers conditional shortcut', t => {
	const manager = new ShortcutManager();
	let isEnabled = false;

	manager.register({
		key: 'y',
		handler: () => {},
		layer: 'dialog',
		enabled: () => isEnabled,
		description: 'Confirm action',
	});

	const shortcuts = manager.getActiveShortcuts();
	t.is(shortcuts.length, 0); // Not enabled yet

	isEnabled = true;
	const activeShortcuts = manager.getActiveShortcuts();
	t.is(activeShortcuts.length, 1);
});

test('detects conflicts when registering duplicates', t => {
	const manager = new ShortcutManager({detectConflicts: true});

	manager.register({
		key: 'ctrl+s',
		handler: () => {},
		layer: 'screen',
		description: 'Save 1',
	});

	manager.register({
		key: 'ctrl+s',
		handler: () => {},
		layer: 'screen',
		description: 'Save 2',
	});

	const conflicts = manager.getConflicts();
	t.is(conflicts.length, 1);
	t.is(conflicts[0].key, 'ctrl+s');
	t.is(conflicts[0].layer, 'screen');
	t.is(conflicts[0].shortcuts.length, 2);
});

test('registers shortcut with custom ID', t => {
	const manager = new ShortcutManager();

	const customId = 'my-custom-shortcut';
	const id = manager.register({
		id: customId,
		key: 'ctrl+q',
		handler: () => {},
		layer: 'global',
	});

	t.is(id, customId);
});

test('registers shortcut with priority', t => {
	const manager = new ShortcutManager();
	const executionOrder: number[] = [];

	manager.register({
		key: 'escape',
		handler: () => {
			executionOrder.push(1);
		},
		layer: 'screen',
		priority: 1,
	});

	manager.register({
		key: 'escape',
		handler: () => {
			executionOrder.push(2);
		},
		layer: 'screen',
		priority: 2, // Higher priority
	});

	// Simulate escape key
	manager.handleInput('', {escape: true} as InkKey);

	// Higher priority executes first
	t.deepEqual(executionOrder, [2, 1]);
});

// ========================================
// Shortcut Execution Tests
// ========================================

test('executes matching shortcut', t => {
	const manager = new ShortcutManager();
	let executed = false;

	manager.register({
		key: 'enter',
		handler: () => {
			executed = true;
			return true; // Return true to indicate handled
		},
		layer: 'screen',
	});

	const handled = manager.handleInput('', {return: true} as InkKey);

	t.true(executed);
	t.true(handled);
});

test('respects layer priority (input > screen > global)', t => {
	const manager = new ShortcutManager();
	const executionLog: string[] = [];

	// Register shortcuts in different layers
	manager.register({
		key: 'escape',
		handler: () => {
			executionLog.push('global');
		},
		layer: 'global',
	});

	manager.register({
		key: 'escape',
		handler: () => {
			executionLog.push('screen');
		},
		layer: 'screen',
	});

	manager.register({
		key: 'escape',
		handler: () => {
			executionLog.push('input');
		},
		layer: 'input',
	});

	// Set active layer to input
	manager.setActiveLayer('input');
	manager.handleInput('', {escape: true} as InkKey);

	// Input layer has highest priority, global always executes
	t.true(executionLog.includes('input'));
	t.true(executionLog.includes('global'));
});

test('calls handler with correct context', t => {
	const manager = new ShortcutManager();
	let handlerCalled = false;
	let returnValue = false;

	manager.register({
		key: 'y',
		handler: () => {
			handlerCalled = true;
			return true; // Stop propagation
		},
		layer: 'dialog',
	});

	manager.setActiveLayer('dialog');
	const handled = manager.handleInput('y', {} as InkKey);

	t.true(handlerCalled);
	t.true(handled);
});

test('handles async handlers', async t => {
	const manager = new ShortcutManager();
	let asyncResult = '';

	manager.register({
		key: 'ctrl+s',
		handler: () => {
			// Simulate async operation
			setTimeout(() => {
				asyncResult = 'saved';
			}, 10);
		},
		layer: 'screen',
	});

	manager.handleInput('s', {ctrl: true} as InkKey);

	// Wait for async operation
	await new Promise(resolve => setTimeout(resolve, 20));
	t.is(asyncResult, 'saved');
});

test('stops propagation when handler returns true', t => {
	const manager = new ShortcutManager();
	const executionLog: string[] = [];

	manager.register({
		key: 'escape',
		handler: () => {
			executionLog.push('first');
			return true; // Stop propagation
		},
		layer: 'screen',
		priority: 2,
	});

	manager.register({
		key: 'escape',
		handler: () => {
			executionLog.push('second');
		},
		layer: 'screen',
		priority: 1,
	});

	manager.handleInput('', {escape: true} as InkKey);

	// Only first handler executes
	t.deepEqual(executionLog, ['first']);
});

// ========================================
// Shortcut Management Tests
// ========================================

test('unregisters shortcuts', t => {
	const manager = new ShortcutManager();

	const id = manager.register({
		key: 'ctrl+q',
		handler: () => {},
		layer: 'global',
	});

	t.is(manager.getActiveShortcuts().length, 1);

	const removed = manager.unregister(id);
	t.true(removed);
	t.is(manager.getActiveShortcuts().length, 0);
});

test('unregister returns false for non-existent shortcut', t => {
	const manager = new ShortcutManager();
	const removed = manager.unregister('non-existent-id');
	t.false(removed);
});

test('updates shortcut handlers by re-registering', t => {
	const manager = new ShortcutManager();
	let counter = 0;

	const customId = 'updateable-shortcut';

	manager.register({
		id: customId,
		key: 'ctrl+u',
		handler: () => {
			counter = 1;
		},
		layer: 'screen',
	});

	manager.handleInput('u', {ctrl: true} as InkKey);
	t.is(counter, 1);

	// Update by re-registering with same ID
	manager.unregister(customId);
	manager.register({
		id: customId,
		key: 'ctrl+u',
		handler: () => {
			counter = 2;
		},
		layer: 'screen',
	});

	manager.handleInput('u', {ctrl: true} as InkKey);
	t.is(counter, 2);
});

test('lists all active shortcuts', t => {
	const manager = new ShortcutManager();

	manager.register({key: 'ctrl+c', handler: () => {}, layer: 'global'});
	manager.register({key: 'enter', handler: () => {}, layer: 'screen'});
	manager.register({key: 'tab', handler: () => {}, layer: 'input'});

	manager.setActiveLayer('screen');

	const active = manager.getActiveShortcuts();
	// Should include global and screen (and higher priority)
	t.true(active.length >= 2);
});

test('filters shortcuts by layer', t => {
	const manager = new ShortcutManager();

	manager.register({key: 'ctrl+c', handler: () => {}, layer: 'global'});
	manager.register({key: 'escape', handler: () => {}, layer: 'screen'});
	manager.register({key: 'enter', handler: () => {}, layer: 'input'});

	const globalShortcuts = manager.getShortcutsByLayer('global');
	t.is(globalShortcuts.length, 1);
	t.is(globalShortcuts[0].key, 'ctrl+c');

	const screenShortcuts = manager.getShortcutsByLayer('screen');
	t.is(screenShortcuts.length, 1);
	t.is(screenShortcuts[0].key, 'escape');
});

test('clears all shortcuts', t => {
	const manager = new ShortcutManager();

	manager.register({key: 'ctrl+c', handler: () => {}, layer: 'global'});
	manager.register({key: 'enter', handler: () => {}, layer: 'screen'});

	t.is(manager.getActiveShortcuts().length, 2);

	manager.clear();
	t.is(manager.getActiveShortcuts().length, 0);
});

// ========================================
// Layer Management Tests
// ========================================

test('sets active layer', t => {
	const manager = new ShortcutManager();

	t.is(manager.getActiveLayer(), 'screen');

	manager.setActiveLayer('input');
	t.is(manager.getActiveLayer(), 'input');

	manager.setActiveLayer('dialog');
	t.is(manager.getActiveLayer(), 'dialog');
});

test('gets layer states', t => {
	const manager = new ShortcutManager();

	manager.register({key: 'ctrl+c', handler: () => {}, layer: 'global'});
	manager.register({key: 'enter', handler: () => {}, layer: 'screen'});
	manager.register({key: 'tab', handler: () => {}, layer: 'input'});

	manager.setActiveLayer('screen');

	const states = manager.getLayerStates();
	t.is(states.length, 4); // global, screen, dialog, input

	const screenState = states.find(s => s.layer === 'screen');
	t.truthy(screenState);
	t.true(screenState!.active);
	t.is(screenState!.shortcutCount, 1);
});

// ========================================
// Edge Cases Tests
// ========================================

test('handles invalid key combinations', t => {
	const manager = new ShortcutManager();
	let executed = false;

	manager.register({
		key: 'ctrl+c',
		handler: () => {
			executed = true;
		},
		layer: 'screen',
	});

	// Invalid input (empty)
	const handled = manager.handleInput('', {} as InkKey);

	t.false(executed);
	t.false(handled);
});

test('handles modifier keys', t => {
	const manager = new ShortcutManager();
	let executed = false;

	manager.register({
		key: 'ctrl+shift+tab',
		handler: () => {
			executed = true;
		},
		layer: 'screen',
	});

	// For special keys, shift is included in the combo
	manager.handleInput('', {tab: true, ctrl: true, shift: true} as InkKey);

	t.true(executed);
});

test('handles multiple shortcuts same key different layers', t => {
	const manager = new ShortcutManager();
	const executionLog: string[] = [];

	manager.register({
		key: 'escape',
		handler: () => {
			executionLog.push('screen');
		},
		layer: 'screen',
	});

	manager.register({
		key: 'escape',
		handler: () => {
			executionLog.push('global');
		},
		layer: 'global',
	});

	// Active layer is screen
	manager.setActiveLayer('screen');
	manager.handleInput('', {escape: true} as InkKey);

	// Both execute: screen matches active layer, global always executes
	t.true(executionLog.includes('screen'));
	t.true(executionLog.includes('global'));
});

test('handles disabled shortcuts', t => {
	const manager = new ShortcutManager();
	let executed = false;
	let isEnabled = false;

	manager.register({
		key: 'ctrl+p',
		handler: () => {
			executed = true;
		},
		layer: 'screen',
		enabled: () => isEnabled,
	});

	// Try when disabled
	manager.handleInput('p', {ctrl: true} as InkKey);
	t.false(executed);

	// Enable and try again
	isEnabled = true;
	manager.handleInput('p', {ctrl: true} as InkKey);
	t.true(executed);
});

test('handles special keys (arrows, tab, enter)', t => {
	const manager = new ShortcutManager();
	const pressedKeys: string[] = [];

	manager.register({
		key: 'up',
		handler: () => {
			pressedKeys.push('up');
		},
		layer: 'screen',
	});

	manager.register({
		key: 'down',
		handler: () => {
			pressedKeys.push('down');
		},
		layer: 'screen',
	});

	manager.register({
		key: 'tab',
		handler: () => {
			pressedKeys.push('tab');
		},
		layer: 'screen',
	});

	manager.handleInput('', {upArrow: true} as InkKey);
	manager.handleInput('', {downArrow: true} as InkKey);
	manager.handleInput('', {tab: true} as InkKey);

	t.deepEqual(pressedKeys, ['up', 'down', 'tab']);
});

test('global layer always executes regardless of active layer', t => {
	const manager = new ShortcutManager({globalAlwaysActive: true});
	let globalExecuted = false;

	manager.register({
		key: 'ctrl+c',
		handler: () => {
			globalExecuted = true;
		},
		layer: 'global',
	});

	// Set to highest layer
	manager.setActiveLayer('input');

	// Global should still execute
	manager.handleInput('c', {ctrl: true} as InkKey);
	t.true(globalExecuted);
});

test('handles error in handler gracefully', t => {
	const manager = new ShortcutManager();
	let secondHandlerExecuted = false;

	manager.register({
		key: 'ctrl+e',
		handler: () => {
			throw new Error('Handler error');
		},
		layer: 'screen',
		priority: 2,
	});

	manager.register({
		key: 'ctrl+e',
		handler: () => {
			secondHandlerExecuted = true;
		},
		layer: 'screen',
		priority: 1,
	});

	// Should not throw, should continue to next handler
	t.notThrows(() => {
		manager.handleInput('e', {ctrl: true} as InkKey);
	});

	t.true(secondHandlerExecuted);
});

// ========================================
// Debug and Utility Tests
// ========================================

test('gets debug state', t => {
	const manager = new ShortcutManager();

	manager.register({key: 'ctrl+c', handler: () => {}, layer: 'global'});
	manager.register({key: 'escape', handler: () => {}, layer: 'screen'});

	const debugState = manager.getDebugState();

	t.truthy(debugState);
	t.is(debugState.activeLayer, 'screen');
	t.is(debugState.totalShortcuts, 2);
	t.truthy(debugState.shortcuts);
	t.is(debugState.shortcuts.length, 2);
	t.truthy(debugState.layerStates);
});

test('normalizes key combinations', t => {
	const manager = new ShortcutManager();
	let executed = false;

	// Register with uppercase
	manager.register({
		key: 'CTRL+C',
		handler: () => {
			executed = true;
		},
		layer: 'global',
	});

	// Should match lowercase
	manager.handleInput('c', {ctrl: true} as InkKey);
	t.true(executed);
});

test('handles character input correctly', t => {
	const manager = new ShortcutManager();
	const pressedChars: string[] = [];

	manager.register({
		key: '?',
		handler: () => {
			pressedChars.push('?');
		},
		layer: 'screen',
		description: 'Show help',
	});

	manager.register({
		key: 'y',
		handler: () => {
			pressedChars.push('y');
		},
		layer: 'dialog',
		description: 'Confirm',
	});

	manager.setActiveLayer('screen');
	manager.handleInput('?', {} as InkKey);

	manager.setActiveLayer('dialog');
	manager.handleInput('y', {} as InkKey);

	t.deepEqual(pressedChars, ['?', 'y']);
});
