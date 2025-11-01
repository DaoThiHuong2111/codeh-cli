# Config Fallback Logic Implementation

## Problem

- Config screen saves to file AND sets env vars
- When user Ctrl+C, env vars disappear on next restart
- Code that only reads env vars will fail

## Solution: Centralized Config with Fallback

### Architecture

```
All config reads → services/config.js getter functions
                 ├─ Check env var (fast, session-only)
                 ├─ Check config file ~/.codeh/configs.json (persistent)
                 └─ Return default value or empty string
```

### New Getter Functions (services/config.js)

All implement same pattern:

```javascript
export function getModel() {
	try {
		return getConfigValue('CODEH_MODEL', 'custom_models.0.model', '');
	} catch (error) {
		return '';
	}
}
```

Available getters:

- `getModel()` → env CODEH_MODEL | file custom_models[0].model | ''
- `getApiKey()` → env CODEH_API_KEY | file custom_models[0].api_key | ''
- `getBaseUrl()` → env CODEH_BASE_URL | file custom_models[0].base_url | ''
- `getProvider()` → env CODEH_PROVIDER | file custom_models[0].provider | ''
- `getMaxToken()` → env CODEH_MAX_TOKEN | file custom_models[0].max_token | 0

### Usage in Other Services

#### apiManager.js

```javascript
import {getModel, getApiKey, getBaseUrl, getProvider, getMaxToken} from './config.js';

// In class, use helper:
getConfig() {
  return {
    provider: getProvider(),
    model: getModel(),
    apiKey: getApiKey(),
    baseUrl: getBaseUrl(),
    maxTokens: getMaxToken(),
  };
}

// Then use: this.getConfig()
```

#### configManager.js

```javascript
// In validate():
const provider =
	envManager.get('CODEH_PROVIDER') || (firstModel ? firstModel.provider : null);
const apiKey =
	envManager.get('CODEH_API_KEY') || (firstModel ? firstModel.api_key : null);

// In getSummary():
const provider =
	envManager.get('CODEH_PROVIDER') || (firstModel ? firstModel.provider : '');
```

### Key Design Decisions

1. **No Circular Imports**

   - config.js imports configManager
   - configManager does NOT import config
   - configManager uses inline fallback logic

2. **Graceful Degradation**

   - All getters wrapped in try-catch
   - Return empty strings/0 on errors
   - App doesn't crash on missing config

3. **Env Priority**
   - Check env first (allows override)
   - Falls back to persistent file
   - Supports both session and persistent config

### Testing

- Fresh install: Config saved to file, survives restart ✓
- Env override: export CODEH_MODEL=xxx works ✓
- Recovery: Ctrl+C then restart → reads from file ✓
- Missing config: Returns default, no crash ✓

### Migration Checklist

- ✅ All direct env reads replaced
- ✅ All envManager.modelConfig replaced
- ✅ No circular dependencies
- ✅ Error handling in place
- ✅ Code formatted and reviewed
