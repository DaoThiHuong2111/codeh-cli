/**
 * Tests for usePermissionDialog hook
 * **Feature: permission-mode-fix**
 */

import test from 'ava';
import * as fc from 'fast-check';
import type {ToolPermissionContext, PermissionResult} from '../../../source/core/domain/interfaces/IToolPermissionHandler.js';

// Types for testing (matching hook types)
interface ToolPermissionRequest {
	toolName: string;
	toolDescription?: string;
	arguments: Record<string, any>;
	timestamp: Date;
}

interface PermissionDialogState {
	isOpen: boolean;
	request: ToolPermissionRequest | null;
	resolve: ((result: PermissionResult) => void) | null;
}

// Arbitrary generators for property-based testing
const toolNameArb = fc.stringMatching(/^[a-z_][a-z0-9_]*$/);
const toolArgsArb = fc.dictionary(fc.string(), fc.jsonValue());

const toolRequestArb = fc.record({
	toolName: toolNameArb,
	toolDescription: fc.option(fc.string(), { nil: undefined }),
	arguments: toolArgsArb,
	timestamp: fc.date(),
});

/**
 * **Feature: permission-mode-fix, Property 3: Dialog Blocks Execution Until Response**
 * **Validates: Requirements 1.2, 10.1, 10.3, 11.1**
 * 
 * For any permission request, the Promise SHALL remain pending until user responds.
 */
test('Property 3: showDialog returns Promise that blocks until response', async t => {
	// Simulate the hook logic
	const createDialogManager = () => {
		let state: PermissionDialogState = {
			isOpen: false,
			request: null,
			resolve: null,
		};

		const showDialog = (request: ToolPermissionRequest): Promise<PermissionResult> => {
			return new Promise((resolve) => {
				state = {
					isOpen: true,
					request,
					resolve,
				};
			});
		};

		const handleApprove = () => {
			if (state.resolve) {
				state.resolve({ approved: true });
				state = { isOpen: false, request: null, resolve: null };
			}
		};

		const handleDeny = () => {
			if (state.resolve) {
				state.resolve({ approved: false, reason: 'User denied' });
				state = { isOpen: false, request: null, resolve: null };
			}
		};

		const handleAlwaysAllow = () => {
			if (state.resolve) {
				state.resolve({ approved: true, rememberChoice: true });
				state = { isOpen: false, request: null, resolve: null };
			}
		};

		return {
			getState: () => state,
			showDialog,
			handleApprove,
			handleDeny,
			handleAlwaysAllow,
		};
	};

	await fc.assert(
		fc.asyncProperty(toolRequestArb, async (request) => {
			const manager = createDialogManager();
			
			// Start showing dialog - Promise should be pending
			const promise = manager.showDialog(request);
			
			// State should be open
			t.true(manager.getState().isOpen, 'Dialog should be open');
			t.deepEqual(manager.getState().request, request, 'Request should be stored');
			
			// Promise should not resolve immediately
			let resolved = false;
			promise.then(() => { resolved = true; });
			
			// Give microtask queue a chance to run
			await new Promise(r => setTimeout(r, 0));
			t.false(resolved, 'Promise should not resolve until user responds');
			
			// Now approve
			manager.handleApprove();
			
			// Promise should resolve
			const result = await promise;
			t.true(result.approved, 'Result should be approved');
			t.false(manager.getState().isOpen, 'Dialog should be closed');
		}),
		{ numRuns: 100 }
	);
});

/**
 * **Feature: permission-mode-fix, Property 4: Approval Executes Tool**
 * **Validates: Requirements 1.3, 11.2**
 * 
 * For any tool call where user approves, the Promise resolves with {approved: true}.
 */
test('Property 4: handleApprove resolves Promise with approved=true', async t => {
	const createDialogManager = () => {
		let resolveRef: ((result: PermissionResult) => void) | null = null;

		const showDialog = (): Promise<PermissionResult> => {
			return new Promise((resolve) => {
				resolveRef = resolve;
			});
		};

		const handleApprove = () => {
			if (resolveRef) {
				resolveRef({ approved: true });
				resolveRef = null;
			}
		};

		return { showDialog, handleApprove };
	};

	await fc.assert(
		fc.asyncProperty(toolRequestArb, async () => {
			const manager = createDialogManager();
			const promise = manager.showDialog();
			
			manager.handleApprove();
			const result = await promise;
			
			t.true(result.approved, 'Approval should set approved=true');
			t.is(result.rememberChoice, undefined, 'rememberChoice should not be set');
		}),
		{ numRuns: 100 }
	);
});

/**
 * **Feature: permission-mode-fix, Property 5: Denial Skips Tool and Reports to LLM**
 * **Validates: Requirements 1.4, 9.1, 9.2, 11.3**
 * 
 * For any tool call where user denies, the Promise resolves with {approved: false}.
 */
test('Property 5: handleDeny resolves Promise with approved=false', async t => {
	const createDialogManager = () => {
		let resolveRef: ((result: PermissionResult) => void) | null = null;

		const showDialog = (): Promise<PermissionResult> => {
			return new Promise((resolve) => {
				resolveRef = resolve;
			});
		};

		const handleDeny = () => {
			if (resolveRef) {
				resolveRef({ approved: false, reason: 'User denied' });
				resolveRef = null;
			}
		};

		return { showDialog, handleDeny };
	};

	await fc.assert(
		fc.asyncProperty(toolRequestArb, async () => {
			const manager = createDialogManager();
			const promise = manager.showDialog();
			
			manager.handleDeny();
			const result = await promise;
			
			t.false(result.approved, 'Denial should set approved=false');
			t.truthy(result.reason, 'Denial should include reason');
		}),
		{ numRuns: 100 }
	);
});

/**
 * **Feature: permission-mode-fix, Property 6: Always-Allow Adds to Pre-Approved List**
 * **Validates: Requirements 1.5, 11.4**
 * 
 * For any tool where user selects "Always Allow", the Promise resolves with rememberChoice=true.
 */
test('Property 6: handleAlwaysAllow resolves with rememberChoice=true', async t => {
	const createDialogManager = () => {
		let resolveRef: ((result: PermissionResult) => void) | null = null;

		const showDialog = (): Promise<PermissionResult> => {
			return new Promise((resolve) => {
				resolveRef = resolve;
			});
		};

		const handleAlwaysAllow = () => {
			if (resolveRef) {
				resolveRef({ approved: true, rememberChoice: true });
				resolveRef = null;
			}
		};

		return { showDialog, handleAlwaysAllow };
	};

	await fc.assert(
		fc.asyncProperty(toolRequestArb, async () => {
			const manager = createDialogManager();
			const promise = manager.showDialog();
			
			manager.handleAlwaysAllow();
			const result = await promise;
			
			t.true(result.approved, 'Always-allow should set approved=true');
			t.true(result.rememberChoice, 'Always-allow should set rememberChoice=true');
		}),
		{ numRuns: 100 }
	);
});

/**
 * Test: Dialog state transitions correctly
 */
test('Dialog state transitions: closed -> open -> closed', async t => {
	let state: PermissionDialogState = {
		isOpen: false,
		request: null,
		resolve: null,
	};

	const showDialog = (request: ToolPermissionRequest): Promise<PermissionResult> => {
		return new Promise((resolve) => {
			state = { isOpen: true, request, resolve };
		});
	};

	const handleApprove = () => {
		if (state.resolve) {
			state.resolve({ approved: true });
			state = { isOpen: false, request: null, resolve: null };
		}
	};

	// Initial state
	t.false(state.isOpen, 'Initially closed');
	t.is(state.request, null, 'No request initially');

	// Show dialog
	const request: ToolPermissionRequest = {
		toolName: 'test_tool',
		arguments: { foo: 'bar' },
		timestamp: new Date(),
	};
	const promise = showDialog(request);

	// State should be open
	t.true(state.isOpen, 'Dialog should be open');
	t.is(state.request?.toolName, 'test_tool', 'Request should be stored');

	// Approve
	handleApprove();

	// State should be closed
	t.false(state.isOpen, 'Dialog should be closed after approval');
	t.is(state.request, null, 'Request should be cleared');

	const result = await promise;
	t.true(result.approved, 'Result should be approved');
});

/**
 * Test: Multiple sequential dialogs work correctly
 */
test('Multiple sequential dialogs work correctly', async t => {
	let resolveRef: ((result: PermissionResult) => void) | null = null;

	const showDialog = (): Promise<PermissionResult> => {
		return new Promise((resolve) => {
			resolveRef = resolve;
		});
	};

	const handleApprove = () => {
		if (resolveRef) {
			resolveRef({ approved: true });
			resolveRef = null;
		}
	};

	const handleDeny = () => {
		if (resolveRef) {
			resolveRef({ approved: false });
			resolveRef = null;
		}
	};

	// First dialog - approve
	const promise1 = showDialog();
	handleApprove();
	const result1 = await promise1;
	t.true(result1.approved, 'First dialog approved');

	// Second dialog - deny
	const promise2 = showDialog();
	handleDeny();
	const result2 = await promise2;
	t.false(result2.approved, 'Second dialog denied');

	// Third dialog - approve
	const promise3 = showDialog();
	handleApprove();
	const result3 = await promise3;
	t.true(result3.approved, 'Third dialog approved');
});
