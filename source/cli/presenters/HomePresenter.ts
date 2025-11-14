/**
 * Home Presenter (Enhanced với MVP pattern)
 * Handles business logic và state management cho Home screen
 */

import {CodehClient} from '../../core/application/CodehClient.js';
import type {Message} from '../../core/domain/models/Message.js';
import {Message as MessageModel} from '../../core/domain/models/Message.js';
import type {Todo} from '../../core/domain/models/Todo.js';
import type {Command} from '../../core/domain/valueObjects/Command.js';
import type {ISessionManager, SessionInfo} from '../../core/domain/interfaces/ISessionManager.js';
import type {ICommandRegistry} from '../../core/domain/interfaces/ICommandRegistry.js';
import {Session} from '../../core/domain/models/Session.js';
import {WorkflowManager} from '../../core/application/services/WorkflowManager.js';
import {InputHistoryService} from '../../core/application/services/InputHistoryService.js';
import {formatRelativeTime} from '../../utils/timeFormat.js';
import type {FormattedSession} from '../components/organisms/SessionSelector.js';

interface ViewState {
	// Input
	input: string;
	inputError: string;

	// Session (replaces messages array)
	session: Session;
	streamingMessageId: string | null;

	// Loading
	isLoading: boolean;

	// Slash Commands
	filteredSuggestions: Command[];
	selectedSuggestionIndex: number;

	// Session Selector (interactive /sessions UI)
	showSessionSelector: boolean;
	availableSessions: FormattedSession[];
	selectedSessionIndex: number;

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

export class HomePresenter {
	private state: ViewState;
	private viewUpdateCallback?: () => void;
	private durationTimer?: NodeJS.Timeout;
	private sessionStartTime: number;

	constructor(
		private client: CodehClient,
		private commandRegistry: ICommandRegistry,
		public sessionManager: ISessionManager,
		private config: any,
		private inputHistory: InputHistoryService,
		private workflowManager?: WorkflowManager,
	) {
		this.sessionStartTime = Date.now();

		// Initialize state
		this.state = {
			input: '',
			inputError: '',
			session: Session.createNew(config.model || 'claude-3-5-sonnet'),
			streamingMessageId: null,
			isLoading: false,
			filteredSuggestions: [],
			selectedSuggestionIndex: 0,
			showSessionSelector: false,
			availableSessions: [],
			selectedSessionIndex: 0,
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
		this.inputHistory.add(userInput);

		// Check if slash command
		if (userInput.startsWith('/')) {
			await this.handleCommand(userInput);
			return;
		}

		// Clear input
		this.state.input = '';

		// Add user message to session
		const userMessage = MessageModel.user(userInput);
		this.state.session.addMessage(userMessage);

		// Track streaming message - Create ID once for consistency
		const assistantMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

					// Get messages array from session
					const messages = this.state.session.getMessages() as Message[];

					// Find existing message or create new one
					const existingIndex = messages.findIndex(
						m => m.id === assistantMessageId,
					);

					// Create new message with updated content using consistent ID
					const updatedMessage = new MessageModel(
						assistantMessageId, // Fixed ID for all chunks
						'assistant',
						assistantContent,
						new Date(),
					);

					if (existingIndex >= 0) {
						// Replace existing message with same ID (direct manipulation OK for streaming)
						(messages as any)[existingIndex] = updatedMessage;
					} else {
						// First chunk - add new message via session
						this.state.streamingMessageId = assistantMessageId;
						this.state.session.addMessage(updatedMessage);
					}

					this._notifyView();
				},
			);

			if (turn.isComplete() && turn.response) {
				// Create final message with metadata (no mutation!)
				const finalMessage = MessageModel.create(
					'assistant',
					turn.response.content,
					{
						toolCalls: turn.response.toolCalls,
						metadata: turn.metadata?.tokenUsage
							? {
									usage: {
										promptTokens: turn.metadata.tokenUsage.prompt,
										completionTokens: turn.metadata.tokenUsage.completion,
										totalTokens: turn.metadata.tokenUsage.total,
									},
								}
							: undefined,
					},
				);

				// Update token stats
				if (turn.metadata?.tokenUsage) {
					this.updateTokenStats(turn.metadata.tokenUsage.total);
				}

				// Replace streaming message with final message
				const messages = this.state.session.getMessages() as Message[];
				const index = messages.findIndex(
					m => m.id === assistantMessageId,
				);
				if (index >= 0) {
					(messages as any)[index] = finalMessage;
				} else {
					this.state.session.addMessage(finalMessage);
				}
			} else {
				throw new Error('Failed to get response from AI');
			}
		} catch (error: any) {
			// Remove the streaming message if exists
			const messages = this.state.session.getMessages() as Message[];
			const index = messages.findIndex(
				m => m.id === assistantMessageId,
			);
			if (index >= 0) {
				(messages as any).splice(index, 1);
			}

			// Add error message
			const errorMessage = MessageModel.error(error);
			this.state.session.addMessage(errorMessage);
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
			const errorMessage = MessageModel.error(
				`Command error: ${error.message}`,
			);
			this.state.session.addMessage(errorMessage);
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

	// === Session Management ===

	/**
	 * Auto-save current session with timestamp name (if not empty)
	 * Returns the saved session name or 'empty' if skipped
	 */
	async autoSaveCurrentSession(): Promise<string> {
		// Skip if session is empty
		if (this.state.session.getMessageCount() === 0) {
			return 'empty';
		}

		// Update metadata before saving
		this.state.session.updateMetadata();

		// Save with auto-generated timestamp name
		const savedName = await this.sessionManager.saveWithTimestamp(
			this.state.session,
		);

		return savedName;
	}

	/**
	 * Start a new empty session
	 */
	async startNewSession(): Promise<void> {
		this.state.session = Session.createNew(this.state.model);
		this._notifyView();
	}

	/**
	 * Add a system message to current session
	 */
	addSystemMessage(message: Message): void {
		this.state.session.addMessage(message);
		this._notifyView();
	}

	/**
	 * Load a session by name
	 */
	async loadSession(name: string): Promise<void> {
		const session = await this.sessionManager.load(name);
		this.state.session = session;
		this._notifyView();
	}

	/**
	 * Show interactive session selector
	 */
	async showSessionSelector(): Promise<void> {
		// Get all sessions
		const sessions = await this.sessionManager.list();

		// Format with relative time
		const formattedSessions: FormattedSession[] = sessions.map(s => ({
			...s,
			relativeTime: formatRelativeTime(s.updatedAt),
		}));

		// Update state
		this.state.showSessionSelector = true;
		this.state.availableSessions = formattedSessions;
		this.state.selectedSessionIndex = 0;
		this._notifyView();
	}

	/**
	 * Navigate session selector (↑↓)
	 */
	navigateSessionSelector(direction: 'up' | 'down'): void {
		const max = this.state.availableSessions.length - 1;
		if (direction === 'up') {
			this.state.selectedSessionIndex = Math.max(
				0,
				this.state.selectedSessionIndex - 1,
			);
		} else {
			this.state.selectedSessionIndex = Math.min(
				max,
				this.state.selectedSessionIndex + 1,
			);
		}
		this._notifyView();
	}

	/**
	 * Load the selected session (Enter key)
	 */
	async loadSelectedSession(): Promise<void> {
		const selected =
			this.state.availableSessions[this.state.selectedSessionIndex];
		if (selected) {
			await this.loadSession(selected.name);
			this.closeSessionSelector();

			// Show system message
			const msg = MessageModel.system(
				`Session "${selected.name}" loaded (${selected.messageCount} messages)`,
			);
			this.addSystemMessage(msg);
		}
	}

	/**
	 * Close session selector (ESC key)
	 */
	closeSessionSelector(): void {
		this.state.showSessionSelector = false;
		this.state.availableSessions = [];
		this.state.selectedSessionIndex = 0;
		this._notifyView();
	}

	// === Input History ===

	navigateHistory = (direction: 'up' | 'down'): void => {
		const result =
			direction === 'up'
				? this.inputHistory.navigateUp()
				: this.inputHistory.navigateDown();

		if (result !== null) {
			this.state.input = result;
			this._notifyView();
		}
	};

	// === Getters ===

	get input() {
		return this.state.input;
	}
	get inputError() {
		return this.state.inputError;
	}
	get messages() {
		return this.state.session.getMessages();
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
		return this.state.session.getMessageCount();
	}

	get session() {
		return this.state.session;
	}

	get showSessionSelector() {
		return this.state.showSessionSelector;
	}

	get availableSessions() {
		return this.state.availableSessions;
	}

	get selectedSessionIndex() {
		return this.state.selectedSessionIndex;
	}

	/**
	 * Get todos from WorkflowManager (single source of truth)
	 * No duplication - todos are managed by WorkflowManager and displayed here
	 */
	get todos(): Todo[] {
		if (!this.workflowManager) {
			return [];
		}

		const currentPlan = this.workflowManager.getCurrentPlan();
		return currentPlan?.todos || [];
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
			const {execSync} = require('child_process');
			const branch = execSync('git rev-parse --abbrev-ref HEAD', {
				encoding: 'utf8',
				stdio: ['pipe', 'pipe', 'ignore'],
			}).trim();
			return branch;
		} catch {
			return undefined;
		}
	}

	async cleanup(): Promise<void> {
		// Auto-save session before exit
		await this.autoSaveCurrentSession();

		// Clear timer
		if (this.durationTimer) {
			clearInterval(this.durationTimer);
		}
	}
}
