/**
 * Plan Model
 * Represents a plan for completing a task with multiple steps
 */

import {Todo, TodoStatus} from './Todo';

/**
 * Plan priority level
 */
export enum PlanPriority {
	Low = 'low',
	Medium = 'medium',
	High = 'high',
	Critical = 'critical',
}

/**
 * Plan status
 */
export enum PlanStatus {
	Pending = 'pending',
	InProgress = 'in_progress',
	Completed = 'completed',
	Failed = 'failed',
	Cancelled = 'cancelled',
}

/**
 * Plan metadata
 */
export interface PlanMetadata {
	estimatedDuration?: number; // In minutes
	actualDuration?: number; // In minutes
	complexity?: 'simple' | 'moderate' | 'complex' | 'very_complex';
	tags?: string[];
}

/**
 * Plan Model
 */
export class Plan {
	public id: string;
	public createdAt: Date;
	public updatedAt: Date;
	public startedAt?: Date;
	public completedAt?: Date;

	constructor(
		public title: string,
		public description: string,
		public todos: Todo[] = [],
		public status: PlanStatus = PlanStatus.Pending,
		public priority: PlanPriority = PlanPriority.Medium,
		public metadata: PlanMetadata = {},
	) {
		this.id = this.generateId();
		this.createdAt = new Date();
		this.updatedAt = new Date();
	}

	/**
	 * Generate unique ID
	 */
	private generateId(): string {
		return `plan_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
	}

	/**
	 * Add a todo to the plan
	 */
	addTodo(todo: Todo): void {
		this.todos.push(todo);
		this.updatedAt = new Date();
	}

	/**
	 * Remove a todo from the plan
	 */
	removeTodo(todoId: string): boolean {
		const index = this.todos.findIndex(t => t.id === todoId);
		if (index !== -1) {
			this.todos.splice(index, 1);
			this.updatedAt = new Date();
			return true;
		}

		return false;
	}

	/**
	 * Get a todo by ID
	 */
	getTodo(todoId: string): Todo | undefined {
		return this.todos.find(t => t.id === todoId);
	}

	/**
	 * Start the plan
	 */
	start(): void {
		if (this.status === PlanStatus.Pending) {
			this.status = PlanStatus.InProgress;
			this.startedAt = new Date();
			this.updatedAt = new Date();
		}
	}

	/**
	 * Complete the plan
	 */
	complete(): void {
		this.status = PlanStatus.Completed;
		this.completedAt = new Date();
		this.updatedAt = new Date();

		if (this.startedAt) {
			this.metadata.actualDuration = Math.floor(
				(this.completedAt.getTime() - this.startedAt.getTime()) / 60000,
			);
		}
	}

	/**
	 * Fail the plan
	 */
	fail(reason?: string): void {
		this.status = PlanStatus.Failed;
		this.completedAt = new Date();
		this.updatedAt = new Date();

		if (reason) {
			this.metadata.tags = [...(this.metadata.tags || []), `failed: ${reason}`];
		}
	}

	/**
	 * Cancel the plan
	 */
	cancel(reason?: string): void {
		this.status = PlanStatus.Cancelled;
		this.completedAt = new Date();
		this.updatedAt = new Date();

		if (reason) {
			this.metadata.tags = [
				...(this.metadata.tags || []),
				`cancelled: ${reason}`,
			];
		}
	}

	/**
	 * Get progress percentage (0-100)
	 */
	getProgress(): number {
		if (this.todos.length === 0) {
			return 0;
		}

		const completedCount = this.todos.filter(
			t => t.status === TodoStatus.Completed,
		).length;
		return Math.round((completedCount / this.todos.length) * 100);
	}

	/**
	 * Get completed todos count
	 */
	getCompletedCount(): number {
		return this.todos.filter(t => t.status === TodoStatus.Completed).length;
	}

	/**
	 * Get pending todos count
	 */
	getPendingCount(): number {
		return this.todos.filter(t => t.status === TodoStatus.Pending).length;
	}

	/**
	 * Get in-progress todos count
	 */
	getInProgressCount(): number {
		return this.todos.filter(t => t.status === TodoStatus.InProgress).length;
	}

	/**
	 * Check if plan is completed
	 */
	isCompleted(): boolean {
		return (
			this.status === PlanStatus.Completed ||
			(this.todos.length > 0 &&
				this.todos.every(t => t.status === TodoStatus.Completed))
		);
	}

	/**
	 * Check if plan is in progress
	 */
	isInProgress(): boolean {
		return (
			this.status === PlanStatus.InProgress ||
			this.todos.some(t => t.status === TodoStatus.InProgress)
		);
	}

	/**
	 * Get summary
	 */
	getSummary(): string {
		const progress = this.getProgress();
		const total = this.todos.length;
		const completed = this.getCompletedCount();

		return `${this.title} - ${completed}/${total} tasks (${progress}%)`;
	}

	/**
	 * Convert to plain object
	 */
	toJSON(): any {
		return {
			id: this.id,
			title: this.title,
			description: this.description,
			status: this.status,
			priority: this.priority,
			todos: this.todos.map(t => t.toJSON()),
			metadata: this.metadata,
			progress: this.getProgress(),
			createdAt: this.createdAt.toISOString(),
			updatedAt: this.updatedAt.toISOString(),
			startedAt: this.startedAt?.toISOString(),
			completedAt: this.completedAt?.toISOString(),
		};
	}

	/**
	 * Create from JSON
	 */
	static fromJSON(data: any): Plan {
		const plan = new Plan(
			data.title,
			data.description,
			data.todos?.map((t: any) => Todo.fromJSON(t)) || [],
			data.status || PlanStatus.Pending,
			data.priority || PlanPriority.Medium,
			data.metadata || {},
		);

		plan.id = data.id;
		plan.createdAt = new Date(data.createdAt);
		plan.updatedAt = new Date(data.updatedAt);

		if (data.startedAt) {
			plan.startedAt = new Date(data.startedAt);
		}

		if (data.completedAt) {
			plan.completedAt = new Date(data.completedAt);
		}

		return plan;
	}
}
