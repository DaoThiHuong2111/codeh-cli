# Configuration System Architecture

## Overview

The configuration system uses a **layered architecture** with priority-based fallback logic to handle API credentials and settings.

## Architecture

```
ConfigLoader
├── EnvConfigRepository (Priority 1)
│   └── Reads from process.env
│       ├── CODEH_PROVIDER
│       ├── CODEH_MODEL
│       ├── CODEH_API_KEY
│       ├── CODEH_BASE_URL
│       ├── CODEH_MAX_TOKENS
│       └── CODEH_TEMPERATURE
│
└── FileConfigRepository (Priority 2)
    └── Reads from ~/.codeh/configs.json
        └── custom_models[0]
```

## File Structure

### ConfigLoader (`source/infrastructure/config/ConfigLoader.ts`)

Main class that orchestrates config loading with fallback:

```typescript
class ConfigLoader {
	private envRepo: EnvConfigRepository;
	private fileRepo: FileConfigRepository;

	async mergeConfigs(): Promise<ConfigData | null> {
		const fileConfig = await this.fileRepo.getAll();
		const envConfig = await this.envRepo.getAll();

		// Return null if neither exists
		if (!envConfig && !fileConfig) {
			return null;
		}

		// Merge with ENV priority
		return {
			provider: envConfig?.provider || fileConfig?.provider || 'anthropic',
			model: envConfig?.model || fileConfig?.model || '',
			baseUrl: envConfig?.baseUrl || fileConfig?.baseUrl,
			apiKey: envConfig?.apiKey || fileConfig?.apiKey,
			maxTokens: envConfig?.maxTokens || fileConfig?.maxTokens || 4096,
			temperature: envConfig?.temperature || fileConfig?.temperature || 0.7,
		};
	}
}
```

### File Config Location

**Path:** `~/.codeh/configs.json`

**Format:**

```json
{
	"custom_models": [
		{
			"provider": "openai",
			"model": "gpt-4",
			"base_url": "https://api.openai.com/v1",
			"api_key": "sk-...",
			"max_tokens": 128000,
			"temperature": 0.7
		}
	]
}
```

**Note:** Only the **first model** in `custom_models` array is used.

## Repositories

### FileConfigRepository (`source/infrastructure/config/FileConfigRepository.ts`)

Handles file-based config:

```typescript
class FileConfigRepository implements IConfigRepository {
	private configFile: string; // ~/.codeh/configs.json

	async getAll(): Promise<ConfigData | null> {
		const firstModel = this.config.custom_models?.[0];
		if (!firstModel) {
			return null; // Trigger Config screen
		}
		return {
			provider: firstModel.provider,
			model: firstModel.model || '',
			baseUrl: firstModel.base_url,
			apiKey: firstModel.api_key,
			maxTokens: firstModel.max_tokens || 4096,
			temperature: firstModel.temperature || 0.7,
		};
	}

	async exists(): Promise<boolean> {
		// File must exist AND have at least one model
		return existsSync(this.configFile) && this.config.custom_models?.length > 0;
	}
}
```

### EnvConfigRepository (`source/infrastructure/config/EnvConfigRepository.ts`)

Handles environment variables:

```typescript
class EnvConfigRepository implements IConfigRepository {
	async getAll(): Promise<ConfigData | null> {
		const provider = process.env.CODEH_PROVIDER;
		if (!provider) {
			return null;
		}

		return {
			provider: provider as any,
			model: process.env.CODEH_MODEL || '',
			baseUrl: process.env.CODEH_BASE_URL,
			apiKey: process.env.CODEH_API_KEY,
			maxTokens: parseInt(process.env.CODEH_MAX_TOKENS || '4096'),
			temperature: parseFloat(process.env.CODEH_TEMPERATURE || '0.7'),
		};
	}
}
```

## Configuration Flow

### 1. Load Config

```typescript
const loader = new ConfigLoader();
const config = await loader.load();
```

Returns:

- `Configuration` object if config exists
- `null` if no config (triggers Config screen)

### 2. Merge Priority

ENV variables override file config:

```typescript
{
  provider: ENV || FILE || 'anthropic',
  model: ENV || FILE || '',
  baseUrl: ENV || FILE || undefined,
  apiKey: ENV || FILE || undefined,
  maxTokens: ENV || FILE || 4096,
  temperature: ENV || FILE || 0.7
}
```

### 3. Validation

```typescript
async validate(): Promise<{ valid: boolean; errors: string[] }> {
  const config = await this.load();
  if (!config) {
    return { valid: false, errors: ['No configuration found'] };
  }
  return {
    valid: errors.length === 0,
    errors: config.getValidationErrors()
  };
}
```

### 4. Create API Client

```typescript
// In setup.ts
const config = await configLoader.mergeConfigs();
if (!config) {
	throw new Error('No configuration found. Please run "codeh config"');
}

const configuration = Configuration.create(config);
const apiClient = factory.create(configuration);
```

## Configuration Domain Model

### Configuration (`source/core/domain/models/Configuration.ts`)

```typescript
class Configuration {
	constructor(
		public readonly provider: Provider,
		public readonly model: string,
		public readonly apiKey?: string,
		public readonly baseUrl?: string,
		public readonly maxTokens: number = 4096,
		public readonly temperature: number = 0.7,
	) {}

	static create(data: {
		provider: string;
		model: string;
		// ...
	}): Configuration {
		const providerInfo = ProviderInfo.fromString(data.provider);

		if (!data.model || data.model.trim() === '') {
			throw new Error('Model is required');
		}

		return new Configuration(
			providerInfo.name,
			data.model,
			data.apiKey,
			data.baseUrl,
			data.maxTokens,
			data.temperature,
		);
	}
}
```

## Provider Support

### Provider Enum (`source/core/domain/valueObjects/Provider.ts`)

```typescript
enum Provider {
	ANTHROPIC = 'anthropic',
	OPENAI = 'openai',
	OLLAMA = 'ollama',
	GENERIC = 'generic-chat-completion-api',
}
```

### ProviderInfo

```typescript
class ProviderInfo {
	static fromString(value: string): ProviderInfo {
		if (!value || value.trim() === '') {
			throw new Error('Provider cannot be empty');
		}

		const provider = value as Provider;
		if (!this.PROVIDERS[provider]) {
			throw new Error(`Unknown provider: ${value}`);
		}
		return this.PROVIDERS[provider];
	}
}
```

## Usage Examples

### Check Config Status

```typescript
const loader = new ConfigLoader();
const status = await loader.getStatus();

if (status.hasConfig) {
	console.log(`Provider: ${status.provider}`);
	console.log(`Model: ${status.model}`);
} else {
	// Navigate to Config screen
}
```

### Save Config

```typescript
const config = Configuration.create({
	provider: 'openai',
	model: 'gpt-4',
	apiKey: 'sk-...',
	baseUrl: 'https://api.openai.com/v1',
	maxTokens: 128000,
	temperature: 0.7,
});

await loader.save(config);
```

### Clear Config

```typescript
await loader.clear(); // Clears file config only, not env vars
```

## Key Design Decisions

1. **No Circular Dependencies**
   - ConfigLoader uses repositories
   - Repositories don't know about each other
   - Clean separation of concerns

2. **Graceful Degradation**
   - Return `null` instead of throwing on missing config
   - Allow app to start without config
   - Trigger Config screen when needed

3. **ENV Priority**
   - ENV vars take precedence (runtime override)
   - File config is persistent fallback
   - Supports both dev and prod workflows

4. **Type Safety**
   - Strong typing throughout
   - Domain models enforce validation
   - Compile-time checks prevent errors

## Testing Scenarios

✅ **Fresh install:** No config → null → Config screen  
✅ **File config:** Reads from ~/.codeh/configs.json  
✅ **ENV override:** ENV vars take precedence  
✅ **Missing model:** Throws validation error  
✅ **Invalid provider:** Throws "Unknown provider" error  
✅ **Partial config:** Merges with defaults
