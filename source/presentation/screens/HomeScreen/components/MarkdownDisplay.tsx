/**
 * Main markdown display component
 * Parses and renders markdown with all supported features
 */

import React from 'react';
import {Box, Text} from 'ink';
import {parseMarkdown} from '../utils/markdownParser';
import {CodeBlock} from './markdown/CodeBlock';
import {TableRenderer} from './markdown/TableRenderer';
import {RenderInline} from './markdown/InlineMarkdownRenderer';
import {THEME_COLORS} from '../utils/colors';
import type {
	AnyMarkdownBlock,
	HeadingBlock,
	CodeBlock as CodeBlockType,
	ListBlock,
	TableBlock,
} from '../types/markdown';

export interface MarkdownDisplayProps {
	text: string;
	isPending: boolean;
	terminalWidth: number;
	availableHeight?: number;
	renderMarkdown?: boolean;
}

/**
 * MarkdownDisplay component - main markdown renderer
 */
export const MarkdownDisplay: React.FC<MarkdownDisplayProps> = ({
	text,
	isPending,
	terminalWidth,
	availableHeight,
	renderMarkdown = true,
}) => {
	if (!text) return null;

	// Raw markdown mode - show syntax-highlighted markdown code
	if (!renderMarkdown) {
		return (
			<CodeBlock
				code={text}
				language="markdown"
				showLineNumbers={false}
				terminalWidth={terminalWidth}
				availableHeight={availableHeight}
			/>
		);
	}

	// Parse markdown into blocks
	const blocks = parseMarkdown(text);

	if (blocks.length === 0) {
		return <Text color={THEME_COLORS.text.primary}>{text}</Text>;
	}

	return (
		<Box flexDirection="column">
			{blocks.map((block, index) => (
				<RenderBlock
					key={`block-${index}`}
					block={block}
					index={index}
					isPending={isPending && index === blocks.length - 1}
					terminalWidth={terminalWidth}
					availableHeight={availableHeight}
				/>
			))}
		</Box>
	);
};

/**
 * Render individual markdown block
 */
const RenderBlock: React.FC<{
	block: AnyMarkdownBlock;
	index: number;
	isPending: boolean;
	terminalWidth: number;
	availableHeight?: number;
}> = ({block, index, isPending, terminalWidth, availableHeight}) => {
	switch (block.type) {
		case 'heading':
			return <RenderHeading block={block as HeadingBlock} />;

		case 'code':
			return (
				<CodeBlock
					code={(block as CodeBlockType).code}
					language={(block as CodeBlockType).language}
					showLineNumbers
					terminalWidth={terminalWidth}
					availableHeight={availableHeight}
				/>
			);

		case 'list':
			return <RenderList block={block as ListBlock} />;

		case 'table':
			return (
				<TableRenderer
					headers={(block as TableBlock).headers}
					rows={(block as TableBlock).rows}
					terminalWidth={terminalWidth}
				/>
			);

		case 'blockquote':
			return <RenderBlockquote content={block.content} />;

		case 'hr':
			return <RenderHorizontalRule terminalWidth={terminalWidth} />;

		case 'paragraph':
			return (
				<RenderParagraph
					content={block.content}
					isPending={isPending}
				/>
			);

		default:
			return null;
	}
};

/**
 * Render heading
 */
const RenderHeading: React.FC<{block: HeadingBlock}> = ({block}) => {
	const colors = [
		THEME_COLORS.text.accent, // H1
		THEME_COLORS.text.accent, // H2
		THEME_COLORS.text.primary, // H3
		THEME_COLORS.text.secondary, // H4
	];

	const color = colors[block.level - 1] || THEME_COLORS.text.primary;

	return (
		<Box marginY={1}>
			<Text bold color={color}>
				{block.content}
			</Text>
		</Box>
	);
};

/**
 * Render list
 */
const RenderList: React.FC<{block: ListBlock}> = ({block}) => {
	const {listType, items} = block;

	return (
		<Box flexDirection="column" marginY={1}>
			{items.map((item, index) => {
				const bullet = listType === 'ordered' ? `${index + 1}.` : '•';
				const indent = ' '.repeat(item.indent);

				return (
					<Box key={index} flexDirection="row">
						<Text color={THEME_COLORS.text.muted}>
							{indent}
							{bullet}{' '}
						</Text>
						<Text color={THEME_COLORS.text.secondary}>
							<RenderInline text={item.content} />
						</Text>
					</Box>
				);
			})}
		</Box>
	);
};

/**
 * Render blockquote
 */
const RenderBlockquote: React.FC<{content: string}> = ({content}) => {
	return (
		<Box
			marginY={1}
			paddingLeft={2}
			borderStyle="single"
			borderLeft
			borderColor={THEME_COLORS.ui.border}
		>
			<Text color={THEME_COLORS.text.muted} italic>
				<RenderInline text={content} />
			</Text>
		</Box>
	);
};

/**
 * Render horizontal rule
 */
const RenderHorizontalRule: React.FC<{terminalWidth: number}> = ({
	terminalWidth,
}) => {
	const width = Math.min(terminalWidth || 80, 80);
	return (
		<Box marginY={1}>
			<Text color={THEME_COLORS.ui.border}>{'─'.repeat(width)}</Text>
		</Box>
	);
};

/**
 * Render paragraph
 */
const RenderParagraph: React.FC<{content: string; isPending: boolean}> = ({
	content,
	isPending,
}) => {
	return (
		<Box marginY={1}>
			<Text wrap="wrap" color={THEME_COLORS.text.secondary}>
				<RenderInline text={content} />
			</Text>
		</Box>
	);
};
