/**
 * Convert lowlight syntax tokens to Ink React elements
 */

import React from 'react';
import {Text} from 'ink';
import type {Root, Element, Text as HastText} from 'hast';
import {getSyntaxColor} from './colors';

/**
 * Convert lowlight tokens to Ink React elements
 * @param result - Lowlight highlight result
 * @returns React elements with syntax highlighting
 */
export function tokensToInkElements(result: Root | null): React.ReactNode {
	if (!result || !result.children || result.children.length === 0) {
		return null;
	}

	return result.children.map((node, index) => convertNode(node, index));
}

/**
 * Convert a single HAST node to React element
 */
function convertNode(node: any, index: number): React.ReactNode {
	// Text node
	if (node.type === 'text') {
		return (node as HastText).value;
	}

	// Element node
	if (node.type === 'element') {
		const element = node as Element;
		const className = element.properties?.className;
		const color = getColorFromClassName(className);

		// Recursively convert children
		const children = element.children?.map((child, i) => convertNode(child, i));

		return (
			<Text key={index} color={color}>
				{children}
			</Text>
		);
	}

	return null;
}

/**
 * Extract token type from className and get corresponding color
 */
function getColorFromClassName(className: any): string | undefined {
	if (!className || !Array.isArray(className)) {
		return undefined;
	}

	// Find hljs class (e.g., 'hljs-keyword', 'hljs-string')
	const hljsClass = className.find((c: string) => c.startsWith('hljs-'));

	if (!hljsClass) {
		return undefined;
	}

	// Extract token type (e.g., 'keyword' from 'hljs-keyword')
	const tokenType = hljsClass.substring(5); // Remove 'hljs-' prefix

	return getSyntaxColor(tokenType);
}

/**
 * Convert highlighted code to Ink elements with line numbers
 * @param result - Lowlight result
 * @param showLineNumbers - Whether to show line numbers
 * @returns Array of line elements
 */
export function codeToInkLines(
	result: Root | null,
	code: string,
	showLineNumbers: boolean = true,
): React.ReactNode[] {
	const lines = code.split('\n');
	const maxLineNumWidth = String(lines.length).length;

	if (!result) {
		// No syntax highlighting - return plain text lines
		return lines.map((line, index) => {
			const lineNum = String(index + 1).padStart(maxLineNumWidth, ' ');
			return (
				<React.Fragment key={index}>
					{showLineNumbers && (
						<Text color="gray" dimColor>
							{lineNum}{' '}
						</Text>
					)}
					<Text>{line}</Text>
				</React.Fragment>
			);
		});
	}

	// With syntax highlighting
	const highlighted = tokensToInkElements(result);

	// Split highlighted content by lines
	// This is a simplified approach - proper line splitting with preserved highlighting
	// would require more complex logic to maintain token boundaries

	return lines.map((line, index) => {
		const lineNum = String(index + 1).padStart(maxLineNumWidth, ' ');
		return (
			<React.Fragment key={index}>
				{showLineNumbers && (
					<Text color="gray" dimColor>
						{lineNum}{' '}
					</Text>
				)}
				{/* For now, show line without per-line highlighting */}
				{/* TODO: Implement proper per-line highlighting while preserving tokens */}
				<Text>{line}</Text>
			</React.Fragment>
		});
	});
}

/**
 * Simple approach: render entire highlighted code at once
 * @param result - Lowlight result
 * @returns Single React element with all highlighting
 */
export function renderHighlightedCode(result: Root | null): React.ReactNode {
	if (!result) return null;
	return tokensToInkElements(result);
}
