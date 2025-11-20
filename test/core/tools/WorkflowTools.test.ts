/**
 * Tests for WorkflowTools
 * Coverage target: 95%
 */

import test from 'ava';
import sinon from 'sinon';
import {
	CreatePlanTool,
	AddTodoTool,
	UpdateTodoStatusTool,
	RemoveTodoTool,
	GetCurrentPlanTool
} from '../../../dist/core/tools/WorkflowTools.js';
import {WorkflowManager} from '../../../dist/core/application/services/WorkflowManager.js';
import {Todo, TodoStatus} from '../../../dist/core/domain/models/Todo.js';
import {Plan, PlanPriority} from '../../../dist/core/domain/models/Plan.js';

// Mock WorkflowManager
const mockWorkflowManager = {
	createPlan: sinon.stub(),
	addTodo: sinon.stub(),
	updateTodoStatus: sinon.stub(),
	removeTodo: sinon.stub(),
	getCurrentPlan: sinon.stub()
} as unknown as WorkflowManager;

test.beforeEach(() => {
	sinon.reset();
});

// --- CreatePlanTool Tests ---

test('CreatePlanTool: validates parameters', t => {
	const tool = new CreatePlanTool(mockWorkflowManager);
	t.true(tool.validateParameters({
		title: 'Test Plan',
		description: 'Desc',
		todos: [{content: 'Task 1', activeForm: 'Doing Task 1'}]
	}));
	t.false(tool.validateParameters({}));
});

test('CreatePlanTool: creates plan successfully', async t => {
	const tool = new CreatePlanTool(mockWorkflowManager);
	const mockPlan = new Plan('Test Plan', 'Desc');
	mockPlan.id = '1';
	(mockWorkflowManager.createPlan as sinon.SinonStub).returns(mockPlan);

	const result = await tool.execute({
		title: 'Test Plan',
		description: 'Desc',
		todos: [{content: 'Task 1', activeForm: 'Doing Task 1'}],
		priority: 'high'
	});

	t.true(result.success);
	t.is(result.metadata?.planId, '1');
	t.true((mockWorkflowManager.createPlan as sinon.SinonStub).calledOnce);
});

// --- AddTodoTool Tests ---

test('AddTodoTool: validates parameters', t => {
	const tool = new AddTodoTool(mockWorkflowManager);
	t.true(tool.validateParameters({content: 'Task', activeForm: 'Doing'}));
	t.false(tool.validateParameters({content: 'Task'}));
});

test('AddTodoTool: adds todo successfully', async t => {
	const tool = new AddTodoTool(mockWorkflowManager);
	const mockTodo = Todo.create('Task', {metadata: {activeForm: 'Doing'}});
	(mockWorkflowManager.addTodo as sinon.SinonStub).returns(mockTodo);

	const result = await tool.execute({content: 'Task', activeForm: 'Doing'});

	t.true(result.success);
	t.is(result.metadata?.todoId, mockTodo.id);
});

test('AddTodoTool: fails if no active plan', async t => {
	const tool = new AddTodoTool(mockWorkflowManager);
	(mockWorkflowManager.addTodo as sinon.SinonStub).returns(null);

	const result = await tool.execute({content: 'Task', activeForm: 'Doing'});

	t.false(result.success);
	t.true(result.error?.includes('No active plan found'));
});

// --- UpdateTodoStatusTool Tests ---

test('UpdateTodoStatusTool: validates parameters', t => {
	const tool = new UpdateTodoStatusTool(mockWorkflowManager);
	t.true(tool.validateParameters({todoId: '1', status: 'completed'}));
	t.false(tool.validateParameters({todoId: '1', status: 'invalid'}));
});

test('UpdateTodoStatusTool: updates status successfully', async t => {
	const tool = new UpdateTodoStatusTool(mockWorkflowManager);
	(mockWorkflowManager.updateTodoStatus as sinon.SinonStub).returns(true);

	const result = await tool.execute({todoId: '1', status: 'completed'});

	t.true(result.success);
	t.is(result.metadata?.status, 'completed');
});

test('UpdateTodoStatusTool: fails if todo not found', async t => {
	const tool = new UpdateTodoStatusTool(mockWorkflowManager);
	(mockWorkflowManager.updateTodoStatus as sinon.SinonStub).returns(false);

	const result = await tool.execute({todoId: '1', status: 'completed'});

	t.false(result.success);
	t.true(result.error?.includes('Todo with ID 1 not found'));
});

// --- RemoveTodoTool Tests ---

test('RemoveTodoTool: validates parameters', t => {
	const tool = new RemoveTodoTool(mockWorkflowManager);
	t.true(tool.validateParameters({todoId: '1'}));
	t.false(tool.validateParameters({}));
});

test('RemoveTodoTool: removes todo successfully', async t => {
	const tool = new RemoveTodoTool(mockWorkflowManager);
	(mockWorkflowManager.removeTodo as sinon.SinonStub).returns(true);

	const result = await tool.execute({todoId: '1'});

	t.true(result.success);
	t.is(result.metadata?.todoId, '1');
});

test('RemoveTodoTool: fails if todo not found', async t => {
	const tool = new RemoveTodoTool(mockWorkflowManager);
	(mockWorkflowManager.removeTodo as sinon.SinonStub).returns(false);

	const result = await tool.execute({todoId: '1'});

	t.false(result.success);
	t.true(result.error?.includes('Todo with ID 1 not found'));
});

// --- GetCurrentPlanTool Tests ---

test('GetCurrentPlanTool: gets plan successfully', async t => {
	const tool = new GetCurrentPlanTool(mockWorkflowManager);
	const mockPlan = new Plan('Test Plan', 'Desc');
	mockPlan.id = '1';
	mockPlan.addTodo(Todo.create('Task 1'));
	(mockWorkflowManager.getCurrentPlan as sinon.SinonStub).returns(mockPlan);

	const result = await tool.execute({});

	t.true(result.success);
	t.is(result.metadata?.planId, '1');
	t.true(result.output.includes('Test Plan'));
});

test('GetCurrentPlanTool: handles no active plan', async t => {
	const tool = new GetCurrentPlanTool(mockWorkflowManager);
	(mockWorkflowManager.getCurrentPlan as sinon.SinonStub).returns(null);

	const result = await tool.execute({});

	t.true(result.success);
	t.true(result.output.includes('No active plan'));
});
