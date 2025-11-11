/**
 * Workflow Manager Service
 * Manages plans and tasks for organized AI agent workflow
 */

import {Plan, PlanStatus, PlanPriority} from '../../domain/models/Plan';
import {Todo, TodoStatus} from '../../domain/models/Todo';

export interface PlanCreateOptions {
	priority?: PlanPriority;
	estimatedDuration?: number;
	complexity?: 'simple' | 'moderate' | 'complex' | 'very_complex';
	tags?: string[];
}

export interface WorkflowProgress {
	currentPlan?: Plan;
	totalPlans: number;
	completedPlans: number;
	overallProgress: number; // 0-100
	activeTodos: number;
	completedTodos: number;
}

/**
 * Workflow Manager - Orchestrates plans and todos
 */
export class WorkflowManager {
	private plans: Map<string, Plan> = new Map();
	private currentPlanId?: string;
	private history: Plan[] = []; // Completed plans

	constructor() {}

	/**
	 * Create a new plan
	 * @param title - Plan title
	 * @param description - Plan description
	 * @param todos - Initial todos (optional)
	 * @param options - Additional options
	 */
	createPlan(
		title: string,
		description: string,
		todos: Todo[] = [],
		options: PlanCreateOptions = {},
	): Plan {
		const plan = new Plan(
			title,
			description,
			todos,
			PlanStatus.Pending,
			options.priority || PlanPriority.Medium,
			{
				estimatedDuration: options.estimatedDuration,
				complexity: options.complexity,
				tags: options.tags,
			},
		);

		this.plans.set(plan.id, plan);

		// Auto-set as current plan if no current plan exists
		if (!this.currentPlanId) {
			this.setCurrentPlan(plan.id);
		}

		return plan;
	}

	/**
	 * Set current active plan
	 */
	setCurrentPlan(planId: string): boolean {
		if (!this.plans.has(planId)) {
			return false;
		}

		this.currentPlanId = planId;
		const plan = this.plans.get(planId)!;

		// Auto-start the plan if it's pending
		if (plan.status === PlanStatus.Pending) {
			plan.start();
		}

		return true;
	}

	/**
	 * Get current plan
	 */
	getCurrentPlan(): Plan | undefined {
		if (!this.currentPlanId) {
			return undefined;
		}

		return this.plans.get(this.currentPlanId);
	}

	/**
	 * Get plan by ID
	 */
	getPlan(planId: string): Plan | undefined {
		return this.plans.get(planId);
	}

	/**
	 * Get all active plans
	 */
	getActivePlans(): Plan[] {
		return Array.from(this.plans.values()).filter(
			p => p.status === PlanStatus.InProgress || p.status === PlanStatus.Pending,
		);
	}

	/**
	 * Get all plans
	 */
	getAllPlans(): Plan[] {
		return Array.from(this.plans.values());
	}

	/**
	 * Get completed plans (history)
	 */
	getHistory(): Plan[] {
		return [...this.history];
	}

	/**
	 * Add todo to current plan
	 */
	addTodo(content: string, activeForm?: string): Todo | undefined {
		const plan = this.getCurrentPlan();
		if (!plan) {
			return undefined;
		}

		const todo = Todo.create(content, {
			metadata: activeForm ? {activeForm} : undefined,
		});

		plan.addTodo(todo);
		return todo;
	}

	/**
	 * Add todo to specific plan
	 */
	addTodoToPlan(
		planId: string,
		content: string,
		activeForm?: string,
	): Todo | undefined {
		const plan = this.getPlan(planId);
		if (!plan) {
			return undefined;
		}

		const todo = Todo.create(content, {
			metadata: activeForm ? {activeForm} : undefined,
		});

		plan.addTodo(todo);
		return todo;
	}

	/**
	 * Update todo status
	 */
	updateTodoStatus(todoId: string, status: TodoStatus): boolean {
		// Find todo in current plan
		const plan = this.getCurrentPlan();
		if (!plan) {
			return false;
		}

		const todo = plan.getTodo(todoId);
		if (!todo) {
			return false;
		}

		// Remove old todo and add updated one
		plan.removeTodo(todoId);
		plan.addTodo(todo.withStatus(status));

		// Check if plan is completed
		this.checkPlanCompletion(plan);

		return true;
	}

	/**
	 * Mark todo as completed
	 */
	completeTodo(todoId: string): boolean {
		return this.updateTodoStatus(todoId, TodoStatus.Completed);
	}

	/**
	 * Mark todo as in progress
	 */
	startTodo(todoId: string): boolean {
		return this.updateTodoStatus(todoId, TodoStatus.InProgress);
	}

	/**
	 * Remove todo from current plan
	 */
	removeTodo(todoId: string): boolean {
		const plan = this.getCurrentPlan();
		if (!plan) {
			return false;
		}

		return plan.removeTodo(todoId);
	}

	/**
	 * Complete current plan
	 */
	completePlan(planId?: string): boolean {
		const targetPlanId = planId || this.currentPlanId;
		if (!targetPlanId) {
			return false;
		}

		const plan = this.getPlan(targetPlanId);
		if (!plan) {
			return false;
		}

		plan.complete();

		// Move to history
		this.history.push(plan);
		this.plans.delete(targetPlanId);

		// Clear current plan if it's the one being completed
		if (this.currentPlanId === targetPlanId) {
			this.currentPlanId = undefined;

			// Auto-select next pending/in-progress plan
			const nextPlan = this.getActivePlans()[0];
			if (nextPlan) {
				this.setCurrentPlan(nextPlan.id);
			}
		}

		return true;
	}

	/**
	 * Fail a plan
	 */
	failPlan(planId: string, reason?: string): boolean {
		const plan = this.getPlan(planId);
		if (!plan) {
			return false;
		}

		plan.fail(reason);

		// Move to history
		this.history.push(plan);
		this.plans.delete(planId);

		// Clear current plan if it's the one being failed
		if (this.currentPlanId === planId) {
			this.currentPlanId = undefined;
		}

		return true;
	}

	/**
	 * Cancel a plan
	 */
	cancelPlan(planId: string, reason?: string): boolean {
		const plan = this.getPlan(planId);
		if (!plan) {
			return false;
		}

		plan.cancel(reason);

		// Move to history
		this.history.push(plan);
		this.plans.delete(planId);

		// Clear current plan if it's the one being cancelled
		if (this.currentPlanId === planId) {
			this.currentPlanId = undefined;
		}

		return true;
	}

	/**
	 * Check if plan is completed and auto-complete if all todos are done
	 */
	private checkPlanCompletion(plan: Plan): void {
		if (plan.isCompleted() && plan.status !== PlanStatus.Completed) {
			this.completePlan(plan.id);
		}
	}

	/**
	 * Get overall workflow progress
	 */
	getProgress(): WorkflowProgress {
		const currentPlan = this.getCurrentPlan();
		const activePlans = this.getActivePlans();
		const completedPlans = this.history.filter(
			p => p.status === PlanStatus.Completed,
		).length;

		let activeTodos = 0;
		let completedTodos = 0;

		// Count todos across all active plans
		for (const plan of activePlans) {
			activeTodos += plan.getPendingCount() + plan.getInProgressCount();
			completedTodos += plan.getCompletedCount();
		}

		const totalPlans = activePlans.length + completedPlans;
		const overallProgress =
			totalPlans > 0 ? Math.round((completedPlans / totalPlans) * 100) : 0;

		return {
			currentPlan,
			totalPlans,
			completedPlans,
			overallProgress,
			activeTodos,
			completedTodos,
		};
	}

	/**
	 * Get summary string
	 */
	getSummary(): string {
		const progress = this.getProgress();
		const lines: string[] = [];

		if (progress.currentPlan) {
			lines.push(`Current Plan: ${progress.currentPlan.getSummary()}`);
		}

		lines.push(
			`Plans: ${progress.completedPlans}/${progress.totalPlans} completed (${progress.overallProgress}%)`,
		);
		lines.push(
			`Todos: ${progress.completedTodos}/${progress.activeTodos + progress.completedTodos} completed`,
		);

		return lines.join('\n');
	}

	/**
	 * Export all plans to JSON
	 */
	exportToJSON(): any {
		return {
			currentPlanId: this.currentPlanId,
			plans: Array.from(this.plans.values()).map(p => p.toJSON()),
			history: this.history.map(p => p.toJSON()),
		};
	}

	/**
	 * Import plans from JSON
	 */
	importFromJSON(data: any): void {
		this.plans.clear();
		this.history = [];

		if (data.plans) {
			for (const planData of data.plans) {
				const plan = Plan.fromJSON(planData);
				this.plans.set(plan.id, plan);
			}
		}

		if (data.history) {
			this.history = data.history.map((p: any) => Plan.fromJSON(p));
		}

		this.currentPlanId = data.currentPlanId;
	}

	/**
	 * Clear all plans and history
	 */
	clear(): void {
		this.plans.clear();
		this.history = [];
		this.currentPlanId = undefined;
	}
}
