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

	useEffect(() => {
		exitConfirmationRef.current = exitConfirmation;
	}, [exitConfirmation]);

	useEffect(() => {
		if (exitConfirmation) {
			const timer = setTimeout(() => {
				setExitConfirmation(false);
			}, 3000);
			return () => clearTimeout(timer);
		}
	}, [exitConfirmation]);

	useShortcut({
		key: 'ctrl+c',
		handler: () => {
			if (exitConfirmationRef.current) {
				exit();
			} else {
				setExitConfirmation(true);
			}
		},
		layer: 'global',
		description: 'Exit application (press twice to confirm)',
		source: 'useExitConfirmation',
	});

	return {exitConfirmation};
}
