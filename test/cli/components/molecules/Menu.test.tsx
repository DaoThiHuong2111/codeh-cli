/**
 * Tests for Menu Component
 * Coverage target: 95%
 */

import React from 'react';
import test from 'ava';
import {render} from 'ink-testing-library';
import Menu from '../../../../dist/cli/components/molecules/Menu.js';

const items = [
	{label: 'Item 1', value: '1'},
	{label: 'Item 2', value: '2', description: 'Desc 2'}
];

test('renders menu items', t => {
	const {lastFrame} = render(
		<Menu items={items} selectedIndex={0} />
	);
	t.true(lastFrame()?.includes('Item 1'));
	t.true(lastFrame()?.includes('Item 2'));
	t.true(lastFrame()?.includes('Desc 2'));
});

test('highlights selected item', t => {
	const {lastFrame} = render(
		<Menu items={items} selectedIndex={1} />
	);
	t.true(lastFrame()?.includes('› Item 2'));
	t.false(lastFrame()?.includes('› Item 1'));
});
