# 🧩 Cấu Trúc Components

> **Phần 2/9** - Technical Documentation | [← Prev: Overview](./01-overview.md) | [Next: Logic Flows →](./03-logic-flows.md) | [Up: Index ↑](../README.md)

---

## Layout Hierarchy

```
Home (Screen)
├── Header
│   ├── Logo (Atom)
│   └── InfoSection (Organism)
│       ├── version
│       ├── model
│       └── directory
│
├── ConversationArea (Organism)
│   └── MessageList (Molecule)
│       └── MessageBubble (Molecule) × N
│
├── Conditional Middle Area
│   ├── TodosDisplay (Organism)      [nếu todos.length > 0]
│   └── TipsDisplay (Organism)       [nếu idle]
│
├── InputPromptArea (Molecule)
│   └── InputBox (Molecule)
│       ├── Prefix: "> "
│       ├── Input field
│       ├── Character counter
│       └── Border decoration
│
├── SlashSuggestions (Organism)       [nếu input starts with "/"]
│   └── Menu (Molecule)
│       └── Command items × N
│
├── Footer (Organism)
│   ├── model info
│   ├── directory
│   ├── token count
│   └── git branch
│
└── HelpOverlay (Organism)            [nếu showHelp = true]
    ├── Keyboard shortcuts
    └── Slash commands
```

---

## Chi Tiết Từng Component

### 1. Logo (Atom)

```javascript
// File: cli/components/atoms/Logo.js
// Hiển thị: "CODEH" với gradient color
// Dependencies: ink-gradient, ink-big-text
```

### 2. InfoSection (Organism)

```javascript
// File: cli/components/organisms/InfoSection.js
// Props:
//   - version: string     (e.g., "1.0.0")
//   - model: string       (e.g., "claude-3-5-sonnet")
//   - directory: string   (e.g., "/home/user/project")
// Hiển thị: Version, Model, Directory info
```

### 3. ConversationArea (Organism)

```javascript
// File: cli/components/organisms/ConversationArea.js
// Props:
//   - messages: Message[]
//   - isLoading: boolean
//   - scrollPosition: number
//
// Features:
//   - Virtual scrolling cho performance
//   - Auto-scroll to bottom
//   - Loading indicator khi isLoading=true
//   - Empty state khi messages=[]
```

### 4. MessageBubble (Molecule)

```javascript
// File: cli/components/molecules/MessageBubble.js
// Props: message { id, role, content, timestamp, metadata }
//
// Role Types:
//   - 'user'      → Prefix: "> You"      | Color: cyan
//   - 'assistant' → Prefix: "< Assistant"| Color: green
//   - 'error'     → Prefix: "✗ Error"    | Color: red
//   - 'system'    → Prefix: "ℹ System"   | Color: blue
//
// Features:
//   - Markdown rendering (parseContent)
//   - Timestamp display
//   - Metadata (tool calls, tokens)
```

### 5. TodosDisplay (Organism)

```javascript
// File: cli/components/organisms/TodosDisplay.js
// Props: todos[]
//
// Todo Status:
//   - 'pending'     → Icon: ○ | Color: gray
//   - 'in_progress' → Icon: ▶ | Color: yellow
//   - 'completed'   → Icon: ✓ | Color: green
//
// Features:
//   - Progress counter: "X/Y completed"
//   - Dynamic activeForm text cho in_progress tasks
```

### 6. TipsDisplay (Organism)

```javascript
// File: cli/components/organisms/TipsDisplay.js
// Random tips từ predefined array
// Hiển thị khi: !isLoading && todos.length === 0
```

### 7. InputPromptArea (Molecule)

```javascript
// File: cli/components/molecules/InputPromptArea.js
// Props:
//   - value: string
//   - onChange: (value) => void
//   - onSubmit: (value) => void
//   - error: string
//   - placeholder: string
//   - showCharCount: boolean
//   - hasSuggestions: boolean
//   - onSuggestionNavigate: (direction) => void
//   - onSuggestionSelect: () => string
//
// Features:
//   - Input history (↑↓ navigation)
//   - Max 10,000 characters
//   - Error display
//   - Suggestion mode (for slash commands)
```

### 8. SlashSuggestions (Organism)

```javascript
// File: cli/components/organisms/SlashSuggestions.js
// Props:
//   - input: string
//   - selectedIndex: number
//   - commands: Command[]
//
// Conditional render:
//   - Chỉ hiện khi input.startsWith('/')
//   - Filter commands theo input
//   - Highlight selected command
//
// Navigation:
//   - ↑↓: Navigate
//   - Enter/Tab: Select
```

### 9. Footer (Organism)

```javascript
// File: cli/components/organisms/Footer.js
// Props:
//   - model: string
//   - directory: string
//   - tokenCount: number (optional)
//   - gitBranch: string (optional)
//
// Format:
//   🤖 model | 📁 directory | 🪙 tokens | [branch]
```

### 10. HelpOverlay (Organism)

```javascript
// File: cli/components/organisms/HelpOverlay.js
// Hiển thị:
//   - Keyboard shortcuts
//   - Slash commands
//   - Close: Press '?' or Esc
//
// Style: Bordered overlay với double-line border
```

---

## 🔗 Navigation

[← Prev: Overview](./01-overview.md) | [Next: Logic Flows →](./03-logic-flows.md) | [Up: Index ↑](../README.md)

---

**Last Updated**: 2025-01-08 | **Part**: 2/9
