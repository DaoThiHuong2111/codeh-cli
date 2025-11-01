# Navigation Screen Flow Design

## Current Screen Navigation Logic

### Screen States

- **WELCOME**: Initial/landing screen
- **HOME**: Main interactive screen for user queries
- **CONFIG**: Configuration setup screen

### Key Bindings by Screen

#### WELCOME Screen

| Key    | Action             | Target |
| ------ | ------------------ | ------ |
| Enter  | Navigate to HOME   | HOME   |
| 'c'    | Navigate to CONFIG | CONFIG |
| Ctrl+C | Exit app           | Exit   |

#### HOME Screen

| Key                | Action               | Note                       |
| ------------------ | -------------------- | -------------------------- |
| (None intercepted) | User can type freely | InputBox handles all input |
| ESC (in InputBox)  | Exit app             | Defined in Home.js         |
| Ctrl+C             | Exit app             | Global Navigation handler  |

**Important**: HOME screen does NOT intercept any keys to allow uninterrupted user input in the query box.

#### CONFIG Screen

| Key             | Action                      | Target                    |
| --------------- | --------------------------- | ------------------------- |
| Navigation keys | Move between config options | (Within Config component) |
| Enter           | Confirm selections          | (Within Config component) |
| Escape          | Go back one step            | (Within Config component) |
| Ctrl+H          | Quick return to HOME        | HOME                      |
| Ctrl+C          | Exit app                    | Exit                      |

### Global Handlers (All Screens)

| Key    | Action                       |
| ------ | ---------------------------- |
| Ctrl+C | Exit application immediately |

### Design Principles

1. **HOME is Input-Safe Zone**

   - No key interception at Navigation level
   - User can type freely without accidental navigation
   - InputBox component controls all input

2. **CONFIG Access Points**

   - Primary: From WELCOME screen (press 'c')
   - Secondary: From HOME screen (press Ctrl+H)
   - Ensures user always has config access

3. **Escape Routes**

   - WELCOME: Ctrl+C to exit
   - HOME: ESC to exit (InputBox), Ctrl+C global
   - CONFIG: Ctrl+H to return HOME, Ctrl+C global

4. **Clean State Management**
   - Config component resets state after successful save
   - No stale state carries over between screens
   - Each screen has isolated input handling

### Files Involved

- `source/components/Navigation.js` - Global screen navigation
- `source/screens/Home.js` - User input/query screen
- `source/screens/Config.js` - Configuration setup
- `source/screens/Welcome.js` - Landing screen

### When Adding New Features

- If new feature needs keys at HOME: Add to InputBox component, NOT Navigation
- If new feature needs quick access: Add to WELCOME or use Ctrl+X pattern
- Never intercept keys at HOME level to preserve input integrity
