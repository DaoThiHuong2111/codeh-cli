/**
 * Tool Execution Context Value Object
 * Encapsulates all context needed for tool execution pipeline
 */

import {ToolCall} from '../interfaces/IApiClient';
import {ToolExecutionResult} from '../interfaces/IToolExecutor';

export type ToolExecutionStatus =
	| 'pending'
	| 'awaiting_permission'
	| 'approved'
	| 'rejected'
	| 'executing'
	| 'completed'
	| 'failed';

export class ToolExecutionContext {
	constructor(
		public readonly id: string,
		public readonly toolCall: ToolCall,
		public readonly status: ToolExecutionStatus,
		public readonly result?: ToolExecutionResult,
		public readonly error?: string,
		public readonly permissionGrantedAt?: Date,
		public readonly executionStartedAt?: Date,
		public readonly executionCompletedAt?: Date,
		public readonly metadata?: Record<string, any>,
	) {}

	static create(toolCall: ToolCall): ToolExecutionContext {
		return new ToolExecutionContext(
			this.generateId(),
			toolCall,
			'pending',
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			{createdAt: new Date()},
		);
	}

	private static generateId(): string {
		return `tool_ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	withStatus(status: ToolExecutionStatus): ToolExecutionContext {
		return new ToolExecutionContext(
			this.id,
			this.toolCall,
			status,
			this.result,
			this.error,
			this.permissionGrantedAt,
			this.executionStartedAt,
			this.executionCompletedAt,
			this.metadata,
		);
	}

	withPermissionGranted(): ToolExecutionContext {
		return new ToolExecutionContext(
			this.id,
			this.toolCall,
			'approved',
			this.result,
			this.error,
			new Date(),
			this.executionStartedAt,
			this.executionCompletedAt,
			this.metadata,
		);
	}

	withPermissionRejected(): ToolExecutionContext {
		return new ToolExecutionContext(
			this.id,
			this.toolCall,
			'rejected',
			this.result,
			this.error,
			this.permissionGrantedAt,
			this.executionStartedAt,
			this.executionCompletedAt,
			this.metadata,
		);
	}

	withExecutionStarted(): ToolExecutionContext {
		return new ToolExecutionContext(
			this.id,
			this.toolCall,
			'executing',
			this.result,
			this.error,
			this.permissionGrantedAt,
			new Date(),
			this.executionCompletedAt,
			this.metadata,
		);
	}

	withResult(result: ToolExecutionResult): ToolExecutionContext {
		return new ToolExecutionContext(
			this.id,
			this.toolCall,
			result.success ? 'completed' : 'failed',
			result,
			result.error,
			this.permissionGrantedAt,
			this.executionStartedAt,
			new Date(),
			this.metadata,
		);
	}

	withError(error: string): ToolExecutionContext {
		return new ToolExecutionContext(
			this.id,
			this.toolCall,
			'failed',
			this.result,
			error,
			this.permissionGrantedAt,
			this.executionStartedAt,
			new Date(),
			this.metadata,
		);
	}

	withMetadata(metadata: Record<string, any>): ToolExecutionContext {
		return new ToolExecutionContext(
			this.id,
			this.toolCall,
			this.status,
			this.result,
			this.error,
			this.permissionGrantedAt,
			this.executionStartedAt,
			this.executionCompletedAt,
			{...this.metadata, ...metadata},
		);
	}

	isPending(): boolean {
		return this.status === 'pending';
	}

	isAwaitingPermission(): boolean {
		return this.status === 'awaiting_permission';
	}

	isApproved(): boolean {
		return this.status === 'approved';
	}

	isRejected(): boolean {
		return this.status === 'rejected';
	}

	isExecuting(): boolean {
		return this.status === 'executing';
	}

	isCompleted(): boolean {
		return this.status === 'completed';
	}

	isFailed(): boolean {
		return this.status === 'failed';
	}

	isFinished(): boolean {
		return this.isCompleted() || this.isFailed() || this.isRejected();
	}

	getExecutionDuration(): number | undefined {
		if (this.executionStartedAt && this.executionCompletedAt) {
			return (
				this.executionCompletedAt.getTime() - this.executionStartedAt.getTime()
			);
		}
		return undefined;
	}

	toJSON(): object {
		return {
			id: this.id,
			toolCall: this.toolCall,
			status: this.status,
			result: this.result,
			error: this.error,
			permissionGrantedAt: this.permissionGrantedAt?.toISOString(),
			executionStartedAt: this.executionStartedAt?.toISOString(),
			executionCompletedAt: this.executionCompletedAt?.toISOString(),
			metadata: this.metadata,
		};
	}
}
