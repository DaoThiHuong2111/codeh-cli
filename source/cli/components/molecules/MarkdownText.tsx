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

// Table Block Component - renders tables with simple format (dashes and pipes)
// This format is more terminal-friendly and wraps better on resize
export const TableBlock: React.FC<{
	headers: string[];
	rows: string[][];
	alignments?: ('left' | 'center' | 'right')[];
}> = ({headers, rows, alignments = []}) => {
	// Simple format: each row as "| col1 | col2 | col3 |"
	// Header separator as "|---|---|---|"
	
	const formatRow = (cells: string[], isHeader = false): React.ReactNode => {
		return (
			<Text wrap="wrap">
				<Text color="gray">| </Text>
				{cells.map((cell, i) => (
					<React.Fragment key={i}>
						{isHeader ? (
							<Text color="cyan" bold>{cell}</Text>
						) : (
							<Text>{cell}</Text>
						)}
						<Text color="gray"> | </Text>
					</React.Fragment>
				))}
			</Text>
		);
	};

	const separator = '|' + headers.map(() => '---').join('|') + '|';

	return (
		<Box flexDirection="column" marginY={1}>
			{formatRow(headers, true)}
			<Text color="gray" wrap="wrap">{separator}</Text>
			{rows.map((row, rowIndex) => (
				<Box key={rowIndex}>
					{formatRow(row)}
				</Box>
			))}
		</Box>
	);
};

// Horizontal Rule Component - renders separator lines
export const HorizontalRule: React.FC = () => {
	return (
		<Box marginY={1}>
			<Text color="gray">{'─'.repeat(40)}</Text>
		</Box>
	);
};

// Link Component - displays links with text and URL
export const Link: React.FC<{text: string; url: string}> = ({text, url}) => {
	// If text equals URL, just show the URL once
	if (text === url) {
		return <Text color="blue" underline>{url}</Text>;
	}
	
	// Show text with URL in parentheses
	return (
		<Text>
			<Text color="blue" underline>{text}</Text>
			<Text color="gray"> ({url})</Text>
		</Text>
	);
};

// Code Block Component
const CodeBlock: React.FC<{content: string; language?: string}> = ({
	content,
	language,
}) => {
	// Check if this is a markdown code block - if so, parse and render the content as markdown
	const isMarkdownBlock = language && ['markdown', 'md'].includes(language.toLowerCase());
	
	if (isMarkdownBlock) {
		// Render markdown content recursively instead of as raw code
		return <MarkdownTextInner content={content} />;
	}

	// Filter out common non-code language hints that shouldn't be displayed
	const displayLanguage = language && 
		language !== 'text' && 
		!['plaintext', 'plain'].includes(language.toLowerCase())
			? language 
			: null;

	return (
		<Box
			flexDirection="column"
			borderStyle="single"
			borderColor="gray"
			paddingX={1}
			marginY={1}
		>
			{displayLanguage && (
				<Text color="cyan" dimColor wrap="wrap">
					{displayLanguage}
				</Text>
			)}
			<Text color="green" wrap="wrap">{content}</Text>
		</Box>
	);
};

// Inner component to avoid circular dependency - parses markdown content
const MarkdownTextInner: React.FC<{content: string}> = ({content}) => {
	const service = useMemo(() => new MarkdownService(), []);
	const blocks = useMemo(() => service.parse(content), [content]);

	return (
		<Box flexDirection="column">
			{blocks.map((block: MarkdownBlock, index: number) => {
				switch (block.type) {
					case BlockType.CODE_BLOCK:
						// Prevent infinite recursion - don't recursively parse markdown blocks
						const isNestedMarkdown = block.language && ['markdown', 'md'].includes(block.language.toLowerCase());
						if (isNestedMarkdown) {
							return <Text key={index} color="green" wrap="wrap">{block.content}</Text>;
						}
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
					case BlockType.TABLE:
						return (
							<TableBlock
								key={index}
								headers={block.headers || []}
								rows={block.rows || []}
								alignments={block.alignments}
							/>
						);
					case BlockType.HORIZONTAL_RULE:
						return <HorizontalRule key={index} />;
					case BlockType.PARAGRAPH:
					default:
						return <Paragraph key={index} content={block.content} />;
				}
			})}
		</Box>
	);
};

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

const ListBlock: React.FC<{items: string[]}> = ({items}) => {
	return (
		<Box flexDirection="column" marginY={1}>
			{items.map((item, index) => (
				<Box key={index} marginLeft={2}>
					<Text wrap="wrap">
						<Text color="yellow">• </Text>
						<InlineTextContent content={item} />
					</Text>
				</Box>
			))}
		</Box>
	);
};

// Helper component that returns inline content without wrapping Text
const InlineTextContent: React.FC<{content: string}> = ({content}) => {
	const service = useMemo(() => new MarkdownService(), []);
	const tokens = useMemo(() => service.parseInline(content), [content]);

	return (
		<>
			{tokens.map((token, index) => {
				if (token.type === 'bold') {
					return <Text key={index} bold>{token.content}</Text>;
				}
				if (token.type === 'italic') {
					return <Text key={index} italic>{token.content}</Text>;
				}
				if (token.type === 'code') {
					return <Text key={index} color="green" backgroundColor="black">{token.content}</Text>;
				}
				if (token.type === 'link' && token.url) {
					if (token.content === token.url) {
						return <Text key={index} color="blue" underline>{token.url}</Text>;
					}
					return (
						<Text key={index}>
							<Text color="blue" underline>{token.content}</Text>
							<Text color="gray"> ({token.url})</Text>
						</Text>
					);
				}
				if (token.type === 'bold_italic') {
					return <Text key={index} bold italic>{token.content}</Text>;
				}
				return <Text key={index}>{token.content}</Text>;
			})}
		</>
	);
};

const Blockquote: React.FC<{content: string}> = ({content}) => {
	return (
		<Box marginY={1} marginLeft={2} borderStyle="single" borderColor="gray">
			<Text color="gray" italic wrap="wrap">
				{content}
			</Text>
		</Box>
	);
};

const InlineText: React.FC<{content: string}> = ({content}) => {
	const service = useMemo(() => new MarkdownService(), []);
	const tokens = useMemo(() => service.parseInline(content), [content]);

	// Wrap all tokens in a single Text component to prevent unwanted line breaks
	return (
		<Text wrap="wrap">
			{tokens.map((token, index) => {
				if (token.type === 'bold') {
					return (
						<Text key={index} bold>
							{token.content}
						</Text>
					);
				}
				if (token.type === 'italic') {
					return (
						<Text key={index} italic>
							{token.content}
						</Text>
					);
				}
				if (token.type === 'code') {
					return (
						<Text key={index} color="green" backgroundColor="black">
							{token.content}
						</Text>
					);
				}
				if (token.type === 'link' && token.url) {
					// Inline link - show text with URL
					if (token.content === token.url) {
						return <Text key={index} color="blue" underline>{token.url}</Text>;
					}
					return (
						<Text key={index}>
							<Text color="blue" underline>{token.content}</Text>
							<Text color="gray"> ({token.url})</Text>
						</Text>
					);
				}
				if (token.type === 'bold_italic') {
					return (
						<Text key={index} bold italic>
							{token.content}
						</Text>
					);
				}
				return <Text key={index}>{token.content}</Text>;
			})}
		</Text>
	);
};

const Paragraph: React.FC<{content: string}> = ({content}) => {
	return (
		<Box marginY={1}>
			<InlineText content={content} />
		</Box>
	);
};

export const MarkdownText: React.FC<MarkdownTextProps> = ({content}) => {
	const service = useMemo(() => new MarkdownService(), []);
	const blocks = useMemo(() => service.parse(content), [content]);

	if (
		blocks.length === 0 ||
		(blocks.length === 1 &&
			blocks[0].type === BlockType.PARAGRAPH &&
			!content.includes('**') &&
			!content.includes('*') &&
			!content.includes('`'))
	) {
		// Use the sanitized content from the parsed block, not the original content
		// This ensures HTML entities are decoded and HTML tags are stripped
		const sanitizedContent = blocks.length > 0 ? blocks[0].content : content;
		return <Text wrap="wrap">{sanitizedContent}</Text>;
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
					case BlockType.TABLE:
						return (
							<TableBlock
								key={index}
								headers={block.headers || []}
								rows={block.rows || []}
								alignments={block.alignments}
							/>
						);
					case BlockType.HORIZONTAL_RULE:
						return <HorizontalRule key={index} />;
					case BlockType.PARAGRAPH:
					default:
						return <Paragraph key={index} content={block.content} />;
				}
			})}
		</Box>
	);
};
