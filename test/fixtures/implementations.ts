/**
 * Sample file for testing FindImplementationsTool
 */

export interface ILogger {
	log(message: string): void;
	error(message: string): void;
}

export class ConsoleLogger implements ILogger {
	log(message: string): void {
		console.log(message);
	}

	error(message: string): void {
		console.error(message);
	}
}

export class FileLogger implements ILogger {
	constructor(private filePath: string) {}

	log(message: string): void {
		// Write to file
	}

	error(message: string): void {
		// Write error to file
	}
}

export abstract class BaseService {
	abstract execute(): Promise<void>;
}

export class EmailService extends BaseService {
	async execute(): Promise<void> {
		console.log('Sending email...');
	}
}

export class SmsService extends BaseService {
	async execute(): Promise<void> {
		console.log('Sending SMS...');
	}
}
