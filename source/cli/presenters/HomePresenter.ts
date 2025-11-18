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
import {getLogger, type ILogger} from '../../infrastructure/logging/Logger.js';
import type {ToolExecutionProgressEvent} from '../../core/application/ToolExecutionOrchestrator.js';
import type {ISandboxModeManager} from '../../core/domain/interfaces/ISandboxModeManager.js';
import {execSync} from 'child_process';

const logger = getLogger();

interface ViewState {
	// Input
	input: string;
	inputError: string;

	// Session (replaces messages array)
	session: Session;
	streamingMessageId: string | null;

	// Loading
	isLoading: boolean;

	// Tool Execution Progress
	toolExecutionProgress: {
		isExecuting: boolean;
		currentIteration?: number;
		maxIterations?: number;
		currentTool?: string;
		toolArguments?: Record<string, any>;
		toolOutput?: string;
		toolIndex?: number;
		totalTools?: number;
		message?: string;
	};

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
	private logger: ILogger;

	constructor(
		private client: CodehClient,
		private commandRegistry: ICommandRegistry,
		public sessionManager: ISessionManager,
		private config: any,
		private inputHistory: InputHistoryService,
		private workflowManager?: WorkflowManager,
		private sandboxModeManager?: ISandboxModeManager,
	) {
		this.logger = logger;
		this.sessionStartTime = Date.now();

		// Initialize state
		const initialSession = Session.createNew(config.model || 'claude-3-5-sonnet');
		this.state = {
			input: '',
			inputError: '',
			session: initialSession,
			streamingMessageId: null,
			isLoading: false,
			toolExecutionProgress: {
				isExecuting: false,
			},
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

		// Set logger session ID
		if (this.logger.setSessionId) {
			this.logger.setSessionId(initialSession.id);
		}

		logger.info('HomePresenter', 'constructor', 'Presenter initialized', {
			session_id: initialSession.id,
			model: this.state.model,
			directory: this.state.directory,
		});

		// Start duration timer (update every second)
		this.startDurationTimer();

		// Check sandbox availability (Dockerfile detection)
		this.checkSandboxAvailability();
	}

	/**
	 * Check if sandbox (Docker) is available in current directory
	 * This checks for Dockerfile existence and Docker availability
	 */
	private async checkSandboxAvailability(): Promise<void> {
		if (!this.sandboxModeManager) {
			return;
		}

		try {
			const available = await this.sandboxModeManager.checkAvailability(process.cwd());
			this.logger.info('HomePresenter', 'checkSandboxAvailability', 'Sandbox availability checked', {
				available,
				cwd: process.cwd(),
			});
		} catch (error) {
			this.logger.error('HomePresenter', 'checkSandboxAvailability', 'Failed to check sandbox availability', {
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	// === View Management ===

	setViewUpdateCallback(callback: () => void) {
		this.logger.debug('HomePresenter', 'setViewUpdateCallback', 'View callback registered');
		this.viewUpdateCallback = callback;
	}

	private _notifyView() {
		this.logger.debug('HomePresenter', '_notifyView', 'Notifying view update');
		this.viewUpdateCallback?.();
	}

	// === Tool Execution Progress Handlers ===

	private handleToolProgress = (event: ToolExecutionProgressEvent) => {
		this.logger.debug('HomePresenter', 'handleToolProgress', 'Tool progress event', {
			type: event.type,
			iteration: event.iteration,
			tool: event.toolName,
		});

		switch (event.type) {
			case 'iteration_start':
				this.state.toolExecutionProgress = {
					isExecuting: true,
					currentIteration: event.iteration,
					maxIterations: event.maxIterations,
					message: `Iteration ${event.iteration}/${event.maxIterations}`,
					// Clear previous tool info when starting new iteration
					currentTool: undefined,
					toolArguments: undefined,
					toolOutput: undefined,
				};
				break;

			case 'tools_detected':
				this.state.toolExecutionProgress = {
					...this.state.toolExecutionProgress,
					isExecuting: true,
					totalTools: event.totalTools,
					message: `Detected ${event.totalTools} tool(s) to execute`,
				};
				break;

			case 'tool_executing':
				this.state.toolExecutionProgress = {
					...this.state.toolExecutionProgress,
					isExecuting: true,
					currentTool: event.toolName,
					toolArguments: event.toolArguments,
					toolOutput: undefined, // Clear previous output
					toolIndex: event.toolIndex,
					totalTools: event.totalTools,
					message: `Executing ${event.toolName} (${event.toolIndex}/${event.totalTools})`,
				};
				break;

			case 'tool_completed':
				this.state.toolExecutionProgress = {
					...this.state.toolExecutionProgress,
					isExecuting: false, // Set to false để hiển thị completed state
					currentTool: event.toolName,
					toolArguments: event.toolArguments,
					toolOutput: event.toolOutput,
					message: `Completed ${event.toolName} (${event.toolIndex}/${event.totalTools})`,
				};
				break;

			case 'tool_failed':
				this.state.toolExecutionProgress = {
					...this.state.toolExecutionProgress,
					isExecuting: false, // Set to false để hiển thị failed state
					currentTool: event.toolName,
					toolArguments: event.toolArguments,
					toolOutput: event.toolOutput, // Error message as output
					message: `Failed ${event.toolName}: ${event.message}`,
				};
				break;

			case 'orchestration_complete':
				this.state.toolExecutionProgress = {
					isExecuting: false,
					message: event.message,
				};
				break;
		}

		this._notifyView();
	};

	// === Input Handlers ===

	handleInputChange = (value: string) => {
		this.logger.debug('HomePresenter', 'handleInputChange', 'Input changed', {
			value_length: value.length,
			is_command: value.startsWith('/'),
		});

		this.state.input = value;
		this.state.inputError = '';

		// Filter suggestions if starts with /
		if (value.startsWith('/')) {
			this.state.filteredSuggestions = this.commandRegistry.filter(value);
			this.state.selectedSuggestionIndex = 0;
			this.logger.debug('HomePresenter', 'handleInputChange', 'Suggestions filtered', {
				suggestions_count: this.state.filteredSuggestions.length,
			});
		} else {
			this.state.filteredSuggestions = [];
		}

		this._notifyView();
	};

	handleSubmit = async (userInput: string) => {
		const start = Date.now();
		this.logger.info('HomePresenter', 'handleSubmit', 'User message received', {
			input_length: userInput.length,
			is_command: userInput.startsWith('/'),
			current_input: this.state.input,
		});

		// If current input is different from submitted input, it means autocomplete happened
		// Ignore this submit as it's stale
		if (this.state.input !== userInput) {
			this.logger.debug('HomePresenter', 'handleSubmit', 'Ignoring stale submit', {
				submitted: userInput,
				current: this.state.input,
			});
			return;
		}

		// Validation
		if (!userInput.trim()) {
			this.state.inputError = 'Please enter a message';
			this._notifyView();
			this.logger.warn('HomePresenter', 'handleSubmit', 'Empty input rejected');
			return;
		}

		// Add to input history
		this.inputHistory.add(userInput);

		// Check if slash command
		if (userInput.startsWith('/')) {
			this.logger.debug('HomePresenter', 'handleSubmit', 'Processing as command', {
				command: userInput.split(' ')[0],
			});
			await this.handleCommand(userInput);
			return;
		}

		// Clear input
		this.state.input = '';

		// Add user message to session
		const userMessage = MessageModel.user(userInput);
		this.state.session.addMessage(userMessage);

		this.logger.debug('HomePresenter', 'handleSubmit', 'User message added to session');

		// Track streaming message - Create ID once for consistency
		const assistantMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		let assistantContent = '';

		// Set loading
		this.state.isLoading = true;
		this._notifyView();

		this.logger.info('HomePresenter', 'handleSubmit', 'Starting AI request', {
			session_id: this.state.session.id,
			message_id: assistantMessageId,
		});

		let chunkCount = 0;
		let firstChunkTime: number | null = null;

		try {
			// Execute AI request with streaming
			const turn = await this.client.executeWithStreaming(
				userInput,
				(chunk: string) => {
					// Log first chunk (time to first token)
					if (chunkCount === 0) {
						firstChunkTime = Date.now();
						this.logger.info('HomePresenter', 'handleSubmit', 'First chunk received', {
							ttft_ms: firstChunkTime - start,
						});
					}

					chunkCount++;

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
				(event: ToolExecutionProgressEvent) => {
					// Handle tool execution progress events
					this.handleToolProgress(event);
				},
			);

			if (turn.isComplete() && turn.response) {
				const duration = Date.now() - start;

				this.logger.info('HomePresenter', 'handleSubmit', 'AI response completed', {
					duration_ms: duration,
					chunks_received: chunkCount,
					response_length: turn.response.content.length,
					tool_calls: turn.response.toolCalls?.length || 0,
					token_usage: turn.metadata?.tokenUsage,
				});

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
				this.logger.error('HomePresenter', 'handleSubmit', 'Incomplete AI response');
				throw new Error('Failed to get response from AI');
			}
		} catch (error: any) {
			const duration = Date.now() - start;

			this.logger.error('HomePresenter', 'handleSubmit', 'AI request failed', {
				duration_ms: duration,
				chunks_received: chunkCount,
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
			});

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
		const start = Date.now();
		const [cmd, ...args] = input.split(' ');

		this.logger.info('HomePresenter', 'handleCommand', 'Processing command', {
			command: cmd,
			args_count: args.length,
			original_input: input,
		});

		// Find command
		const command = this.commandRegistry.get(cmd);

		if (!command) {
			this.logger.warn('HomePresenter', 'handleCommand', 'Unknown command', {
				command: cmd,
			});
			this.state.inputError = `Unknown command: ${cmd}`;
			this._notifyView();
			return;
		}

		// Clear input
		this.state.input = '';
		this.state.filteredSuggestions = [];

		try {
			this.logger.debug('HomePresenter', 'handleCommand', 'Executing command', {
				command: cmd,
			});
			await command.execute(args, this);
			const duration = Date.now() - start;
			this.logger.info('HomePresenter', 'handleCommand', 'Command executed successfully', {
				command: cmd,
				duration_ms: duration,
			});
		} catch (error: any) {
			const duration = Date.now() - start;
			this.logger.error('HomePresenter', 'handleCommand', 'Command execution failed', {
				command: cmd,
				duration_ms: duration,
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
			});
			const errorMessage = MessageModel.error(
				`Command error: ${error.message}`,
			);
			this.state.session.addMessage(errorMessage);
		}

		this._notifyView();
	}

	// === Suggestion Handlers ===

	handleSuggestionNavigate = (direction: 'up' | 'down') => {
		this.logger.debug('HomePresenter', 'handleSuggestionNavigate', 'Navigating suggestions', {
			direction,
			current_index: this.state.selectedSuggestionIndex,
			suggestions_count: this.state.filteredSuggestions.length,
		});

		const count = this.state.filteredSuggestions.length;
		if (count === 0) return;

		if (direction === 'up') {
			this.state.selectedSuggestionIndex =
				(this.state.selectedSuggestionIndex - 1 + count) % count;
		} else {
			this.state.selectedSuggestionIndex =
				(this.state.selectedSuggestionIndex + 1) % count;
		}

		this.logger.debug('HomePresenter', 'handleSuggestionNavigate', 'New index selected', {
			new_index: this.state.selectedSuggestionIndex,
		});

		this._notifyView();
	};

	handleSuggestionSelect = (): string | null => {
		this.logger.debug('HomePresenter', 'handleSuggestionSelect', 'Selecting suggestion', {
			index: this.state.selectedSuggestionIndex,
		});

		const selected =
			this.state.filteredSuggestions[this.state.selectedSuggestionIndex];

		if (!selected) {
			this.logger.warn('HomePresenter', 'handleSuggestionSelect', 'No suggestion selected');
			return null;
		}

		this.logger.info('HomePresenter', 'handleSuggestionSelect', 'Suggestion selected', {
			command: selected.cmd,
		});

		// Auto-fill input
		this.state.input = selected.cmd + ' ';
		this.state.filteredSuggestions = [];

		this._notifyView();

		return selected.cmd;
	};

	hasSuggestions = (): boolean => {
		const has = this.state.filteredSuggestions.length > 0;
		this.logger.debug('HomePresenter', 'hasSuggestions', 'Checking suggestions', {
			has_suggestions: has,
			count: this.state.filteredSuggestions.length,
		});
		return has;
	};

	// === Session Management ===

	/**
	 * Auto-save current session with timestamp name (if not empty)
	 * Returns the saved session name or 'empty' if skipped
	 */
	async autoSaveCurrentSession(): Promise<string> {
		const start = Date.now();
		this.logger.info('HomePresenter', 'autoSaveCurrentSession', 'Auto-saving session', {
			session_id: this.state.session.id,
			message_count: this.state.session.getMessageCount(),
		});

		// Skip if session is empty
		if (this.state.session.getMessageCount() === 0) {
			this.logger.debug('HomePresenter', 'autoSaveCurrentSession', 'Skipping empty session');
			return 'empty';
		}

		// Update metadata before saving
		this.state.session.updateMetadata();

		// Save with auto-generated timestamp name
		const savedName = await this.sessionManager.saveWithTimestamp(
			this.state.session,
		);

		const duration = Date.now() - start;
		this.logger.info('HomePresenter', 'autoSaveCurrentSession', 'Session saved', {
			saved_name: savedName,
			duration_ms: duration,
		});

		return savedName;
	}

	/**
	 * Start a new empty session
	 */
	async startNewSession(): Promise<void> {
		this.logger.info('HomePresenter', 'startNewSession', 'Starting new session');

		const newSession = Session.createNew(this.state.model);
		this.state.session = newSession;

		// Sync with historyRepo - start fresh conversation
		const historyRepo = this.client.getHistoryRepository();
		await historyRepo.startNewConversation();

		// Update logger session ID
		if (this.logger && this.logger.setSessionId) {
			this.logger.setSessionId(newSession.id);
			this.logger.info('HomePresenter', 'startNewSession', 'New session created', {
				session_id: newSession.id,
				model: this.state.model,
			});
		}

		this._notifyView();
	}

	/**
	 * Add a system message to current session
	 */
	addSystemMessage(message: Message): void {
		this.logger.debug('HomePresenter', 'addSystemMessage', 'Adding system message', {
			message_role: message.role,
			content_length: message.content.length,
		});

		this.state.session.addMessage(message);
		this._notifyView();
	}

	/**
	 * Load a session by name
	 */
	async loadSession(name: string): Promise<void> {
		const start = Date.now();
		this.logger.info('HomePresenter', 'loadSession', 'Loading session', {
			session_name: name,
		});

		const session = await this.sessionManager.load(name);
		this.state.session = session;

		// IMPORTANT: Sync loaded session messages to historyRepo
		// This ensures LLM receives full conversation context
		const historyRepo = this.client.getHistoryRepository();
		
		// Clear current history and start fresh conversation
		await historyRepo.startNewConversation();
		
		// Add all messages from loaded session to history
		const messages = session.getMessages();
		for (const message of messages) {
			await historyRepo.addMessage(message);
		}

		const duration = Date.now() - start;
		this.logger.info('HomePresenter', 'loadSession', 'Session loaded and synced to history', {
			session_name: name,
			message_count: session.getMessageCount(),
			duration_ms: duration,
		});

		this._notifyView();
	}

	/**
	 * Show interactive session selector
	 */
	async openSessionSelector(): Promise<void> {
		const start = Date.now();
		this.logger.info('HomePresenter', 'openSessionSelector', 'Opening session selector');

		// Get all sessions
		const sessions = await this.sessionManager.list();

		this.logger.debug('HomePresenter', 'openSessionSelector', 'Sessions loaded', {
			count: sessions.length,
		});

		// Format with relative time
		const formattedSessions: FormattedSession[] = sessions.map(s => ({
			...s,
			relativeTime: formatRelativeTime(s.updatedAt),
		}));

		// Update state
		this.state.showSessionSelector = true;
		this.state.availableSessions = formattedSessions;
		this.state.selectedSessionIndex = 0;

		const duration = Date.now() - start;
		this.logger.info('HomePresenter', 'openSessionSelector', 'Session selector opened', {
			sessions_count: formattedSessions.length,
			duration_ms: duration,
		});

		this._notifyView();
	}

	/**
	 * Navigate session selector (↑↓)
	 */
	navigateSessionSelector(direction: 'up' | 'down'): void {
		this.logger.debug('HomePresenter', 'navigateSessionSelector', 'Navigating', {
			direction,
			current_index: this.state.selectedSessionIndex,
			max_index: this.state.availableSessions.length - 1,
		});

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

		this.logger.debug('HomePresenter', 'navigateSessionSelector', 'New index', {
			new_index: this.state.selectedSessionIndex,
		});

		this._notifyView();
	}

	/**
	 * Load the selected session (Enter key)
	 */
	async loadSelectedSession(): Promise<void> {
		this.logger.info('HomePresenter', 'loadSelectedSession', 'Loading selected session', {
			selected_index: this.state.selectedSessionIndex,
		});

		const selected =
			this.state.availableSessions[this.state.selectedSessionIndex];
		if (selected) {
			this.logger.debug('HomePresenter', 'loadSelectedSession', 'Selected session details', {
				name: selected.name,
				message_count: selected.messageCount,
			});

			await this.loadSession(selected.name);
			this.closeSessionSelector();

			// Show system message
			const msg = MessageModel.system(
				`Session "${selected.name}" loaded (${selected.messageCount} messages)`,
			);
			this.addSystemMessage(msg);
		} else {
			this.logger.warn('HomePresenter', 'loadSelectedSession', 'No session selected');
		}
	}

	/**
	 * Close session selector (ESC key)
	 */
	closeSessionSelector(): void {
		this.logger.debug('HomePresenter', 'closeSessionSelector', 'Closing session selector');

		this.state.showSessionSelector = false;
		this.state.availableSessions = [];
		this.state.selectedSessionIndex = 0;
		this._notifyView();
	}

	// === Input History ===

	navigateHistory = (direction: 'up' | 'down'): void => {
		this.logger.debug('HomePresenter', 'navigateHistory', 'Navigating history', {
			direction,
		});

		const result =
			direction === 'up'
				? this.inputHistory.navigateUp()
				: this.inputHistory.navigateDown();

		if (result !== null) {
			this.logger.debug('HomePresenter', 'navigateHistory', 'History item found', {
				input_length: result.length,
			});
			this.state.input = result;
			this._notifyView();
		} else {
			this.logger.debug('HomePresenter', 'navigateHistory', 'No history item found');
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
	get sandboxEnabled() {
		return this.sandboxModeManager?.isEnabled() ?? true; // Default: enabled for safety
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

	get toolExecutionProgress() {
		return this.state.toolExecutionProgress;
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
		this.logger.debug('HomePresenter', 'startDurationTimer', 'Starting duration timer');

		// Update duration every second
		this.durationTimer = setInterval(() => {
			this.state.sessionDuration = Math.floor(
				(Date.now() - this.sessionStartTime) / 1000,
			);
			this._notifyView();
		}, 1000);
	}

	private updateTokenStats(tokens: number): void {
		this.logger.debug('HomePresenter', 'updateTokenStats', 'Updating token stats', {
			tokens_added: tokens,
			total_tokens_before: this.state.totalTokens,
		});

		this.state.totalTokens += tokens;

		// Estimate cost based on model
		// Simple pricing: $0.005 per 1K tokens (average)
		this.state.estimatedCost = (this.state.totalTokens / 1000) * 0.005;

		this.logger.info('HomePresenter', 'updateTokenStats', 'Token stats updated', {
			total_tokens: this.state.totalTokens,
			estimated_cost: this.state.estimatedCost,
		});
	}

	private getGitBranch(): string | undefined {
		this.logger.debug('HomePresenter', 'getGitBranch', 'Getting git branch');

		try {
			const branch = execSync('git rev-parse --abbrev-ref HEAD', {
				encoding: 'utf8',
				stdio: ['pipe', 'pipe', 'ignore'],
			}).trim();

			this.logger.debug('HomePresenter', 'getGitBranch', 'Git branch found', {
				branch,
			});

			return branch;
		} catch (error) {
			this.logger.debug('HomePresenter', 'getGitBranch', 'Not a git repository or git not available', {
				error: error instanceof Error ? error.message : String(error),
			});
			return undefined;
		}
	}

	async cleanup(): Promise<void> {
		this.logger.info('HomePresenter', 'cleanup', 'Cleaning up presenter');

		// Auto-save session before exit
		await this.autoSaveCurrentSession();

		// Clear timer
		if (this.durationTimer) {
			this.logger.debug('HomePresenter', 'cleanup', 'Clearing duration timer');
			clearInterval(this.durationTimer);
		}

		this.logger.info('HomePresenter', 'cleanup', 'Cleanup completed');
	}
}
