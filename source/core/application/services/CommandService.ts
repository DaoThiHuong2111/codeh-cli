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

		this.commands.set(command.cmd, command);

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
						const helpText = `📚 Available Commands:

🗨️  Conversation:
  /help, /h, /?     - Show this help message

📝 Session Management:
  /new, /n          - Save current session and start a new one
  /sessions, /ls    - Browse and load saved sessions

⚙️  System:
  /sandbox, /sb     - Toggle sandbox mode (safe ↔ unrestricted)

💡 Tips:
  - Use ↑↓ arrows to navigate command suggestions
  - Press Tab to autocomplete commands
  - Use Ctrl+C to exit`;

						const systemMsg = Message.system(helpText);
						presenter.addSystemMessage(systemMsg);
					},
				},
			),
		);

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
						const savedName = await presenter.autoSaveCurrentSession();

						await presenter.startNewSession();

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

		this.register(
			new Command(
				{
					cmd: '/sandbox',
					desc: 'Toggle sandbox mode for shell commands (safe ↔ unrestricted)',
					category: CommandCategory.SYSTEM,
					aliases: ['/sb'],
				},
				{
					execute: async (args, presenter) => {
						const sandboxManager = (presenter as any).sandboxModeManager;

						if (!sandboxManager) {
							logger.error('CommandService', 'sandbox', 'Sandbox manager not available');
							const errorMsg = Message.system('Sandbox manager not available');
							presenter.addSystemMessage(errorMsg);
							return;
						}

						const oldMode = sandboxManager.getMode();
					const oldDescription = sandboxManager.getModeDescription();

					const result = await sandboxManager.toggle();

					if (!result.success) {
						logger.error('CommandService', 'sandbox', 'Failed to toggle sandbox mode', {
							error: result.error,
						});
						const errorMsg = Message.system(`Failed to toggle sandbox: ${result.error}`);
						presenter.addSystemMessage(errorMsg);
						return;
					}

					const newMode = result.mode;

					logger.info('CommandService', 'sandbox', 'Sandbox mode toggled', {
						old_mode: oldMode,
						new_mode: newMode,
					});

					const message = `Sandbox mode toggled: ${newMode}`;

					const systemMsg = Message.system(message);
					presenter.addSystemMessage(systemMsg);
					},
				},
			),
		);

		logger.info('CommandService', 'registerDefaultCommands', 'Default commands registered', {
			total_commands: this.commands.size,
		});
	}
}
