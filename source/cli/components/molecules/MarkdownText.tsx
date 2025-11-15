/**
 * Markdown Text Component
 * Renders markdown formatted text with syntax highlighting
 */

import {Box, Text} from 'ink';
import React, {useMemo} from 'react';
import {
	MarkdownService,
	BlockType,
	MarkdownBlock,
} from '../../../core/application/services/MarkdownService.js';

interface MarkdownTextProps {
	content: string;
}

// Code Block Component
const CodeBlock: React.FC<{content: string; language?: string}> = ({
	content,
	language,
}) => {
	return (
		<Box
			flexDirection="column"
			borderStyle="single"
			borderColor="gray"
			paddingX={1}
			marginY={1}
		>
			{language && language !== 'text' && (
				<Text color="cyan" dimColor wrap="wrap">
					{language}
				</Text>
			)}
			<Text color="green" wrap="wrap">{content}</Text>
		</Box>
	);
};

// Heading Component
const Heading: React.FC<{content: string; level: number}> = ({
	content,
	level,
}) => {
	const colors: Record<number, string> = {
		1: 'magenta',
		2: 'cyan',
		3: 'blue',
		4: 'yellow',
		5: 'green',
		6: 'white',
	};

	const color = colors[level] || 'white';

	return (
		<Box marginY={level === 1 ? 1 : 0}>
			<Text color={color} bold wrap="wrap">
				{content}
			</Text>
		</Box>
	);
};

// List Component
const ListBlock: React.FC<{items: string[]}> = ({items}) => {
	return (
		<Box flexDirection="column" marginY={1}>
			{items.map((item, index) => (
				<Box key={index} marginLeft={2}>
					<Text color="yellow">• </Text>
					<InlineText content={item} />
				</Box>
			))}
		</Box>
	);
};

// Blockquote Component
const Blockquote: React.FC<{content: string}> = ({content}) => {
	return (
		<Box marginY={1} marginLeft={2} borderStyle="single" borderColor="gray">
			<Text color="gray" italic wrap="wrap">
				{content}
			</Text>
		</Box>
	);
};

// Inline Text Component (handles bold, italic, code)
const InlineText: React.FC<{content: string}> = ({content}) => {
	const service = useMemo(() => new MarkdownService(), []);
	const tokens = useMemo(() => service.parseInline(content), [content]);

	return (
		<>
			{tokens.map((token, index) => {
				if (token.type === 'bold') {
					return (
						<Text key={index} bold wrap="wrap">
							{token.content}
						</Text>
					);
				}
				if (token.type === 'italic') {
					return (
						<Text key={index} italic wrap="wrap">
							{token.content}
						</Text>
					);
				}
				if (token.type === 'code') {
					return (
						<Text key={index} color="green" backgroundColor="black" wrap="wrap">
							{token.content}
						</Text>
					);
				}
				return <Text key={index} wrap="wrap">{token.content}</Text>;
			})}
		</>
	);
};

// Paragraph Component
const Paragraph: React.FC<{content: string}> = ({content}) => {
	return (
		<Box marginY={1}>
			<InlineText content={content} />
		</Box>
	);
};

// Main MarkdownText Component
export const MarkdownText: React.FC<MarkdownTextProps> = ({content}) => {
	const service = useMemo(() => new MarkdownService(), []);
	const blocks = useMemo(() => service.parse(content), [content]);

	// If no markdown detected, render as plain text
	if (
		blocks.length === 0 ||
		(blocks.length === 1 &&
			blocks[0].type === BlockType.PARAGRAPH &&
			!content.includes('**') &&
			!content.includes('*') &&
			!content.includes('`'))
	) {
		return <Text wrap="wrap">{content}</Text>;
	}

	return (
		<Box flexDirection="column">
			{blocks.map((block: MarkdownBlock, index: number) => {
				switch (block.type) {
					case BlockType.CODE_BLOCK:
						return (
							<CodeBlock
								key={index}
								content={block.content}
								language={block.language}
							/>
						);
					case BlockType.HEADING:
						return (
							<Heading
								key={index}
								content={block.content}
								level={block.level || 1}
							/>
						);
					case BlockType.LIST:
						return <ListBlock key={index} items={block.items || []} />;
					case BlockType.BLOCKQUOTE:
						return <Blockquote key={index} content={block.content} />;
					case BlockType.PARAGRAPH:
					default:
						return <Paragraph key={index} content={block.content} />;
				}
			})}
		</Box>
	);
};
