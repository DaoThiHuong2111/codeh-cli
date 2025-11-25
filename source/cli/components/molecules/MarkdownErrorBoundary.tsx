/**
 * Markdown Error Boundary Component
 * Catches errors during markdown rendering and displays fallback content
 */

import {Box, Text} from 'ink';
import React, {Component, ErrorInfo, ReactNode} from 'react';
import {getLogger} from '../../../infrastructure/logging/Logger.js';

const logger = getLogger();

interface MarkdownErrorBoundaryProps {
	children: ReactNode;
	fallbackContent: string;
}

interface MarkdownErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

/**
 * Error boundary specifically for markdown rendering failures.
 * When markdown parsing or rendering fails, displays the raw content as fallback.
 * This ensures the user always sees the message content, even if formatting fails.
 */
export class MarkdownErrorBoundary extends Component<
	MarkdownErrorBoundaryProps,
	MarkdownErrorBoundaryState
> {
	constructor(props: MarkdownErrorBoundaryProps) {
		super(props);
		this.state = {hasError: false, error: null};
	}

	static getDerivedStateFromError(error: Error): MarkdownErrorBoundaryState {
		return {hasError: true, error};
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
		logger.error(
			'MarkdownErrorBoundary',
			'componentDidCatch',
			'Markdown rendering failed, displaying fallback content',
			{
				error: error.message,
				stack: error.stack,
				componentStack: errorInfo.componentStack,
			},
		);
	}

	render(): ReactNode {
		if (this.state.hasError) {
			// Fallback: display raw content as plain text
			return (
				<Box flexDirection="column">
					<Text wrap="wrap">{this.props.fallbackContent}</Text>
				</Box>
			);
		}

		return this.props.children;
	}
}
