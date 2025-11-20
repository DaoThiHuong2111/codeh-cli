/**
 * Tests for ConfigurablePermissionHandler
 * Coverage target: 95%
 */

import test from 'ava';
import sinon from 'sinon';
import {ConfigurablePermissionHandler, PermissionMode} from '../../../dist/infrastructure/permissions/ConfigurablePermissionHandler.js';
import type {ToolPermissionContext} from '../../../dist/core/domain/interfaces/IToolPermissionHandler.js';

// Stub console.log to avoid test output pollution
test.beforeEach(t => {
	if (!('restore' in console.log)) {
		sinon.stub(console, 'log');
	}
});

test.afterEach(() => {
	sinon.restore();
});

function createContext(toolName: string, args: any = {}): ToolPermissionContext {
	return {
		toolCall: {
			id: `test-${toolName}-${Date.now()}`,
			name: toolName,
			arguments: args
		},
		timestamp: new Date(),
		conversationContext: `Testing ${toolName}`
	};
}

test('AUTO_APPROVE mode approves all non-dangerous tools', async t => {
	const handler = new ConfigurablePermissionHandler({
		mode: PermissionMode.AUTO_APPROVE,
		dangerousToolsRequireApproval: false
	});
	
	const result = await handler.requestPermission(createContext('search_code'));
	
	t.true(result.approved);
	t.true(result.reason!.includes('Auto-approved'));
});

test('AUTO_APPROVE mode blocks dangerous tools when dangerousToolsRequireApproval is true', async t => {
	const handler = new ConfigurablePermissionHandler({
		mode: PermissionMode.AUTO_APPROVE,
		dangerousToolsRequireApproval: true
	});
	
	const result = await handler.requestPermission(createContext('shell'));
	
	t.false(result.approved);
	t.true(result.reason!.includes('Dangerous tool'));
});

test('REQUIRE_APPROVAL mode approves pre-approved tools', async t => {
	const handler = new ConfigurablePermissionHandler({
		mode: PermissionMode.REQUIRE_APPROVAL,
		preApprovedTools: ['search_code']
	});
	
	const result = await handler.requestPermission(createContext('search_code'));
	
	t.true(result.approved);
});

test('REQUIRE_APPROVAL mode denies non-pre-approved tools', async t => {
	const handler = new ConfigurablePermissionHandler({
		mode: PermissionMode.REQUIRE_APPROVAL,
		preApprovedTools: ['search_code']
	});
	
	const result = await handler.requestPermission(createContext('file_read'));
	
	t.false(result.approved);
	t.true(result.reason!.includes('requires pre-approval'));
});

test('DENY_BY_DEFAULT mode denies all tools', async t => {
	const handler = new ConfigurablePermissionHandler({
		mode: PermissionMode.DENY_BY_DEFAULT
	});
	
	const result = await handler.requestPermission(createContext('search_code'));
	
	t.false(result.approved);
	t.true(result.reason!.includes('denied by default'));
});

test('pre-approved tools bypass mode restrictions', async t => {
	const handler = new ConfigurablePermissionHandler({
		mode: PermissionMode.DENY_BY_DEFAULT,
		preApprovedTools: ['search_code']
	});
	
	const result = await handler.requestPermission(createContext('search_code'));
	
	t.true(result.approved);
	t.true(result.reason!.includes('Pre-approved'));
});

test('hasPreApproval returns correct status', t => {
	const handler = new ConfigurablePermissionHandler({
		preApprovedTools: ['tool1', 'tool2']
	});
	
	t.true(handler.hasPreApproval('tool1'));
	t.true(handler.hasPreApproval('tool2'));
	t.false(handler.hasPreApproval('tool3'));
});

test('savePermissionPreference adds tool to pre-approved list', async t => {
	const handler = new ConfigurablePermissionHandler({
		mode: PermissionMode.REQUIRE_APPROVAL
	});
	
	t.false(handler.hasPreApproval('new_tool'));
	
	await handler.savePermissionPreference('new_tool', true);
	
	t.true(handler.hasPreApproval('new_tool'));
	
	const result = await handler.requestPermission(createContext('new_tool'));
	t.true(result.approved);
});

test('savePermissionPreference removes tool from pre-approved list', async t => {
	const handler = new ConfigurablePermissionHandler({
		preApprovedTools: ['tool1']
	});
	
	t.true(handler.hasPreApproval('tool1'));
	
	await handler.savePermissionPreference('tool1', false);
	
	t.false(handler.hasPreApproval('tool1'));
});

test('clearPreferences removes all pre-approved tools', async t => {
	const handler = new ConfigurablePermissionHandler({
		preApprovedTools: ['tool1', 'tool2', 'tool3']
	});
	
	t.true(handler.hasPreApproval('tool1'));
	
	await handler.clearPreferences();
	
	t.false(handler.hasPreApproval('tool1'));
	t.false(handler.hasPreApproval('tool2'));
	t.false(handler.hasPreApproval('tool3'));
});

test('setMode changes permission mode', async t => {
	const handler = new ConfigurablePermissionHandler({
		mode: PermissionMode.DENY_BY_DEFAULT
	});
	
	let result = await handler.requestPermission(createContext('tool1'));
	t.false(result.approved);
	
	handler.setMode(PermissionMode.AUTO_APPROVE);
	
	result = await handler.requestPermission(createContext('tool1'));
	t.true(result.approved);
});

test('getConfig returns current configuration', t => {
	const handler = new ConfigurablePermissionHandler({
		mode: PermissionMode.REQUIRE_APPROVAL,
		preApprovedTools: ['tool1'],
		dangerousToolsRequireApproval: true
	});
	
	const config = handler.getConfig();
	
	t.is(config.mode, PermissionMode.REQUIRE_APPROVAL);
	t.deepEqual(config.preApprovedTools, ['tool1']);
	t.true(config.dangerousToolsRequireApproval);
});
