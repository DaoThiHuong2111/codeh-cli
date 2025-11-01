class InputValidator {
	constructor() {
		// Ban đầu chưa có từ khóa bị cấm
		this.blockedKeywords = [];
		this.suspiciousPatterns = [];
		this.maxInputLength = 10000;
		this.allowedCommands = [
			'git',
			'npm',
			'node',
			'python',
			'ls',
			'cd',
			'mkdir',
			'touch',
			'cat',
			'echo',
			'rm',
			'cp',
			'mv',
			'grep',
			'find',
			'chmod',
			'curl',
			'wget',
		];
	}

	// Thêm từ khóa bị cấm
	addBlockedKeyword(keyword) {
		if (!this.blockedKeywords.includes(keyword)) {
			this.blockedKeywords.push(keyword.toLowerCase());
		}
	}

	// Thêm pattern bị cấm
	addSuspiciousPattern(pattern) {
		try {
			const regex = new RegExp(pattern, 'i');
			this.suspiciousPatterns.push(regex);
		} catch (error) {
			console.error(`Invalid pattern: ${pattern}`);
		}
	}

	// Xóa từ khóa bị cấm
	removeBlockedKeyword(keyword) {
		const index = this.blockedKeywords.indexOf(keyword.toLowerCase());
		if (index > -1) {
			this.blockedKeywords.splice(index, 1);
		}
	}

	// Kiểm tra input có chứa từ khóa bị cấm
	checkBlockedKeywords(input) {
		const lowerInput = input.toLowerCase();
		const found = [];

		for (const keyword of this.blockedKeywords) {
			if (lowerInput.includes(keyword)) {
				found.push(keyword);
			}
		}

		return found;
	}

	// Kiểm tra input có match pattern bị cấm
	checkSuspiciousPatterns(input) {
		const matches = [];

		for (const pattern of this.suspiciousPatterns) {
			if (pattern.test(input)) {
				matches.push(pattern.source);
			}
		}

		return matches;
	}

	// Kiểm tra độ dài input
	checkInputLength(input) {
		return input.length <= this.maxInputLength;
	}

	// Phân loại input
	classifyInput(input) {
		// Kiểm tra nếu là command
		if (this.isCommand(input)) {
			return 'command';
		}

		// Kiểm tra nếu là code
		if (this.isCode(input)) {
			return 'code';
		}

		// Kiểm tra nếu là URL
		if (this.isUrl(input)) {
			return 'url';
		}

		// Kiểm tra nếu là file path
		if (this.isFilePath(input)) {
			return 'file';
		}

		// Mặc định là text
		return 'text';
	}

	// Kiểm tra nếu input là command
	isCommand(input) {
		const trimmed = input.trim();
		const firstWord = trimmed.split(' ')[0];
		return this.allowedCommands.includes(firstWord);
	}

	// Kiểm tra nếu input là code
	isCode(input) {
		const codePatterns = [
			/^\s*function\s+\w+\s*\(/,
			/^\s*const\s+\w+\s*=/,
			/^\s*let\s+\w+\s*=/,
			/^\s*var\s+\w+\s*=/,
			/^\s*class\s+\w+/,
			/^\s*import\s+/,
			/^\s*export\s+/,
			/^\s*if\s*\(/,
			/^\s*for\s*\(/,
			/^\s*while\s*\(/,
			/\{\s*\n.*\n\}/,
			/\(.*\)\s*=>/,
			/```[\s\S]*```/,
		];

		return codePatterns.some(pattern => pattern.test(input));
	}

	// Kiểm tra nếu input là URL
	isUrl(input) {
		const urlPattern = /^https?:\/\/.+/;
		return urlPattern.test(input.trim());
	}

	// Kiểm tra nếu input là file path
	isFilePath(input) {
		const filePathPatterns = [
			/^\.\/.+/,
			/^~\//,
			/^\/.+/,
			/^[a-zA-Z]:\\/,
			/^[a-zA-Z]:\//,
		];

		return filePathPatterns.some(pattern => pattern.test(input.trim()));
	}

	// Validate input hoàn chỉnh
	validate(input) {
		const result = {
			valid: true,
			warnings: [],
			errors: [],
			classification: this.classifyInput(input),
			sanitized: input,
		};

		// Kiểm tra độ dài
		if (!this.checkInputLength(input)) {
			result.valid = false;
			result.errors.push(`Input quá dài (tối đa ${this.maxInputLength} ký tự)`);
		}

		// Kiểm tra từ khóa bị cấm
		const blockedKeywords = this.checkBlockedKeywords(input);
		if (blockedKeywords.length > 0) {
			result.valid = false;
			result.errors.push(
				`Input chứa từ khóa bị cấm: ${blockedKeywords.join(', ')}`,
			);
		}

		// Kiểm tra pattern đáng ngờ
		const suspiciousPatterns = this.checkSuspiciousPatterns(input);
		if (suspiciousPatterns.length > 0) {
			result.warnings.push(
				`Input có thể chứa nội dung đáng ngờ: ${suspiciousPatterns.join(', ')}`,
			);
		}

		// Nếu là command, kiểm tra xem có trong whitelist không
		if (result.classification === 'command') {
			const firstWord = input.trim().split(' ')[0];
			if (!this.allowedCommands.includes(firstWord)) {
				result.valid = false;
				result.errors.push(`Command không được phép: ${firstWord}`);
			}
		}

		return result;
	}

	// Lấy danh sách các from khóa bị cấm
	getBlockedKeywords() {
		return [...this.blockedKeywords];
	}

	// Lấy danh sách command được phép
	getAllowedCommands() {
		return [...this.allowedCommands];
	}

	// Thêm command vào whitelist
	addAllowedCommand(command) {
		if (!this.allowedCommands.includes(command)) {
			this.allowedCommands.push(command);
		}
	}

	// Xóa command khỏi whitelist
	removeAllowedCommand(command) {
		const index = this.allowedCommands.indexOf(command);
		if (index > -1) {
			this.allowedCommands.splice(index, 1);
		}
	}
}

export const inputValidator = new InputValidator();
export default inputValidator;
