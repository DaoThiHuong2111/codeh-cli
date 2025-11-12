/**
 * Tool Parameter Schemas using Zod
 * Provides runtime validation and type inference for tool parameters
 */

import {z} from 'zod';

/**
 * GetTypeInformationTool parameters
 */
export const GetTypeInfoArgsSchema = z.object({
	filePath: z.string().min(1, 'File path is required'),
	symbolName: z.string().min(1, 'Symbol name is required'),
	line: z.number().int().positive().optional(),
});

export type GetTypeInfoArgs = z.infer<typeof GetTypeInfoArgsSchema>;

/**
 * GetCallHierarchyTool parameters
 */
export const GetCallHierarchyArgsSchema = z.object({
	filePath: z.string().min(1, 'File path is required'),
	symbolName: z.string().min(1, 'Symbol name is required'),
	direction: z.enum(['incoming', 'outgoing', 'both']),
	maxDepth: z.number().int().positive().max(10).default(3),
});

export type GetCallHierarchyArgs = z.infer<typeof GetCallHierarchyArgsSchema>;

/**
 * FindImplementationsTool parameters
 */
export const FindImplementationsArgsSchema = z.object({
	filePath: z.string().min(1, 'File path is required'),
	interfaceName: z.string().min(1, 'Interface name is required'),
});

export type FindImplementationsArgs = z.infer<
	typeof FindImplementationsArgsSchema
>;

/**
 * ValidateCodeChangesTool parameters
 */
export const ValidateCodeChangesArgsSchema = z.object({
	files: z.array(z.string()).optional(),
});

export type ValidateCodeChangesArgs = z.infer<
	typeof ValidateCodeChangesArgsSchema
>;

/**
 * SmartContextExtractorTool parameters
 */
export const SmartContextExtractorArgsSchema = z.object({
	filePath: z.string().min(1, 'File path is required'),
	symbolName: z.string().min(1, 'Symbol name is required'),
	includeCallers: z.boolean().default(true),
	includeTypes: z.boolean().default(true),
	maxDepth: z.number().int().positive().max(5).default(2),
});

export type SmartContextExtractorArgs = z.infer<
	typeof SmartContextExtractorArgsSchema
>;

/**
 * DependencyGraphTool parameters
 */
export const DependencyGraphArgsSchema = z.object({
	filePath: z.string().min(1, 'File path is required'),
	module: z.string().optional(),
});

export type DependencyGraphArgs = z.infer<typeof DependencyGraphArgsSchema>;

/**
 * Helper function to validate and parse parameters
 */
export function validateAndParse<T>(
	schema: z.ZodSchema<T>,
	parameters: unknown,
): {success: true; data: T} | {success: false; error: string} {
	const result = schema.safeParse(parameters);

	if (result.success) {
		return {success: true, data: result.data};
	}

	// Format errors nicely
	const errors = result.error.issues
		.map((err: any) => `${err.path.join('.')}: ${err.message}`)
		.join(', ');

	return {success: false, error: errors};
}
