/**
 * Key Parser Utility
 * Converts Ink's useInput key/input to normalized key combo strings
 */

import type {InkKey, KeyCombo, ParsedKeyCombo} from './types';

/**
 * Parse Ink input into normalized key combo string
 *
 * @example
 * parseKeyCombo('c', {ctrl: true}) => 'ctrl+c'
 * parseKeyCombo('', {shift: true, tab: true}) => 'shift+tab'
 * parseKeyCombo('', {escape: true}) => 'escape'
 * parseKeyCombo('?', {}) => '?'
 */
export function parseKeyCombo(input: string, key: InkKey): KeyCombo | null {
	const modifiers: string[] = [];
	let baseKey = '';

	if (key.upArrow) baseKey = 'up';
	else if (key.downArrow) baseKey = 'down';
	else if (key.leftArrow) baseKey = 'left';
	else if (key.rightArrow) baseKey = 'right';
	else if (key.escape) baseKey = 'escape';
	else if (key.tab) baseKey = 'tab';
	else if (key.return) baseKey = 'enter';
	else if (key.backspace) baseKey = 'backspace';
	else if (key.delete) baseKey = 'delete';
	else if (key.pageUp) baseKey = 'pageup';
	else if (key.pageDown) baseKey = 'pagedown';
	else if (input && input.length === 1) {
		baseKey = input.toLowerCase();
	}

	if (!baseKey) return null;

	const isSpecialKey = !input || input.length !== 1;

	if (isSpecialKey) {
		if (key.ctrl) modifiers.push('ctrl');
		if (key.shift) modifiers.push('shift');
		if (key.meta) modifiers.push('meta');
	} else {
		if (key.ctrl) modifiers.push('ctrl');
		if (key.meta) modifiers.push('meta');
	}

	if (modifiers.length > 0) {
		return [...modifiers, baseKey].join('+');
	}

	return baseKey;
}

/**
 * Parse key combo string into components
 *
 * @example
 * parseKeyComboString('ctrl+c') => {key: 'c', ctrl: true, shift: false, ...}
 * parseKeyComboString('shift+tab') => {key: 'tab', shift: true, ...}
 * parseKeyComboString('escape') => {key: 'escape', ...}
 */
export function parseKeyComboString(combo: KeyCombo): ParsedKeyCombo {
	const parts = combo.toLowerCase().split('+');
	const parsed: ParsedKeyCombo = {
		key: '',
		ctrl: false,
		shift: false,
		meta: false,
		alt: false,
	};

	for (const part of parts) {
		if (part === 'ctrl') parsed.ctrl = true;
		else if (part === 'shift') parsed.shift = true;
		else if (part === 'meta') parsed.meta = true;
		else if (part === 'alt') parsed.alt = true;
		else parsed.key = part;
	}

	return parsed;
}

/**
 * Match two key combos
 */
export function matchKeyCombo(combo1: KeyCombo, combo2: KeyCombo): boolean {
	return combo1.toLowerCase() === combo2.toLowerCase();
}

/**
 * Normalize key combo string for consistent comparison
 */
export function normalizeKeyCombo(combo: KeyCombo): KeyCombo {
	const parsed = parseKeyComboString(combo);
	const parts: string[] = [];

	if (parsed.ctrl) parts.push('ctrl');
	if (parsed.shift) parts.push('shift');
	if (parsed.meta) parts.push('meta');
	if (parsed.alt) parts.push('alt');
	if (parsed.key) parts.push(parsed.key);

	return parts.join('+');
}

/**
 * Format key combo for display
 *
 * @example
 * formatKeyComboForDisplay('ctrl+c') => 'Ctrl+C'
 * formatKeyComboForDisplay('shift+tab') => 'Shift+Tab'
 */
export function formatKeyComboForDisplay(combo: KeyCombo): string {
	const parts = combo.split('+');
	return parts
		.map(part => part.charAt(0).toUpperCase() + part.slice(1))
		.join('+');
}
