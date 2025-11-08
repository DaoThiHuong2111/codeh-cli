/**
 * Unit tests for ProgressBar component
 */

import test from 'ava';
import React from 'react';
import { render } from 'ink-testing-library';
import ProgressBar from '../../../source/cli/components/atoms/ProgressBar.js';

// === Rendering Tests ===

test('renders progress bar with correct percentage', (t) => {
	const { lastFrame } = render(<ProgressBar current={50} total={100} />);
	const output = lastFrame();

	t.true(output.includes('50%'));
	t.true(output.includes('(50/100)'));
});

test('renders progress bar with 0%', (t) => {
	const { lastFrame } = render(<ProgressBar current={0} total={100} />);
	const output = lastFrame();

	t.true(output.includes('0%'));
});

test('renders progress bar with 100%', (t) => {
	const { lastFrame } = render(<ProgressBar current={100} total={100} />);
	const output = lastFrame();

	t.true(output.includes('100%'));
});

test('renders filled and empty bar sections', (t) => {
	const { lastFrame } = render(<ProgressBar current={50} total={100} width={20} />);
	const output = lastFrame();

	// Should have filled section (█) and empty section (░)
	t.true(output.includes('█'));
	t.true(output.includes('░'));
});

// === Percentage Calculation Tests ===

test('calculates correct percentage for fractional values', (t) => {
	const { lastFrame } = render(<ProgressBar current={33} total={100} />);
	const output = lastFrame();

	t.true(output.includes('33%'));
});

test('handles percentage over 100% (caps at 100)', (t) => {
	const { lastFrame } = render(<ProgressBar current={150} total={100} />);
	const output = lastFrame();

	t.true(output.includes('100%'));
});

test('handles zero total gracefully', (t) => {
	// Should not crash
	t.notThrows(() => {
		render(<ProgressBar current={0} total={0} />);
	});
});

// === Props Tests ===

test('respects showPercentage prop', (t) => {
	const { lastFrame } = render(
		<ProgressBar current={50} total={100} showPercentage={false} />
	);
	const output = lastFrame();

	// Should show count but not percentage
	t.true(output.includes('(50/100)'));
	t.false(output.includes('%'));
});

test('uses custom width', (t) => {
	const { lastFrame } = render(
		<ProgressBar current={50} total={100} width={10} />
	);
	const output = lastFrame();

	// With width=10 and 50%, should have ~5 filled chars
	const filledCount = (output.match(/█/g) || []).length;
	t.true(filledCount >= 4 && filledCount <= 6); // Allow some tolerance
});

test('uses custom character', (t) => {
	const { lastFrame } = render(
		<ProgressBar current={50} total={100} char="■" />
	);
	const output = lastFrame();

	t.true(output.includes('■'));
	t.false(output.includes('█'));
});

test('applies custom color prop', (t) => {
	// Color is applied via Ink's Text component, can't test visually
	// but we verify it renders without errors
	t.notThrows(() => {
		render(<ProgressBar current={50} total={100} color="yellow" />);
	});
});

// === Edge Cases ===

test('handles very small progress', (t) => {
	const { lastFrame } = render(<ProgressBar current={1} total={1000} />);
	const output = lastFrame();

	t.true(output.includes('0%') || output.includes('1%')); // Depends on rounding
});

test('handles very large numbers', (t) => {
	const { lastFrame } = render(<ProgressBar current={999999} total={1000000} />);
	const output = lastFrame();

	t.true(output.includes('100%') || output.includes('99%'));
});

test('renders correctly with minimal width', (t) => {
	const { lastFrame } = render(
		<ProgressBar current={50} total={100} width={1} />
	);
	const output = lastFrame();

	// Should still render something
	t.truthy(output);
	t.true(output.length > 0);
});
