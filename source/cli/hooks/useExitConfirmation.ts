import {useState, useEffect, useRef} from 'react';
import {useApp, useInput} from 'ink';

interface UseExitConfirmationReturn {
	exitConfirmation: boolean;
}

/**
 * Hook to handle Ctrl+C exit confirmation
 * First Ctrl+C shows confirmation, second Ctrl+C exits
 * Auto-resets after 3 seconds
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

	// Handle Ctrl+C using useInput (works better with Ink's exitOnCtrlC: false)
	useInput((input, key) => {
		if (key.ctrl && input === 'c') {
			if (exitConfirmationRef.current) {
				// Second Ctrl+C - exit
				exit();
			} else {
				// First Ctrl+C - show confirmation
				setExitConfirmation(true);
			}
		}
	});

	return {exitConfirmation};
}
