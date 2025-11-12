/**
 * Symbol Explorer Component
 * Displays code symbol hierarchy in tree format
 */

import {Box, Text} from 'ink';
import React from 'react';
import {Symbol, SymbolKind} from '../../../core/domain/models/Symbol.js';

export interface SymbolExplorerProps {
	symbols: Symbol[];
	title?: string;
	maxHeight?: number;
	showLocation?: boolean;
}

// Symbol kind icon and color mapping
const SYMBOL_KIND_CONFIG: Record<
	SymbolKind,
	{icon: string; color: string}
> = {
	[SymbolKind.File]: {icon: '📄', color: 'white'},
	[SymbolKind.Module]: {icon: '📦', color: 'blue'},
	[SymbolKind.Namespace]: {icon: '🗂️ ', color: 'cyan'},
	[SymbolKind.Package]: {icon: '📦', color: 'blue'},
	[SymbolKind.Class]: {icon: '🏛️ ', color: 'yellow'},
	[SymbolKind.Method]: {icon: 'ƒ', color: 'magenta'},
	[SymbolKind.Property]: {icon: '⚡', color: 'cyan'},
	[SymbolKind.Field]: {icon: '○', color: 'gray'},
	[SymbolKind.Constructor]: {icon: '🏗️ ', color: 'green'},
	[SymbolKind.Enum]: {icon: '🔢', color: 'yellow'},
	[SymbolKind.Interface]: {icon: '🔌', color: 'cyan'},
	[SymbolKind.Function]: {icon: 'ƒ', color: 'blue'},
	[SymbolKind.Variable]: {icon: 'v', color: 'white'},
	[SymbolKind.Constant]: {icon: 'C', color: 'green'},
	[SymbolKind.String]: {icon: '"', color: 'green'},
	[SymbolKind.Number]: {icon: '#', color: 'blue'},
	[SymbolKind.Boolean]: {icon: '?', color: 'yellow'},
	[SymbolKind.Array]: {icon: '[]', color: 'cyan'},
	[SymbolKind.Object]: {icon: '{}', color: 'yellow'},
	[SymbolKind.Key]: {icon: 'K', color: 'white'},
	[SymbolKind.Null]: {icon: 'ø', color: 'gray'},
	[SymbolKind.EnumMember]: {icon: '•', color: 'yellow'},
	[SymbolKind.Struct]: {icon: '🏗️ ', color: 'yellow'},
	[SymbolKind.Event]: {icon: '⚡', color: 'magenta'},
	[SymbolKind.Operator]: {icon: '+', color: 'white'},
	[SymbolKind.TypeParameter]: {icon: 'T', color: 'cyan'},
};

// Single symbol item component
interface SymbolItemProps {
	symbol: Symbol;
	depth?: number;
	showLocation?: boolean;
}

const SymbolItem: React.FC<SymbolItemProps> = ({
	symbol,
	depth = 0,
	showLocation = false,
}) => {
	const config = SYMBOL_KIND_CONFIG[symbol.kind];
	const indent = '  '.repeat(depth);

	return (
		<Box flexDirection="column">
			{/* Symbol name and kind */}
			<Box>
				<Text>{indent}</Text>
				<Text color={config.color}>{config.icon}</Text>
				<Box marginLeft={1}>
					<Text bold color={config.color}>
						{symbol.name}
					</Text>
					<Box marginLeft={1}>
						<Text dimColor>({symbol.getKindName()})</Text>
					</Box>
				</Box>
			</Box>

			{/* Location info (optional) */}
			{showLocation && (
				<Box marginLeft={indent.length + 2}>
					<Text dimColor color="gray">
						{symbol.location.relativePath}:{symbol.location.startLine}
					</Text>
				</Box>
			)}

			{/* Children (recursive) */}
			{symbol.children && symbol.children.length > 0 && (
				<Box flexDirection="column">
					{symbol.children.map((child, index) => (
						<SymbolItem
							key={`${child.namePath}-${index}`}
							symbol={child}
							depth={depth + 1}
							showLocation={showLocation}
						/>
					))}
				</Box>
			)}
		</Box>
	);
};

export const SymbolExplorer: React.FC<SymbolExplorerProps> = ({
	symbols,
	title = '🔍 Symbol Explorer',
	maxHeight,
	showLocation = false,
}) => {
	if (symbols.length === 0) {
		return null; // Don't show if no symbols
	}

	// Count statistics
	const totalSymbols = countSymbols(symbols);
	const symbolsByKind = groupSymbolsByKind(symbols);

	return (
		<Box
			flexDirection="column"
			borderStyle="single"
			borderColor="cyan"
			paddingX={1}
			marginY={1}
		>
			{/* Header */}
			<Box>
				<Text bold color="cyan">
					{title}
				</Text>
				<Box marginLeft={1}>
					<Text dimColor>({totalSymbols} symbols)</Text>
				</Box>
			</Box>

			{/* Symbol kind summary */}
			<Box marginTop={1}>
				<Text dimColor>
					{Object.entries(symbolsByKind)
						.filter(([_, count]) => count > 0)
						.map(([kind, count]) => `${kind}: ${count}`)
						.join(' | ')}
				</Text>
			</Box>

			{/* Symbols Tree */}
			<Box flexDirection="column" marginTop={1}>
				{symbols.map((symbol, index) => (
					<SymbolItem
						key={`${symbol.namePath}-${index}`}
						symbol={symbol}
						depth={0}
						showLocation={showLocation}
					/>
				))}
			</Box>
		</Box>
	);
};

// Helper: Count total symbols (including children)
function countSymbols(symbols: Symbol[]): number {
	let count = symbols.length;
	for (const symbol of symbols) {
		if (symbol.children) {
			count += countSymbols(symbol.children);
		}
	}
	return count;
}

// Helper: Group symbols by kind
function groupSymbolsByKind(symbols: Symbol[]): Record<string, number> {
	const groups: Record<string, number> = {};

	function addSymbol(symbol: Symbol) {
		const kindName = symbol.getKindName();
		groups[kindName] = (groups[kindName] || 0) + 1;

		if (symbol.children) {
			symbol.children.forEach(addSymbol);
		}
	}

	symbols.forEach(addSymbol);
	return groups;
}
