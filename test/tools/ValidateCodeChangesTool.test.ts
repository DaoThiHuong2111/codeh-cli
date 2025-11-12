import test from 'ava';
import * as path from 'path';
import * as fs from 'fs';
import {ValidateCodeChangesTool} from '../../source/core/tools/ValidateCodeChangesTool';
import {TypeScriptSymbolAnalyzer} from '../../source/infrastructure/typescript/TypeScriptSymbolAnalyzer';

const fixturesPath = path.resolve(process.cwd(), 'test/fixtures');

test('ValidateCodeChangesTool: should validate correct code', async t => {
	const analyzer = new TypeScriptSymbolAnalyzer(fixturesPath);
	const tool = new ValidateCodeChangesTool(fixturesPath, analyzer);

	const result = await tool.execute({});

	t.true(result.success);
	t.true(result.metadata.valid);
	t.is(result.metadata.errorCount, 0);
});

test('ValidateCodeChangesTool: should validate specific files', async t => {
	const analyzer = new TypeScriptSymbolAnalyzer(fixturesPath);
	const tool = new ValidateCodeChangesTool(fixturesPath, analyzer);

	const result = await tool.execute({
		files: ['sample.ts'],
	});

	t.true(result.success);
	t.truthy(result.metadata);
});

test('ValidateCodeChangesTool: should detect TypeScript errors', async t => {
	// Create a temporary file with errors
	const errorFilePath = path.join(fixturesPath, 'error-test.ts');
	const errorContent = `
export function badFunction() {
	const x: number = "string"; // Type error
	return x;
}
`;

	fs.writeFileSync(errorFilePath, errorContent);

	try {
		const analyzer = new TypeScriptSymbolAnalyzer(fixturesPath);
		const tool = new ValidateCodeChangesTool(fixturesPath, analyzer);

		const result = await tool.execute({
			files: ['error-test.ts'],
		});

		t.true(result.success); // Tool executes successfully
		t.false(result.metadata.valid); // But code has errors
		t.true(result.metadata.errorCount > 0);
		t.true(Array.isArray(result.metadata.errors));
	} finally {
		// Cleanup
		if (fs.existsSync(errorFilePath)) {
			fs.unlinkSync(errorFilePath);
		}
	}
});

test('ValidateCodeChangesTool: should report error details', async t => {
	// Create a temporary file with errors
	const errorFilePath = path.join(fixturesPath, 'detailed-error.ts');
	const errorContent = `
export const x: string = 123; // Type error
`;

	fs.writeFileSync(errorFilePath, errorContent);

	try {
		const analyzer = new TypeScriptSymbolAnalyzer(fixturesPath);
		const tool = new ValidateCodeChangesTool(fixturesPath, analyzer);

		const result = await tool.execute({
			files: ['detailed-error.ts'],
		});

		t.true(result.success);
		t.false(result.metadata.valid);

		if (result.metadata.errors.length > 0) {
			const error = result.metadata.errors[0];
			t.truthy(error.file);
			t.true(typeof error.line === 'number');
			t.truthy(error.message);
		}
	} finally {
		// Cleanup
		if (fs.existsSync(errorFilePath)) {
			fs.unlinkSync(errorFilePath);
		}
	}
});

test('ValidateCodeChangesTool: should handle cache invalidation', async t => {
	const analyzer = new TypeScriptSymbolAnalyzer(fixturesPath);
	const tool = new ValidateCodeChangesTool(fixturesPath, analyzer);

	// First validation
	const result1 = await tool.execute({});
	t.true(result1.success);

	// Second validation (should invalidate cache)
	const result2 = await tool.execute({});
	t.true(result2.success);

	// Results should be consistent
	t.is(result1.metadata.valid, result2.metadata.valid);
});

test('ValidateCodeChangesTool: should validate parameters', t => {
	const analyzer = new TypeScriptSymbolAnalyzer(fixturesPath);
	const tool = new ValidateCodeChangesTool(fixturesPath, analyzer);

	// Valid parameters
	t.true(tool.validateParameters({}));
	t.true(tool.validateParameters({files: ['test.ts']}));

	// Invalid type
	t.false(tool.validateParameters({files: 'not-an-array'}));
	t.false(tool.validateParameters({files: [123]}));
});
