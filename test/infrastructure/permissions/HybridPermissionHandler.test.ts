/**
 * Tests for HybridPermissionHandler
 * **Feature: permission-mode-fix**
 */

import test from 'ava';
import * as fc from 'fast-check';
import {HybridPermissionHandler} from '../../../dist/infrastructure/permissions/HybridPermissionHandler.js';
import {PermissionModeManager} from '../../../dist/infrastructure/permissions/PermissionModeManager.js';
import type {ToolPermissionContext} from '../../../dist/core/domain/interfaces/IToolPermissionHandler.js';

// Suppress console output during tests
const originalLog = console.log;
const originalWarn = console.warn;
test.before(() => {
	console.log = () => {};
	console.warn = () => {};
});
test.after(() => {
	console.log = originalLog;
	console.warn = originalWarn;
});

// Arbitrary generators for property-based testing
const toolNameArb = fc.stringMatching(/^[a-z_][a-z0-9_]{0,20}$/);
const toolArgsArb = fc.dictionary(
	fc.stringMatching(/^[a-z_][a-z0-9_]{0,10}$/),
	fc.oneof(fc.string(), fc.integer(), fc.boolean())
);

const toolContextArb = fc.record({
	toolCall: fc.record({
		id: fc.uuid(),
		name: toolNameArb,
		arguments: toolArgsArb,
	}),
	toolDescription: fc.option(fc.string(), {nil: undefined}),
	timestamp: fc.date(),
	conversationContext: fc.option(fc.string(), {nil: undefined}),
});

/**
 * **Feature: permission-mode-fix, Property 1: MVP Mode Auto-Approves All Tools**
 * **Validates: Requirements 2.1, 2.2, 3.3**
 *
 * For any tool call in MVP mode, the permission handler SHALL return {approved: true}
 * without invoking UI callback.
 */
test('Property 1: MVP mode auto-approves all tools without UI callback', async t => {
	await fc.assert(
		fc.asyncProperty(toolContextArb, async context => {
			// Setup: Create handler in MVP mode
			const modeManager = new PermissionModeManager();
			modeManager.setMode('mvp'); // Ensure MVP mode
			const handler = new HybridPermissionHandler(modeManager);

			// Track if UI callback was invoked
			let uiCallbackInvoked = false;
			handler.getInteractiveHandler().setUICallback({
				requestPermission: async () => {
					uiCallbackInvoked = true;
					return {approved: false, reason: 'Should not be called'};
				},
			});

			// Act: Request permission
			const result = await handler.requestPermission(context);

			// Assert: Should be approved without UI callback
			t.true(result.approved, 'MVP mode should auto-approve all tools');
			t.false(
				uiCallbackInvoked,
				'UI callback should NOT be invoked in MVP mode'
			);
		}),
		{numRuns: 100}
	);
});

/**
 * **Feature: permission-mode-fix, Property 2: Interactive Mode Shows Dialog**
 * **Validates: Requirements 1.1, 1.2, 4.3**
 *
 * For any tool call in Interactive mode (without pre-approval), the permission handler
 * SHALL invoke UI callback and wait for user response.
 */
test('Property 2: Interactive mode invokes UI callback for non-pre-approved tools', async t => {
	await fc.assert(
		fc.asyncProperty(toolContextArb, async context => {
			// Setup: Create handler in Interactive mode
			const modeManager = new PermissionModeManager();
			modeManager.setMode('interactive');
			const handler = new HybridPermissionHandler(modeManager);

			// Track UI callback invocation
			let uiCallbackInvoked = false;
			let receivedContext: ToolPermissionContext | null = null;

			handler.getInteractiveHandler().setUICallback({
				requestPermission: async ctx => {
					uiCallbackInvoked = true;
					receivedContext = ctx;
					return {approved: true, reason: 'User approved'};
				},
			});

			// Act: Request permission
			const result = await handler.requestPermission(context);

			// Assert: UI callback should be invoked
			t.true(
				uiCallbackInvoked,
				'UI callback should be invoked in Interactive mode'
			);
			t.is(
				receivedContext?.toolCall.name,
				context.toolCall.name,
				'Context should be passed to UI callback'
			);
			t.true(result.approved, 'Result should match UI callback response');
		}),
		{numRuns: 100}
	);
});

/**
 * Test: Mode switching changes delegation behavior immediately
 * **Validates: Requirements 3.3**
 */
test('Mode switching changes delegation behavior immediately', async t => {
	const modeManager = new PermissionModeManager();
	const handler = new HybridPermissionHandler(modeManager);

	let uiCallbackCount = 0;
	handler.getInteractiveHandler().setUICallback({
		requestPermission: async () => {
			uiCallbackCount++;
			return {approved: true};
		},
	});

	const context: ToolPermissionContext = {
		toolCall: {id: 'test-1', name: 'test_tool', arguments: {}},
		timestamp: new Date(),
	};

	// Start in MVP mode (default)
	t.true(modeManager.isMVPMode(), 'Should start in MVP mode');

	// Request in MVP mode - should auto-approve
	const result1 = await handler.requestPermission(context);
	t.true(result1.approved, 'MVP mode should approve');
	t.is(uiCallbackCount, 0, 'UI callback should not be called in MVP mode');

	// Switch to Interactive mode
	modeManager.setMode('interactive');
	t.true(modeManager.isInteractiveMode(), 'Should be in Interactive mode');

	// Request in Interactive mode - should invoke UI callback
	const result2 = await handler.requestPermission(context);
	t.true(result2.approved, 'Interactive mode should approve via callback');
	t.is(uiCallbackCount, 1, 'UI callback should be called in Interactive mode');

	// Switch back to MVP mode
	modeManager.setMode('mvp');

	// Request in MVP mode again - should auto-approve
	const result3 = await handler.requestPermission(context);
	t.true(result3.approved, 'MVP mode should approve again');
	t.is(uiCallbackCount, 1, 'UI callback should not be called after switching back');
});

/**
 * Test: hasPreApproval returns true for all tools in MVP mode
 */
test('hasPreApproval returns true for all tools in MVP mode', t => {
	const modeManager = new PermissionModeManager();
	modeManager.setMode('mvp');
	const handler = new HybridPermissionHandler(modeManager);

	// Any tool should be "pre-approved" in MVP mode
	t.true(handler.hasPreApproval('any_tool'));
	t.true(handler.hasPreApproval('shell'));
	t.true(handler.hasPreApproval('file_write'));
});

/**
 * Test: hasPreApproval checks interactive handler in Interactive mode
 */
test('hasPreApproval checks interactive handler in Interactive mode', async t => {
	const modeManager = new PermissionModeManager();
	modeManager.setMode('interactive');
	const handler = new HybridPermissionHandler(modeManager);

	// Initially no pre-approvals
	t.false(handler.hasPreApproval('test_tool'));

	// Add pre-approval
	await handler.savePermissionPreference('test_tool', true);

	// Now should be pre-approved
	t.true(handler.hasPreApproval('test_tool'));
});

/**
 * Test: Interactive mode with pre-approved tool skips UI callback
 */
test('Interactive mode with pre-approved tool skips UI callback', async t => {
	const modeManager = new PermissionModeManager();
	modeManager.setMode('interactive');
	const handler = new HybridPermissionHandler(modeManager);

	let uiCallbackInvoked = false;
	handler.getInteractiveHandler().setUICallback({
		requestPermission: async () => {
			uiCallbackInvoked = true;
			return {approved: true};
		},
	});

	// Pre-approve the tool
	await handler.getInteractiveHandler().savePermissionPreference('pre_approved_tool', true);

	const context: ToolPermissionContext = {
		toolCall: {id: 'test-1', name: 'pre_approved_tool', arguments: {}},
		timestamp: new Date(),
	};

	// Request permission for pre-approved tool
	const result = await handler.requestPermission(context);

	t.true(result.approved, 'Pre-approved tool should be approved');
	t.false(uiCallbackInvoked, 'UI callback should not be invoked for pre-approved tools');
});

/**
 * Test: Interactive mode without UI callback falls back to auto-approve
 */
test('Interactive mode without UI callback falls back to auto-approve', async t => {
	const modeManager = new PermissionModeManager();
	modeManager.setMode('interactive');
	const handler = new HybridPermissionHandler(modeManager);

	// Don't set UI callback

	const context: ToolPermissionContext = {
		toolCall: {id: 'test-1', name: 'test_tool', arguments: {}},
		timestamp: new Date(),
	};

	// Request permission - should fallback to auto-approve
	const result = await handler.requestPermission(context);

	t.true(result.approved, 'Should fallback to auto-approve when no UI callback');
});

/**
 * Test: getInteractiveHandler returns the interactive handler instance
 */
test('getInteractiveHandler returns the interactive handler instance', t => {
	const modeManager = new PermissionModeManager();
	const handler = new HybridPermissionHandler(modeManager);

	const interactiveHandler = handler.getInteractiveHandler();

	t.truthy(interactiveHandler, 'Should return interactive handler');
	t.is(typeof interactiveHandler.setUICallback, 'function', 'Should have setUICallback method');
});
