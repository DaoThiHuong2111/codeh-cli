/**
 * Codeh Chat - Conversation Manager
 * Manages conversation flow and context
 */

import { Conversation } from '../domain/models/Conversation';
import { Message } from '../domain/models/Message';
import { IHistoryRepository } from '../domain/interfaces/IHistoryRepository';

export class CodehChat {
  private conversation: Conversation;

  constructor(private historyRepo: IHistoryRepository) {
    this.conversation = Conversation.create();
  }

  /**
   * Send a message and get response
   */
  async sendMessage(content: string): Promise<Message> {
    const userMessage = Message.user(content);
    this.conversation.addMessage(userMessage);

    // Save to history
    await this.historyRepo.addMessage(userMessage);

    return userMessage;
  }

  /**
   * Add assistant response
   */
  async addResponse(content: string): Promise<Message> {
    const assistantMessage = Message.assistant(content);
    this.conversation.addMessage(assistantMessage);

    // Save to history
    await this.historyRepo.addMessage(assistantMessage);

    return assistantMessage;
  }

  /**
   * Get conversation history
   */
  getHistory(): ReadonlyArray<Message> {
    return this.conversation.getMessages();
  }

  /**
   * Get last N messages
   */
  getLastMessages(n: number): ReadonlyArray<Message> {
    return this.conversation.getLastNMessages(n);
  }

  /**
   * Clear conversation
   */
  async clear(): Promise<void> {
    this.conversation.clear();
    await this.historyRepo.clear();
  }

  /**
   * Start new conversation
   */
  async startNew(): Promise<void> {
    this.conversation = Conversation.create();
    await this.historyRepo.startNewConversation();
  }

  /**
   * Load conversation from history
   */
  async loadFromHistory(conversationId: string): Promise<void> {
    const history = await this.historyRepo.load(conversationId);

    if (history) {
      this.conversation = Conversation.fromHistory(
        history.id,
        history.createdAt,
        history.messages.map(
          (m: any) =>
            new Message(
              m.id || `msg_${Date.now()}`,
              m.role,
              m.content,
              new Date(m.timestamp || Date.now())
            )
        )
      );
    }
  }

  /**
   * Get conversation stats
   */
  getStats() {
    return {
      messageCount: this.conversation.getMessageCount(),
      userMessages: this.conversation.getUserMessages().length,
      assistantMessages: this.conversation.getAssistantMessages().length,
      estimatedTokens: this.conversation.estimateTokenCount(),
    };
  }

  /**
   * Check if conversation needs compression
   */
  needsCompression(maxTokens: number): boolean {
    return this.conversation.needsCompression(maxTokens);
  }

  /**
   * Get conversation
   */
  getConversation(): Conversation {
    return this.conversation;
  }
}
