/**
 * Conversation Domain Model
 * Represents a conversation with message history
 */

import { Message } from './Message';

export class Conversation {
  private messages: Message[] = [];

  constructor(
    public readonly id: string,
    public readonly createdAt: Date,
    initialMessages: Message[] = []
  ) {
    this.messages = [...initialMessages];
  }

  static create(): Conversation {
    return new Conversation(this.generateId(), new Date());
  }

  static fromHistory(id: string, createdAt: Date, messages: Message[]): Conversation {
    return new Conversation(id, createdAt, messages);
  }

  private static generateId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  addMessage(message: Message): void {
    this.messages.push(message);
  }

  getMessages(): ReadonlyArray<Message> {
    return this.messages;
  }

  getLastMessage(): Message | undefined {
    return this.messages[this.messages.length - 1];
  }

  getLastNMessages(n: number): ReadonlyArray<Message> {
    return this.messages.slice(-n);
  }

  getMessageCount(): number {
    return this.messages.length;
  }

  getUserMessages(): ReadonlyArray<Message> {
    return this.messages.filter((m) => m.isUser());
  }

  getAssistantMessages(): ReadonlyArray<Message> {
    return this.messages.filter((m) => m.isAssistant());
  }

  clear(): void {
    this.messages = [];
  }

  estimateTokenCount(): number {
    // Rough estimation: ~4 characters per token
    const totalChars = this.messages.reduce(
      (sum, msg) => sum + msg.content.length,
      0
    );
    return Math.ceil(totalChars / 4);
  }

  needsCompression(maxTokens: number): boolean {
    return this.estimateTokenCount() > maxTokens * 0.8;
  }

  toJSON(): object {
    return {
      id: this.id,
      createdAt: this.createdAt.toISOString(),
      messageCount: this.messages.length,
      messages: this.messages.map((m) => m.toJSON()),
    };
  }
}
