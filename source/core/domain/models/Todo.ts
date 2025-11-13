/**
 * Todo Domain Model
 * Represents a task or action item from AI responses
 */

export enum TodoStatus {
	Pending = 'pending',
	InProgress = 'in_progress',
	Completed = 'completed',
}

export class Todo {
	constructor(
		public readonly id: string,
		public readonly content: string,
		public readonly status: TodoStatus,
		public readonly timestamp: Date,
		public readonly metadata?: Record<string, any>,
	) {}

	static create(
		content: string,
		options?: {
			status?: TodoStatus;
			metadata?: Record<string, any>;
		},
	): Todo {
		return new Todo(
			this.generateId(),
			content,
			options?.status || TodoStatus.Pending,
			new Date(),
			options?.metadata,
		);
	}

	static pending(content: string): Todo {
		return this.create(content, {status: TodoStatus.Pending});
	}

	static inProgress(content: string): Todo {
		return this.create(content, {status: TodoStatus.InProgress});
	}

	static completed(content: string): Todo {
		return this.create(content, {status: TodoStatus.Completed});
	}

	private static generateId(): string {
		return `todo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	// Status checkers
	isPending(): boolean {
		return this.status === TodoStatus.Pending;
	}

	isInProgress(): boolean {
		return this.status === TodoStatus.InProgress;
	}

	isCompleted(): boolean {
		return this.status === TodoStatus.Completed;
	}

	// Create new instance with updated status (immutability)
	withStatus(newStatus: TodoStatus): Todo {
		return new Todo(
			this.id,
			this.content,
			newStatus,
			this.timestamp,
			this.metadata,
		);
	}

	// Mark as completed
	complete(): Todo {
		return this.withStatus(TodoStatus.Completed);
	}

	// Mark as in progress
	start(): Todo {
		return this.withStatus(TodoStatus.InProgress);
	}

	toJSON(): object {
		return {
			id: this.id,
			content: this.content,
			status: this.status,
			timestamp: this.timestamp.toISOString(),
			metadata: this.metadata,
		};
	}

	static fromJSON(data: any): Todo {
		return new Todo(
			data.id,
			data.content,
			data.status,
			new Date(data.timestamp),
			data.metadata,
		);
	}
}
