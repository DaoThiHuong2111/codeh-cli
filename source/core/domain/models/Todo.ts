/**
 * Todo Domain Model
 * Represents a task or action item from AI responses
 */

export type TodoStatus = 'pending' | 'in_progress' | 'completed';

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
			options?.status || 'pending',
			new Date(),
			options?.metadata,
		);
	}

	static pending(content: string): Todo {
		return this.create(content, { status: 'pending' });
	}

	static inProgress(content: string): Todo {
		return this.create(content, { status: 'in_progress' });
	}

	static completed(content: string): Todo {
		return this.create(content, { status: 'completed' });
	}

	private static generateId(): string {
		return `todo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	// Status checkers
	isPending(): boolean {
		return this.status === 'pending';
	}

	isInProgress(): boolean {
		return this.status === 'in_progress';
	}

	isCompleted(): boolean {
		return this.status === 'completed';
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
		return this.withStatus('completed');
	}

	// Mark as in progress
	start(): Todo {
		return this.withStatus('in_progress');
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
}
