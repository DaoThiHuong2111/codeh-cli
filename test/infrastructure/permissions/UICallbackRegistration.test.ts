/**
 * Tests for UI Callback Registration
 * **Feature: permission-mode-fix**
 */

import test from 'ava';
import * as fc from 'fast-check';
import {InteractivePermissionHandler} from '../../../dist/infrastructure/permissions/InteractivePermissionHandler.js';
import {HybridPermissionHandler} from '../../../dist/infrastructure/permissions/HybridPermissionHandler.js';
import {PermissionModeManager} from '../../../dist/infrastructure/permissions/PermissionModeManager.js';
import type {ToolPermissionContext, PermissionResult} from '../../../dist/core/domain/interfaces/IToolPermissionHandler.js';

// Arbitrary generators
const toolNameArb = fc.stringMatching(/^[a-z_][a-z0-9_]*$/);
const toolArgsArb = fc.dictionary(fc.string(), fc.jsonValue());

const toolContextArb = fc.record({
	toolCall: fc.record({
		id: fc.uuid(),
		name: toolNameArb,
		arguments: toolArgsArb,
	}),
	toolDescription: fc.option(fc.string(), { nil: undefined }),
	timestamp: fc.date(),
	conversationContext: fc.option(fc.string(), { nil: undefined }),
});

/**
 * **Feature: permission-mode-fix, Property 1: MVP Mode Auto-Approves All Tools**
 * **Validates: Requirements 2.1, 2.2, 3.3**
 * 
 * For any tool call in MVP mode, the permission handler SHALL return {approved: true}
 * without invoking UI callback.
 */
test('Property 1: MVP mode auto-approves without invoking UI callback', async t => {
	await fc.assert(
		fc.asyncProperty(toolContextArb, async (context) => {
			const modeManager = new PermissionModeManager();
			const hybridHandler = new HybridPermissionHandler(modeManager);
			
			// Set to MVP mode (default)
			modeManager.setMode('mvp');
			t.true(modeManager.isMVPMode(), 'Should be in MVP mode');
			
			// Set up UI callback that should NOT be called
			let callbackInvoked = false;
			hybridHandler.getInteractiveHandler().setUICallback({
				requestPermission: async () => {
					callbackInvoked = true;
					return { approved: false }; // Would deny if called
				},
			});
			
			// Request permission
			const result = await hybridHandler.requestPermission(context as ToolPermissionContext);
			
			// Should auto-approve without calling UI callback
			t.true(result.approved, 'MVP mode should auto-approve');
			t.false(callbackInvoked, 'UI callback should NOT be invoked in MVP mode');
		}),
		{ numRuns: 100 }
	);
});

/**
 * **Feature: permission-mode-fix, Property 2: Interactive Mode Shows Dialog**
 * **Validates: Requirements 1.1, 1.2, 4.3**
 * 
 * For any tool call in Interactive mode (without pre-approval), the permission handler
 * SHALL invoke UI callback and wait for user response.
 */
test('Property 2: Interactive mode invokes UI callback', async t => {
	await fc.assert(
		fc.asyncProperty(toolContextArb, async (context) => {
			const modeManager = new PermissionModeManager();
			const hybridHandler = new HybridPermissionHandler(modeManager);
			
			// Set to Interactive mode
			modeManager.setMode('interactive');
			t.true(modeManager.isInteractiveMode(), 'Should be in Interactive mode');
			
			// Set up UI callback that tracks invocation
			let callbackInvoked = false;
			let receivedContext: ToolPermissionContext | null = null;
			
			hybridHandler.getInteractiveHandler().setUICallback({
				requestPermission: async (ctx) => {
					callbackInvoked = true;
					receivedContext = ctx;
					return { approved: true };
				},
			});
			
			// Request permission
			const result = await hybridHandler.requestPermission(context as ToolPermissionContext);
			
			// Should invoke UI callback
			t.true(callbackInvoked, 'UI callback should be invoked in Interactive mode');
			t.truthy(receivedContext, 'Context should be passed to callback');
			t.is(receivedContext?.toolCall.name, context.toolCall.name, 'Tool name should match');
			t.true(result.approved, 'Result should match callback response');
		}),
		{ numRuns: 100 }
	);
});

/**
 * Test: UI callback not registered falls back to auto-approve with warning
 * **Validates: Requirements 4.2**
 */
test('Interactive mode without UI callback falls back to auto-approve', async t => {
	const modeManager = new PermissionModeManager();
	const hybridHandler = new HybridPermissionHandler(modeManager);
	
	// Set to Interactive mode but DON'T register UI callback
	modeManager.setMode('interactive');
	
	const context: ToolPermissionContext = {
		toolCall: {
			id: 'test-id',
			name: 'test_tool',
			arguments: { foo: 'bar' },
		},
		timestamp: new Date(),
	};
	
	// Should fallback to auto-approve (with warning logged)
	const result = await hybridHandler.requestPermission(context);
	
	t.true(result.approved, 'Should fallback to auto-approve when no UI callback');
});

/**
 * Test: Pre-approved tools skip UI callback even in Interactive mode
 * **Validates: Requirements 1.5**
 */
test('Pre-approved tools skip UI callback in Interactive mode', async t => {
	const modeManager = new PermissionModeManager();
	const hybridHandler = new HybridPermissionHandler(modeManager);
	
	// Set to Interactive mode
	modeManager.setMode('interactive');
	
	// Pre-approve a tool
	await hybridHandler.savePermissionPreference('pre_approved_tool', true);
	
	// Set up UI callback that should NOT be called for pre-approved tool
	let callbackInvoked = false;
	hybridHandler.getInteractiveHandler().setUICallback({
		requestPermission: async () => {
			callbackInvoked = true;
			return { approved: false };
		},
	});
	
	const context: ToolPermissionContext = {
		toolCall: {
			id: 'test-id',
			name: 'pre_approved_tool',
			arguments: {},
		},
		timestamp: new Date(),
	};
	
	const result = await hybridHandler.requestPermission(context);
	
	t.true(result.approved, 'Pre-approved tool should be approved');
	t.false(callbackInvoked, 'UI callback should NOT be invoked for pre-approved tool');
});

/**
 * **Feature: permission-mode-fix, Property 9: Mode Toggle Updates Behavior Immediately**
 * **Validates: Requirements 3.1, 3.2, 3.3**
 * 
 * For any mode toggle, the next permission request SHALL use the new mode's behavior.
 * Property: For any sequence of mode toggles and tool contexts, after each toggle,
 * the permission behavior should immediately reflect the new mode.
 */
test('Property 9: Mode toggle updates behavior immediately', async t => {
	await fc.assert(
		fc.asyncProperty(
			// Generate a sequence of toggle operations (true = toggle, false = no toggle)
			fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }),
			// Generate tool contexts for each operation
			fc.array(toolContextArb, { minLength: 1, maxLength: 10 }),
			async (toggleSequence, contexts) => {
				const modeManager = new PermissionModeManager();
				const hybridHandler = new HybridPermissionHandler(modeManager);
				
				let callbackInvocations = 0;
				hybridHandler.getInteractiveHandler().setUICallback({
					requestPermission: async () => {
						callbackInvocations++;
						return { approved: true };
					},
				});
				
				// Start in MVP mode
				modeManager.setMode('mvp');
				let expectedMode: 'mvp' | 'interactive' = 'mvp';
				
				// Process each toggle decision
				for (let i = 0; i < toggleSequence.length; i++) {
					const shouldToggle = toggleSequence[i];
					const context = contexts[i % contexts.length];
					
					// Record callback count before request
					const callbacksBefore = callbackInvocations;
					
					if (shouldToggle) {
						modeManager.toggleMode();
						expectedMode = expectedMode === 'mvp' ? 'interactive' : 'mvp';
					}
					
					// Verify mode is correct
					t.is(modeManager.getCurrentMode(), expectedMode, 
						`Mode should be ${expectedMode} after ${shouldToggle ? 'toggle' : 'no toggle'}`);
					
					// Make permission request
					await hybridHandler.requestPermission(context as ToolPermissionContext);
					
					// Verify behavior matches current mode
					const callbacksAfter = callbackInvocations;
					const callbackWasInvoked = callbacksAfter > callbacksBefore;
					
					if (expectedMode === 'mvp') {
						t.false(callbackWasInvoked, 
							'MVP mode should NOT invoke UI callback');
					} else {
						t.true(callbackWasInvoked, 
							'Interactive mode should invoke UI callback');
					}
				}
			}
		),
		{ numRuns: 100 }
	);
});
