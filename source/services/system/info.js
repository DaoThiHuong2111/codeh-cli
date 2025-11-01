import {readFileSync} from 'fs';
import {fileURLToPath} from 'url';
import {dirname, join} from 'path';
import {execSync} from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Get the current version from package.json
 */
export function getVersion() {
	const packageJson = JSON.parse(
		readFileSync(join(__dirname, '../../../package.json'), 'utf-8'),
	);
	return `v${packageJson.version}`;
}

/**
 * Get the current working directory
 */
export function getCurrentDirectory() {
	return process.cwd();
}

/**
 * Get the current git branch name
 */
export function getCurrentBranch() {
	try {
		const branch = execSync('git branch --show-current', {
			encoding: 'utf-8',
			stdio: ['pipe', 'pipe', 'ignore'],
			cwd: process.cwd(),
		}).trim();
		return branch || 'N/A';
	} catch (error) {
		return 'N/A';
	}
}
