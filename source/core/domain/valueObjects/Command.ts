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
		this.cmd = data.cmd;
		this.desc = data.desc;
		this.category = data.category;
		this.aliases = data.aliases || [];
		this.argCount = data.argCount || 0;
		this.argNames = data.argNames || [];
		this.executor = executor;
	}

	/**
	 * Execute command
	 */
	async execute(args: string[], presenter: any): Promise<void> {
		// Validate arg count
		if (args.length < this.argCount) {
			throw new Error(
				`${this.cmd} requires ${this.argCount} argument(s): ${this.argNames.join(', ')}`,
			);
		}

		await this.executor.execute(args, presenter);
	}

	/**
	 * Check if input matches this command
	 */
	matches(input: string): boolean {
		const normalized = input.toLowerCase();
		return (
			this.cmd.toLowerCase().startsWith(normalized) ||
			this.aliases.some((alias) => alias.toLowerCase().startsWith(normalized))
		);
	}

	/**
	 * Serialize to JSON
	 */
	toJSON(): CommandData {
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
