/**
 * Tool Result Formatter
 * Standardizes tool output format for consistent AI consumption
 */

import {ToolExecutionResult} from '../../domain/interfaces/IToolExecutor';
import {ToolExecutionContext} from '../../domain/models/ToolExecutionContext';

/**
 * Standardized tool result schema
 */
export interface StandardizedToolResult {
	tool: string;
	status: 'success' | 'error';
	timestamp: string;
	duration?: number;
	summary: string;
	data?: any;
	error?: string;
	metadata?: Record<string, any>;
}

/**
 * Tool Result Formatter
 * Converts raw tool results to standardized, human-readable format
 */
export class ToolResultFormatter {
	/**
	 * Format tool result as markdown
	 */
	formatAsMarkdown(context: ToolExecutionContext): string {
		const standardized = this.standardize(context);

		let markdown = `## 🔧 Tool: ${standardized.tool}\n\n`;
		markdown += `**Status**: ${standardized.status === 'success' ? '✅ Success' : ' Error'}\n`;
		markdown += `**Time**: ${standardized.timestamp}`;

		if (standardized.duration) {
			markdown += ` (${standardized.duration}ms)`;
		}

		markdown += '\n\n';

		markdown += `### Summary\n${standardized.summary}\n\n`;

		if (standardized.data) {
			markdown += `### Results\n`;
			markdown += this.formatData(standardized.data);
			markdown += '\n';
		}

		if (standardized.error) {
			markdown += `### Error\n\`\`\`\n${standardized.error}\n\`\`\`\n`;
		}

		if (
			standardized.metadata &&
			Object.keys(standardized.metadata).length > 0
		) {
			markdown += `### Metadata\n`;
			for (const [key, value] of Object.entries(standardized.metadata)) {
				markdown += `- **${key}**: ${JSON.stringify(value)}\n`;
			}
		}

		return markdown;
	}

	/**
	 * Format tool result as JSON
	 */
	formatAsJSON(context: ToolExecutionContext): string {
		const standardized = this.standardize(context);
		return JSON.stringify(standardized, null, 2);
	}

	/**
	 * Format tool result as compact text
	 */
	formatAsText(context: ToolExecutionContext): string {
		const standardized = this.standardize(context);

		let text = `[${standardized.tool}] ${standardized.status === 'success' ? '✅' : ''}\n`;
		text += standardized.summary;

		if (standardized.data) {
			text += `\n\nResults:\n${this.formatData(standardized.data, false)}`;
		}

		if (standardized.error) {
			text += `\n\nError: ${standardized.error}`;
		}

		return text;
	}

	/**
	 * Standardize tool execution context to consistent schema
	 */
	private standardize(context: ToolExecutionContext): StandardizedToolResult {
		const result: StandardizedToolResult = {
			tool: context.toolCall.name,
			status:
				context.isCompleted() && context.result?.success ? 'success' : 'error',
			timestamp:
				context.executionStartedAt?.toISOString() || new Date().toISOString(),
			summary: this.generateSummary(context),
		};

		if (context.executionStartedAt && context.executionCompletedAt) {
			result.duration =
				context.executionCompletedAt.getTime() -
				context.executionStartedAt.getTime();
		}

		if (context.result?.success) {
			result.data = this.parseResultData(context.result);
			result.metadata = context.result.metadata;
		}

		if (context.isFailed()) {
			result.error = context.error || context.result?.error || 'Unknown error';
		}

		return result;
	}

	/**
	 * Generate human-readable summary from context
	 */
	private generateSummary(context: ToolExecutionContext): string {
		const toolName = context.toolCall.name;

		if (context.isCompleted() && context.result?.success) {
			switch (toolName) {
				case 'symbol_search':
					return this.summarizeSymbolSearch(context.result);
				case 'find_references':
					return this.summarizeFindReferences(context.result);
				case 'get_symbols_overview':
					return this.summarizeSymbolsOverview(context.result);
				case 'find_file':
					return this.summarizeFindFile(context.result);
				case 'search_for_pattern':
					return this.summarizePatternSearch(context.result);
				default:
					return context.result.output || `${toolName} executed successfully`;
			}
		} else if (context.isFailed()) {
			return `Failed to execute ${toolName}: ${context.error || 'Unknown error'}`;
		}

		return `${toolName} is ${context.status}`;
	}

	/**
	 * Parse result data from tool execution result
	 */
	private parseResultData(result: ToolExecutionResult): any {
		if (result.metadata) {
			return result.metadata;
		}

		try {
			return JSON.parse(result.output);
		} catch {
			return {output: result.output};
		}
	}

	/**
	 * Format data for display (markdown or text)
	 */
	private formatData(data: any, markdown: boolean = true): string {
		if (typeof data === 'string') {
			return markdown ? `\`\`\`\n${data}\n\`\`\`\n` : data;
		}

		if (Array.isArray(data)) {
			return markdown
				? data
						.map((item, idx) => `${idx + 1}. ${JSON.stringify(item)}`)
						.join('\n') + '\n'
				: data
						.map((item, idx) => `${idx + 1}. ${JSON.stringify(item)}`)
						.join('\n');
		}

		if (typeof data === 'object') {
			return markdown
				? `\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`\n`
				: JSON.stringify(data, null, 2);
		}

		return String(data);
	}

	private summarizeSymbolSearch(result: ToolExecutionResult): string {
		const metadata = result.metadata;
		if (metadata?.count !== undefined) {
			return `Found ${metadata.count} symbol(s) matching the search criteria`;
		}
		return 'Symbol search completed';
	}

	private summarizeFindReferences(result: ToolExecutionResult): string {
		const metadata = result.metadata;
		if (metadata?.count !== undefined) {
			return `Found ${metadata.count} reference(s) to the symbol`;
		}
		return 'Reference search completed';
	}

	private summarizeSymbolsOverview(result: ToolExecutionResult): string {
		const metadata = result.metadata;
		if (metadata?.symbolCount !== undefined) {
			return `File contains ${metadata.symbolCount} symbol(s)`;
		}
		return 'Symbol overview retrieved';
	}

	private summarizeFindFile(result: ToolExecutionResult): string {
		const metadata = result.metadata;
		if (metadata?.fileCount !== undefined) {
			return `Found ${metadata.fileCount} file(s) matching the pattern`;
		}
		return 'File search completed';
	}

	private summarizePatternSearch(result: ToolExecutionResult): string {
		const metadata = result.metadata;
		if (metadata?.matchCount !== undefined) {
			return `Found ${metadata.matchCount} match(es) for the pattern`;
		}
		return 'Pattern search completed';
	}
}
