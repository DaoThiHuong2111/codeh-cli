import {Command, CommandCategory} from '../../domain/valueObjects/Command.js';
import type {ICommandRegistry} from '../../domain/interfaces/ICommandRegistry.js';
import {Message} from '../../domain/models/Message.js';
import {getLogger} from '../../../infrastructure/logging/Logger.js';

const logger = getLogger();

export class CommandService implements ICommandRegistry {
	private commands: Map<string, Command> = new Map();
	private aliases: Map<string, string> = new Map();

	constructor() {
		logger.info('CommandService', 'constructor', 'Initializing Command service');
		this.registerDefaultCommands();
		logger.debug('CommandService', 'constructor', 'Command service initialized', {
			commands_count: this.commands.size,
			aliases_count: this.aliases.size,
		});
	}

	/**
	 * Register a command
	 */
	register(command: Command): void {
		logger.debug('CommandService', 'register', 'Registering command', {
			command: command.cmd,
			aliases_count: command.aliases.length,
		});

		// Register main command
		this.commands.set(command.cmd, command);

		// Register aliases
		for (const alias of command.aliases) {
			this.aliases.set(alias, command.cmd);
		}

		logger.debug('CommandService', 'register', 'Command registered', {
			total_commands: this.commands.size,
			total_aliases: this.aliases.size,
		});
	}

	/**
	 * Get command by name or alias
	 */
	get(cmd: string): Command | null {
		logger.debug('CommandService', 'get', 'Getting command', {
			command: cmd,
		});

		// Check aliases first
		const mainCmd = this.aliases.get(cmd) || cmd;
		const command = this.commands.get(mainCmd) || null;

		logger.debug('CommandService', 'get', 'Command lookup result', {
			found: !!command,
			resolved_to: mainCmd,
		});

		return command;
	}

	/**
	 * Get all commands
	 */
	getAll(): Command[] {
		logger.debug('CommandService', 'getAll', 'Getting all commands', {
			commands_count: this.commands.size,
		});
		return Array.from(this.commands.values());
	}

	/**
	 * Filter commands by input
	 */
	filter(input: string): Command[] {
		logger.debug('CommandService', 'filter', 'Filtering commands', {
			input_length: input.length,
		});

		const normalized = input.toLowerCase().replace(/^\//, '');

		if (!normalized) {
			logger.debug('CommandService', 'filter', 'Empty filter, returning all');
			return this.getAll();
		}

		const filtered = this.getAll().filter(cmd => cmd.matches('/' + normalized));

		logger.debug('CommandService', 'filter', 'Commands filtered', {
			input: normalized,
			matches_count: filtered.length,
		});

		return filtered;
	}

	/**
	 * Check if command exists
	 */
	has(cmd: string): boolean {
		const exists = this.get(cmd) !== null;
		logger.debug('CommandService', 'has', 'Checking command existence', {
			command: cmd,
			exists,
		});
		return exists;
	}

	/**
	 * Get commands by category
	 */
	getByCategory(category: string): Command[] {
		logger.debug('CommandService', 'getByCategory', 'Getting commands by category', {
			category,
		});

		const commands = this.getAll().filter(cmd => cmd.category === category);

		logger.debug('CommandService', 'getByCategory', 'Commands retrieved', {
			category,
			count: commands.length,
		});

		return commands;
	}

	/**
	 * Register default commands
	 */
	private registerDefaultCommands(): void {
		logger.info('CommandService', 'registerDefaultCommands', 'Registering default commands');

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
						await presenter.openSessionSelector();
					},
				},
			),
		);

		logger.info('CommandService', 'registerDefaultCommands', 'Default commands registered', {
			total_commands: this.commands.size,
		});
	}
}
