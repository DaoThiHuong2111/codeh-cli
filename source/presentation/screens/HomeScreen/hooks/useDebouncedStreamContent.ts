/**
 * useDebouncedStreamContent hook
 * Debounces streaming content updates to reduce re-renders
 */

import {useState, useEffect} from 'react';

/**
 * Debounce streaming content to optimize rendering performance
 *
 * @param content - The streaming content to debounce
 * @param delay - Debounce delay in milliseconds (default: 50ms)
 * @returns Debounced content value
 *
 * @example
 * ```tsx
 * const {streamingContent, isStreaming} = useStreamChat(options);
 * const debouncedContent = useDebouncedStreamContent(streamingContent, 50);
 *
 * return (
 *   <MarkdownDisplay
 *     text={debouncedContent}
 *     isPending={isStreaming}
 *   />
 * );
 * ```
 */
export function useDebouncedStreamContent(
	content: string,
	delay: number = 50,
): string {
	const [debouncedContent, setDebouncedContent] = useState(content);

	useEffect(() => {
		// Update immediately if content is empty (reset case)
		if (content === '') {
			setDebouncedContent('');
			return;
		}

		// Set up debounce timer
		const timeoutId = setTimeout(() => {
			setDebouncedContent(content);
		}, delay);

		// Cleanup on content change or unmount
		return () => {
			clearTimeout(timeoutId);
		};
	}, [content, delay]);

	return debouncedContent;
}
