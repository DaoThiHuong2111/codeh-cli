import {useState, useEffect, useRef} from 'react';
import {useApp} from 'ink';
import {useShortcut} from '../../core/input/index.js';

interface UseExitConfirmationReturn {
	exitConfirmation: boolean;
}

/**
 * Hook to handle Ctrl+C exit confirmation
 * First Ctrl+C shows confirmation, second Ctrl+C exits
 * Auto-resets after 3 seconds
 *
 * Uses global layer to ensure it always works
 */
export function useExitConfirmation(): UseExitConfirmationReturn {
	const {exit} = useApp();

	const [exitConfirmation, setExitConfirmation] = useState(false);
	const exitConfirmationRef = useRef(false);

	// Keep ref in sync with state
	useEffect(() => {
		exitConfirmationRef.current = exitConfirmation;
	}, [exitConfirmation]);

	// Reset exit confirmation after 3 seconds
	useEffect(() => {
		if (exitConfirmation) {
			const timer = setTimeout(() => {
				setExitConfirmation(false);
			}, 3000);
			return () => clearTimeout(timer);
		}
	}, [exitConfirmation]);

	// Register Ctrl+C shortcut in global layer (always active)
	useShortcut({
		key: 'ctrl+c',
		handler: () => {
			if (exitConfirmationRef.current) {
				// Second Ctrl+C - exit
				exit();
			} else {
				// First Ctrl+C - show confirmation
				setExitConfirmation(true);
			}
		},
		layer: 'global',
		description: 'Exit application (press twice to confirm)',
		source: 'useExitConfirmation',
	});

	return {exitConfirmation};
}
