# Config Screen - Technical

## Architecture

### Components

- **Config.tsx**: Main container (Presentation Layer)
- **ConfigPresenter.ts**: Business logic (Core Layer)
- **useConfigWizard.ts**: Wizard state management hook
- **useConfigKeyboard.ts**: Keyboard handling hook
- **Configuration.ts**: Domain model (Core Layer)
- **ConfigLoader.ts**: Config persistence (Infrastructure Layer)

### Dependencies

```
Config (CLI)
  ├── useNavigation()
  ├── useConfigWizard()
  │   └── ConfigPresenter
  │       ├── ConfigLoader
  │       │   ├── FileConfigRepository
  │       │   └── EnvConfigRepository
  │       └── Configuration (Domain Model)
  └── useConfigKeyboard()
```

## State Management

### ConfigStep Enum

```typescript
enum ConfigStep {
  PROVIDER = 'provider',
  MODEL = 'model',
  API_KEY = 'apiKey',
  BASE_URL = 'baseUrl',
  MAX_TOKENS = 'maxTokens',
  CONFIRM = 'confirm',
}
```

### Wizard State

```typescript
interface WizardState {
  currentStep: ConfigStep;
  selectedProvider: Provider | null;
  selectedModel: string;
  apiKey: string;
  baseUrl: string;
  maxTokens: string;
  error: string | null;
  saving: boolean;
  providerIndex: number;
  confirmIndex: number;
  providers: MenuItem[];
  confirmOptions: MenuItem[];
}
```

## Flow

### Step-by-Step Process

```
1. PROVIDER
   ├── User navigates với ↑↓
   ├── Press Enter
   └── Set selectedProvider → Go to MODEL

2. MODEL
   ├── User types model name
   ├── Press Enter
   ├── Validate not empty
   └── Set selectedModel → Go to API_KEY

3. API_KEY
   ├── If provider === 'ollama':
   │   └── Skip to BASE_URL
   └── Else:
       ├── User enters API key (masked)
       ├── Press Enter
       └── Set apiKey → Go to BASE_URL

4. BASE_URL
   ├── User enters URL or press Enter to skip
   └── Set baseUrl → Go to MAX_TOKENS

5. MAX_TOKENS
   ├── User enters number
   ├── Validate 1-1,000,000
   ├── Show error nếu invalid
   └── Set maxTokens → Go to CONFIRM

6. CONFIRM
   ├── Display summary:
   │   ├── Provider
   │   ├── Model
   │   ├── API Key (masked)
   │   ├── Base URL (if set)
   │   └── Max Tokens
   ├── Options:
   │   ├── Save → saveConfiguration()
   │   └── Edit → goBack(PROVIDER)
   └── On Save Success → Navigate to Home
```

## Validation

### Model Validation

```typescript
function validateModel(model: string): boolean {
  return model.trim() !== '';
}
```

### Max Tokens Validation

```typescript
function validateMaxTokens(value: string): {valid: boolean; error?: string} {
  const num = parseInt(value, 10);

  if (isNaN(num)) {
    return {valid: false, error: 'Must be a number'};
  }

  if (num <= 0) {
    return {valid: false, error: 'Must be greater than 0'};
  }

  if (num > 1000000) {
    return {valid: false, error: 'Must be less than 1,000,000'};
  }

  return {valid: true};
}
```

### Configuration Validation

```typescript
class Configuration {
  isValid(): boolean {
    if (!this.model || this.model.trim() === '') {
      return false;
    }

    if (this.requiresApiKey() && !this.apiKey) {
      return false;
    }

    if (this.maxTokens <= 0 || this.maxTokens > 1000000) {
      return false;
    }

    if (this.temperature < 0 || this.temperature > 2) {
      return false;
    }

    return true;
  }

  getValidationErrors(): string[] {
    const errors: string[] = [];

    if (!this.model || this.model.trim() === '') {
      errors.push('Model is required');
    }

    if (this.requiresApiKey() && !this.apiKey) {
      errors.push(`API key is required for ${this.provider}`);
    }

    if (this.maxTokens <= 0) {
      errors.push('Max tokens must be greater than 0');
    }

    if (this.maxTokens > 1000000) {
      errors.push('Max tokens must be less than 1,000,000');
    }

    if (this.temperature < 0 || this.temperature > 2) {
      errors.push('Temperature must be between 0 and 2');
    }

    return errors;
  }
}
```

## Persistence

### ConfigLoader

```typescript
class ConfigLoader {
  private fileRepo: FileConfigRepository;
  private envRepo: EnvConfigRepository;

  async load(): Promise<Configuration | null> {
    // Try env first, then file
    const envConfig = await this.envRepo.load();
    if (envConfig) return envConfig;

    return await this.fileRepo.load();
  }

  async save(config: Configuration): Promise<void> {
    // Save to file only (not env)
    await this.fileRepo.save(config);
  }

  async validate(): Promise<{valid: boolean; errors: string[]}> {
    const config = await this.load();

    if (!config) {
      return {valid: false, errors: ['No configuration found']};
    }

    return {
      valid: config.isValid(),
      errors: config.getValidationErrors(),
    };
  }
}
```

### File Storage

**Location**: `~/.codeh/config.json`

**Format**:
```json
{
  "provider": "anthropic",
  "model": "claude-3-5-sonnet-20241022",
  "baseUrl": "https://api.anthropic.com/v1",
  "maxTokens": 4096,
  "temperature": 0.7
}
```

### Environment Variables

**Priority**: Env vars override file config

**Variables**:
- `CODEH_PROVIDER`: Provider name
- `CODEH_MODEL`: Model name
- `CODEH_API_KEY`: API key (secure)
- `CODEH_BASE_URL`: Base URL
- `CODEH_MAX_TOKENS`: Max tokens
- `CODEH_TEMPERATURE`: Temperature

## Keyboard Handling

### useConfigKeyboard Hook

```typescript
function useConfigKeyboard(options: {
  currentStep: ConfigStep;
  saving: boolean;
  providerIndex: number;
  confirmIndex: number;
  providersLength: number;
  confirmOptionsLength: number;
  onNavigateHome: () => void;
  onGoBack: (step?: ConfigStep) => void;
  onProviderIndexChange: (index: number) => void;
  onConfirmIndexChange: (index: number) => void;
  onComplete: () => Promise<void>;
}) {
  useInput((input, key) => {
    // ESC: Go back or exit
    if (key.escape) {
      if (currentStep === ConfigStep.PROVIDER) {
        onNavigateHome();
      } else {
        onGoBack();
      }
    }

    // Enter: Complete current step
    if (key.return) {
      onComplete();
    }

    // Arrow keys: Navigate menu
    if (key.upArrow) {
      if (currentStep === ConfigStep.PROVIDER) {
        const newIndex = providerIndex > 0 ? providerIndex - 1 : providersLength - 1;
        onProviderIndexChange(newIndex);
      } else if (currentStep === ConfigStep.CONFIRM) {
        const newIndex = confirmIndex > 0 ? confirmIndex - 1 : confirmOptionsLength - 1;
        onConfirmIndexChange(newIndex);
      }
    }

    if (key.downArrow) {
      if (currentStep === ConfigStep.PROVIDER) {
        const newIndex = providerIndex < providersLength - 1 ? providerIndex + 1 : 0;
        onProviderIndexChange(newIndex);
      } else if (currentStep === ConfigStep.CONFIRM) {
        const newIndex = confirmIndex < confirmOptionsLength - 1 ? confirmIndex + 1 : 0;
        onConfirmIndexChange(newIndex);
      }
    }
  });
}
```

## Error Handling

### Error Types

1. **Validation Errors**: Displayed inline trên từng step
2. **Save Errors**: Displayed sau khi save failed
3. **Load Errors**: Handled khi không load được existing config

### Error Display

```typescript
{wizard.error && (
  <Box marginTop={1}>
    <Text color="red">{wizard.error}</Text>
  </Box>
)}
```

### Error Recovery

- User có thể retry invalid input
- ESC để go back và edit previous steps
- Errors được clear khi user changes input

## Testing

### Unit Tests

```typescript
describe('Configuration', () => {
  test('should validate required fields', () => {
    const config = Configuration.create({
      provider: 'anthropic',
      model: '',
      apiKey: 'sk-ant-123',
    });

    expect(config.isValid()).toBe(false);
    expect(config.getValidationErrors()).toContain('Model is required');
  });

  test('should require API key for Anthropic', () => {
    const config = Configuration.create({
      provider: 'anthropic',
      model: 'claude-3-5-sonnet',
    });

    expect(config.isValid()).toBe(false);
    expect(config.getValidationErrors()).toContain('API key is required for anthropic');
  });

  test('should not require API key for Ollama', () => {
    const config = Configuration.create({
      provider: 'ollama',
      model: 'llama2',
    });

    expect(config.isValid()).toBe(true);
  });
});
```

### Integration Tests

- Test wizard flow từ start to finish
- Test save và load configuration
- Test validation errors ở mỗi step
- Test keyboard navigation

## Performance

- **Lazy Loading**: ConfigPresenter chỉ được init khi cần
- **Debouncing**: Input validation debounced 300ms
- **Minimal Re-renders**: React.memo cho sub-components
- **Fast Persistence**: Async file writes không block UI

## Security

- **API Key Masking**: API key input được mask với type="password"
- **No Logging**: API keys không được log hoặc display
- **Secure Storage**: API keys stored trong `.env` (gitignored)
- **JSON Sanitization**: API key không included trong `toJSON()`

## Related Files

- `source/cli/screens/Config.tsx:16` - Main component
- `source/cli/presenters/ConfigPresenter.ts:11` - Business logic
- `source/cli/hooks/useConfigWizard.ts` - Wizard hook
- `source/cli/hooks/useConfigKeyboard.ts` - Keyboard hook
- `source/core/domain/models/Configuration.ts:8` - Domain model
- `source/infrastructure/config/ConfigLoader.ts` - Persistence
