import {useInput} from 'ink';
import {useRef} from 'react';

export interface KeyDebounceConfig {
	/**
	 * Debounce time in milliseconds for this specific key
	 */
	debounceMs: number;
}

export interface UseDebouncedInputOptions {
	/**
	 * Configuration for specific keys to debounce
	 * Key name -> debounce config
	 *
	 * @example
	 * {
	 *   return: { debounceMs: 300 },
	 *   space: { debounceMs: 200 },
	 *   upArrow: { debounceMs: 100 }
	 * }
	 */
	keyDebounce?: Record<string, KeyDebounceConfig>;
	/**
	 * Global debounce for all keys not specified in keyDebounce
	 * Set to 0 or undefined to disable global debounce
	 */
	globalDebounceMs?: number;
	/**
	 * Condition to disable input handling
	 */
	disabled?: boolean;
}

/**
 * Custom hook that wraps Ink's useInput with flexible per-key debounce support
 * Prevents long-press from triggering multiple actions for any key
 *
 * @example Per-key debounce configuration
 * ```typescript
 * useDebouncedInput((_input, key) => {
 *   if (key.return) handleSubmit();
 *   if (key.space) handleToggle();
 *   if (key.upArrow) handleNavigateUp();
 * }, {
 *   keyDebounce: {
 *     return: { debounceMs: 300 },  // Enter needs 300ms debounce
 *     space: { debounceMs: 200 },   // Space needs 200ms
 *     upArrow: { debounceMs: 50 }   // Arrow keys can be faster
 *   }
 * });
 * ```
 *
 * @example Global debounce for all keys
 * ```typescript
 * useDebouncedInput((_input, key) => {
 *   // Handle any key
 * }, {
 *   globalDebounceMs: 300  // All keys debounced by 300ms
 * });
 * ```
 *
 * @example Mix global and specific key debounce
 * ```typescript
 * useDebouncedInput((_input, key) => {
 *   if (key.return) handleSubmit();
 *   if (key.upArrow) handleNavigate();
 * }, {
 *   globalDebounceMs: 100,  // Default 100ms for all keys
 *   keyDebounce: {
 *     return: { debounceMs: 300 }  // But Enter needs 300ms
 *   }
 * });
 * ```
 *
 * @example With disabled state
 * ```typescript
 * const [loading, setLoading] = useState(false);
 *
 * useDebouncedInput((_input, key) => {
 *   if (key.return) processAction();
 * }, {
 *   keyDebounce: { return: { debounceMs: 300 } },
 *   disabled: loading
 * });
 * ```
 */
export function useDebouncedInput(
	handler: (input: string, key: any) => void,
	options: UseDebouncedInputOptions = {},
) {
	const {keyDebounce = {}, globalDebounceMs = 0, disabled = false} = options;

	const lastPressTimeRef = useRef<Record<string, number>>({});

	useInput((input: string, key: any) => {
		if (disabled) return;

		let pressedKey = '';
		let debounceTime = globalDebounceMs;

		for (const keyName in key) {
			if (key[keyName] === true) {
				pressedKey = keyName;

				if (keyDebounce[keyName]) {
					debounceTime = keyDebounce[keyName].debounceMs;
				}
				break;
			}
		}

		if (debounceTime > 0 && pressedKey) {
			const now = Date.now();
			const lastPressTime = lastPressTimeRef.current[pressedKey] || 0;

			if (now - lastPressTime < debounceTime) {
				return;
			}

			lastPressTimeRef.current[pressedKey] = now;
		}

		handler(input, key);
	});
}
