# Welcome Screen - Technical

## Components

- `WelcomeScreen`: Main container
- `WelcomePresenter`: Business logic
- `useWelcomeLogic`: React hook

## State

```typescript
interface WelcomeState {
  step: 'provider' | 'apiKey' | 'model' | 'confirm';
  selectedProvider: Provider | null;
  apiKey: string;
  selectedModel: string | null;
  error: string | null;
}
```

## Flow

```
Step 1: Provider Selection
  → User selects provider
  → Set selectedProvider

Step 2: API Key Input
  → User enters API key
  → Validate format
  → Set apiKey

Step 3: Model Selection
  → Fetch available models for provider
  → User selects model
  → Set selectedModel

Step 4: Confirm
  → Show summary
  → User confirms
  → Save configuration
  → Navigate to Home Screen
```

## Validation

```typescript
function validateApiKey(provider: Provider, key: string): boolean {
  const patterns = {
    anthropic: /^sk-ant-/,
    openai: /^sk-/,
    ollama: /^.*$/, // No validation for local
    generic: /^.*$/
  };

  return patterns[provider].test(key);
}
```
