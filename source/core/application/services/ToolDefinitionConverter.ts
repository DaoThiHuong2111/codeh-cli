/**
 * Tool Definition Converter
 * Converts tool definitions to different AI provider formats
 */

import {ToolDefinition} from '../../domain/interfaces/IToolExecutor';

/**
 * Anthropic Claude tool format
 */
export interface AnthropicTool {
	name: string;
	description: string;
	input_schema: {
		type: 'object';
		properties: Record<string, any>;
		required?: string[];
	};
}

/**
 * OpenAI function calling format
 */
export interface OpenAIFunction {
	type: 'function';
	function: {
		name: string;
		description: string;
		parameters: {
			type: 'object';
			properties: Record<string, any>;
			required?: string[];
		};
	};
}

/**
 * Generic tool format (our internal format)
 */
export interface GenericTool {
	name: string;
	description: string;
	parameters: Record<string, any>;
}

/**
 * Tool Definition Converter Service
 * Converts between different tool formats for various AI providers
 */
export class ToolDefinitionConverter {
	/**
	 * Convert to Anthropic Claude format
	 */
	toAnthropicFormat(definitions: ToolDefinition[]): AnthropicTool[] {
		return definitions.map(def => {
			const properties: Record<string, any> = {};
			const required: string[] = [];

			// Convert from our format to Anthropic format
			if (def.inputSchema) {
				// Already in schema format
				return {
					name: def.name,
					description: def.description,
					input_schema: {
						type: 'object',
						properties: def.inputSchema.properties || {},
						required: def.inputSchema.required || [],
					},
				};
			}

			// Convert from parameters array format
			if (def.parameters) {
				for (const param of def.parameters) {
					properties[param.name] = {
						type: param.type,
						description: param.description,
					};

					if (param.required) {
						required.push(param.name);
					}
				}
			}

			return {
				name: def.name,
				description: def.description,
				input_schema: {
					type: 'object',
					properties,
					required: required.length > 0 ? required : undefined,
				},
			};
		});
	}

	/**
	 * Convert to OpenAI function calling format
	 */
	toOpenAIFormat(definitions: ToolDefinition[]): OpenAIFunction[] {
		return definitions.map(def => {
			const properties: Record<string, any> = {};
			const required: string[] = [];

			// Convert from our format to OpenAI format
			if (def.inputSchema) {
				// Already in schema format
				return {
					type: 'function',
					function: {
						name: def.name,
						description: def.description,
						parameters: {
							type: 'object',
							properties: def.inputSchema.properties || {},
							required: def.inputSchema.required || [],
						},
					},
				};
			}

			// Convert from parameters array format
			if (def.parameters) {
				for (const param of def.parameters) {
					properties[param.name] = {
						type: param.type,
						description: param.description,
					};

					if (param.required) {
						required.push(param.name);
					}
				}
			}

			return {
				type: 'function',
				function: {
					name: def.name,
					description: def.description,
					parameters: {
						type: 'object',
						properties,
						required: required.length > 0 ? required : undefined,
					},
				},
			};
		});
	}

	/**
	 * Convert to generic format (simplified)
	 */
	toGenericFormat(definitions: ToolDefinition[]): GenericTool[] {
		return definitions.map(def => {
			const parameters: Record<string, any> = {};

			if (def.inputSchema) {
				Object.assign(parameters, def.inputSchema.properties || {});
			} else if (def.parameters) {
				for (const param of def.parameters) {
					parameters[param.name] = {
						type: param.type,
						description: param.description,
						required: param.required || false,
					};
				}
			}

			return {
				name: def.name,
				description: def.description,
				parameters,
			};
		});
	}

	/**
	 * Get format for specific provider
	 */
	getFormatForProvider(
		definitions: ToolDefinition[],
		provider: 'anthropic' | 'openai' | 'generic',
	): AnthropicTool[] | OpenAIFunction[] | GenericTool[] {
		switch (provider) {
			case 'anthropic':
				return this.toAnthropicFormat(definitions);
			case 'openai':
				return this.toOpenAIFormat(definitions);
			case 'generic':
				return this.toGenericFormat(definitions);
			default:
				return this.toGenericFormat(definitions);
		}
	}
}
