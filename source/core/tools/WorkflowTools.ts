/**
 * Workflow Management Tools
 * Tools for AI to create and manage plans/todos
 */

import {Tool} from './base/Tool';
import {
	ToolDefinition,
	ToolExecutionResult,
} from '../domain/interfaces/IToolExecutor';
import {WorkflowManager} from '../application/services/WorkflowManager';
import {Todo, TodoStatus} from '../domain/models/Todo';
import {PlanPriority} from '../domain/models/Plan';

/**
 * Create Plan Tool - AI creates a new plan with todos
 */
export class CreatePlanTool extends Tool {
	constructor(private workflowManager: WorkflowManager) {
		super(
			'create_plan',
			'Create a new plan with tasks (todos) to organize AI workflow',
		);
	}

	getDefinition(): ToolDefinition {
		return {
			name: this.name,
			description: this.description,
			inputSchema: {
				type: 'object',
				properties: {
					title: {
						type: 'string',
						description: 'Plan title (e.g., "Refactor authentication system")',
					},
					description: {
						type: 'string',
						description: 'Plan description explaining the goal',
					},
					todos: {
						type: 'array',
						description: 'List of tasks to complete',
						items: {
							type: 'object',
							properties: {
								content: {
									type: 'string',
									description: 'Task description',
								},
								activeForm: {
									type: 'string',
									description:
										'Present continuous form (e.g., "Refactoring auth")',
								},
							},
							required: ['content', 'activeForm'],
						},
					},
					priority: {
						type: 'string',
						description: 'Plan priority (low, medium, high, critical)',
						enum: ['low', 'medium', 'high', 'critical'],
						default: 'medium',
					},
				},
				required: ['title', 'description', 'todos'],
			},
		};
	}

	async execute(parameters: Record<string, any>): Promise<ToolExecutionResult> {
		try {
			if (!this.validateParameters(parameters)) {
				return this.createErrorResult('Invalid parameters');
			}

			const {title, description, todos: todosInput, priority} = parameters;

			// Create Todo objects
			const todos: Todo[] = todosInput.map((t: any) =>
				Todo.create(t.content, {
					metadata: {activeForm: t.activeForm},
				}),
			);

			// Map priority string to enum
			const priorityMap: Record<string, PlanPriority> = {
				low: PlanPriority.Low,
				medium: PlanPriority.Medium,
				high: PlanPriority.High,
				critical: PlanPriority.Critical,
			};

			const planPriority = priorityMap[priority || 'medium'];

			// Create plan
			const plan = this.workflowManager.createPlan(title, description, todos, {
				priority: planPriority,
			});

			const output = JSON.stringify({
				success: true,
				planId: plan.id,
				title: plan.title,
				todosCount: todos.length,
				todos: todos.map(t => ({
					id: t.id,
					content: t.content,
					status: t.status,
					activeForm: t.metadata?.activeForm,
				})),
			});

			return this.createSuccessResult(output, {
				planId: plan.id,
				todosCount: todos.length,
			});
		} catch (error: any) {
			return this.createErrorResult(`Failed to create plan: ${error.message}`);
		}
	}

	validateParameters(parameters: Record<string, any>): boolean {
		return !!(
			parameters.title &&
			parameters.description &&
			Array.isArray(parameters.todos) &&
			parameters.todos.length > 0
		);
	}
}

/**
 * Add Todo Tool - AI adds a todo to current plan
 */
export class AddTodoTool extends Tool {
	constructor(private workflowManager: WorkflowManager) {
		super('add_todo', 'Add a new task (todo) to the current plan');
	}

	getDefinition(): ToolDefinition {
		return {
			name: this.name,
			description: this.description,
			inputSchema: {
				type: 'object',
				properties: {
					content: {
						type: 'string',
						description: 'Task description (imperative form)',
					},
					activeForm: {
						type: 'string',
						description:
							'Present continuous form for display (e.g., "Creating API endpoint")',
					},
				},
				required: ['content', 'activeForm'],
			},
		};
	}

	async execute(parameters: Record<string, any>): Promise<ToolExecutionResult> {
		try {
			if (!this.validateParameters(parameters)) {
				return this.createErrorResult('Invalid parameters');
			}

			const {content, activeForm} = parameters;

			// Add todo to current plan
			const todo = this.workflowManager.addTodo(content, activeForm);

			if (!todo) {
				return this.createErrorResult(
					'No active plan found. Create a plan first using create_plan.',
				);
			}

			const output = JSON.stringify({
				success: true,
				todoId: todo.id,
				content: todo.content,
				status: todo.status,
			});

			return this.createSuccessResult(output, {
				todoId: todo.id,
			});
		} catch (error: any) {
			return this.createErrorResult(`Failed to add todo: ${error.message}`);
		}
	}

	validateParameters(parameters: Record<string, any>): boolean {
		return !!(parameters.content && parameters.activeForm);
	}
}

/**
 * Update Todo Status Tool - AI updates todo status as it progresses
 */
export class UpdateTodoStatusTool extends Tool {
	constructor(private workflowManager: WorkflowManager) {
		super(
			'update_todo_status',
			'Update the status of a task (pending, in_progress, completed)',
		);
	}

	getDefinition(): ToolDefinition {
		return {
			name: this.name,
			description: this.description,
			inputSchema: {
				type: 'object',
				properties: {
					todoId: {
						type: 'string',
						description: 'ID of the todo to update',
					},
					status: {
						type: 'string',
						description: 'New status',
						enum: ['pending', 'in_progress', 'completed'],
					},
				},
				required: ['todoId', 'status'],
			},
		};
	}

	async execute(parameters: Record<string, any>): Promise<ToolExecutionResult> {
		try {
			if (!this.validateParameters(parameters)) {
				return this.createErrorResult('Invalid parameters');
			}

			const {todoId, status} = parameters;

			// Map status string to enum
			const statusMap: Record<string, TodoStatus> = {
				pending: TodoStatus.Pending,
				in_progress: TodoStatus.InProgress,
				completed: TodoStatus.Completed,
			};

			const todoStatus = statusMap[status];
			if (!todoStatus) {
				return this.createErrorResult(`Invalid status: ${status}`);
			}

			// Update todo status
			const success = this.workflowManager.updateTodoStatus(todoId, todoStatus);

			if (!success) {
				return this.createErrorResult(
					`Todo with ID ${todoId} not found in current plan`,
				);
			}

			const output = JSON.stringify({
				success: true,
				todoId,
				newStatus: status,
			});

			return this.createSuccessResult(output, {
				todoId,
				status,
			});
		} catch (error: any) {
			return this.createErrorResult(
				`Failed to update todo status: ${error.message}`,
			);
		}
	}

	validateParameters(parameters: Record<string, any>): boolean {
		return !!(
			parameters.todoId &&
			parameters.status &&
			['pending', 'in_progress', 'completed'].includes(parameters.status)
		);
	}
}

/**
 * Remove Todo Tool - AI removes a todo from current plan
 */
export class RemoveTodoTool extends Tool {
	constructor(private workflowManager: WorkflowManager) {
		super('remove_todo', 'Remove a task (todo) from the current plan');
	}

	getDefinition(): ToolDefinition {
		return {
			name: this.name,
			description: this.description,
			inputSchema: {
				type: 'object',
				properties: {
					todoId: {
						type: 'string',
						description: 'ID of the todo to remove',
					},
				},
				required: ['todoId'],
			},
		};
	}

	async execute(parameters: Record<string, any>): Promise<ToolExecutionResult> {
		try {
			if (!this.validateParameters(parameters)) {
				return this.createErrorResult('Invalid parameters');
			}

			const {todoId} = parameters;

			// Remove todo
			const success = this.workflowManager.removeTodo(todoId);

			if (!success) {
				return this.createErrorResult(
					`Todo with ID ${todoId} not found in current plan`,
				);
			}

			const output = JSON.stringify({
				success: true,
				todoId,
				message: 'Todo removed successfully',
			});

			return this.createSuccessResult(output, {
				todoId,
			});
		} catch (error: any) {
			return this.createErrorResult(`Failed to remove todo: ${error.message}`);
		}
	}

	validateParameters(parameters: Record<string, any>): boolean {
		return !!parameters.todoId;
	}
}

/**
 * Get Current Plan Tool - AI checks current plan status
 */
export class GetCurrentPlanTool extends Tool {
	constructor(private workflowManager: WorkflowManager) {
		super('get_current_plan', 'Get the current active plan with all todos');
	}

	getDefinition(): ToolDefinition {
		return {
			name: this.name,
			description: this.description,
			inputSchema: {
				type: 'object',
				properties: {},
				required: [],
			},
		};
	}

	async execute(parameters: Record<string, any>): Promise<ToolExecutionResult> {
		try {
			const plan = this.workflowManager.getCurrentPlan();

			if (!plan) {
				return this.createSuccessResult(
					JSON.stringify({
						success: true,
						message: 'No active plan',
						plan: null,
					}),
				);
			}

			const output = JSON.stringify({
				success: true,
				plan: {
					id: plan.id,
					title: plan.title,
					description: plan.description,
					status: plan.status,
					priority: plan.priority,
					todos: plan.todos.map(t => ({
						id: t.id,
						content: t.content,
						status: t.status,
						activeForm: t.metadata?.activeForm,
					})),
					progress: {
						total: plan.todos.length,
						pending: plan.getPendingCount(),
						inProgress: plan.getInProgressCount(),
						completed: plan.getCompletedCount(),
					},
				},
			});

			return this.createSuccessResult(output, {
				planId: plan.id,
			});
		} catch (error: any) {
			return this.createErrorResult(
				`Failed to get current plan: ${error.message}`,
			);
		}
	}

	validateParameters(parameters: Record<string, any>): boolean {
		return true; // No parameters required
	}
}
