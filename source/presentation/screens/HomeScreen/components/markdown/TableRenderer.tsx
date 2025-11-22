/**
 * Table renderer component for markdown tables
 */

import React from 'react';
import {Box, Text} from 'ink';
import {THEME_COLORS} from '../../utils/colors';
import {measureTextWidth, padText, truncateText} from '../../utils/textUtils';

export interface TableRendererProps {
	headers: string[];
	rows: string[][];
	terminalWidth?: number;
}

/**
 * TableRenderer component - displays markdown tables with borders
 */
export const TableRenderer: React.FC<TableRendererProps> = ({
	headers,
	rows,
	terminalWidth,
}) => {
	if (!headers || headers.length === 0) return null;

	const columnWidths = calculateColumnWidths(headers, rows, terminalWidth);

	const totalWidth = columnWidths.reduce((sum, w) => sum + w, 0) + headers.length * 3 + 1;
	const shouldTruncate = terminalWidth ? totalWidth > terminalWidth : false;

	return (
		<Box flexDirection="column" paddingY={1}>
			<TableRow
				cells={headers}
				widths={columnWidths}
				isHeader
				shouldTruncate={shouldTruncate}
			/>

			<TableSeparator widths={columnWidths} />

			{rows.map((row, index) => (
				<TableRow
					key={index}
					cells={row}
					widths={columnWidths}
					isHeader={false}
					shouldTruncate={shouldTruncate}
				/>
			))}
		</Box>
	);
};

/**
 * Table row component
 */
const TableRow: React.FC<{
	cells: string[];
	widths: number[];
	isHeader: boolean;
	shouldTruncate: boolean;
}> = ({cells, widths, isHeader, shouldTruncate}) => {
	return (
		<Box flexDirection="row">
			<Text color={THEME_COLORS.ui.border}>│</Text>
			{cells.map((cell, index) => {
				const width = widths[index] || 10;
				const content = shouldTruncate && cell.length > width
					? truncateText(cell, width)
					: padText(cell, width, 'left');

				return (
					<React.Fragment key={index}>
						<Box paddingX={1}>
							<Text bold={isHeader} color={isHeader ? THEME_COLORS.text.accent : THEME_COLORS.text.secondary}>
								{content}
							</Text>
						</Box>
						<Text color={THEME_COLORS.ui.border}>│</Text>
					</React.Fragment>
				);
			})}
		</Box>
	);
};

/**
 * Table separator line
 */
const TableSeparator: React.FC<{widths: number[]}> = ({widths}) => {
	return (
		<Box flexDirection="row">
			<Text color={THEME_COLORS.ui.border}>├</Text>
			{widths.map((width, index) => (
				<React.Fragment key={index}>
					<Text color={THEME_COLORS.ui.border}>
						{'─'.repeat(width + 2)}
					</Text>
					<Text color={THEME_COLORS.ui.border}>
						{index === widths.length - 1 ? '┤' : '┼'}
					</Text>
				</React.Fragment>
			))}
		</Box>
	);
};

/**
 * Calculate optimal column widths
 */
function calculateColumnWidths(
	headers: string[],
	rows: string[][],
	terminalWidth?: number,
): number[] {
	const numColumns = headers.length;
	const widths: number[] = [];

	for (let i = 0; i < numColumns; i++) {
		const headerWidth = measureTextWidth(headers[i]);
		const maxRowWidth = Math.max(
			...rows.map(row => measureTextWidth(row[i] || '')),
			0,
		);

		widths[i] = Math.max(headerWidth, maxRowWidth, 3);
	}

	if (terminalWidth) {
		const totalWidth = widths.reduce((sum, w) => sum + w, 0) + numColumns * 3 + 1;

		if (totalWidth > terminalWidth) {
			const scale = (terminalWidth - numColumns * 3 - 1) / widths.reduce((sum, w) => sum + w, 0);
			for (let i = 0; i < widths.length; i++) {
				widths[i] = Math.max(Math.floor(widths[i] * scale), 3);
			}
		}
	}

	return widths;
}
