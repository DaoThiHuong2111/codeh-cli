/**
 * Tests for InteractivePermissionHandler
 * **Feature: permission-mode-fix**
 */

import test from 'ava';
import * as fc from 'fast-check';
import {InteractivePermissionHandler} from '../../../dist/infrastructure/permissions/InteractivePermissionHandler.js';
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

/**
 * Test: savePermissionPreference adds tool to pre-approved list
 * **Validates: Requirements 1.5**
 */
test('savePermissionPreference adds tool to pre-approved list when alwaysAllow=true', async t => {
	const handler = new InteractivePermissionHandler();

	// Initially not pre-approved
	t.false(
		handler.hasPreApproval('test_tool'),
		'Tool should not be pre-approved initially',
	);

	// Add to pre-approved list
	await handler.savePermissionPreference('test_tool', true);

	// Now should be pre-approved
	t.true(
		handler.hasPreApproval('test_tool'),
		'Tool should be pre-approved after savePermissionPreference',
	);

	// Should appear in getPreApprovedTools
	const preApproved = handler.getPreApprovedTools();
	t.true(
		preApproved.includes('test_tool'),
		'Tool should appear in pre-approved list',
	);
});

/**
 * Test: savePermissionPreference removes tool from pre-approved list
 * **Validates: Requirements 1.5**
 */
test('savePermissionPreference removes tool from pre-approved list when alwaysAllow=false', async t => {
	const handler = new InteractivePermissionHandler();

	// First add to pre-approved list
	await handler.savePermissionPreference('test_tool', true);
	t.true(handler.hasPreApproval('test_tool'), 'Tool should be pre-approved');

	// Remove from pre-approved list
	await handler.savePermissionPreference('test_tool', false);

	// Should no longer be pre-approved
	t.false(
		handler.hasPreApproval('test_tool'),
		'Tool should not be pre-approved after removal',
	);

	// Should not appear in getPreApprovedTools
	const preApproved = handler.getPreApprovedTools();
	t.false(
		preApproved.includes('test_tool'),
		'Tool should not appear in pre-approved list',
	);
});

/**
 * Test: clearPreferences removes all pre-approved tools
 */
test('clearPreferences removes all pre-approved tools', async t => {
	const handler = new InteractivePermissionHandler();

	// Add multiple tools
	await handler.savePermissionPreference('tool1', true);
	await handler.savePermissionPreference('tool2', true);
	await handler.savePermissionPreference('tool3', true);

	t.is(
		handler.getPreApprovedTools().length,
		3,
		'Should have 3 pre-approved tools',
	);

	// Clear all
	await handler.clearPreferences();

	t.is(
		handler.getPreApprovedTools().length,
		0,
		'Should have no pre-approved tools after clear',
	);
	t.false(handler.hasPreApproval('tool1'), 'tool1 should not be pre-approved');
	t.false(handler.hasPreApproval('tool2'), 'tool2 should not be pre-approved');
	t.false(handler.hasPreApproval('tool3'), 'tool3 should not be pre-approved');
});

/**
 * Test: Pre-approved tool skips UI callback
 * **Validates: Requirements 1.5**
 */
test('Pre-approved tool skips UI callback and auto-approves', async t => {
	const handler = new InteractivePermissionHandler();

	let uiCallbackInvoked = false;
	handler.setUICallback({
		requestPermission: async () => {
			uiCallbackInvoked = true;
			return {approved: false, reason: 'Should not be called'};
		},
	});

	// Pre-approve the tool
	await handler.savePermissionPreference('pre_approved_tool', true);

	const context: ToolPermissionContext = {
		toolCall: {id: 'test-1', name: 'pre_approved_tool', arguments: {}},
		timestamp: new Date(),
	};

	// Request permission
	const result = await handler.requestPermission(context);

	t.true(result.approved, 'Pre-approved tool should be approved');
	t.false(
		uiCallbackInvoked,
		'UI callback should not be invoked for pre-approved tools',
	);
});

/**
 * Test: Non-pre-approved tool invokes UI callback
 */
test('Non-pre-approved tool invokes UI callback', async t => {
	const handler = new InteractivePermissionHandler();

	let uiCallbackInvoked = false;
	handler.setUICallback({
		requestPermission: async () => {
			uiCallbackInvoked = true;
			return {approved: true, reason: 'User approved'};
		},
	});

	const context: ToolPermissionContext = {
		toolCall: {id: 'test-1', name: 'not_pre_approved_tool', arguments: {}},
		timestamp: new Date(),
	};

	// Request permission
	const result = await handler.requestPermission(context);

	t.true(result.approved, 'Tool should be approved via UI callback');
	t.true(
		uiCallbackInvoked,
		'UI callback should be invoked for non-pre-approved tools',
	);
});

/**
 * **Feature: permission-mode-fix, Property 6: Always-Allow Adds to Pre-Approved List**
 * **Validates: Requirements 1.5, 11.4**
 *
 * For any tool name, calling savePermissionPreference with alwaysAllow=true SHALL add
 * the tool to the pre-approved list, and hasPreApproval SHALL return true for that tool.
 */
test('Property 6: Always-allow adds tool to pre-approved list', async t => {
	await fc.assert(
		fc.asyncProperty(toolNameArb, async toolName => {
			const handler = new InteractivePermissionHandler();

			// Initially not pre-approved
			t.false(
				handler.hasPreApproval(toolName),
				`Tool "${toolName}" should not be pre-approved initially`,
			);

			// Add to pre-approved list
			await handler.savePermissionPreference(toolName, true);

			// Now should be pre-approved
			t.true(
				handler.hasPreApproval(toolName),
				`Tool "${toolName}" should be pre-approved after always-allow`,
			);

			// Should appear in getPreApprovedTools
			const preApproved = handler.getPreApprovedTools();
			t.true(
				preApproved.includes(toolName),
				`Tool "${toolName}" should appear in pre-approved list`,
			);
		}),
		{numRuns: 100},
	);
});

/**
 * Property test: Removing tool from pre-approved list
 * For any tool name, calling savePermissionPreference with alwaysAllow=false SHALL remove
 * the tool from the pre-approved list.
 */
test('Property: Removing tool from pre-approved list works correctly', async t => {
	await fc.assert(
		fc.asyncProperty(toolNameArb, async toolName => {
			const handler = new InteractivePermissionHandler();

			// First add to pre-approved list
			await handler.savePermissionPreference(toolName, true);
			t.true(
				handler.hasPreApproval(toolName),
				`Tool "${toolName}" should be pre-approved`,
			);

			// Remove from pre-approved list
			await handler.savePermissionPreference(toolName, false);

			// Should no longer be pre-approved
			t.false(
				handler.hasPreApproval(toolName),
				`Tool "${toolName}" should not be pre-approved after removal`,
			);
		}),
		{numRuns: 100},
	);
});

/**
 * Property test: Pre-approved tools skip UI callback
 * For any pre-approved tool, requestPermission SHALL return approved=true without invoking UI callback.
 */
test('Property: Pre-approved tools skip UI callback', async t => {
	await fc.assert(
		fc.asyncProperty(toolNameArb, async toolName => {
			const handler = new InteractivePermissionHandler();

			let uiCallbackInvoked = false;
			handler.setUICallback({
				requestPermission: async () => {
					uiCallbackInvoked = true;
					return {approved: false, reason: 'Should not be called'};
				},
			});

			// Pre-approve the tool
			await handler.savePermissionPreference(toolName, true);

			const context: ToolPermissionContext = {
				toolCall: {id: 'test-1', name: toolName, arguments: {}},
				timestamp: new Date(),
			};

			// Request permission
			const result = await handler.requestPermission(context);

			t.true(result.approved, 'Pre-approved tool should be approved');
			t.false(
				uiCallbackInvoked,
				'UI callback should not be invoked for pre-approved tools',
			);
		}),
		{numRuns: 100},
	);
});
