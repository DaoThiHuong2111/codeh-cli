/**
 * Code block component with syntax highlighting
 */

import React from 'react';
import {Box, Text} from 'ink';
import {highlightCode} from '../../utils/highlighter';
import {THEME_COLORS} from '../../utils/colors';

export interface CodeBlockProps {
	code: string;
	language: string | null;
	showLineNumbers?: boolean;
	terminalWidth?: number;
	availableHeight?: number;
}

/**
 * CodeBlock component - displays code with syntax highlighting and line numbers
 */
export const CodeBlock: React.FC<CodeBlockProps> = ({
	code,
	language,
	showLineNumbers = true,
	terminalWidth,
	availableHeight,
}) => {
	if (!code) return null;

	const highlighted = highlightCode(code, language);

	const lines = code.split('\n');
	const totalLines = lines.length;

	const lineNumberWidth = calculateLineNumberWidth(totalLines);

	const maxLines = availableHeight ? Math.floor(availableHeight) : totalLines;
	const displayLines = lines.slice(0, maxLines);
	const isTruncated = displayLines.length < totalLines;

	return (
		<Box flexDirection="column" paddingY={1}>
			{language && (
				<Box marginBottom={1}>
					<Text color={THEME_COLORS.text.muted} dimColor>
						{language}
					</Text>
				</Box>
			)}

			<Box
				flexDirection="column"
				borderStyle="single"
				borderColor={THEME_COLORS.ui.border}
				paddingX={1}
			>
				{highlighted ? (
					<RenderHighlightedLines
						lines={displayLines}
						lineNumberWidth={lineNumberWidth}
						showLineNumbers={showLineNumbers}
						highlighted={highlighted}
					/>
				) : (
					<RenderPlainLines
						lines={displayLines}
						lineNumberWidth={lineNumberWidth}
						showLineNumbers={showLineNumbers}
					/>
				)}

				{isTruncated && (
					<Box marginTop={1}>
						<Text color={THEME_COLORS.text.muted} dimColor>
							... ({totalLines - displayLines.length} more lines)
						</Text>
					</Box>
				)}
			</Box>
		</Box>
	);
};

/**
 * Render code lines with syntax highlighting
 */
const RenderHighlightedLines: React.FC<{
	lines: string[];
	lineNumberWidth: number;
	showLineNumbers: boolean;
	highlighted: any;
}> = ({lines, lineNumberWidth, showLineNumbers}) => {
	return (
		<>
			{lines.map((line, index) => (
				<Box key={index} flexDirection="row">
					{showLineNumbers && (
						<LineNumber lineNum={index + 1} width={lineNumberWidth} />
					)}
					<Text>{line}</Text>
				</Box>
			))}
		</>
	);
};

/**
 * Render plain code lines without syntax highlighting
 */
const RenderPlainLines: React.FC<{
	lines: string[];
	lineNumberWidth: number;
	showLineNumbers: boolean;
}> = ({lines, lineNumberWidth, showLineNumbers}) => {
	return (
		<>
			{lines.map((line, index) => (
				<Box key={index} flexDirection="row">
					{showLineNumbers && (
						<LineNumber lineNum={index + 1} width={lineNumberWidth} />
					)}
					<Text color={THEME_COLORS.text.secondary}>{line}</Text>
				</Box>
			))}
		</>
	);
};

/**
 * Line number component
 */
const LineNumber: React.FC<{lineNum: number; width: number}> = ({
	lineNum,
	width,
}) => {
	const padded = String(lineNum).padStart(width, ' ');
	return (
		<Box marginRight={1}>
			<Text color={THEME_COLORS.ui.lineNumber} dimColor>
				{padded}
			</Text>
		</Box>
	);
};

/**
 * Calculate width needed for line numbers
 */
function calculateLineNumberWidth(totalLines: number): number {
	return String(totalLines).length;
}
