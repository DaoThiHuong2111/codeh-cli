import test from 'ava';
import * as path from 'path';
import {GetTypeInformationTool} from '../../source/core/tools/GetTypeInformationTool';
import {TypeScriptSymbolAnalyzer} from '../../source/infrastructure/typescript/TypeScriptSymbolAnalyzer';

const fixturesPath = path.resolve(process.cwd(), 'test/fixtures');

test('GetTypeInformationTool: should get type for variable', async t => {
	const analyzer = new TypeScriptSymbolAnalyzer(fixturesPath);
	const tool = new GetTypeInformationTool(fixturesPath, analyzer);

	const result = await tool.execute({
		filePath: path.join(fixturesPath, 'sample.ts'),
		symbolName: 'DEFAULT_USER_NAME',
	});

	t.true(result.success);
	t.is(result.metadata.typeString, 'string');
	t.false(result.metadata.isAsync);
});

test('GetTypeInformationTool: should detect async function', async t => {
	const analyzer = new TypeScriptSymbolAnalyzer(fixturesPath);
	const tool = new GetTypeInformationTool(fixturesPath, analyzer);

	const result = await tool.execute({
		filePath: path.join(fixturesPath, 'sample.ts'),
		symbolName: 'fetchUser',
	});

	t.true(result.success);
	t.true(result.metadata.isAsync);
	t.regex(result.metadata.typeString, /Promise/);
});

test('GetTypeInformationTool: should detect optional parameter', async t => {
	const analyzer = new TypeScriptSymbolAnalyzer(fixturesPath);
	const tool = new GetTypeInformationTool(fixturesPath, analyzer);

	const result = await tool.execute({
		filePath: path.join(fixturesPath, 'sample.ts'),
		symbolName: 'email',
	});

	t.true(result.success);
	t.true(
		result.metadata.isOptional ||
			result.metadata.typeString.includes('undefined'),
	);
});

test('GetTypeInformationTool: should handle symbol not found', async t => {
	const analyzer = new TypeScriptSymbolAnalyzer(fixturesPath);
	const tool = new GetTypeInformationTool(fixturesPath, analyzer);

	const result = await tool.execute({
		filePath: path.join(fixturesPath, 'sample.ts'),
		symbolName: 'nonExistentSymbol',
	});

	t.false(result.success);
	t.regex(result.output, /not found/i);
});

test('GetTypeInformationTool: should get interface type', async t => {
	const analyzer = new TypeScriptSymbolAnalyzer(fixturesPath);
	const tool = new GetTypeInformationTool(fixturesPath, analyzer);

	const result = await tool.execute({
		filePath: path.join(fixturesPath, 'sample.ts'),
		symbolName: 'User',
	});

	t.true(result.success);
	t.truthy(result.metadata);
});

test('GetTypeInformationTool: should validate parameters', t => {
	const analyzer = new TypeScriptSymbolAnalyzer(fixturesPath);
	const tool = new GetTypeInformationTool(fixturesPath, analyzer);

	// Valid parameters
	t.true(
		tool.validateParameters({
			filePath: 'test.ts',
			symbolName: 'foo',
		}),
	);

	// Missing required parameter
	t.false(
		tool.validateParameters({
			filePath: 'test.ts',
		}),
	);

	// Invalid type
	t.false(
		tool.validateParameters({
			filePath: 123,
			symbolName: 'foo',
		}),
	);
});
