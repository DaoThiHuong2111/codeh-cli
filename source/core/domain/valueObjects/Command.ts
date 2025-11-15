import {getLogger} from '../../../infrastructure/logging/Logger.js';

const logger = getLogger();

export enum CommandCategory {
	CONVERSATION = 'conversation',
	SESSION = 'session',
	CONFIGURATION = 'configuration',
	SYSTEM = 'system',
}

export interface CommandData {
	cmd: string;
	desc: string;
	category: CommandCategory;
	aliases?: string[];
	argCount?: number;
	argNames?: string[];
}

export interface ICommandExecutor {
	execute(args: string[], presenter: any): Promise<void>;
}

export class Command {
	readonly cmd: string;
	readonly desc: string;
	readonly category: CommandCategory;
	readonly aliases: string[];
	readonly argCount: number;
	readonly argNames: string[];
	private executor: ICommandExecutor;

	constructor(data: CommandData, executor: ICommandExecutor) {
		logger.debug('Command', 'constructor', 'Creating command', {
			cmd: data.cmd,
			category: data.category,
			aliases_count: data.aliases?.length || 0,
		});

		this.cmd = data.cmd;
		this.desc = data.desc;
		this.category = data.category;
		this.aliases = data.aliases || [];
		this.argCount = data.argCount || 0;
		this.argNames = data.argNames || [];
		this.executor = executor;

		logger.debug('Command', 'constructor', 'Command created', {
			cmd: this.cmd,
		});
	}

	/**
	 * Execute command
	 */
	async execute(args: string[], presenter: any): Promise<void> {
		const start = Date.now();
		logger.info('Command', 'execute', 'Executing command', {
			cmd: this.cmd,
			args_count: args.length,
			required_args: this.argCount,
		});

		// Validate arg count
		if (args.length < this.argCount) {
			logger.warn('Command', 'execute', 'Command execution failed - insufficient arguments', {
				cmd: this.cmd,
				provided: args.length,
				required: this.argCount,
			});

			throw new Error(
				`${this.cmd} requires ${this.argCount} argument(s): ${this.argNames.join(', ')}`,
			);
		}

		try {
			await this.executor.execute(args, presenter);

			const duration = Date.now() - start;
			logger.info('Command', 'execute', 'Command executed successfully', {
				cmd: this.cmd,
				duration_ms: duration,
			});
		} catch (error: any) {
			const duration = Date.now() - start;
			logger.error('Command', 'execute', 'Command execution failed', {
				cmd: this.cmd,
				duration_ms: duration,
				error: error.message,
				stack: error.stack,
			});
			throw error;
		}
	}

	/**
	 * Check if input matches this command
	 */
	matches(input: string): boolean {
		logger.debug('Command', 'matches', 'Checking if input matches command', {
			cmd: this.cmd,
			input_length: input.length,
		});

		const normalized = input.toLowerCase();
		const isMatch =
			this.cmd.toLowerCase().startsWith(normalized) ||
			this.aliases.some(alias => alias.toLowerCase().startsWith(normalized));

		logger.debug('Command', 'matches', 'Match check completed', {
			cmd: this.cmd,
			is_match: isMatch,
		});

		return isMatch;
	}

	/**
	 * Serialize to JSON
	 */
	toJSON(): CommandData {
		logger.debug('Command', 'toJSON', 'Serializing command to JSON', {
			cmd: this.cmd,
		});

		return {
			cmd: this.cmd,
			desc: this.desc,
			category: this.category,
			aliases: this.aliases,
			argCount: this.argCount,
			argNames: this.argNames,
		};
	}
}
