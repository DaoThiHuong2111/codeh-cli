import test from 'ava';
import * as path from 'path';
import * as fs from 'fs';
import {DependencyGraphTool} from '../../source/core/tools/DependencyGraphTool';

const fixturesPath = path.resolve(process.cwd(), 'test/fixtures');

test('DependencyGraphTool: should analyze file dependencies', async t => {
	const tool = new DependencyGraphTool(fixturesPath);

	const result = await tool.execute({
		filePath: path.join(fixturesPath, 'sample.ts'),
	});

	t.true(result.success);
	t.truthy(result.metadata);
	t.truthy(result.metadata.imports);
	t.truthy(result.metadata.exports);
	t.true(Array.isArray(result.metadata.imports));
	t.true(Array.isArray(result.metadata.exports));
});

test('DependencyGraphTool: should detect imports', async t => {
	// Create a file with imports
	const testFilePath = path.join(fixturesPath, 'imports-test.ts');
	const content = `
import {User} from './sample';
import * as fs from 'fs';
import path from 'path';

export function test() {}
`;

	fs.writeFileSync(testFilePath, content);

	try {
		const tool = new DependencyGraphTool(fixturesPath);

		const result = await tool.execute({
			filePath: testFilePath,
		});

		t.true(result.success);
		t.true(result.metadata.imports.length >= 3);

		const hasLocalImport = result.metadata.imports.some(
			(imp: any) => imp.from === './sample',
		);
		const hasNodeImport = result.metadata.imports.some((imp: any) =>
			['fs', 'path'].includes(imp.from),
		);

		t.true(hasLocalImport || hasNodeImport);
	} finally {
		if (fs.existsSync(testFilePath)) {
			fs.unlinkSync(testFilePath);
		}
	}
});

test('DependencyGraphTool: should detect exports', async t => {
	const tool = new DependencyGraphTool(fixturesPath);

	const result = await tool.execute({
		filePath: path.join(fixturesPath, 'sample.ts'),
	});

	t.true(result.success);
	t.true(result.metadata.exports.length > 0);

	// sample.ts exports User, UserService, processUser, DEFAULT_USER_NAME
	const exportNames = result.metadata.exports.map((exp: any) => exp.name);
	t.true(
		exportNames.includes('User') ||
			exportNames.includes('UserService') ||
			exportNames.includes('processUser'),
	);
});

test('DependencyGraphTool: should handle file with no dependencies', async t => {
	const testFilePath = path.join(fixturesPath, 'no-deps.ts');
	const content = `
export const x = 1;
export function foo() {
	return x * 2;
}
`;

	fs.writeFileSync(testFilePath, content);

	try {
		const tool = new DependencyGraphTool(fixturesPath);

		const result = await tool.execute({
			filePath: testFilePath,
		});

		t.true(result.success);
		t.is(result.metadata.imports.length, 0);
		t.true(result.metadata.exports.length >= 2); // x and foo
	} finally {
		if (fs.existsSync(testFilePath)) {
			fs.unlinkSync(testFilePath);
		}
	}
});

test('DependencyGraphTool: should handle file not found', async t => {
	const tool = new DependencyGraphTool(fixturesPath);

	const result = await tool.execute({
		filePath: path.join(fixturesPath, 'non-existent-file.ts'),
	});

	t.false(result.success);
});

test('DependencyGraphTool: should validate parameters', t => {
	const tool = new DependencyGraphTool(fixturesPath);

	// Valid parameters
	t.true(
		tool.validateParameters({
			filePath: 'test.ts',
		}),
	);

	// Missing required parameter
	t.false(tool.validateParameters({}));

	// Invalid type
	t.false(
		tool.validateParameters({
			filePath: 123,
		}),
	);
});
