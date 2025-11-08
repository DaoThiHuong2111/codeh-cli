import { Command } from '../valueObjects/Command.js';

export interface ICommandRegistry {
	/**
	 * Register a command
	 */
	register(command: Command): void;

	/**
	 * Get command by name or alias
	 */
	get(cmd: string): Command | null;

	/**
	 * Get all commands
	 */
	getAll(): Command[];

	/**
	 * Filter commands by input
	 */
	filter(input: string): Command[];

	/**
	 * Check if command exists
	 */
	has(cmd: string): boolean;

	/**
	 * Get commands by category
	 */
	getByCategory(category: string): Command[];
}
