import {readFileSync} from 'fs';
import {fileURLToPath} from 'url';
import {dirname, join} from 'path';

/**
 * Get the current version from package.json
 */
export function getVersion() {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = dirname(__filename);
	const packageJson = JSON.parse(
		readFileSync(join(__dirname, '../../package.json'), 'utf-8'),
	);
	return `v${packageJson.version}`;
}

/**
 * Get the configured LLM model
 */
export function getModel() {
	return process.env.CODEH_MODEL || '';
}

/**
 * Get the current working directory
 */
export function getCurrentDirectory() {
	return process.cwd();
}
