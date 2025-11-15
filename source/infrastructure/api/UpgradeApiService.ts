/**
 * Upgrade API Service
 * Handles API calls for upgrade information
 */

import {
	UpgradeInfo,
	UpgradeInfoResponse,
} from '../../core/domain/models/UpgradeInfo';
import {getLogger} from '../logging/Logger.js';

const logger = getLogger();

export class UpgradeApiService {
	private readonly apiUrl =
		'https://68ff9efce02b16d1753eb347.mockapi.io/api/v1/upgrade';

	async fetchUpgradeInfo(): Promise<UpgradeInfo | null> {
		const start = Date.now();
		logger.info('UpgradeApiService', 'fetchUpgradeInfo', 'Fetching upgrade info from API', {
			api_url: this.apiUrl,
		});

		try {
			logger.debug('UpgradeApiService', 'fetchUpgradeInfo', 'Sending fetch request');
			const response = await fetch(this.apiUrl);

			const duration = Date.now() - start;
			if (!response.ok) {
				logger.warn('UpgradeApiService', 'fetchUpgradeInfo', 'Failed to fetch upgrade info', {
					duration_ms: duration,
					status_code: response.status,
				});
				return null;
			}

			logger.debug('UpgradeApiService', 'fetchUpgradeInfo', 'Parsing response');
			const data = (await response.json()) as UpgradeInfoResponse[];

			if (!Array.isArray(data) || data.length === 0) {
				logger.warn('UpgradeApiService', 'fetchUpgradeInfo', 'Invalid API response format', {
					duration_ms: duration,
					is_array: Array.isArray(data),
					data_length: Array.isArray(data) ? data.length : 0,
				});
				return null;
			}

			// Take first item from array
			const firstItem = data[0];
			logger.debug('UpgradeApiService', 'fetchUpgradeInfo', 'Processing first item', {
				has_version: firstItem.version !== null,
				has_messages: firstItem.messages !== null,
			});

			// Check if version or message is not null/empty
			if (
				(firstItem.version !== null && firstItem.version.trim() !== '') ||
				(firstItem.messages !== null && firstItem.messages.trim() !== '')
			) {
				const upgradeInfo = UpgradeInfo.fromApiResponse(firstItem);
				logger.info('UpgradeApiService', 'fetchUpgradeInfo', 'Upgrade info fetched successfully', {
					duration_ms: duration,
					version: upgradeInfo.version,
					has_message: !!upgradeInfo.message,
				});
				return upgradeInfo;
			}

			logger.info('UpgradeApiService', 'fetchUpgradeInfo', 'No valid upgrade info', {
				duration_ms: duration,
			});
			return null;
		} catch (error: any) {
			const duration = Date.now() - start;
			logger.error('UpgradeApiService', 'fetchUpgradeInfo', 'Error fetching upgrade info', {
				duration_ms: duration,
				error: error.message,
				stack: error.stack,
			});
			return null;
		}
	}
}
