/**
 * Home Presenter (Enhanced với MVP pattern)
 * Handles business logic và state management cho Home screen
 */

import { CodehClient } from '../../core/application/CodehClient.js';
import type { Message } from '../../core/domain/models/Message.js';
import { Message as MessageModel } from '../../core/domain/models/Message.js';
import type { Command } from '../../core/domain/valueObjects/Command.js';
import type { ISessionManager } from '../../core/domain/interfaces/ISessionManager.js';
import type { ICommandRegistry } from '../../core/domain/interfaces/ICommandRegistry.js';
import { Session } from '../../core/domain/valueObjects/Session.js';

interface ViewState {
	// Input
	input: string;
	inputError: string;

	// Input History (for ↑↓ navigation)
	inputHistory: string[];
	currentHistoryIndex: number;

	// Messages
	messages: Message[];
	streamingMessageId: string | null;

	// Loading
	isLoading: boolean;

	// Slash Commands
	filteredSuggestions: Command[];
	selectedSuggestionIndex: number;

	// Help Overlay
	showHelp: boolean;

	// Stats
	totalTokens: number;
	estimatedCost: number;
	sessionDuration: number; // in seconds
	gitBranch?: string;

	// Info
	version: string;
	model: string;
	directory: string;
}

export class HomePresenterNew {
	private state: ViewState;
	private viewUpdateCallback?: () => void;
	private durationTimer?: NodeJS.Timeout;
	private sessionStartTime: number;

	constructor(
		private client: CodehClient,
		private commandRegistry: ICommandRegistry,
		public sessionManager: ISessionManager,
		private config: any,
	) {
		this.sessionStartTime = Date.now();

		// Initialize state
		this.state = {
			input: '',
			inputError: '',
			inputHistory: [],
			currentHistoryIndex: -1,
			messages: [],
			streamingMessageId: null,
			isLoading: false,
			filteredSuggestions: [],
			selectedSuggestionIndex: 0,
			showHelp: false,
			totalTokens: 0,
			estimatedCost: 0,
			sessionDuration: 0,
			gitBranch: this.getGitBranch(),
			version: config.version || '1.0.0',
			model: config.model || 'claude-3-5-sonnet',
			directory: process.cwd(),
		};

		// Start duration timer (update every second)
		this.startDurationTimer();
	}

	// === View Management ===

	setViewUpdateCallback(callback: () => void) {
		this.viewUpdateCallback = callback;
	}

	private _notifyView() {
		this.viewUpdateCallback?.();
	}

	// === Input Handlers ===

	handleInputChange = (value: string) => {
		this.state.input = value;
		this.state.inputError = '';

		// Filter suggestions if starts with /
		if (value.startsWith('/')) {
			this.state.filteredSuggestions = this.commandRegistry.filter(value);
			this.state.selectedSuggestionIndex = 0;
		} else {
			this.state.filteredSuggestions = [];
		}

		this._notifyView();
	};

	handleSubmit = async (userInput: string) => {
		// Validation
		if (!userInput.trim()) {
			this.state.inputError = 'Please enter a message';
			this._notifyView();
			return;
		}

		// Add to input history
		this.addToInputHistory(userInput);

		// Check if slash command
		if (userInput.startsWith('/')) {
			await this.handleCommand(userInput);
			return;
		}

		// Clear input
		this.state.input = '';

		// Add user message
		const userMessage = MessageModel.user(userInput);
		this.state.messages.push(userMessage);

		// Track streaming message
		let assistantMessageId = '';
		let assistantContent = '';

		// Set loading
		this.state.isLoading = true;
		this._notifyView();

		try {
			// Execute AI request with streaming
			const turn = await this.client.executeWithStreaming(
				userInput,
				(chunk: string) => {
					// Accumulate content
					assistantContent += chunk;

					// Find existing message or create new one
					const existingIndex = this.state.messages.findIndex(
						(m) => m.id === assistantMessageId,
					);

					// Create new message with updated content
					const updatedMessage = MessageModel.assistant(assistantContent);

					if (existingIndex >= 0) {
						// Replace existing message (maintain ID for streaming indicator)
						assistantMessageId = updatedMessage.id;
						this.state.streamingMessageId = updatedMessage.id;
						this.state.messages[existingIndex] = updatedMessage;
					} else {
						// First chunk - add new message
						assistantMessageId = updatedMessage.id;
						this.state.streamingMessageId = updatedMessage.id;
						this.state.messages.push(updatedMessage);
					}

					this._notifyView();
				},
			);

			if (turn.isComplete() && turn.response) {
				// Create final message with metadata
				const finalMessage = MessageModel.assistant(
					turn.response.content,
					turn.response.toolCalls,
				);

				// Update metadata if available
				if (turn.metadata?.tokenUsage) {
					(finalMessage as any).metadata = {
						...finalMessage.metadata,
						usage: {
							promptTokens: turn.metadata.tokenUsage.prompt,
							completionTokens: turn.metadata.tokenUsage.completion,
							totalTokens: turn.metadata.tokenUsage.total,
						},
					};

					// Update token stats
					this.updateTokenStats(turn.metadata.tokenUsage.total);
				}

				// Replace streaming message with final message
				const index = this.state.messages.findIndex(
					(m) => m.id === assistantMessageId,
				);
				if (index >= 0) {
					this.state.messages[index] = finalMessage;
				} else {
					this.state.messages.push(finalMessage);
				}
			} else {
				throw new Error('Failed to get response from AI');
			}
		} catch (error: any) {
			// Remove the streaming message if exists
			const index = this.state.messages.findIndex(
				(m) => m.id === assistantMessageId,
			);
			if (index >= 0) {
				this.state.messages.splice(index, 1);
			}

			// Add error message
			const errorMessage = MessageModel.error(error);
			this.state.messages.push(errorMessage);
		} finally {
			this.state.isLoading = false;
			this.state.streamingMessageId = null;
			this._notifyView();
		}
	};

	// === Command Handlers ===

	private async handleCommand(input: string) {
		const [cmd, ...args] = input.split(' ');

		// Find command
		const command = this.commandRegistry.get(cmd);

		if (!command) {
			this.state.inputError = `Unknown command: ${cmd}`;
			this._notifyView();
			return;
		}

		// Clear input
		this.state.input = '';
		this.state.filteredSuggestions = [];

		try {
			await command.execute(args, this);
		} catch (error: any) {
			const errorMessage = MessageModel.error(`Command error: ${error.message}`);
			this.state.messages.push(errorMessage);
		}

		this._notifyView();
	}

	// === Suggestion Handlers ===

	handleSuggestionNavigate = (direction: 'up' | 'down') => {
		const count = this.state.filteredSuggestions.length;
		if (count === 0) return;

		if (direction === 'up') {
			this.state.selectedSuggestionIndex =
				(this.state.selectedSuggestionIndex - 1 + count) % count;
		} else {
			this.state.selectedSuggestionIndex =
				(this.state.selectedSuggestionIndex + 1) % count;
		}

		this._notifyView();
	};

	handleSuggestionSelect = (): string | null => {
		const selected =
			this.state.filteredSuggestions[this.state.selectedSuggestionIndex];

		if (!selected) return null;

		// Auto-fill input
		this.state.input = selected.cmd + ' ';
		this.state.filteredSuggestions = [];

		this._notifyView();

		return selected.cmd;
	};

	hasSuggestions = (): boolean => {
		return this.state.filteredSuggestions.length > 0;
	};

	// === Conversation Management ===

	async clearConversation(): Promise<void> {
		this.state.messages = [];
		this._notifyView();
	}

	async startNewConversation(): Promise<void> {
		await this.clearConversation();
	}

	addSystemMessage(message: Message): void {
		this.state.messages.push(message);
		this._notifyView();
	}

	// === Session Management ===

	async saveSession(name: string): Promise<void> {
		const session = Session.create(name, this.state.messages, this.state.model);

		await this.sessionManager.save(session);
	}

	async loadSession(name: string): Promise<void> {
		const session = await this.sessionManager.load(name);

		this.state.messages = session.messages;
		this._notifyView();
	}

	// === Input History ===

	private addToInputHistory(input: string): void {
		// Don't add empty or duplicate inputs
		if (!input.trim()) return;
		if (this.state.inputHistory[0] === input) return;

		// Add to beginning of history
		this.state.inputHistory.unshift(input);

		// Limit to 50 items
		if (this.state.inputHistory.length > 50) {
			this.state.inputHistory = this.state.inputHistory.slice(0, 50);
		}

		// Reset index
		this.state.currentHistoryIndex = -1;
	}

	navigateHistory = (direction: 'up' | 'down'): void => {
		const history = this.state.inputHistory;
		if (history.length === 0) return;

		if (direction === 'up') {
			// Navigate to older inputs
			if (this.state.currentHistoryIndex < history.length - 1) {
				this.state.currentHistoryIndex++;
				this.state.input = history[this.state.currentHistoryIndex];
			}
		} else {
			// Navigate to newer inputs
			if (this.state.currentHistoryIndex > 0) {
				this.state.currentHistoryIndex--;
				this.state.input = history[this.state.currentHistoryIndex];
			} else if (this.state.currentHistoryIndex === 0) {
				// Go back to empty input
				this.state.currentHistoryIndex = -1;
				this.state.input = '';
			}
		}

		this._notifyView();
	};

	// === Help Overlay ===

	toggleHelp = (): void => {
		this.state.showHelp = !this.state.showHelp;
		this._notifyView();
	};

	// === Getters ===

	get input() {
		return this.state.input;
	}
	get inputError() {
		return this.state.inputError;
	}
	get messages() {
		return this.state.messages;
	}
	get isLoading() {
		return this.state.isLoading;
	}
	get filteredSuggestions() {
		return this.state.filteredSuggestions;
	}
	get selectedSuggestionIndex() {
		return this.state.selectedSuggestionIndex;
	}
	get version() {
		return this.state.version;
	}
	get model() {
		return this.state.model;
	}
	get directory() {
		return this.state.directory;
	}
	get streamingMessageId() {
		return this.state.streamingMessageId;
	}
	get showHelp() {
		return this.state.showHelp;
	}
	get totalTokens() {
		return this.state.totalTokens;
	}
	get estimatedCost() {
		return this.state.estimatedCost;
	}
	get sessionDuration() {
		return this.state.sessionDuration;
	}
	get gitBranch() {
		return this.state.gitBranch;
	}
	get messageCount() {
		return this.state.messages.length;
	}

	// === Stats Management ===

	private startDurationTimer(): void {
		// Update duration every second
		this.durationTimer = setInterval(() => {
			this.state.sessionDuration = Math.floor(
				(Date.now() - this.sessionStartTime) / 1000,
			);
			this._notifyView();
		}, 1000);
	}

	private updateTokenStats(tokens: number): void {
		this.state.totalTokens += tokens;

		// Estimate cost based on model
		// Simple pricing: $0.005 per 1K tokens (average)
		this.state.estimatedCost = (this.state.totalTokens / 1000) * 0.005;
	}

	private getGitBranch(): string | undefined {
		try {
			const { execSync } = require('child_process');
			const branch = execSync('git rev-parse --abbrev-ref HEAD', {
				encoding: 'utf8',
				stdio: ['pipe', 'pipe', 'ignore'],
			}).trim();
			return branch;
		} catch {
			return undefined;
		}
	}

	cleanup(): void {
		if (this.durationTimer) {
			clearInterval(this.durationTimer);
		}
	}
}
