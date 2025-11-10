/**
 * Tool Definition Converter
 * Converts internal ToolDefinition to API-specific formats
 */

import {Tool as ApiTool} from '../../domain/interfaces/IApiClient';
import {ToolDefinition} from '../../domain/interfaces/IToolExecutor';

export class ToolDefinitionConverter {
	/**
	 * Convert internal ToolDefinition to unified API format
	 */
	static toApiFormat(toolDef: ToolDefinition): ApiTool {
		const properties: Record<string, any> = {};
		const required: string[] = [];

		// Convert parameters to JSON Schema format
		for (const param of toolDef.parameters) {
			properties[param.name] = {
				type: param.type,
				description: param.description,
			};

			if (param.default !== undefined) {
				properties[param.name].default = param.default;
			}

			if (param.required) {
				required.push(param.name);
			}
		}

		return {
			name: toolDef.name,
			description: toolDef.description,
			parameters: {
				type: 'object',
				properties,
				required: required.length > 0 ? required : undefined,
			},
		};
	}

	/**
	 * Convert array of ToolDefinitions to API format
	 */
	static toApiFormatBatch(toolDefs: ToolDefinition[]): ApiTool[] {
		return toolDefs.map(td => this.toApiFormat(td));
	}

	/**
	 * Convert to Anthropic-specific format (if needed in future)
	 * For now, unified format works for both
	 */
	static toAnthropicFormat(toolDef: ToolDefinition): any {
		// Anthropic uses same format as our unified format
		return this.toApiFormat(toolDef);
	}

	/**
	 * Convert to OpenAI-specific format (if needed in future)
	 * For now, unified format works for both
	 */
	static toOpenAIFormat(toolDef: ToolDefinition): any {
		// OpenAI uses same format as our unified format
		// With 'function' wrapper for function calling
		const apiFormat = this.toApiFormat(toolDef);
		return {
			type: 'function',
			function: {
				name: apiFormat.name,
				description: apiFormat.description,
				parameters: apiFormat.parameters,
			},
		};
	}
}
