/**
 * Interface for conversation history storage
 */

import { Message } from '../models/Message';

export interface ConversationHistory {
  id: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface IHistoryRepository {
  /**
   * Save a conversation
   */
  save(conversation: ConversationHistory): Promise<void>;

  /**
   * Load a conversation by ID
   */
  load(id: string): Promise<ConversationHistory | null>;

  /**
   * Load the latest conversation
   */
  loadLatest(): Promise<ConversationHistory | null>;

  /**
   * List all conversations
   */
  list(): Promise<ConversationHistory[]>;

  /**
   * Delete a conversation
   */
  delete(id: string): Promise<void>;

  /**
   * Clear all history
   */
  clear(): Promise<void>;

  /**
   * Add a message to the current conversation
   */
  addMessage(message: Message): Promise<void>;

  /**
   * Get recent messages
   */
  getRecentMessages(limit: number): Promise<Message[]>;

  /**
   * Start a new conversation
   */
  startNewConversation(): Promise<void>;
}
