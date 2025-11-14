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

		// /new command - Auto-save current session and start new
		this.register(
			new Command(
				{
					cmd: '/new',
					desc: 'Save current session and start new one',
					category: CommandCategory.SESSION,
					aliases: ['/n'],
				},
				{
					execute: async (args, presenter) => {
						// 1. Auto-save current session (if not empty)
						const savedName = await presenter.autoSaveCurrentSession();

						// 2. Start new session
						await presenter.startNewSession();

						// 3. Show message
						let message = 'New session started.';
						if (savedName && savedName !== 'empty') {
							message = `Previous session saved as "${savedName}". ${message}`;
						}

						const msg = Message.system(message);
						presenter.addSystemMessage(msg);
					},
				},
			),
		);

		// /sessions command - Interactive session browser
		this.register(
			new Command(
				{
					cmd: '/sessions',
					desc: 'Browse and load saved sessions (↑↓ to navigate, Enter to load)',
					category: CommandCategory.SESSION,
					aliases: ['/ls'],
				},
				{
					execute: async (args, presenter) => {
						await presenter.showSessionSelector();
					},
				},
			),
		);
	}
}
