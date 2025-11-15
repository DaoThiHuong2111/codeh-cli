/**
 * Command Validator
 * Validates shell commands for security
 */

import {getLogger} from '../logging/Logger.js';

const logger = getLogger();

export class CommandValidator {
	private blockedKeywords: string[] = [
		'rm -rf /',
		'mkfs',
		'dd if=',
		':(){:|:&};:', // Fork bomb
		'chmod -R 777 /',
		'> /dev/sda',
		'mv /* /dev/null',
	];

	private allowedCommands: string[] = [
		'ls',
		'cd',
		'pwd',
		'cat',
		'echo',
		'grep',
		'find',
		'git',
		'npm',
		'yarn',
		'node',
		'python',
		'pip',
		'docker',
		'kubectl',
		'curl',
		'wget',
		'ssh',
		'scp',
		'rsync',
		'tar',
		'zip',
		'unzip',
		'mkdir',
		'touch',
		'cp',
		'mv',
		'rm',
		'which',
		'whoami',
		'date',
		'history',
	];

	/**
	 * Validate command
	 */
	validate(command: string): {valid: boolean; reason?: string} {
		logger.info('CommandValidator', 'validate', 'Validating command', {
			command_length: command.length,
		});

		// Check for blocked keywords
		for (const keyword of this.blockedKeywords) {
			if (command.includes(keyword)) {
				logger.warn('CommandValidator', 'validate', 'Command blocked - contains blocked keyword', {
					keyword,
				});

				return {
					valid: false,
					reason: `Command contains blocked keyword: ${keyword}`,
				};
			}
		}

		// Extract base command
		const baseCommand = this.extractBaseCommand(command);

		// Check if command is in allowed list
		if (!this.allowedCommands.includes(baseCommand)) {
			logger.warn('CommandValidator', 'validate', 'Command blocked - not in allowed list', {
				base_command: baseCommand,
			});

			return {
				valid: false,
				reason: `Command '${baseCommand}' is not in the allowed list`,
			};
		}

		// Additional security checks
		if (this.containsSuspiciousPatterns(command)) {
			logger.warn('CommandValidator', 'validate', 'Command blocked - suspicious patterns detected');

			return {
				valid: false,
				reason: 'Command contains suspicious patterns',
			};
		}

		logger.info('CommandValidator', 'validate', 'Command validated successfully', {
			base_command: baseCommand,
		});

		return {valid: true};
	}

	/**
	 * Extract base command from full command string
	 */
	private extractBaseCommand(command: string): string {
		logger.debug('CommandValidator', 'extractBaseCommand', 'Extracting base command');

		const trimmed = command.trim();
		const parts = trimmed.split(/\s+/);
		const baseCommand = parts[0];

		logger.debug('CommandValidator', 'extractBaseCommand', 'Base command extracted', {
			base_command: baseCommand,
		});

		return baseCommand;
	}

	/**
	 * Check for suspicious patterns
	 */
	private containsSuspiciousPatterns(command: string): boolean {
		logger.debug('CommandValidator', 'containsSuspiciousPatterns', 'Checking for suspicious patterns');

		const suspiciousPatterns = [
			/;\s*rm\s+-rf/i, // Chained rm -rf
			/\|\s*sh/i, // Pipe to shell
			/eval\s*\(/i, // eval function
			/`.*`/, // Command substitution
			/\$\(.*\)/, // Command substitution
			/>\s*\/dev\/(sd|hd|nvme)/i, // Write to disk device
			/curl.*\|\s*bash/i, // Curl pipe to bash
			/wget.*\|\s*sh/i, // Wget pipe to shell
		];

		const hasSuspiciousPatterns = suspiciousPatterns.some(pattern => pattern.test(command));

		logger.debug('CommandValidator', 'containsSuspiciousPatterns', 'Suspicious patterns check completed', {
			has_suspicious_patterns: hasSuspiciousPatterns,
		});

		return hasSuspiciousPatterns;
	}

	/**
	 * Check if command is safe
	 */
	isSafe(command: string): boolean {
		logger.debug('CommandValidator', 'isSafe', 'Checking if command is safe');

		const valid = this.validate(command).valid;

		logger.debug('CommandValidator', 'isSafe', 'Safety check completed', {
			is_safe: valid,
		});

		return valid;
	}

	/**
	 * Add allowed command
	 */
	addAllowedCommand(command: string): void {
		logger.info('CommandValidator', 'addAllowedCommand', 'Adding allowed command', {
			command,
		});

		if (!this.allowedCommands.includes(command)) {
			this.allowedCommands.push(command);

			logger.info('CommandValidator', 'addAllowedCommand', 'Allowed command added', {
				total_allowed: this.allowedCommands.length,
			});
		} else {
			logger.debug('CommandValidator', 'addAllowedCommand', 'Command already allowed', {
				command,
			});
		}
	}

	/**
	 * Remove allowed command
	 */
	removeAllowedCommand(command: string): void {
		logger.info('CommandValidator', 'removeAllowedCommand', 'Removing allowed command', {
			command,
		});

		const index = this.allowedCommands.indexOf(command);
		if (index > -1) {
			this.allowedCommands.splice(index, 1);

			logger.info('CommandValidator', 'removeAllowedCommand', 'Allowed command removed', {
				total_allowed: this.allowedCommands.length,
			});
		} else {
			logger.debug('CommandValidator', 'removeAllowedCommand', 'Command not found in allowed list', {
				command,
			});
		}
	}

	/**
	 * Add blocked keyword
	 */
	addBlockedKeyword(keyword: string): void {
		logger.info('CommandValidator', 'addBlockedKeyword', 'Adding blocked keyword', {
			keyword,
		});

		if (!this.blockedKeywords.includes(keyword)) {
			this.blockedKeywords.push(keyword);

			logger.info('CommandValidator', 'addBlockedKeyword', 'Blocked keyword added', {
				total_blocked: this.blockedKeywords.length,
			});
		} else {
			logger.debug('CommandValidator', 'addBlockedKeyword', 'Keyword already blocked', {
				keyword,
			});
		}
	}

	/**
	 * Get allowed commands
	 */
	getAllowedCommands(): string[] {
		logger.debug('CommandValidator', 'getAllowedCommands', 'Getting allowed commands', {
			count: this.allowedCommands.length,
		});

		return [...this.allowedCommands];
	}

	/**
	 * Get blocked keywords
	 */
	getBlockedKeywords(): string[] {
		logger.debug('CommandValidator', 'getBlockedKeywords', 'Getting blocked keywords', {
			count: this.blockedKeywords.length,
		});

		return [...this.blockedKeywords];
	}
}
