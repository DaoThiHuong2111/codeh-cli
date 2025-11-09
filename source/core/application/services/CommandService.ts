import {Command, CommandCategory} from '../../domain/valueObjects/Command.js';
import type {ICommandRegistry} from '../../domain/interfaces/ICommandRegistry.js';
import {Message} from '../../domain/models/Message.js';

export class CommandService implements ICommandRegistry {
	private commands: Map<string, Command> = new Map();
	private aliases: Map<string, string> = new Map();

	constructor() {
		this.registerDefaultCommands();
	}

	/**
	 * Register a command
	 */
	register(command: Command): void {
		// Register main command
		this.commands.set(command.cmd, command);

		// Register aliases
		for (const alias of command.aliases) {
			this.aliases.set(alias, command.cmd);
		}
	}

	/**
	 * Get command by name or alias
	 */
	get(cmd: string): Command | null {
		// Check aliases first
		const mainCmd = this.aliases.get(cmd) || cmd;
		return this.commands.get(mainCmd) || null;
	}

	/**
	 * Get all commands
	 */
	getAll(): Command[] {
		return Array.from(this.commands.values());
	}

	/**
	 * Filter commands by input
	 */
	filter(input: string): Command[] {
		const normalized = input.toLowerCase().replace(/^\//, '');

		if (!normalized) {
			return this.getAll();
		}

		return this.getAll().filter(cmd => cmd.matches('/' + normalized));
	}

	/**
	 * Check if command exists
	 */
	has(cmd: string): boolean {
		return this.get(cmd) !== null;
	}

	/**
	 * Get commands by category
	 */
	getByCategory(category: string): Command[] {
		return this.getAll().filter(cmd => cmd.category === category);
	}

	/**
	 * Register default commands
	 */
	private registerDefaultCommands(): void {
		// /help command
		this.register(
			new Command(
				{
					cmd: '/help',
					desc: 'Show help documentation',
					category: CommandCategory.SYSTEM,
					aliases: ['/h', '/?'],
				},
				{
					execute: async (args, presenter) => {
						presenter.toggleHelp();
					},
				},
			),
		);

		// /clear command
		this.register(
			new Command(
				{
					cmd: '/clear',
					desc: 'Clear conversation history',
					category: CommandCategory.CONVERSATION,
					aliases: ['/cls', '/reset'],
				},
				{
					execute: async (args, presenter) => {
						await presenter.clearConversation();

						const msg = Message.system('Conversation cleared');
						presenter.addSystemMessage(msg);
					},
				},
			),
		);

		// /new command
		this.register(
			new Command(
				{
					cmd: '/new',
					desc: 'Start new conversation',
					category: CommandCategory.CONVERSATION,
					aliases: ['/n'],
				},
				{
					execute: async (args, presenter) => {
						await presenter.startNewConversation();

						const msg = Message.system('New conversation started');
						presenter.addSystemMessage(msg);
					},
				},
			),
		);

		// /save command
		this.register(
			new Command(
				{
					cmd: '/save',
					desc: 'Save current session',
					category: CommandCategory.SESSION,
					argCount: 1,
					argNames: ['name'],
				},
				{
					execute: async (args, presenter) => {
						const name = args[0];
						await presenter.saveSession(name);

						const msg = Message.system(`Session saved as "${name}"`);
						presenter.addSystemMessage(msg);
					},
				},
			),
		);

		// /load command
		this.register(
			new Command(
				{
					cmd: '/load',
					desc: 'Load saved session',
					category: CommandCategory.SESSION,
					argCount: 1,
					argNames: ['name'],
				},
				{
					execute: async (args, presenter) => {
						const name = args[0];
						await presenter.loadSession(name);

						const msg = Message.system(`Session "${name}" loaded`);
						presenter.addSystemMessage(msg);
					},
				},
			),
		);

		// /sessions command
		this.register(
			new Command(
				{
					cmd: '/sessions',
					desc: 'List all saved sessions',
					category: CommandCategory.SESSION,
					aliases: ['/ls'],
				},
				{
					execute: async (args, presenter) => {
						const sessions = await presenter.sessionManager.list();

						let content = 'Saved Sessions:\n\n';
						for (const session of sessions) {
							content += `- ${session.name} (${session.messageCount} messages, `;
							content += `${new Date(session.updatedAt).toLocaleDateString()})\n`;
						}

						if (sessions.length === 0) {
							content = 'No saved sessions found';
						}

						const msg = Message.system(content);
						presenter.addSystemMessage(msg);
					},
				},
			),
		);
	}
}
