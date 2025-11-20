/**
 * Tests for CommandService
 * Coverage target: 95%
 */

import test from 'ava';
import sinon from 'sinon';
import {CommandService} from '../../../../dist/core/application/services/CommandService.js';
import {Command, CommandCategory} from '../../../../dist/core/domain/valueObjects/Command.js';

test('registers and retrieves commands', t => {
	const service = new CommandService();
	const executor = { execute: sinon.stub().resolves() };
	const cmd = new Command({
		cmd: '/test',
		desc: 'Test command',
		category: CommandCategory.SYSTEM
	}, executor);

	service.register(cmd);
	
	t.is(service.get('/test'), cmd);
	t.true(service.has('/test'));
});

test('retrieves by alias', t => {
	const service = new CommandService();
	const executor = { execute: sinon.stub().resolves() };
	const cmd = new Command({
		cmd: '/test',
		desc: 'Test command',
		category: CommandCategory.SYSTEM,
		aliases: ['/t']
	}, executor);

	service.register(cmd);
	
	t.is(service.get('/t'), cmd);
});

test('filters commands', t => {
	const service = new CommandService();
	// Default commands are registered in constructor
	
	const results = service.filter('/hel');
	t.true(results.some(c => c.cmd === '/help'));
	
	const results2 = service.filter('/x');
	t.is(results2.length, 0);
});

test('executes default commands', async t => {
	const service = new CommandService();
	const helpCmd = service.get('/help');
	
	const mockPresenter = {
		addSystemMessage: sinon.stub()
	};
	
	if (!helpCmd) {
		t.fail('Help command not found');
		return;
	}

	await helpCmd.execute([], mockPresenter);
	
	t.true(mockPresenter.addSystemMessage.called);
});
