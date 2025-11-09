/**
 * Inline markdown renderer - handles bold, italic, code, links within text
 */

import React from 'react';
import {Text} from 'ink';
import {parseInlineTokens} from '../../utils/inlineParser';
import {THEME_COLORS} from '../../utils/colors';
import type {InlineToken} from '../../types/markdown';

export interface RenderInlineProps {
	text: string;
	defaultColor?: string;
}

/**
 * RenderInline component - renders text with inline markdown formatting
 */
export const RenderInline: React.FC<RenderInlineProps> = ({
	text,
	defaultColor = THEME_COLORS.text.primary,
}) => {
	if (!text) return null;

	// Parse inline tokens
	const tokens = parseInlineTokens(text);

	if (tokens.length === 0) {
		return <Text color={defaultColor}>{text}</Text>;
	}

	return (
		<>
			{tokens.map((token, index) => (
				<RenderToken key={index} token={token} defaultColor={defaultColor} />
			))}
		</>
	);
};

/**
 * Render a single inline token
 */
const RenderToken: React.FC<{
	token: InlineToken;
	defaultColor: string;
}> = ({token, defaultColor}) => {
	switch (token.type) {
		case 'bold':
			return (
				<Text bold color={defaultColor}>
					{token.content}
				</Text>
			);

		case 'italic':
			return (
				<Text italic color={defaultColor}>
					{token.content}
				</Text>
			);

		case 'code':
			return (
				<Text
					backgroundColor={THEME_COLORS.ui.background}
					color={THEME_COLORS.syntax.string}
				>
					{' '}
					{token.content}
					{' '}
				</Text>
			);

		case 'link':
			return (
				<Text
					color={THEME_COLORS.text.accent}
					underline
					dimColor
				>
					{token.content}
					{token.url && ` (${token.url})`}
				</Text>
			);

		case 'text':
		default:
			return <Text color={defaultColor}>{token.content}</Text>;
	}
};
