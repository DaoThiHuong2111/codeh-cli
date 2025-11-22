/**
 * Dependency Injection Container
 * Manages application dependencies
 */

type Factory<T> = () => T;

export class Container {
	private instances: Map<string, any> = new Map();
	private factories: Map<string, Factory<any>> = new Map();
	private singletons: Set<string> = new Set();

	/**
	 * Register a factory
	 */
	register<T>(
		token: string,
		factory: Factory<T>,
		singleton: boolean = true,
	): void {
		this.factories.set(token, factory);

		if (singleton) {
			this.singletons.add(token);
		}
	}

	/**
	 * Register an instance directly
	 */
	registerInstance<T>(token: string, instance: T): void {
		this.instances.set(token, instance);
		this.singletons.add(token);
	}

	/**
	 * Resolve a dependency
	 */
	resolve<T>(token: string): T {
		if (this.instances.has(token)) {
			return this.instances.get(token) as T;
		}

		const factory = this.factories.get(token);

		if (!factory) {
			throw new Error(`No factory registered for token: ${token}`);
		}

		const instance = factory();

		if (this.singletons.has(token)) {
			this.instances.set(token, instance);
		}

		return instance as T;
	}

	/**
	 * Check if token is registered
	 */
	has(token: string): boolean {
		return this.factories.has(token) || this.instances.has(token);
	}

	/**
	 * Clear all registrations
	 */
	clear(): void {
		this.instances.clear();
		this.factories.clear();
		this.singletons.clear();
	}

	/**
	 * Clear instance (useful for testing)
	 */
	clearInstance(token: string): void {
		this.instances.delete(token);
	}
}
