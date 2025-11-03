import { ConfigStep } from './useConfigWizard';
import { useDebouncedInput } from './useDebouncedInput';

export interface UseConfigKeyboardProps {
	currentStep: ConfigStep;
	saving: boolean;
	providerIndex: number;
	confirmIndex: number;
	providersLength: number;
	confirmOptionsLength: number;
	onNavigateHome: () => void;
	onGoBack: () => void;
	onProviderIndexChange: (index: number) => void;
	onConfirmIndexChange: (index: number) => void;
	onComplete: () => void;
}

/**
 * Custom hook to handle keyboard navigation for Config screen
 */
export function useConfigKeyboard({
	currentStep,
	saving,
	providerIndex,
	confirmIndex,
	providersLength,
	confirmOptionsLength,
	onNavigateHome,
	onGoBack,
	onProviderIndexChange,
	onConfirmIndexChange,
	onComplete,
}: UseConfigKeyboardProps) {
	useDebouncedInput(
		(_input: string, key: any) => {
			// ESC - go back to previous step
			if (key.escape) {
				onGoBack();
				return;
			}

			// Arrow key navigation
			if (key.upArrow) {
				if (currentStep === ConfigStep.PROVIDER) {
					onProviderIndexChange(Math.max(0, providerIndex - 1));
				} else if (currentStep === ConfigStep.CONFIRM) {
					onConfirmIndexChange(Math.max(0, confirmIndex - 1));
				}
			} else if (key.downArrow) {
				if (currentStep === ConfigStep.PROVIDER) {
					onProviderIndexChange(Math.min(providersLength - 1, providerIndex + 1));
				} else if (currentStep === ConfigStep.CONFIRM) {
					onConfirmIndexChange(Math.min(confirmOptionsLength - 1, confirmIndex + 1));
				}
			} else if (key.return) {
				onComplete();
			}
		},
		{
			// Per-key debounce configuration
			keyDebounce: {
				return: { debounceMs: 1500 },   // Enter needs strong debounce
			},
			disabled: saving,
		}
	);
}
