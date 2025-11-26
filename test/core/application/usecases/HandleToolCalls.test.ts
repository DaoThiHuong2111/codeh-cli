/**
 * Tests for HandleToolCalls Use Case
 * **Feature: permission-mode-fix**
 *
 * Tests the approval flow: when user approves a tool, it gets executed
 * and the result is returned correctly.
 */

import test from 'ava';
import * as fc from 'fast-check';
import {HandleToolCalls} from '../../../../dist/core/application/usecases/HandleToolCalls.js';
import {ToolRegistry} from '../../../../dist/core/tools/base/ToolRegistry.js';
import {Tool} from '../../../../dist/core/tools/base/Tool.js';
import type {ToolCall} from '../../../../dist/core/domain/interfaces/IApiClient.js';
import type {
	IToolPermissionHandler,
	PermissionResult,
	ToolPermissionContext,
} from '../../../../dist/core/domain/interfaces/IToolPermissionHandler.js';
import type {
	ToolDefinition,
	ToolExecutionResult,
} from '../../../../dist/core/domain/interfaces/IToolExecutor.js';

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

// ========================================
// Mock Tool for Testing
// ========================================

class MockTool extends Tool {
	public executionCount = 0;
	public lastArgs: Record<string, any> | null = null;
	private mockResult: ToolExecutionResult;
	private toolName: string;

	constructor(
		toolName: string,
		result: ToolExecutionResult = {success: true, output: 'Mock output'},
	) {
		super();
		this.toolName = toolName;
		this.mockResult = result;
	}

	getDefinition(): ToolDefinition {
		return {
			name: this.toolName,
			description: `Mock tool: ${this.toolName}`,
			parameters: [
				{
					name: 'input',
					type: 'string',
					description: 'Input parameter',
					required: false,
				},
			],
		};
	}

	async execute(parameters: Record<string, any>): Promise<ToolExecutionResult> {
		this.executionCount++;
		this.lastArgs = parameters;
		return this.mockResult;
	}

	validateParameters(parameters: Record<string, any>): boolean {
		return true;
	}

	getName(): string {
		return this.toolName;
	}

	getDescription(): string {
		return `Mock tool: ${this.toolName}`;
	}

	reset() {
		this.executionCount = 0;
		this.lastArgs = null;
	}
}

// ========================================
// Mock Permission Handler
// ========================================

class MockPermissionHandler implements IToolPermissionHandler {
	public permissionRequests: ToolPermissionContext[] = [];
	private approvalBehavior: (
		context: ToolPermissionContext,
	) => PermissionResult;
	private preApprovedTools: Set<string> = new Set();

	constructor(
		approvalBehavior: (
			context: ToolPermissionContext,
		) => PermissionResult = () => ({
			approved: true,
		}),
	) {
		this.approvalBehavior = approvalBehavior;
	}

	async requestPermission(
		context: ToolPermissionContext,
	): Promise<PermissionResult> {
		this.permissionRequests.push(context);
		return this.approvalBehavior(context);
	}

	hasPreApproval(toolName: string): boolean {
		return this.preApprovedTools.has(toolName);
	}

	addPreApproval(toolName: string) {
		this.preApprovedTools.add(toolName);
	}

	async savePermissionPreference(
		toolName: string,
		alwaysAllow: boolean,
	): Promise<void> {
		if (alwaysAllow) {
			this.preApprovedTools.add(toolName);
		} else {
			this.preApprovedTools.delete(toolName);
		}
	}

	async clearPreferences(): Promise<void> {
		this.preApprovedTools.clear();
	}

	reset() {
		this.permissionRequests = [];
		this.preApprovedTools.clear();
	}
}

// ========================================
// Arbitrary Generators for Property Tests
// ========================================

const toolNameArb = fc.stringMatching(/^[a-z_][a-z0-9_]{0,15}$/);
const toolArgsArb = fc.dictionary(
	fc.stringMatching(/^[a-z_][a-z0-9_]{0,10}$/),
	fc.oneof(fc.string(), fc.integer(), fc.boolean()),
);

const toolCallArb = fc.record({
	id: fc.uuid(),
	name: toolNameArb,
	arguments: toolArgsArb,
});

// ========================================
// Unit Tests: Task 10.1 - Verify tool execution after approval
// ========================================

test('Approved tool is executed', async t => {
	const toolRegistry = new ToolRegistry();
	const mockTool = new MockTool('test_tool');
	toolRegistry.register(mockTool);

	const permissionHandler = new MockPermissionHandler(() => ({approved: true}));
	const handleToolCalls = new HandleToolCalls(toolRegistry, permissionHandler);

	const toolCall: ToolCall = {
		id: 'call-1',
		name: 'test_tool',
		arguments: {input: 'test value'},
	};

	const result = await handleToolCalls.execute({toolCalls: [toolCall]});

	t.is(mockTool.executionCount, 1, 'Tool should be executed once');
	t.deepEqual(
		mockTool.lastArgs,
		{input: 'test value'},
		'Tool should receive correct arguments',
	);
	t.true(result.allApproved, 'All tools should be approved');
	t.true(result.allCompleted, 'All tools should be completed');
	t.is(result.contexts.length, 1, 'Should have one context');
	t.is(result.contexts[0].status, 'completed', 'Context should be completed');
});

test('Approved tool returns correct result', async t => {
	const toolRegistry = new ToolRegistry();
	const expectedOutput = 'Expected output from tool';
	const mockTool = new MockTool('result_tool', {
		success: true,
		output: expectedOutput,
		metadata: {custom: 'data'},
	});
	toolRegistry.register(mockTool);

	const permissionHandler = new MockPermissionHandler(() => ({approved: true}));
	const handleToolCalls = new HandleToolCalls(toolRegistry, permissionHandler);

	const toolCall: ToolCall = {
		id: 'call-1',
		name: 'result_tool',
		arguments: {input: 'test'},
	};

	const result = await handleToolCalls.execute({toolCalls: [toolCall]});

	t.truthy(result.contexts[0].result, 'Context should have result');
	t.true(result.contexts[0].result!.success, 'Result should be successful');
	t.is(
		result.contexts[0].result!.output,
		expectedOutput,
		'Result should have correct output',
	);
	t.deepEqual(
		result.contexts[0].result!.metadata,
		{custom: 'data'},
		'Result should have metadata',
	);
});

test('Multiple approved tools are all executed', async t => {
	const toolRegistry = new ToolRegistry();
	const tool1 = new MockTool('tool_1');
	const tool2 = new MockTool('tool_2');
	const tool3 = new MockTool('tool_3');
	toolRegistry.register(tool1);
	toolRegistry.register(tool2);
	toolRegistry.register(tool3);

	const permissionHandler = new MockPermissionHandler(() => ({approved: true}));
	const handleToolCalls = new HandleToolCalls(toolRegistry, permissionHandler);

	const toolCalls: ToolCall[] = [
		{id: 'call-1', name: 'tool_1', arguments: {input: 'a'}},
		{id: 'call-2', name: 'tool_2', arguments: {input: 'b'}},
		{id: 'call-3', name: 'tool_3', arguments: {input: 'c'}},
	];

	const result = await handleToolCalls.execute({toolCalls});

	t.is(tool1.executionCount, 1, 'Tool 1 should be executed');
	t.is(tool2.executionCount, 1, 'Tool 2 should be executed');
	t.is(tool3.executionCount, 1, 'Tool 3 should be executed');
	t.true(result.allApproved, 'All tools should be approved');
	t.true(result.allCompleted, 'All tools should be completed');
	t.is(result.contexts.length, 3, 'Should have three contexts');
});

test('Pre-approved tool skips permission request and executes', async t => {
	const toolRegistry = new ToolRegistry();
	const mockTool = new MockTool('pre_approved_tool');
	toolRegistry.register(mockTool);

	const permissionHandler = new MockPermissionHandler(() => ({approved: true}));
	permissionHandler.addPreApproval('pre_approved_tool');

	const handleToolCalls = new HandleToolCalls(toolRegistry, permissionHandler);

	const toolCall: ToolCall = {
		id: 'call-1',
		name: 'pre_approved_tool',
		arguments: {input: 'test'},
	};

	const result = await handleToolCalls.execute({toolCalls: [toolCall]});

	t.is(
		permissionHandler.permissionRequests.length,
		0,
		'Should not request permission for pre-approved tool',
	);
	t.is(mockTool.executionCount, 1, 'Tool should still be executed');
	t.true(result.allCompleted, 'Tool should complete');
});

test('Tool execution preserves argument types', async t => {
	const toolRegistry = new ToolRegistry();
	const mockTool = new MockTool('typed_tool');
	toolRegistry.register(mockTool);

	const permissionHandler = new MockPermissionHandler(() => ({approved: true}));
	const handleToolCalls = new HandleToolCalls(toolRegistry, permissionHandler);

	const complexArgs = {
		stringArg: 'hello',
		numberArg: 42,
		boolArg: true,
		nestedArg: {inner: 'value'},
	};

	const toolCall: ToolCall = {
		id: 'call-1',
		name: 'typed_tool',
		arguments: complexArgs,
	};

	await handleToolCalls.execute({toolCalls: [toolCall]});

	t.deepEqual(
		mockTool.lastArgs,
		complexArgs,
		'Arguments should be preserved with correct types',
	);
});

// ========================================
// Property-Based Test: Task 10.2 - Property 4
// ========================================

/**
 * **Feature: permission-mode-fix, Property 4: Approval Executes Tool**
 * **Validates: Requirements 1.3, 11.2**
 *
 * For any tool call where user approves, the tool SHALL be executed and result returned.
 */
test('Property 4: Approval executes tool and returns result', async t => {
	await fc.assert(
		fc.asyncProperty(
			toolCallArb,
			fc.string({minLength: 1, maxLength: 100}),
			async (toolCallTemplate, expectedOutput) => {
				// Setup: Create tool registry with mock tool
				const toolRegistry = new ToolRegistry();
				const mockTool = new MockTool(toolCallTemplate.name, {
					success: true,
					output: expectedOutput,
				});
				toolRegistry.register(mockTool);

				// Setup: Create permission handler that approves
				const permissionHandler = new MockPermissionHandler(() => ({
					approved: true,
					reason: 'User approved',
				}));

				const handleToolCalls = new HandleToolCalls(
					toolRegistry,
					permissionHandler,
				);

				// Ensure arguments are not empty (required by HandleToolCalls)
				const toolCall: ToolCall = {
					...toolCallTemplate,
					arguments:
						Object.keys(toolCallTemplate.arguments).length > 0
							? toolCallTemplate.arguments
							: {_placeholder: 'value'},
				};

				// Act: Execute tool call
				const result = await handleToolCalls.execute({toolCalls: [toolCall]});

				// Assert: Tool was executed
				t.is(
					mockTool.executionCount,
					1,
					'Tool should be executed exactly once',
				);

				// Assert: Result is returned correctly
				t.is(result.contexts.length, 1, 'Should have one context');
				t.true(result.allApproved, 'Tool should be approved');
				t.true(result.allCompleted, 'Tool should complete');
				t.truthy(result.contexts[0].result, 'Context should have result');
				t.true(
					result.contexts[0].result!.success,
					'Result should be successful',
				);
				t.is(
					result.contexts[0].result!.output,
					expectedOutput,
					'Result should have correct output',
				);

				// Assert: Permission was requested
				t.is(
					permissionHandler.permissionRequests.length,
					1,
					'Permission should be requested',
				);
				t.is(
					permissionHandler.permissionRequests[0].toolCall.name,
					toolCall.name,
					'Permission request should have correct tool name',
				);
			},
		),
		{numRuns: 100},
	);
});

/**
 * Additional property test: Approval with rememberChoice still executes tool
 */
test('Approval with rememberChoice=true executes tool', async t => {
	await fc.assert(
		fc.asyncProperty(toolCallArb, async toolCallTemplate => {
			const toolRegistry = new ToolRegistry();
			const mockTool = new MockTool(toolCallTemplate.name);
			toolRegistry.register(mockTool);

			// Permission handler returns approval with rememberChoice
			const permissionHandler = new MockPermissionHandler(() => ({
				approved: true,
				rememberChoice: true,
			}));

			const handleToolCalls = new HandleToolCalls(
				toolRegistry,
				permissionHandler,
			);

			const toolCall: ToolCall = {
				...toolCallTemplate,
				arguments:
					Object.keys(toolCallTemplate.arguments).length > 0
						? toolCallTemplate.arguments
						: {_placeholder: 'value'},
			};

			const result = await handleToolCalls.execute({toolCalls: [toolCall]});

			// Tool should still be executed regardless of rememberChoice
			t.is(mockTool.executionCount, 1, 'Tool should be executed');
			t.true(result.allCompleted, 'Tool should complete');
		}),
		{numRuns: 100},
	);
});

/**
 * Test: Execution context tracks approval timestamp
 */
test('Execution context tracks permission granted timestamp', async t => {
	const toolRegistry = new ToolRegistry();
	const mockTool = new MockTool('timestamp_tool');
	toolRegistry.register(mockTool);

	const permissionHandler = new MockPermissionHandler(() => ({approved: true}));
	const handleToolCalls = new HandleToolCalls(toolRegistry, permissionHandler);

	const beforeExecution = new Date();

	const toolCall: ToolCall = {
		id: 'call-1',
		name: 'timestamp_tool',
		arguments: {input: 'test'},
	};

	const result = await handleToolCalls.execute({toolCalls: [toolCall]});

	const afterExecution = new Date();

	t.truthy(
		result.contexts[0].permissionGrantedAt,
		'Should have permission granted timestamp',
	);
	t.true(
		result.contexts[0].permissionGrantedAt! >= beforeExecution,
		'Timestamp should be after test start',
	);
	t.true(
		result.contexts[0].permissionGrantedAt! <= afterExecution,
		'Timestamp should be before test end',
	);
});

/**
 * Test: Execution context tracks execution timestamps
 */
test('Execution context tracks execution start and completion timestamps', async t => {
	const toolRegistry = new ToolRegistry();
	const mockTool = new MockTool('timing_tool');
	toolRegistry.register(mockTool);

	const permissionHandler = new MockPermissionHandler(() => ({approved: true}));
	const handleToolCalls = new HandleToolCalls(toolRegistry, permissionHandler);

	const toolCall: ToolCall = {
		id: 'call-1',
		name: 'timing_tool',
		arguments: {input: 'test'},
	};

	const result = await handleToolCalls.execute({toolCalls: [toolCall]});

	t.truthy(
		result.contexts[0].executionStartedAt,
		'Should have execution start timestamp',
	);
	t.truthy(
		result.contexts[0].executionCompletedAt,
		'Should have execution completion timestamp',
	);
	t.true(
		result.contexts[0].executionCompletedAt! >=
			result.contexts[0].executionStartedAt!,
		'Completion should be after start',
	);
});

// ========================================
// Unit Tests: Task 11.1 - Verify tool is skipped after denial
// ========================================

test('Denied tool is NOT executed', async t => {
	const toolRegistry = new ToolRegistry();
	const mockTool = new MockTool('denied_tool');
	toolRegistry.register(mockTool);

	const permissionHandler = new MockPermissionHandler(() => ({
		approved: false,
		reason: 'User denied',
	}));
	const handleToolCalls = new HandleToolCalls(toolRegistry, permissionHandler);

	const toolCall: ToolCall = {
		id: 'call-1',
		name: 'denied_tool',
		arguments: {input: 'test value'},
	};

	const result = await handleToolCalls.execute({toolCalls: [toolCall]});

	t.is(mockTool.executionCount, 0, 'Tool should NOT be executed');
	t.false(result.allApproved, 'Not all tools should be approved');
	t.false(result.allCompleted, 'Not all tools should be completed');
	t.is(result.contexts.length, 1, 'Should have one context');
	t.is(result.contexts[0].status, 'rejected', 'Context should be rejected');
});

test('Denied tool context has correct rejection state', async t => {
	const toolRegistry = new ToolRegistry();
	const mockTool = new MockTool('rejected_tool');
	toolRegistry.register(mockTool);

	const permissionHandler = new MockPermissionHandler(() => ({
		approved: false,
		reason: 'User rejected the tool',
	}));
	const handleToolCalls = new HandleToolCalls(toolRegistry, permissionHandler);

	const toolCall: ToolCall = {
		id: 'call-1',
		name: 'rejected_tool',
		arguments: {input: 'test'},
	};

	const result = await handleToolCalls.execute({toolCalls: [toolCall]});

	const context = result.contexts[0];
	t.true(context.isRejected(), 'Context should report as rejected');
	t.false(context.isCompleted(), 'Context should NOT report as completed');
	t.false(context.isExecuting(), 'Context should NOT report as executing');
	t.is(context.result, undefined, 'Context should have no result');
	t.is(
		context.executionStartedAt,
		undefined,
		'Execution should not have started',
	);
});

test('Multiple tools with one denied - only approved tools execute', async t => {
	const toolRegistry = new ToolRegistry();
	const tool1 = new MockTool('tool_1');
	const tool2 = new MockTool('tool_2');
	const tool3 = new MockTool('tool_3');
	toolRegistry.register(tool1);
	toolRegistry.register(tool2);
	toolRegistry.register(tool3);

	// Deny tool_2, approve others
	const permissionHandler = new MockPermissionHandler(context => ({
		approved: context.toolCall.name !== 'tool_2',
		reason: context.toolCall.name === 'tool_2' ? 'User denied' : undefined,
	}));
	const handleToolCalls = new HandleToolCalls(toolRegistry, permissionHandler);

	const toolCalls: ToolCall[] = [
		{id: 'call-1', name: 'tool_1', arguments: {input: 'a'}},
		{id: 'call-2', name: 'tool_2', arguments: {input: 'b'}},
		{id: 'call-3', name: 'tool_3', arguments: {input: 'c'}},
	];

	const result = await handleToolCalls.execute({toolCalls});

	t.is(tool1.executionCount, 1, 'Tool 1 should be executed');
	t.is(tool2.executionCount, 0, 'Tool 2 should NOT be executed (denied)');
	t.is(tool3.executionCount, 1, 'Tool 3 should be executed');
	t.false(result.allApproved, 'Not all tools should be approved');
	t.false(result.allCompleted, 'Not all tools should be completed');
	t.is(result.contexts[0].status, 'completed', 'Tool 1 should be completed');
	t.is(result.contexts[1].status, 'rejected', 'Tool 2 should be rejected');
	t.is(result.contexts[2].status, 'completed', 'Tool 3 should be completed');
});

test('All tools denied - none execute', async t => {
	const toolRegistry = new ToolRegistry();
	const tool1 = new MockTool('tool_a');
	const tool2 = new MockTool('tool_b');
	toolRegistry.register(tool1);
	toolRegistry.register(tool2);

	const permissionHandler = new MockPermissionHandler(() => ({
		approved: false,
		reason: 'All denied',
	}));
	const handleToolCalls = new HandleToolCalls(toolRegistry, permissionHandler);

	const toolCalls: ToolCall[] = [
		{id: 'call-1', name: 'tool_a', arguments: {input: 'x'}},
		{id: 'call-2', name: 'tool_b', arguments: {input: 'y'}},
	];

	const result = await handleToolCalls.execute({toolCalls});

	t.is(tool1.executionCount, 0, 'Tool A should NOT be executed');
	t.is(tool2.executionCount, 0, 'Tool B should NOT be executed');
	t.false(result.allApproved, 'No tools should be approved');
	t.false(result.allCompleted, 'No tools should be completed');
	t.true(
		result.contexts.every(c => c.status === 'rejected'),
		'All contexts should be rejected',
	);
});

test('Denied tool still has permission request recorded', async t => {
	const toolRegistry = new ToolRegistry();
	const mockTool = new MockTool('tracked_tool');
	toolRegistry.register(mockTool);

	const permissionHandler = new MockPermissionHandler(() => ({
		approved: false,
		reason: 'Denied for tracking test',
	}));
	const handleToolCalls = new HandleToolCalls(toolRegistry, permissionHandler);

	const toolCall: ToolCall = {
		id: 'call-1',
		name: 'tracked_tool',
		arguments: {input: 'test'},
	};

	await handleToolCalls.execute({toolCalls: [toolCall]});

	t.is(
		permissionHandler.permissionRequests.length,
		1,
		'Permission should be requested',
	);
	t.is(
		permissionHandler.permissionRequests[0].toolCall.name,
		'tracked_tool',
		'Permission request should have correct tool name',
	);
	t.deepEqual(
		permissionHandler.permissionRequests[0].toolCall.arguments,
		{input: 'test'},
		'Permission request should have correct arguments',
	);
});

// ========================================
// Property-Based Test: Task 11.2 - Property 5
// ========================================

/**
 * **Feature: permission-mode-fix, Property 5: Denial Skips Tool and Reports to LLM**
 * **Validates: Requirements 1.4, 9.1, 9.2, 11.3**
 *
 * For any tool call where user denies, the tool SHALL NOT be executed
 * and rejection SHALL be reported (context marked as rejected).
 */
test('Property 5: Denial skips tool execution and marks context as rejected', async t => {
	await fc.assert(
		fc.asyncProperty(
			toolCallArb,
			fc.string({minLength: 1, maxLength: 100}),
			async (toolCallTemplate, denialReason) => {
				// Setup: Create tool registry with mock tool
				const toolRegistry = new ToolRegistry();
				const mockTool = new MockTool(toolCallTemplate.name, {
					success: true,
					output: 'Should not see this',
				});
				toolRegistry.register(mockTool);

				// Setup: Create permission handler that denies
				const permissionHandler = new MockPermissionHandler(() => ({
					approved: false,
					reason: denialReason,
				}));

				const handleToolCalls = new HandleToolCalls(
					toolRegistry,
					permissionHandler,
				);

				// Ensure arguments are not empty (required by HandleToolCalls)
				const toolCall: ToolCall = {
					...toolCallTemplate,
					arguments:
						Object.keys(toolCallTemplate.arguments).length > 0
							? toolCallTemplate.arguments
							: {_placeholder: 'value'},
				};

				// Act: Execute tool call
				const result = await handleToolCalls.execute({toolCalls: [toolCall]});

				// Assert: Tool was NOT executed
				t.is(
					mockTool.executionCount,
					0,
					'Tool should NOT be executed when denied',
				);

				// Assert: Context is marked as rejected (for LLM reporting)
				t.is(result.contexts.length, 1, 'Should have one context');
				t.false(result.allApproved, 'Tool should not be approved');
				t.false(result.allCompleted, 'Tool should not be completed');
				t.is(
					result.contexts[0].status,
					'rejected',
					'Context should be rejected',
				);
				t.true(
					result.contexts[0].isRejected(),
					'Context.isRejected() should return true',
				);

				// Assert: No result or execution timestamps
				t.is(
					result.contexts[0].result,
					undefined,
					'Rejected context should have no result',
				);
				t.is(
					result.contexts[0].executionStartedAt,
					undefined,
					'Rejected context should have no execution start time',
				);
				t.is(
					result.contexts[0].executionCompletedAt,
					undefined,
					'Rejected context should have no execution completion time',
				);

				// Assert: Permission was still requested
				t.is(
					permissionHandler.permissionRequests.length,
					1,
					'Permission should be requested even for denied tools',
				);
			},
		),
		{numRuns: 100},
	);
});

// ========================================
// Unit Tests: Task 12.1 - Test batch tool calls with mixed approval
// ========================================

test('Batch tools with first denied, rest approved - only approved execute', async t => {
	const toolRegistry = new ToolRegistry();
	const tool1 = new MockTool('batch_tool_1');
	const tool2 = new MockTool('batch_tool_2');
	const tool3 = new MockTool('batch_tool_3');
	toolRegistry.register(tool1);
	toolRegistry.register(tool2);
	toolRegistry.register(tool3);

	// Deny first tool, approve rest
	const permissionHandler = new MockPermissionHandler(context => ({
		approved: context.toolCall.name !== 'batch_tool_1',
	}));
	const handleToolCalls = new HandleToolCalls(toolRegistry, permissionHandler);

	const toolCalls: ToolCall[] = [
		{id: 'call-1', name: 'batch_tool_1', arguments: {input: 'a'}},
		{id: 'call-2', name: 'batch_tool_2', arguments: {input: 'b'}},
		{id: 'call-3', name: 'batch_tool_3', arguments: {input: 'c'}},
	];

	const result = await handleToolCalls.execute({toolCalls});

	t.is(tool1.executionCount, 0, 'First tool should NOT be executed (denied)');
	t.is(tool2.executionCount, 1, 'Second tool should be executed');
	t.is(tool3.executionCount, 1, 'Third tool should be executed');
	t.is(result.contexts[0].status, 'rejected', 'First context should be rejected');
	t.is(result.contexts[1].status, 'completed', 'Second context should be completed');
	t.is(result.contexts[2].status, 'completed', 'Third context should be completed');
	t.false(result.allApproved, 'Not all tools should be approved');
	t.false(result.allCompleted, 'Not all tools should be completed');
});

test('Batch tools with last denied, rest approved - only approved execute', async t => {
	const toolRegistry = new ToolRegistry();
	const tool1 = new MockTool('last_batch_1');
	const tool2 = new MockTool('last_batch_2');
	const tool3 = new MockTool('last_batch_3');
	toolRegistry.register(tool1);
	toolRegistry.register(tool2);
	toolRegistry.register(tool3);

	// Deny last tool, approve rest
	const permissionHandler = new MockPermissionHandler(context => ({
		approved: context.toolCall.name !== 'last_batch_3',
	}));
	const handleToolCalls = new HandleToolCalls(toolRegistry, permissionHandler);

	const toolCalls: ToolCall[] = [
		{id: 'call-1', name: 'last_batch_1', arguments: {input: 'a'}},
		{id: 'call-2', name: 'last_batch_2', arguments: {input: 'b'}},
		{id: 'call-3', name: 'last_batch_3', arguments: {input: 'c'}},
	];

	const result = await handleToolCalls.execute({toolCalls});

	t.is(tool1.executionCount, 1, 'First tool should be executed');
	t.is(tool2.executionCount, 1, 'Second tool should be executed');
	t.is(tool3.executionCount, 0, 'Third tool should NOT be executed (denied)');
	t.is(result.contexts[0].status, 'completed', 'First context should be completed');
	t.is(result.contexts[1].status, 'completed', 'Second context should be completed');
	t.is(result.contexts[2].status, 'rejected', 'Third context should be rejected');
});

test('Batch tools with alternating approval - correct execution pattern', async t => {
	const toolRegistry = new ToolRegistry();
	const tools = [
		new MockTool('alt_tool_1'),
		new MockTool('alt_tool_2'),
		new MockTool('alt_tool_3'),
		new MockTool('alt_tool_4'),
	];
	tools.forEach(tool => toolRegistry.register(tool));

	// Alternating: approve, deny, approve, deny
	let callCount = 0;
	const permissionHandler = new MockPermissionHandler(() => {
		const approved = callCount % 2 === 0;
		callCount++;
		return {approved};
	});
	const handleToolCalls = new HandleToolCalls(toolRegistry, permissionHandler);

	const toolCalls: ToolCall[] = tools.map((tool, i) => ({
		id: `call-${i}`,
		name: tool.getName(),
		arguments: {input: `value-${i}`},
	}));

	const result = await handleToolCalls.execute({toolCalls});

	t.is(tools[0].executionCount, 1, 'Tool 1 should be executed (approved)');
	t.is(tools[1].executionCount, 0, 'Tool 2 should NOT be executed (denied)');
	t.is(tools[2].executionCount, 1, 'Tool 3 should be executed (approved)');
	t.is(tools[3].executionCount, 0, 'Tool 4 should NOT be executed (denied)');
	t.is(result.contexts[0].status, 'completed');
	t.is(result.contexts[1].status, 'rejected');
	t.is(result.contexts[2].status, 'completed');
	t.is(result.contexts[3].status, 'rejected');
});

test('Batch tools - rejected tools have no execution timestamps', async t => {
	const toolRegistry = new ToolRegistry();
	const tool1 = new MockTool('ts_tool_1');
	const tool2 = new MockTool('ts_tool_2');
	toolRegistry.register(tool1);
	toolRegistry.register(tool2);

	// Deny first, approve second
	const permissionHandler = new MockPermissionHandler(context => ({
		approved: context.toolCall.name === 'ts_tool_2',
	}));
	const handleToolCalls = new HandleToolCalls(toolRegistry, permissionHandler);

	const toolCalls: ToolCall[] = [
		{id: 'call-1', name: 'ts_tool_1', arguments: {input: 'a'}},
		{id: 'call-2', name: 'ts_tool_2', arguments: {input: 'b'}},
	];

	const result = await handleToolCalls.execute({toolCalls});

	// Rejected tool should have no execution timestamps
	t.is(result.contexts[0].executionStartedAt, undefined, 'Rejected tool should have no start time');
	t.is(result.contexts[0].executionCompletedAt, undefined, 'Rejected tool should have no completion time');
	
	// Approved tool should have execution timestamps
	t.truthy(result.contexts[1].executionStartedAt, 'Approved tool should have start time');
	t.truthy(result.contexts[1].executionCompletedAt, 'Approved tool should have completion time');
});

test('Batch tools - results only present for executed tools', async t => {
	const toolRegistry = new ToolRegistry();
	const tool1 = new MockTool('result_tool_1', {success: true, output: 'output1'});
	const tool2 = new MockTool('result_tool_2', {success: true, output: 'output2'});
	const tool3 = new MockTool('result_tool_3', {success: true, output: 'output3'});
	toolRegistry.register(tool1);
	toolRegistry.register(tool2);
	toolRegistry.register(tool3);

	// Deny middle tool
	const permissionHandler = new MockPermissionHandler(context => ({
		approved: context.toolCall.name !== 'result_tool_2',
	}));
	const handleToolCalls = new HandleToolCalls(toolRegistry, permissionHandler);

	const toolCalls: ToolCall[] = [
		{id: 'call-1', name: 'result_tool_1', arguments: {input: 'a'}},
		{id: 'call-2', name: 'result_tool_2', arguments: {input: 'b'}},
		{id: 'call-3', name: 'result_tool_3', arguments: {input: 'c'}},
	];

	const result = await handleToolCalls.execute({toolCalls});

	t.truthy(result.contexts[0].result, 'First tool should have result');
	t.is(result.contexts[0].result!.output, 'output1');
	t.is(result.contexts[1].result, undefined, 'Denied tool should have no result');
	t.truthy(result.contexts[2].result, 'Third tool should have result');
	t.is(result.contexts[2].result!.output, 'output3');
});

// ========================================
// Property-Based Test: Task 12.2 - Property 10
// ========================================

/**
 * **Feature: permission-mode-fix, Property 10: Partial Approval Executes Approved Tools Only**
 * **Validates: Requirements 9.3**
 *
 * For any batch of tool calls where some are approved and some denied,
 * only approved tools SHALL be executed.
 */
test('Property 10: Partial approval executes approved tools only', async t => {
	await fc.assert(
		fc.asyncProperty(
			fc.array(toolCallArb, {minLength: 2, maxLength: 5}),
			fc.array(fc.boolean(), {minLength: 2, maxLength: 5}),
			async (toolCallTemplates, approvalDecisions) => {
				// Ensure we have matching lengths
				const numTools = Math.min(
					toolCallTemplates.length,
					approvalDecisions.length,
				);
				const toolCalls = toolCallTemplates.slice(0, numTools);
				const decisions = approvalDecisions.slice(0, numTools);

				// Setup: Create unique tool names to avoid conflicts
				const uniqueToolCalls = toolCalls.map((tc, i) => ({
					...tc,
					name: `tool_${i}_${tc.name}`,
					arguments:
						Object.keys(tc.arguments).length > 0
							? tc.arguments
							: {_placeholder: 'value'},
				}));

				// Setup: Create tool registry with mock tools
				const toolRegistry = new ToolRegistry();
				const mockTools = uniqueToolCalls.map(
					tc => new MockTool(tc.name, {success: true, output: 'output'}),
				);
				mockTools.forEach(tool => toolRegistry.register(tool));

				// Setup: Create permission handler with mixed decisions
				let callIndex = 0;
				const permissionHandler = new MockPermissionHandler(() => {
					const approved = decisions[callIndex] ?? true;
					callIndex++;
					return {approved, reason: approved ? undefined : 'User denied'};
				});

				const handleToolCalls = new HandleToolCalls(
					toolRegistry,
					permissionHandler,
				);

				// Act: Execute tool calls
				const result = await handleToolCalls.execute({
					toolCalls: uniqueToolCalls,
				});

				// Assert: Only approved tools were executed
				for (let i = 0; i < numTools; i++) {
					const shouldExecute = decisions[i];
					const actualExecutions = mockTools[i].executionCount;

					if (shouldExecute) {
						t.is(
							actualExecutions,
							1,
							`Tool ${i} should be executed (approved)`,
						);
						t.is(
							result.contexts[i].status,
							'completed',
							`Tool ${i} context should be completed`,
						);
						t.truthy(
							result.contexts[i].result,
							`Tool ${i} should have result`,
						);
						t.truthy(
							result.contexts[i].executionStartedAt,
							`Tool ${i} should have execution start time`,
						);
						t.truthy(
							result.contexts[i].executionCompletedAt,
							`Tool ${i} should have execution completion time`,
						);
					} else {
						t.is(
							actualExecutions,
							0,
							`Tool ${i} should NOT be executed (denied)`,
						);
						t.is(
							result.contexts[i].status,
							'rejected',
							`Tool ${i} context should be rejected`,
						);
						t.is(
							result.contexts[i].result,
							undefined,
							`Tool ${i} should have no result`,
						);
						t.is(
							result.contexts[i].executionStartedAt,
							undefined,
							`Tool ${i} should have no execution start time`,
						);
						t.is(
							result.contexts[i].executionCompletedAt,
							undefined,
							`Tool ${i} should have no execution completion time`,
						);
					}
				}

				// Assert: allApproved reflects whether all were approved
				const allApproved = decisions.every(d => d);
				t.is(
					result.allApproved,
					allApproved,
					'allApproved should reflect actual approval state',
				);

				// Assert: allCompleted is false if any tool was denied
				const anyDenied = decisions.some(d => !d);
				if (anyDenied) {
					t.false(
						result.allCompleted,
						'allCompleted should be false when any tool is denied',
					);
				}

				// Assert: contexts length matches input
				t.is(
					result.contexts.length,
					numTools,
					'Should have context for each tool call',
				);
			},
		),
		{numRuns: 100},
	);
});
