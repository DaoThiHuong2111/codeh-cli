/**
 * Command Validator
 * Validates shell commands for security
 */

export class CommandValidator {
  private blockedKeywords: string[] = [
    'rm -rf /',
    'mkfs',
    'dd if=',
    ':(){:|:&};:',  // Fork bomb
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
  validate(command: string): { valid: boolean; reason?: string } {
    // Check for blocked keywords
    for (const keyword of this.blockedKeywords) {
      if (command.includes(keyword)) {
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
      return {
        valid: false,
        reason: `Command '${baseCommand}' is not in the allowed list`,
      };
    }

    // Additional security checks
    if (this.containsSuspiciousPatterns(command)) {
      return {
        valid: false,
        reason: 'Command contains suspicious patterns',
      };
    }

    return { valid: true };
  }

  /**
   * Extract base command from full command string
   */
  private extractBaseCommand(command: string): string {
    const trimmed = command.trim();
    const parts = trimmed.split(/\s+/);
    return parts[0];
  }

  /**
   * Check for suspicious patterns
   */
  private containsSuspiciousPatterns(command: string): boolean {
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

    return suspiciousPatterns.some((pattern) => pattern.test(command));
  }

  /**
   * Check if command is safe
   */
  isSafe(command: string): boolean {
    return this.validate(command).valid;
  }

  /**
   * Add allowed command
   */
  addAllowedCommand(command: string): void {
    if (!this.allowedCommands.includes(command)) {
      this.allowedCommands.push(command);
    }
  }

  /**
   * Remove allowed command
   */
  removeAllowedCommand(command: string): void {
    const index = this.allowedCommands.indexOf(command);
    if (index > -1) {
      this.allowedCommands.splice(index, 1);
    }
  }

  /**
   * Add blocked keyword
   */
  addBlockedKeyword(keyword: string): void {
    if (!this.blockedKeywords.includes(keyword)) {
      this.blockedKeywords.push(keyword);
    }
  }

  /**
   * Get allowed commands
   */
  getAllowedCommands(): string[] {
    return [...this.allowedCommands];
  }

  /**
   * Get blocked keywords
   */
  getBlockedKeywords(): string[] {
    return [...this.blockedKeywords];
  }
}
