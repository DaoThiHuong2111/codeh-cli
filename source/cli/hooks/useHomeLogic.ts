import {useState, useEffect} from 'react';
import {Container} from '../../core/di/Container';
import {useCodehClient} from './useCodehClient';
import {useCodehChat} from './useCodehChat';
import {usePresenter} from './usePresenter';
import {HomePresenter} from '../presenters/HomePresenter';

export interface UseHomeLogicReturn {
	// State
	output: string;
	processing: boolean;
	version: string;
	model: string;
	directory: string;

	// Error states
	chatError: string | null;

	// Actions
	handleInput: (input: string) => Promise<void>;
}

/**
 * Custom hook for Home screen business logic
 */
export function useHomeLogic(container: Container): UseHomeLogicReturn {
	const {
		client,
		loading: clientLoading,
		error: clientError,
		initializeClient,
	} = useCodehClient(container);
	const {
		chat,
		loading: chatLoading,
		error: chatError,
	} = useCodehChat(container);

	const [output, setOutput] = useState('');
	const [processing, setProcessing] = useState(false);
	const [clientInitialized, setClientInitialized] = useState(false);
	const [version] = useState('1.0.0');
	const [model, setModel] = useState('');
	const [directory] = useState(process.cwd());

	// Load model from config
	useEffect(() => {
		const loadModel = async () => {
			try {
				const {ConfigLoader} = await import(
					'../../infrastructure/config/ConfigLoader.js'
				);
				const loader = new ConfigLoader();
				const config = await loader.load();
				if (config) {
					setModel(config.model);
				}
			} catch (error) {
				console.error('Failed to load model:', error);
			}
		};

		loadModel();
	}, []);

	/**
	 * Handle user input submission
	 */
	const handleInput = async (input: string) => {
		if (processing) return;

		setProcessing(true);
		setOutput('Connecting...');

		try {
			// Initialize client if not already done
			let activeClient = client;
			if (!clientInitialized) {
				activeClient = await initializeClient();
				setClientInitialized(!!activeClient);
			}

			if (!activeClient) {
				setOutput(
					'❌ Failed to connect to API. Please check your configuration (/config).',
				);
				return;
			}

			setOutput('Thinking...');

			const presenter = usePresenter(HomePresenter, activeClient, chat);
			if (!presenter) {
				setOutput('❌ Error: Presenter not initialized');
				return;
			}
			const result = await presenter.handleInput(input);

			if (result.success) {
				setOutput(result.output);
			} else {
				setOutput(`❌ Error: ${result.error || 'Unknown error'}`);
			}
		} catch (error: any) {
			if (error.message?.includes('API key is required')) {
				setOutput(
					'❌ API key required. Please configure your API key (press Ctrl+C, then run "codeh config").',
				);
			} else {
				setOutput(`❌ Error: ${error.message}`);
			}
		} finally {
			setProcessing(false);
		}
	};

	return {
		output,
		processing,
		version,
		model,
		directory,
		chatError,
		handleInput,
	};
}
