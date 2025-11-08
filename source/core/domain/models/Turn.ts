/**
 * Turn Domain Model
 * Represents one request-response cycle in a conversation
 */

import { Message } from './Message';
import { ToolCall } from '../interfaces/IApiClient';

export interface TurnMetadata {
  duration?: number;
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
  model?: string;
  finishReason?: string;
}

export class Turn {
  constructor(
    public readonly id: string,
    public readonly request: Message,
    public readonly response: Message | null,
    public readonly toolCalls: ToolCall[] = [],
    public readonly metadata: TurnMetadata = {},
    public readonly createdAt: Date = new Date()
  ) {}

  static create(request: Message): Turn {
    return new Turn(this.generateId(), request, null);
  }

  private static generateId(): string {
    return `turn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  withResponse(response: Message): Turn {
    return new Turn(
      this.id,
      this.request,
      response,
      this.toolCalls,
      this.metadata,
      this.createdAt
    );
  }

  withToolCalls(toolCalls: ToolCall[]): Turn {
    return new Turn(
      this.id,
      this.request,
      this.response,
      toolCalls,
      this.metadata,
      this.createdAt
    );
  }

  withMetadata(metadata: Partial<TurnMetadata>): Turn {
    return new Turn(
      this.id,
      this.request,
      this.response,
      this.toolCalls,
      { ...this.metadata, ...metadata },
      this.createdAt
    );
  }

  isComplete(): boolean {
    return this.response !== null;
  }

  hasToolCalls(): boolean {
    return this.toolCalls.length > 0;
  }

  getDuration(): number | undefined {
    return this.metadata.duration;
  }

  getTokenUsage(): TurnMetadata['tokenUsage'] {
    return this.metadata.tokenUsage;
  }

  toJSON(): object {
    return {
      id: this.id,
      request: this.request.toJSON(),
      response: this.response?.toJSON(),
      toolCalls: this.toolCalls,
      metadata: this.metadata,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
