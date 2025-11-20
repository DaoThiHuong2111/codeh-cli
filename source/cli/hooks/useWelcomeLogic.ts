import {useState, useEffect} from 'react';
import {WelcomePresenter} from '../presenters/WelcomePresenter';
import {UpgradeInfo} from '../../core/domain/models/UpgradeInfo';
import {useShortcut} from '../../core/input/index.js';

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
export function useWelcomeLogic({
	onNavigateHome,
	onNavigateConfig,
}: UseWelcomeLogicProps): UseWelcomeLogicReturn {
	const presenter = new WelcomePresenter();
	const [loading, setLoading] = useState(true);
	const [upgradeInfo, setUpgradeInfo] = useState<UpgradeInfo | null>(null);
	const [shouldShowWelcome, setShouldShowWelcome] = useState(false);

	useEffect(() => {
		const initializeScreen = async () => {
			try {
				const fetchedUpgradeInfo = await presenter.fetchUpgradeInfo();
				setUpgradeInfo(fetchedUpgradeInfo);

				const hasValidContent =
					presenter.hasValidUpgradeInfo(fetchedUpgradeInfo);
				setShouldShowWelcome(hasValidContent);

				if (!hasValidContent) {
					await checkConfigurationAndNavigate();
				}
			} catch (error) {
				console.error('Failed to initialize welcome screen:', error);
				await checkConfigurationAndNavigate();
			} finally {
				setLoading(false);
			}
		};

		initializeScreen();
	}, []);

	const checkConfigurationAndNavigate = async () => {
		try {
			const {ConfigLoader} = await import(
				'../../infrastructure/config/ConfigLoader.js'
			);
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

	useShortcut({
		key: 'enter',
		handler: () => {
			onNavigateHome();
		},
		layer: 'screen',
		enabled: () => shouldShowWelcome,
		description: 'Continue to Home screen',
		source: 'useWelcomeLogic',
	});

	useShortcut({
		key: 'c',
		handler: () => {
			onNavigateConfig();
		},
		layer: 'screen',
		enabled: () => shouldShowWelcome,
		description: 'Go to Config screen',
		source: 'useWelcomeLogic',
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
