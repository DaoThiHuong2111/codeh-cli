import * as path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const {FindReferencesTool} = await import('./dist/core/tools/FindReferencesTool.js');

const FIXTURES_ROOT = path.join(__dirname, 'test/fixtures/symbol-analysis');

console.log('Testing FindReferencesTool...\n');

const tool = new FindReferencesTool(FIXTURES_ROOT);
const result = await tool.execute({
	namePath: 'UserService',
	filePath: 'UserService.ts',
});

console.log('Result:', JSON.stringify(result, null, 2));
