/**
 * useConfiguration Hook
 * Manage configuration state
 */

import {useState, useEffect} from 'react';
import {ConfigLoader} from '../../infrastructure/config/ConfigLoader';
import {Configuration} from '../../core/domain/models/Configuration';

export function useConfiguration() {
	const [config, setConfig] = useState<Configuration | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const loader = new ConfigLoader();

	const loadConfig = async () => {
		setLoading(true);
		setError(null);

		try {
			const loadedConfig = await loader.load();
			setConfig(loadedConfig);
		} catch (err: any) {
			setError(err.message || 'Failed to load configuration');
			console.error('Failed to load configuration:', err);
		} finally {
			setLoading(false);
		}
	};

	const saveConfig = async (data: {
		provider: string;
		model: string;
		apiKey?: string;
		baseUrl?: string;
		maxTokens?: number;
	}): Promise<{success: boolean; error?: string}> => {
		try {
			const newConfig = Configuration.create(data);

			if (!newConfig.isValid()) {
				return {
					success: false,
					error: newConfig.getValidationErrors().join(', '),
				};
			}

			await loader.save(newConfig);
			setConfig(newConfig);

			return {success: true};
		} catch (err: any) {
			return {
				success: false,
				error: err.message || 'Failed to save configuration',
			};
		}
	};

	const reloadConfig = () => {
		loadConfig();
	};

	useEffect(() => {
		loadConfig();
	}, []);

	return {
		config,
		loading,
		error,
		saveConfig,
		reloadConfig,
	};
}
