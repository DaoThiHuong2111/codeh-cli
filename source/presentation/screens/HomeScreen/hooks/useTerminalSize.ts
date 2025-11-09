/**
 * useTerminalSize hook
 * Detects and tracks terminal dimensions
 */

import {useState, useEffect} from 'react';
import {useStdout} from 'ink';

export interface TerminalSize {
	width: number;
	height: number;
}

/**
 * Hook to get current terminal size and listen to resize events
 *
 * @returns Terminal width and height
 *
 * @example
 * ```tsx
 * const {width, height} = useTerminalSize();
 *
 * return (
 *   <Box width={width} height={height}>
 *     <Text>Terminal: {width}x{height}</Text>
 *   </Box>
 * );
 * ```
 */
export function useTerminalSize(): TerminalSize {
	const {stdout} = useStdout();

	const [size, setSize] = useState<TerminalSize>({
		width: stdout?.columns || 80,
		height: stdout?.rows || 24,
	});

	useEffect(() => {
		if (!stdout) return;

		// Update size when terminal resizes
		const handleResize = () => {
			setSize({
				width: stdout.columns || 80,
				height: stdout.rows || 24,
			});
		};

		// Listen to resize events
		stdout.on('resize', handleResize);

		// Initial size check
		handleResize();

		// Cleanup
		return () => {
			stdout.off('resize', handleResize);
		};
	}, [stdout]);

	return size;
}
