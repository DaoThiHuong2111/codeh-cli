import { useState, useEffect } from 'react';
import { useInput } from 'ink';
import { WelcomePresenter } from '../presenters/WelcomePresenter';
import { UpgradeInfo } from '../../core/domain/models/UpgradeInfo';

export interface UseWelcomeLogicReturn {
	loading: boolean;
	shouldShowWelcome: boolean;
	upgradeInfo: UpgradeInfo | null;
	displayMessage: string;
	displayVersion: string;
}

export interface UseWelcomeLogicProps {
	onNavigateHome: () => void;
	onNavigateConfig: () => void;
}

/**
 * Custom hook for Welcome screen business logic
 */
export function useWelcomeLogic({ onNavigateHome, onNavigateConfig }: UseWelcomeLogicProps): UseWelcomeLogicReturn {
	const presenter = new WelcomePresenter();
	const [loading, setLoading] = useState(true);
	const [upgradeInfo, setUpgradeInfo] = useState<UpgradeInfo | null>(null);
	const [shouldShowWelcome, setShouldShowWelcome] = useState(false);

	useEffect(() => {
		const initializeScreen = async () => {
			try {
				// Fetch upgrade info from API
				const fetchedUpgradeInfo = await presenter.fetchUpgradeInfo();
				setUpgradeInfo(fetchedUpgradeInfo);

				// Check if upgrade info has valid content
				const hasValidContent = presenter.hasValidUpgradeInfo(fetchedUpgradeInfo);
				setShouldShowWelcome(hasValidContent);

				// If no valid upgrade info, skip welcome screen
				if (!hasValidContent) {
					await checkConfigurationAndNavigate();
				}
			} catch (error) {
				console.error('Failed to initialize welcome screen:', error);
				// If API fails, skip welcome screen
				await checkConfigurationAndNavigate();
			} finally {
				setLoading(false);
			}
		};

		initializeScreen();
	}, []);

	const checkConfigurationAndNavigate = async () => {
		try {
			const { ConfigLoader } = await import('../../infrastructure/config/ConfigLoader.js');
			const loader = new ConfigLoader();
			const status = await loader.getStatus();

			if (!status.hasConfig) {
				onNavigateConfig();
			} else {
				onNavigateHome();
			}
		} catch (error) {
			console.error('Config check failed:', error);
			onNavigateConfig();
		}
	};

	// Handle keyboard input
	useInput((input: string, key: any) => {
		if (!shouldShowWelcome) return;

		if (key.return) {
			onNavigateHome();
		} else if (input === 'c') {
			onNavigateConfig();
		}
	});

	const displayMessage = presenter.getDisplayMessage(upgradeInfo);
	const displayVersion = presenter.getDisplayVersion(upgradeInfo);

	return {
		loading,
		shouldShowWelcome,
		upgradeInfo,
		displayMessage,
		displayVersion,
	};
}
