/**
 * Codeh Client - Main Orchestrator
 * Coordinates all application operations
 */

import { IApiClient } from '../domain/interfaces/IApiClient';
import { IHistoryRepository } from '../domain/interfaces/IHistoryRepository';
import { Turn } from '../domain/models/Turn';
import { Message } from '../domain/models/Message';
import { InputClassifier } from './services/InputClassifier';
import { OutputFormatter } from './services/OutputFormatter';

export class CodehClient {
  private inputClassifier: InputClassifier;
  private outputFormatter: OutputFormatter;

  constructor(
    private apiClient: IApiClient,
    private historyRepo: IHistoryRepository
  ) {
    this.inputClassifier = new InputClassifier();
    this.outputFormatter = new OutputFormatter();
  }

  /**
   * Execute a user input and return a Turn
   */
  async execute(input: string): Promise<Turn> {
    const startTime = Date.now();

    // Validate input
    const validation = this.inputClassifier.validate(input);
    if (!validation.valid) {
      const errorMessage = validation.errors.join('\n');
      const requestMsg = Message.user(input);
      const responseMsg = Message.assistant(
        `❌ Input validation failed:\n${errorMessage}`
      );

      return Turn.create(requestMsg)
        .withResponse(responseMsg)
        .withMetadata({ duration: Date.now() - startTime });
    }

    // Create request message
    const requestMsg = Message.user(input);

    // Get history for context
    const recentMessages = await this.historyRepo.getRecentMessages(10);

    // Call AI API
    try {
      const apiResponse = await this.apiClient.chat({
        messages: [
          ...recentMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          { role: 'user', content: input },
        ],
      });

      // Create response message
      const responseMsg = Message.assistant(apiResponse.content);

      // Save to history
      await this.historyRepo.addMessage(requestMsg);
      await this.historyRepo.addMessage(responseMsg);

      // Create turn with metadata
      return Turn.create(requestMsg)
        .withResponse(responseMsg)
        .withMetadata({
          duration: Date.now() - startTime,
          tokenUsage: apiResponse.usage
            ? {
                prompt: apiResponse.usage.promptTokens,
                completion: apiResponse.usage.completionTokens,
                total: apiResponse.usage.totalTokens,
              }
            : undefined,
          model: apiResponse.model,
          finishReason: apiResponse.finishReason,
        });
    } catch (error: any) {
      const errorMsg = Message.assistant(
        `❌ Error: ${error.message}`
      );

      return Turn.create(requestMsg)
        .withResponse(errorMsg)
        .withMetadata({
          duration: Date.now() - startTime,
        });
    }
  }

  /**
   * Stream a response
   */
  async *executeStream(input: string): AsyncGenerator<string, Turn, void> {
    const startTime = Date.now();

    // Validate input
    const validation = this.inputClassifier.validate(input);
    if (!validation.valid) {
      const errorMessage = validation.errors.join('\n');
      yield `❌ Input validation failed:\n${errorMessage}`;

      const requestMsg = Message.user(input);
      const responseMsg = Message.assistant(
        `❌ Input validation failed:\n${errorMessage}`
      );

      return Turn.create(requestMsg)
        .withResponse(responseMsg)
        .withMetadata({ duration: Date.now() - startTime });
    }

    // Create request message
    const requestMsg = Message.user(input);

    // Get history for context
    const recentMessages = await this.historyRepo.getRecentMessages(10);

    let fullResponse = '';

    try {
      await this.apiClient.streamChat(
        {
          messages: [
            ...recentMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            { role: 'user', content: input },
          ],
        },
        (chunk) => {
          if (chunk.content) {
            fullResponse += chunk.content;
          }
        }
      );

      // Create response message
      const responseMsg = Message.assistant(fullResponse);

      // Save to history
      await this.historyRepo.addMessage(requestMsg);
      await this.historyRepo.addMessage(responseMsg);

      return Turn.create(requestMsg)
        .withResponse(responseMsg)
        .withMetadata({
          duration: Date.now() - startTime,
        });
    } catch (error: any) {
      yield `❌ Error: ${error.message}`;

      const errorMsg = Message.assistant(`❌ Error: ${error.message}`);

      return Turn.create(requestMsg)
        .withResponse(errorMsg)
        .withMetadata({
          duration: Date.now() - startTime,
        });
    }
  }

  /**
   * Get API client
   */
  getApiClient(): IApiClient {
    return this.apiClient;
  }

  /**
   * Get history repository
   */
  getHistoryRepository(): IHistoryRepository {
    return this.historyRepo;
  }
}
