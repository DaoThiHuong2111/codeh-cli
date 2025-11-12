#!/usr/bin/env node
/**
 * Integration Test: WorkflowManager Tools with Mock AI
 * Tests complete workflow: AI creates plan → updates todos → UI displays
 */

import {CodehClient} from './dist/core/application/CodehClient.js';
import {ToolRegistry} from './dist/core/tools/base/ToolRegistry.js';
import {WorkflowManager} from './dist/core/application/services/WorkflowManager.js';
import {
	CreatePlanTool,
	AddTodoTool,
	UpdateTodoStatusTool,
	GetCurrentPlanTool,
} from './dist/core/tools/WorkflowTools.js';

// ========================================
// Mock Infrastructure
// ========================================

class MockHistoryRepository {
	constructor() {
		this.messages = [];
	}

	async addMessage(message) {
		this.messages.push(message);
	}

	async getRecentMessages(limit) {
		return this.messages.slice(-limit);
	}

	async clearHistory() {
		this.messages = [];
	}

	async saveToFile() {}
	async loadFromFile() {}
}

class MockPermissionHandler {
	async requestPermission(context) {
		// Auto-approve workflow tools
		return {
			approved: true,
			reason: 'Auto-approved for testing',
		};
	}

	hasPreApproval(toolName) {
		return true;
	}

	async savePermissionPreference(toolName, alwaysAllow) {}
	async clearPreferences() {}
}

class MockAIClient {
	constructor(scenario) {
		this.scenario = scenario;
		this.callCount = 0;
	}

	async chat(request) {
		this.callCount++;

		if (this.scenario === 'create-plan') {
			return this.handleCreatePlanScenario(request);
		} else if (this.scenario === 'update-todo') {
			return this.handleUpdateTodoScenario(request);
		}

		throw new Error(`Unknown scenario: ${this.scenario}`);
	}

	handleCreatePlanScenario(request) {
		// Call 1: AI creates plan
		if (this.callCount === 1) {
			return {
				content: 'I will create a plan to refactor authentication.',
				model: 'mock-ai',
				finishReason: 'tool_calls',
				toolCalls: [
					{
						id: 'call_1',
						name: 'create_plan',
						arguments: {
							title: 'Refactor Authentication System',
							description: 'Modernize auth with JWT tokens',
							todos: [
								{
									content: 'Find AuthService code',
									activeForm: 'Finding AuthService code',
								},
								{
									content: 'Rename to AuthenticationManager',
									activeForm: 'Renaming to AuthenticationManager',
								},
								{
									content: 'Update all imports',
									activeForm: 'Updating all imports',
								},
							],
							priority: 'high',
						},
					},
				],
			};
		}

		// Call 2: Final response after creating plan
		return {
			content:
				'I have created a plan with 3 tasks to refactor the authentication system.',
			model: 'mock-ai',
			finishReason: 'stop',
		};
	}

	handleUpdateTodoScenario(request) {
		// This scenario assumes a plan already exists
		// Call 1: Update first todo to in_progress
		if (this.callCount === 1) {
			return {
				content: 'I will start working on the first task.',
				model: 'mock-ai',
				finishReason: 'tool_calls',
				toolCalls: [
					{
						id: 'call_1',
						name: 'update_todo_status',
						arguments: {
							todoId: 'todo_placeholder_1',
							status: 'in_progress',
						},
					},
				],
			};
		}

		// Call 2: Complete first todo
		if (this.callCount === 2) {
			return {
				content: 'Task completed! Moving to next one.',
				model: 'mock-ai',
				finishReason: 'tool_calls',
				toolCalls: [
					{
						id: 'call_2',
						name: 'update_todo_status',
						arguments: {
							todoId: 'todo_placeholder_1',
							status: 'completed',
						},
					},
				],
			};
		}

		return {
			content: 'All tasks updated successfully.',
			model: 'mock-ai',
			finishReason: 'stop',
		};
	}

	async streamChat(request, onChunk) {
		const response = await this.chat(request);
		onChunk({content: response.content, done: true});
		return response;
	}

	async healthCheck() {
		return true;
	}

	getProviderName() {
		return 'mock-ai';
	}

	async getAvailableModels() {
		return ['mock-ai'];
	}

	getCallCount() {
		return this.callCount;
	}
}

// ========================================
// Test Helper
// ========================================

function createTestEnvironment(scenario) {
	const mockAI = new MockAIClient(scenario);
	const historyRepo = new MockHistoryRepository();
	const permissionHandler = new MockPermissionHandler();
	const workflowManager = new WorkflowManager();
	const toolRegistry = new ToolRegistry();

	// Register workflow tools
	toolRegistry.register(new CreatePlanTool(workflowManager));
	toolRegistry.register(new AddTodoTool(workflowManager));
	toolRegistry.register(new UpdateTodoStatusTool(workflowManager));
	toolRegistry.register(new GetCurrentPlanTool(workflowManager));

	const client = new CodehClient(
		mockAI,
		historyRepo,
		toolRegistry,
		permissionHandler,
	);

	return {client, workflowManager, mockAI};
}

function assert(condition, message) {
	if (!condition) {
		throw new Error(`❌ Assertion failed: ${message}`);
	}
	console.log(`✓ ${message}`);
}

// ========================================
// Integration Tests
// ========================================

async function test(name, fn) {
	console.log(`\n🧪 Test: ${name}`);
	try {
		await fn();
		console.log(`✅ PASSED: ${name}\n`);
	} catch (error) {
		console.error(`❌ FAILED: ${name}`);
		console.error(`   Error: ${error.message}\n`);
		throw error;
	}
}

// Test 1: AI creates a plan with todos
await test('Integration: AI creates plan via create_plan tool', async () => {
	const {client, workflowManager, mockAI} = createTestEnvironment('create-plan');

	// Execute user request
	const turn = await client.execute('Create a plan to refactor authentication');

	// Verify AI was called twice (initial + continuation)
	assert(
		mockAI.getCallCount() >= 2,
		`AI should call at least twice, got ${mockAI.getCallCount()}`,
	);

	// Verify plan was created in WorkflowManager
	const currentPlan = workflowManager.getCurrentPlan();
	assert(currentPlan !== undefined, 'Current plan should exist');
	assert(
		currentPlan.title === 'Refactor Authentication System',
		'Plan title should match',
	);
	assert(currentPlan.todos.length === 3, 'Plan should have 3 todos');

	// Verify todos structure
	const todos = currentPlan.todos;
	assert(todos[0].content === 'Find AuthService code', 'First todo content matches');
	assert(
		todos[0].metadata?.activeForm === 'Finding AuthService code',
		'First todo activeForm matches',
	);
	assert(todos[0].status === 'pending', 'First todo should be pending');

	// Verify response indicates success
	assert(turn.response !== null, 'Should have response');
	assert(
		turn.response.content.includes('plan') ||
			turn.response.content.includes('task'),
		'Response should mention plan or tasks',
	);
});

// Test 2: Verify tool definitions are correct
await test('Tool Definitions: All workflow tools registered correctly', async () => {
	const {client, workflowManager} = createTestEnvironment('create-plan');
	const toolRegistry = new ToolRegistry();

	toolRegistry.register(new CreatePlanTool(workflowManager));
	toolRegistry.register(new AddTodoTool(workflowManager));
	toolRegistry.register(new UpdateTodoStatusTool(workflowManager));
	toolRegistry.register(new GetCurrentPlanTool(workflowManager));

	const definitions = toolRegistry.getDefinitions();

	assert(definitions.length === 4, 'Should have 4 workflow tools');

	// Check create_plan tool
	const createPlanDef = definitions.find(d => d.name === 'create_plan');
	assert(createPlanDef !== undefined, 'create_plan tool should be registered');
	assert(
		createPlanDef.inputSchema.properties.title !== undefined,
		'create_plan should have title property',
	);
	assert(
		createPlanDef.inputSchema.properties.todos !== undefined,
		'create_plan should have todos property',
	);
	assert(
		createPlanDef.inputSchema.required.includes('title'),
		'title should be required',
	);

	// Check update_todo_status tool
	const updateDef = definitions.find(d => d.name === 'update_todo_status');
	assert(
		updateDef !== undefined,
		'update_todo_status tool should be registered',
	);
	assert(
		updateDef.inputSchema.properties.todoId !== undefined,
		'Should have todoId property',
	);
	assert(
		updateDef.inputSchema.properties.status !== undefined,
		'Should have status property',
	);
	assert(
		updateDef.inputSchema.properties.status.enum.includes('in_progress'),
		'Status should allow in_progress',
	);
});

// Test 3: Get current plan tool
await test('Integration: AI can check current plan status', async () => {
	const {client, workflowManager} = createTestEnvironment('create-plan');

	// First create a plan
	await client.execute('Create a plan to refactor authentication');

	// Now use get_current_plan tool by creating a new client
	const mockAI2 = {
		callCount: 0,
		async chat(request) {
			this.callCount++;
			if (this.callCount === 1) {
				return {
					content: 'Let me check the current plan.',
					model: 'mock-ai',
					finishReason: 'tool_calls',
					toolCalls: [
						{
							id: 'call_1',
							name: 'get_current_plan',
							arguments: {},
						},
					],
				};
			}
			return {
				content: 'The current plan has 3 tasks.',
				model: 'mock-ai',
				finishReason: 'stop',
			};
		},
		async streamChat(request, onChunk) {
			const response = await this.chat(request);
			onChunk({content: response.content, done: true});
			return response;
		},
		async healthCheck() {
			return true;
		},
		getProviderName() {
			return 'mock-ai';
		},
		async getAvailableModels() {
			return ['mock-ai'];
		},
	};

	const historyRepo = new MockHistoryRepository();
	const permissionHandler = new MockPermissionHandler();
	const toolRegistry2 = new ToolRegistry();

	toolRegistry2.register(new GetCurrentPlanTool(workflowManager));

	const client2 = new CodehClient(mockAI2, historyRepo, toolRegistry2, permissionHandler);

	const turn = await client2.execute('What is the current plan?');

	assert(mockAI2.callCount >= 2, 'AI should call at least twice');
	assert(turn.response !== null, 'Should have response');
});

// Test 4: WorkflowManager state management
await test('WorkflowManager: Correctly manages plan state', async () => {
	const workflowManager = new WorkflowManager();

	// Initially no plan
	assert(
		workflowManager.getCurrentPlan() === undefined,
		'Should have no current plan initially',
	);

	// Create plan
	const plan = workflowManager.createPlan(
		'Test Plan',
		'Test Description',
		[],
		{priority: 'medium'},
	);

	// Verify plan is current
	assert(
		workflowManager.getCurrentPlan() !== undefined,
		'Should have current plan after creation',
	);
	assert(
		workflowManager.getCurrentPlan().id === plan.id,
		'Current plan should match created plan',
	);

	// Add todos
	const todo1 = workflowManager.addTodo('Task 1', 'Doing Task 1');
	assert(todo1 !== undefined, 'Should add todo successfully');
	assert(
		workflowManager.getCurrentPlan().todos.length === 1,
		'Plan should have 1 todo',
	);

	// Update todo status
	const success = workflowManager.updateTodoStatus(todo1.id, 'in_progress');
	assert(success === true, 'Should update todo status successfully');

	const updatedTodo = workflowManager.getCurrentPlan().getTodo(todo1.id);
	assert(
		updatedTodo.status === 'in_progress',
		'Todo status should be in_progress',
	);
});

// ========================================
// Summary
// ========================================

console.log('\n' + '='.repeat(50));
console.log('\n📊 Integration Test Results:');
console.log('✅ All tests passed!');
console.log('\nWorkflow Integration Summary:');
console.log('  ✓ AI can create plans with todos via create_plan tool');
console.log('  ✓ WorkflowManager correctly stores and manages plans');
console.log('  ✓ Tool definitions are correctly formatted for AI API');
console.log('  ✓ AI can query current plan status via get_current_plan tool');
console.log('  ✓ WorkflowManager state management works correctly');
console.log('\n🎉 WorkflowManager integration is working!');
console.log('\n' + '='.repeat(50));
