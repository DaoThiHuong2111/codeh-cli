/**
 * Tests for PermissionModeManager
 * Coverage target: 95%
 */

import test from 'ava';
import {PermissionModeManager, type ModeChangeListener} from '../../../dist/infrastructure/permissions/PermissionModeManager.js';

test('initializes with MVP mode by default', t => {
	const manager = new PermissionModeManager();
	
	t.is(manager.getCurrentMode(), 'mvp');
	t.true(manager.isMVPMode());
	t.false(manager.isInteractiveMode());
});

test('sets mode correctly', t => {
	const manager = new PermissionModeManager();
	
	manager.setMode('interactive');
	
	t.is(manager.getCurrentMode(), 'interactive');
	t.false(manager.isMVPMode());
	t.true(manager.isInteractiveMode());
});

test('toggles between modes', t => {
	const manager = new PermissionModeManager();
	
	// Initial: MVP
	t.is(manager.getCurrentMode(), 'mvp');
	
	// Toggle to Interactive
	manager.toggleMode();
	t.is(manager.getCurrentMode(), 'interactive');
	
	// Toggle back to MVP
	manager.toggleMode();
	t.is(manager.getCurrentMode(), 'mvp');
});

test('notifies listeners on mode change', t => {
	const manager = new PermissionModeManager();
	let notificationCount = 0;
	let lastMode: string | null = null;
	
	const listener: ModeChangeListener = {
		onModeChanged: (mode) => {
			notificationCount++;
			lastMode = mode;
		}
	};
	
	manager.addListener(listener);
	
	// Change to interactive
	manager.setMode('interactive');
	t.is(notificationCount, 1);
	t.is(lastMode, 'interactive');
	
	// Change back to MVP
	manager.setMode('mvp');
	t.is(notificationCount, 2);
	t.is(lastMode, 'mvp');
});

test('does not notify listeners if mode unchanged', t => {
	const manager = new PermissionModeManager();
	let notificationCount = 0;
	
	const listener: ModeChangeListener = {
		onModeChanged: () => {
			notificationCount++;
		}
	};
	
	manager.addListener(listener);
	
	// Set to same mode (MVP)
	manager.setMode('mvp');
	t.is(notificationCount, 0);
});

test('removes listener correctly', t => {
	const manager = new PermissionModeManager();
	let notificationCount = 0;
	
	const listener: ModeChangeListener = {
		onModeChanged: () => {
			notificationCount++;
		}
	};
	
	manager.addListener(listener);
	manager.removeListener(listener);
	
	manager.setMode('interactive');
	t.is(notificationCount, 0);
});

test('returns correct mode description', t => {
	const manager = new PermissionModeManager();
	
	t.true(manager.getModeDescription().includes('MVP'));
	
	manager.setMode('interactive');
	t.true(manager.getModeDescription().includes('Interactive'));
});

test('returns correct mode icon', t => {
	const manager = new PermissionModeManager();
	
	t.is(manager.getModeIcon(), '🚀');
	
	manager.setMode('interactive');
	t.is(manager.getModeIcon(), '🔒');
});
