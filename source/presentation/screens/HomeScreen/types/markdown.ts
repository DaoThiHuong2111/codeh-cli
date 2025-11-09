/**
 * Markdown parsing and rendering types
 */

/**
 * Type of markdown block
 */
export type MarkdownBlockType =
	| 'paragraph'
	| 'heading'
	| 'code'
	| 'list'
	| 'table'
	| 'blockquote'
	| 'hr';

/**
 * Heading level (H1-H4)
 */
export type HeadingLevel = 1 | 2 | 3 | 4;

/**
 * List type
 */
export type ListType = 'ordered' | 'unordered';

/**
 * Base markdown block
 */
export interface MarkdownBlock {
	type: MarkdownBlockType;
	content: string;
}

/**
 * Heading block
 */
export interface HeadingBlock extends MarkdownBlock {
	type: 'heading';
	level: HeadingLevel;
}

/**
 * Code block
 */
export interface CodeBlock extends MarkdownBlock {
	type: 'code';
	language: string | null;
	code: string;
}

/**
 * List item
 */
export interface ListItem {
	content: string;
	indent: number;
}

/**
 * List block
 */
export interface ListBlock extends MarkdownBlock {
	type: 'list';
	listType: ListType;
	items: ListItem[];
}

/**
 * Table block
 */
export interface TableBlock extends MarkdownBlock {
	type: 'table';
	headers: string[];
	rows: string[][];
}

/**
 * Paragraph block
 */
export interface ParagraphBlock extends MarkdownBlock {
	type: 'paragraph';
}

/**
 * Blockquote block
 */
export interface BlockquoteBlock extends MarkdownBlock {
	type: 'blockquote';
}

/**
 * Horizontal rule block
 */
export interface HrBlock extends MarkdownBlock {
	type: 'hr';
}

/**
 * Union type of all block types
 */
export type AnyMarkdownBlock =
	| HeadingBlock
	| CodeBlock
	| ListBlock
	| TableBlock
	| ParagraphBlock
	| BlockquoteBlock
	| HrBlock;

/**
 * Inline token type
 */
export type InlineTokenType = 'text' | 'bold' | 'italic' | 'code' | 'link';

/**
 * Inline markdown token
 */
export interface InlineToken {
	type: InlineTokenType;
	content: string;
	url?: string; // For link tokens
}

/**
 * Code fence information
 */
export interface CodeFenceInfo {
	fence: string; // The fence characters (``` or ~~~)
	language: string | null;
}
