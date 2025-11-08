# Navigation Screen Flow Design (Updated)

## Current Architecture

### Entry Point
- **File:** `source/cli.tsx`
- **Flow:** main() → setupContainer() → render(<App container={container} />)

### Navigation Structure
- **App** (`source/cli/app.tsx`) → **Navigation** (`source/cli/components/organisms/Navigation.tsx`) → **NavigationProvider** (`source/cli/providers/NavigationProvider.tsx`)

### Screen States

NavigationProvider manages 3 main screens:
- **WELCOME**: Initial screen with auto-detection
- **HOME**: Main interactive screen (uses HomeNew component)
- **CONFIG**: Configuration setup screen

### Auto-Navigation Logic

#### Welcome Screen Auto-Detection (`source/cli/screens/Welcome.tsx`)

The Welcome screen uses `useWelcomeLogic` hook which:

1. **Fetches upgrade info** from API
2. **Checks if should show welcome:**
   - If upgrade info is valid → Show welcome screen (user presses Enter or 'c')
   - If no upgrade info → Auto-check config and navigate

3. **Auto-navigation logic** (`useWelcomeLogic.ts` line 55-70):
   ```typescript
   const checkConfigurationAndNavigate = async () => {
     const loader = new ConfigLoader();
     const status = await loader.getStatus();
     
     if (!status.hasConfig) {
       onNavigateConfig();  // No config → Config screen
     } else {
       onNavigateHome();    // Has config → Home screen
     }
   }
   ```

### Config Detection

**ConfigLoader** checks both:
- Environment variables (priority 1)
- File config at `~/.codeh/configs.json` (priority 2)

**File format:**
```json
{
  "custom_models": [
    {
      "provider": "openai",
      "model": "model-name",
      "base_url": "https://api.url",
      "api_key": "key",
      "max_tokens": 128000,
      "temperature": 0.7
    }
  ]
}
```

### Home Screen Initialization

#### Component: HomeNew (`source/cli/screens/HomeNew.tsx`)

Uses `useHomeLogicNew` hook which:

1. **Initializes API client** via `useCodehClient`
2. **Loads configuration** via ConfigLoader
3. **Creates presenter** with dependencies:
   - CodehClient (initialized)
   - CommandService
   - FileSessionManager
   - Configuration

#### Critical Fix: Client Initialization

**Problem:** React state doesn't update immediately after `setClient()`

**Solution:** `initializeClient()` returns client directly instead of boolean

```typescript
// useCodehClient.ts
const initializeClient = async (): Promise<CodehClient | null> => {
  const newClient = await createCodehClient(container);
  setClient(newClient);
  return newClient;  // Return directly, don't rely on state
}

// useHomeLogicNew.ts
const initializedClient = await initializeClient();
if (!initializedClient) {
  setError('Failed to initialize API client');
  return;
}
// Use initializedClient instead of client state
```

### Key Bindings

#### WELCOME Screen
- **Enter** → Navigate to HOME
- **'c'** → Navigate to CONFIG
- **Ctrl+C** → Exit

#### HOME Screen
- **All input** → Handled by InputBox component
- **ESC** → Exit
- **Ctrl+C** → Exit (global)

#### CONFIG Screen
- **Navigation** → Config component handles
- **Ctrl+H** → Return to HOME
- **Ctrl+C** → Exit (global)

### Files Architecture

```
source/
├── cli.tsx                          # Entry point
├── cli/
│   ├── app.tsx                      # App root
│   ├── components/
│   │   └── organisms/
│   │       └── Navigation.tsx       # Navigation wrapper
│   ├── providers/
│   │   └── NavigationProvider.tsx   # Navigation logic & screen rendering
│   ├── screens/
│   │   ├── Welcome.tsx              # Auto-detect + welcome
│   │   ├── HomeNew.tsx              # Main screen (current)
│   │   ├── Home.tsx                 # Old home (legacy)
│   │   └── Config.tsx               # Config setup
│   └── hooks/
│       ├── useWelcomeLogic.ts       # Welcome auto-navigation
│       ├── useHomeLogicNew.ts       # HomeNew business logic
│       └── useCodehClient.ts        # API client initialization
└── core/
    └── di/
        └── setup.ts                 # DI container setup
```

### Boot Sequence

1. **App starts** → Always shows Welcome screen first (NavigationProvider line 31)
2. **Welcome screen loads** → useWelcomeLogic checks upgrade info
3. **Auto-navigation:**
   - If no upgrade info → Check config
   - If config exists → Navigate to Home
   - If no config → Navigate to Config
4. **Home screen loads** → useHomeLogicNew initializes client & presenter
5. **Ready** → User can interact

### Common Issues & Solutions

#### Issue: "Failed to initialize API client"
**Causes:**
1. Config file doesn't exist or empty
2. Invalid config data (missing required fields)
3. React state timing issue (client state not updated)

**Solution:**
- Use returned client from `initializeClient()` directly
- Don't rely on `client` state immediately after initialization

#### Issue: Stuck on Welcome screen
**Causes:**
1. Upgrade API available (valid response)
2. User needs to press Enter or 'c'

**Solution:**
- This is expected behavior when upgrade info exists
- Auto-navigation only happens when API fails or returns invalid data

### Design Principles

1. **Lazy Initialization:** API client created only when needed (not on app start)
2. **Config Priority:** ENV vars > File config
3. **Auto-Detection:** App auto-navigates based on config status
4. **Error Handling:** Show clear error messages, never crash
5. **State Management:** Return values directly to avoid React state timing issues
