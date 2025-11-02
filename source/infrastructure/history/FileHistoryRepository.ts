/**
 * File-based History Repository
 * Stores conversation history in ~/.codeh/history/
 */

import {
  IHistoryRepository,
  ConversationHistory,
} from '../../core/domain/interfaces/IHistoryRepository';
import { Message } from '../../core/domain/interfaces/IApiClient';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

export class FileHistoryRepository implements IHistoryRepository {
  private historyDir: string;
  private currentConversationId?: string;

  constructor(historyPath?: string) {
    this.historyDir =
      historyPath || join(homedir(), '.codeh', 'history');
    this.ensureHistoryDir();
  }

  private ensureHistoryDir(): void {
    if (!existsSync(this.historyDir)) {
      mkdirSync(this.historyDir, { recursive: true });
    }
  }

  private getFilePath(id: string): string {
    return join(this.historyDir, `${id}.json`);
  }

  async save(conversation: ConversationHistory): Promise<void> {
    try {
      const filePath = this.getFilePath(conversation.id);
      const data = {
        id: conversation.id,
        messages: conversation.messages,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
        metadata: conversation.metadata,
      };

      writeFileSync(filePath, JSON.stringify(data, null, 2));
      this.currentConversationId = conversation.id;
    } catch (error: any) {
      console.error('Error saving conversation:', error.message);
      throw error;
    }
  }

  async load(id: string): Promise<ConversationHistory | null> {
    try {
      const filePath = this.getFilePath(id);

      if (!existsSync(filePath)) {
        return null;
      }

      const data = JSON.parse(readFileSync(filePath, 'utf8'));

      return {
        id: data.id,
        messages: data.messages,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        metadata: data.metadata,
      };
    } catch (error: any) {
      console.error('Error loading conversation:', error.message);
      return null;
    }
  }

  async loadLatest(): Promise<ConversationHistory | null> {
    try {
      const conversations = await this.list();

      if (conversations.length === 0) {
        return null;
      }

      // Sort by updatedAt descending
      conversations.sort(
        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
      );

      return conversations[0];
    } catch (error: any) {
      console.error('Error loading latest conversation:', error.message);
      return null;
    }
  }

  async list(): Promise<ConversationHistory[]> {
    try {
      const files = readdirSync(this.historyDir).filter((f) =>
        f.endsWith('.json')
      );

      const conversations: ConversationHistory[] = [];

      for (const file of files) {
        const id = file.replace('.json', '');
        const conversation = await this.load(id);
        if (conversation) {
          conversations.push(conversation);
        }
      }

      return conversations;
    } catch (error: any) {
      console.error('Error listing conversations:', error.message);
      return [];
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const filePath = this.getFilePath(id);
      if (existsSync(filePath)) {
        const fs = await import('fs/promises');
        await fs.unlink(filePath);

        if (this.currentConversationId === id) {
          this.currentConversationId = undefined;
        }
      }
    } catch (error: any) {
      console.error('Error deleting conversation:', error.message);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      const files = readdirSync(this.historyDir).filter((f) =>
        f.endsWith('.json')
      );

      const fs = await import('fs/promises');
      for (const file of files) {
        await fs.unlink(join(this.historyDir, file));
      }

      this.currentConversationId = undefined;
    } catch (error: any) {
      console.error('Error clearing history:', error.message);
      throw error;
    }
  }

  async addMessage(message: Message): Promise<void> {
    try {
      let conversation: ConversationHistory;

      if (this.currentConversationId) {
        const existing = await this.load(this.currentConversationId);
        if (existing) {
          conversation = {
            ...existing,
            messages: [...existing.messages, message],
            updatedAt: new Date(),
          };
        } else {
          // Current conversation was deleted, create new one
          conversation = this.createNewConversation([message]);
        }
      } else {
        // No current conversation, create new one
        conversation = this.createNewConversation([message]);
      }

      await this.save(conversation);
    } catch (error: any) {
      console.error('Error adding message:', error.message);
      throw error;
    }
  }

  async getRecentMessages(limit: number): Promise<Message[]> {
    try {
      const latest = await this.loadLatest();

      if (!latest) {
        return [];
      }

      return latest.messages.slice(-limit);
    } catch (error: any) {
      console.error('Error getting recent messages:', error.message);
      return [];
    }
  }

  private createNewConversation(messages: Message[]): ConversationHistory {
    const now = new Date();
    return {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      messages,
      createdAt: now,
      updatedAt: now,
      metadata: {},
    };
  }

  // Additional utility methods
  async getCurrentConversationId(): Promise<string | undefined> {
    return this.currentConversationId;
  }

  async startNewConversation(): Promise<void> {
    const conversation = this.createNewConversation([]);
    await this.save(conversation);
  }

  getHistoryDir(): string {
    return this.historyDir;
  }
}
