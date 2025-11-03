import {useState, useEffect} from 'react';
import {ConfigValidator} from '../../core/domain/validators/ConfigValidator';
import {ConfigPresenter} from '../presenters/ConfigPresenter';
import {MenuItem} from '../components/molecules/Menu';

export enum ConfigStep {
	PROVIDER = 'provider',
	MODEL = 'model',
	API_KEY = 'api_key',
	BASE_URL = 'base_url',
	MAX_TOKENS = 'max_tokens',
	CONFIRM = 'confirm',
}

export interface UseConfigWizardReturn {
	// Current state
	currentStep: ConfigStep;
	error: string;
	saving: boolean;

	// Form values
	selectedProvider: string;
	selectedModel: string;
	apiKey: string;
	baseUrl: string;
	maxTokens: string;

	// Menu states
	providerIndex: number;
	confirmIndex: number;
	providers: MenuItem[];
	confirmOptions: MenuItem[];

	// Actions
	setSelectedModel: (value: string) => void;
	setApiKey: (value: string) => void;
	setBaseUrl: (value: string) => void;
	setMaxTokens: (value: string) => void;
	setProviderIndex: (value: number) => void;
	setConfirmIndex: (value: number) => void;
	goBack: (configStep?: ConfigStep | null) => void;
	completeStep: () => Promise<void>;
	save: (onSuccess: () => void) => Promise<void>;
}

export function useConfigWizard(): UseConfigWizardReturn {
	const presenter = new ConfigPresenter();

	// Step management
	const [currentStep, setCurrentStep] = useState<ConfigStep>(
		ConfigStep.PROVIDER,
	);
	const [error, setError] = useState('');
	const [saving, setSaving] = useState(false);

	// Form state
	const [selectedProvider, setSelectedProvider] = useState('');
	const [selectedModel, setSelectedModel] = useState('');
	const [apiKey, setApiKey] = useState('');
	const [baseUrl, setBaseUrl] = useState('');
	const [maxTokens, setMaxTokens] = useState('128000');

	// Menu state
	const [providerIndex, setProviderIndex] = useState(0);
	const [confirmIndex, setConfirmIndex] = useState(0);

	const providers = presenter.getProviders();
	const confirmOptions: MenuItem[] = [
		{label: 'Confirm & Save', value: 'save'},
		{label: 'Edit Configuration', value: 'edit'},
	];

	const stepBackMap: Record<ConfigStep, ConfigStep> = {
		[ConfigStep.MODEL]: ConfigStep.PROVIDER,
		[ConfigStep.API_KEY]: ConfigStep.MODEL,
		[ConfigStep.BASE_URL]: ConfigStep.API_KEY,
		[ConfigStep.MAX_TOKENS]: ConfigStep.BASE_URL,
		[ConfigStep.CONFIRM]: ConfigStep.MAX_TOKENS,
		[ConfigStep.PROVIDER]: ConfigStep.PROVIDER, // Stay at first step
	};

	// Clear error when user starts typing
	useEffect(() => {
		if (error) {
			setError('');
		}
	}, [selectedModel, maxTokens]);

	/**
	 * Go back to previous step
	 */
	const goBack = (configStep: ConfigStep | null = null) => {
		setError('');
		if (configStep !== null) {
			setCurrentStep(configStep);
			return;
		}
		const previousStep = stepBackMap[currentStep];
		setCurrentStep(previousStep);
	};

	/**
	 * Complete current step and move to next
	 */
	const completeStep = async () => {
		setError('');

		switch (currentStep) {
			case ConfigStep.PROVIDER:
				setSelectedProvider(providers[providerIndex].value);
				setCurrentStep(ConfigStep.MODEL);
				break;

			case ConfigStep.MODEL:
				const modelValidation = ConfigValidator.validateModel(selectedModel);
				if (!modelValidation.isValid) {
					setError(modelValidation.error || 'Invalid model');
					return;
				}
				setCurrentStep(ConfigStep.API_KEY);
				break;

			case ConfigStep.API_KEY:
				const apiKeyValidation = ConfigValidator.validateApiKey(
					apiKey,
					selectedProvider,
				);
				if (!apiKeyValidation.isValid) {
					setError(apiKeyValidation.error || 'Invalid API key');
					return;
				}
				setCurrentStep(ConfigStep.BASE_URL);
				break;

			case ConfigStep.BASE_URL:
				const urlValidation = ConfigValidator.validateUrl(baseUrl);
				if (!urlValidation.isValid) {
					setError(urlValidation.error || 'Invalid URL');
					return;
				}
				setCurrentStep(ConfigStep.MAX_TOKENS);
				break;

			case ConfigStep.MAX_TOKENS:
				const maxTokensValidation =
					ConfigValidator.validateMaxTokens(maxTokens);
				if (!maxTokensValidation.isValid) {
					setError(maxTokensValidation.error || 'Invalid max tokens');
					return;
				}
				setCurrentStep(ConfigStep.CONFIRM);
				break;

			case ConfigStep.CONFIRM:
				// Handled by confirmAction
				break;
		}
	};

	/**
	 * Save configuration
	 */
	const save = async (onSuccess: () => void) => {
		setSaving(true);

		try {
			const maxTokensNum = parseInt(maxTokens.trim());
			const result = await presenter.saveConfiguration({
				provider: selectedProvider,
				model: selectedModel,
				apiKey: apiKey || undefined,
				baseUrl: baseUrl || undefined,
				maxTokens: maxTokensNum,
			});

			if (result.success) {
				onSuccess();
			} else {
				setError(result.error || 'Failed to save configuration');
				setSaving(false);
			}
		} catch (err: any) {
			setError(err.message);
			setSaving(false);
		}
	};

	return {
		// State
		currentStep,
		error,
		saving,

		// Form values
		selectedProvider,
		selectedModel,
		apiKey,
		baseUrl,
		maxTokens,

		// Menu states
		providerIndex,
		confirmIndex,
		providers,
		confirmOptions,

		// Actions
		setSelectedModel,
		setApiKey,
		setBaseUrl,
		setMaxTokens,
		setProviderIndex,
		setConfirmIndex,
		goBack,
		completeStep,
		save,
	};
}
