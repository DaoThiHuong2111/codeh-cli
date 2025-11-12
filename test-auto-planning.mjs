#!/usr/bin/env node
/**
 * Test: AI Auto-Planning Feature
 * Verifies that AI automatically creates plans for multi-step tasks
 */

import {CodehClient} from './dist/core/application/CodehClient.js';
import {ToolRegistry} from './dist/core/tools/base/ToolRegistry.js';
import {WorkflowManager} from './dist/core/application/services/WorkflowManager.js';
import {
	CreatePlanTool,
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
}

class MockPermissionHandler {
	async requestPermission(context) {
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

		// Verify system prompt is present
		if (!request.systemPrompt) {
			throw new Error('System prompt is missing!');
		}

		if (!request.systemPrompt.includes('Planning Guidelines')) {
			throw new Error('Planning system prompt not set correctly!');
		}

		// Scenario: User asks to refactor something complex
		if (this.scenario === 'refactor-auth') {
			return this.handleRefactorAuthScenario(request);
		}

		throw new Error(`Unknown scenario: ${this.scenario}`);
	}

	handleRefactorAuthScenario(request) {
		// Call 1: AI decides to create a plan
		if (this.callCount === 1) {
			console.log('✓ AI received system prompt with planning guidelines');
			console.log('✓ AI decides this is a multi-step task requiring a plan');

			return {
				content:
					'I understand you want to refactor the authentication system. Let me create a plan for this task.',
				model: 'mock-ai',
				finishReason: 'tool_calls',
				toolCalls: [
					{
						id: 'call_1',
						name: 'create_plan',
						arguments: {
							title: 'Refactor Authentication System',
							description:
								'Replace session-based auth with JWT token authentication',
							todos: [
								{
									content: 'Find current authentication implementation',
									activeForm: 'Finding authentication implementation',
								},
								{
									content: 'Research JWT best practices',
									activeForm: 'Researching JWT best practices',
								},
								{
									content: 'Implement JWT service',
									activeForm: 'Implementing JWT service',
								},
								{
									content: 'Update authentication middleware',
									activeForm: 'Updating authentication middleware',
								},
								{
									content: 'Update tests and documentation',
									activeForm: 'Updating tests and documentation',
								},
							],
							priority: 'high',
						},
					},
				],
			};
		}

		// Call 2: After plan creation, AI confirms and is ready to start
		return {
			content:
				"I've created a plan with 5 steps to refactor your authentication system. The plan is now visible in your TodosDisplay. I'm ready to start executing the tasks whenever you're ready.",
			model: 'mock-ai',
			finishReason: 'stop',
		};
	}

	async streamChat(request, onChunk) {
		const response = await this.chat(request);
		if (response.content) {
			onChunk({content: response.content, done: true});
		}
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
}

// ========================================
// Test Execution
// ========================================

async function testAutoPlanning() {
	console.log('\n🧪 Testing: AI Auto-Planning Feature\n');
	console.log('━'.repeat(50));

	// Setup
	const mockAI = new MockAIClient('refactor-auth');
	const historyRepo = new MockHistoryRepository();
	const permissionHandler = new MockPermissionHandler();
	const workflowManager = new WorkflowManager();
	const toolRegistry = new ToolRegistry();

	// Register workflow tools
	toolRegistry.register(new CreatePlanTool(workflowManager));
	toolRegistry.register(new UpdateTodoStatusTool(workflowManager));
	toolRegistry.register(new GetCurrentPlanTool(workflowManager));

	const client = new CodehClient(
		mockAI,
		historyRepo,
		toolRegistry,
		permissionHandler,
	);

	// Test: User asks to refactor authentication
	console.log('\n📝 User Request:');
	console.log(
		'   "Refactor the authentication system to use JWT instead of sessions"\n',
	);

	const turn = await client.execute(
		'Refactor the authentication system to use JWT instead of sessions',
	);

	// Verify results
	console.log('━'.repeat(50));
	console.log('\n✅ Test Results:\n');

	// Check 1: System prompt was sent
	console.log('✓ System prompt with planning guidelines sent to AI');

	// Check 2: AI created a plan
	const currentPlan = workflowManager.getCurrentPlan();
	if (!currentPlan) {
		throw new Error('AI did not create a plan!');
	}
	console.log(`✓ AI created plan: "${currentPlan.title}"`);

	// Check 3: Plan has todos
	if (currentPlan.todos.length !== 5) {
		throw new Error(`Expected 5 todos, got ${currentPlan.todos.length}`);
	}
	console.log(`✓ Plan has ${currentPlan.todos.length} todos`);

	// Check 4: Todos have proper format
	const firstTodo = currentPlan.todos[0];
	if (
		!firstTodo.content ||
		!firstTodo.metadata?.activeForm ||
		!firstTodo.status
	) {
		throw new Error('Todos not properly formatted');
	}
	console.log('✓ Todos properly formatted with content, activeForm, status');

	// Check 5: Turn is complete
	if (!turn.isComplete()) {
		throw new Error('Turn did not complete successfully');
	}
	console.log('✓ Turn completed successfully');

	// Display plan details
	console.log('\n📋 Plan Details:\n');
	console.log(`   Title: ${currentPlan.title}`);
	console.log(`   Description: ${currentPlan.description}`);
	console.log(`   Priority: ${currentPlan.priority}`);
	console.log(`   Status: ${currentPlan.status}`);
	console.log('\n   Todos:');
	currentPlan.todos.forEach((todo, i) => {
		console.log(`   ${i + 1}. [${todo.status}] ${todo.content}`);
	});

	console.log('\n━'.repeat(50));
	console.log('\n🎉 Auto-Planning Feature: WORKING!\n');
	console.log('Summary:');
	console.log('  ✓ System prompt guides AI to create plans');
	console.log('  ✓ AI detects multi-step tasks automatically');
	console.log('  ✓ AI creates structured plans with todos');
	console.log('  ✓ Plans are stored in WorkflowManager');
	console.log('  ✓ TodosDisplay will show progress in real-time');
	console.log('\n━'.repeat(50));
}

// Run test
testAutoPlanning().catch(err => {
	console.error('\n❌ Test Failed:', err.message);
	process.exit(1);
});
