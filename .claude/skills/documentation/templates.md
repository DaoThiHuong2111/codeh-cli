# Documentation Templates

Standard templates for all documentation types in this project.

## Screen README Template

Use this for `docs/screens/{screen-name}/README.md`:

```markdown
# {Screen Name} Screen

Brief one-line description of what this screen does.

## Overview

2-3 sentences explaining the screen's purpose and when users see it.

## Features

### Core Features
1. **Feature Name**: Brief description
2. **Another Feature**: Brief description
3. **Third Feature**: Brief description

### Advanced Features (if applicable)
4. **Advanced Feature**: Brief description

## Usage

### Basic Usage

Describe the most common use case with example:

\```
User action → Result
User action → Result
\```

### Keyboard Shortcuts

| Key      | Action           |
|----------|------------------|
| `Enter`  | Action           |
| `ESC`    | Action           |
| `Ctrl+C` | Action           |

## Components

- **MainComponent**: Brief description (path:line)
- **SubComponent**: Brief description (path:line)
- **HookName**: Brief description (path:line)

## Layout

\```
┌─────────────────────────────────────┐
│  Component Hierarchy                │
├─────────────────────────────────────┤
│  Visual representation              │
└─────────────────────────────────────┘
\```

## State Management

Brief description of how state is managed.

## Performance

Key performance metrics or optimizations.

## Related

- [Related Doc 1](../path/to/doc.md)
- [Related Doc 2](../../path/to/doc.md)
```

## Screen Technical Template

Use this for `docs/screens/{screen-name}/technical.md`:

```markdown
# {Screen Name} - Technical

## Architecture

### Components

- **Component.tsx**: Main component (Presentation Layer)
- **Presenter.ts**: Business logic (Core Layer)
- **useHook.ts**: State management hook
- **Model.ts**: Domain model (Core Layer)

### Dependencies

\```
Component (CLI)
  ├── useNavigation()
  ├── useCustomHook()
  │   └── Presenter
  │       ├── Service
  │       └── Repository
  └── useKeyboardHook()
\```

## State Management

### State Interface

\```typescript
interface ComponentState {
  field1: Type;
  field2: Type;
  field3: Type;
}
\```

### State Flow

\```
Initial State
  → User Action
  → State Update
  → Re-render
  → New State
\```

## Implementation Details

### Key Functions

\```typescript
function keyFunction(param: Type): ReturnType {
  // Implementation description
  // Reference: path/to/file.ts:line
}
\```

### Event Handling

\```typescript
useInput((input, key) => {
  if (key.return) {
    // Handle Enter
  }
  if (key.escape) {
    // Handle Escape
  }
});
\```

## Validation

### Validation Rules

\```typescript
function validate(value: string): {valid: boolean; error?: string} {
  if (condition) {
    return {valid: false, error: 'Error message'};
  }
  return {valid: true};
}
\```

## Persistence (if applicable)

### Storage Location

Description of where data is stored.

### Format

\```json
{
  "field": "value"
}
\```

## Testing

### Unit Tests

\```typescript
describe('Component', () => {
  test('should do something', () => {
    expect(result).toBe(expected);
  });
});
\```

### Integration Tests

Description of integration test approach.

## Performance

- **Optimization 1**: Description
- **Optimization 2**: Description
- **Metrics**: Key performance metrics

## Security (if applicable)

- **Security consideration 1**: Description
- **Security consideration 2**: Description

## Related Files

- `path/to/file.ts:line` - Description
- `path/to/file.ts:line` - Description
```

## Screen Features Template

Use this for `docs/screens/{screen-name}/features.md`:

```markdown
# {Screen Name} - Features

Detailed documentation of all features.

## Feature 1: Name

### Description

Detailed description of what this feature does.

### Usage

\```
Step-by-step usage example
\```

### Configuration

| Option     | Type   | Default | Description |
|------------|--------|---------|-------------|
| option1    | string | 'value' | Description |

### Examples

#### Example 1: Common Use Case

\```typescript
// Code example
\```

**Result**: Description of result

#### Example 2: Advanced Use Case

\```typescript
// Code example
\```

**Result**: Description of result

### Error Handling

| Error              | Cause            | Solution        |
|--------------------|------------------|-----------------|
| Error message      | What causes it   | How to fix      |

### Implementation

Brief technical note about implementation.

Reference: path/to/file.ts:line

---

## Feature 2: Name

[Repeat structure above]

---

## Feature Comparison

| Feature    | Screen 1 | Screen 2 | Notes      |
|------------|----------|----------|------------|
| Feature A  | ✅       | ❌       | Note       |
| Feature B  | ✅       | ✅       | Note       |

## Future Enhancements

- [ ] Potential feature 1
- [ ] Potential feature 2
```

## Screen Flows Template

Use this for `docs/screens/{screen-name}/flows.md`:

```markdown
# {Screen Name} - User Flows

## Flow 1: Primary Flow Name

### Description

What this flow accomplishes.

### Steps

\```
1. User Action
   → System Response
   → State Change

2. Next Action
   → System Response
   → State Change

3. Final Action
   → System Response
   → Result
\```

### Visual Flow

\```
┌─────────────┐
│   Start     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Action    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Result    │
└─────────────┘
\```

### Mermaid Diagram (optional)

\```mermaid
graph TD
  A[Start] --> B[Action]
  B --> C{Condition}
  C -->|Yes| D[Result 1]
  C -->|No| E[Result 2]
\```

### Error Cases

**Error 1**: Description
\```
User Action → Error → Recovery
\```

**Error 2**: Description
\```
User Action → Error → Recovery
\```

---

## Flow 2: Secondary Flow Name

[Repeat structure above]

---

## State Transitions

\```
State A
  ├─ Event 1 → State B
  ├─ Event 2 → State C
  └─ Event 3 → State A (no change)

State B
  ├─ Event 4 → State C
  └─ Event 5 → State A
\```

## Sequence Diagrams

For complex interactions:

\```
User          Component       Service       API
  │               │              │           │
  ├─ Action ─────>│              │           │
  │               ├─ Process ───>│           │
  │               │              ├─ Call ───>│
  │               │              │<── Response
  │               │<── Result ───┤           │
  │<── Update ────┤              │           │
\```
```

## Architecture Document Template

Use this for `docs/architecture/*.md`:

```markdown
# {Architecture Topic}

## Overview

High-level description of this architectural component.

## Architecture Diagram

\```
┌──────────────────────────────────────┐
│         Layer 1: Name                │
│  Components, responsibilities        │
└────────────────┬─────────────────────┘
                 │ depends on
┌────────────────▼─────────────────────┐
│         Layer 2: Name                │
│  Components, responsibilities        │
└────────────────┬─────────────────────┘
                 │ depends on
┌────────────────▼─────────────────────┐
│         Layer 3: Name                │
│  Components, responsibilities        │
└──────────────────────────────────────┘
\```

## Components

### Component 1

**Purpose**: What it does

**Responsibilities**:
- Responsibility 1
- Responsibility 2

**Location**: path/to/directory/

**Key Files**:
- `File.ts:line` - Description
- `File.ts:line` - Description

**Example**:

\```typescript
// Code example showing usage
\```

### Component 2

[Repeat structure above]

## Patterns

### Pattern 1: Name

**When to use**: Description

**Implementation**:

\```typescript
// Code example
\```

**Benefits**:
- Benefit 1
- Benefit 2

**Trade-offs**:
- Trade-off 1
- Trade-off 2

### Pattern 2: Name

[Repeat structure above]

## Data Flow

\```
Input
  → Processing Step 1
  → Processing Step 2
  → Output
\```

## Design Decisions

### Decision 1: Title

**Context**: What problem we were solving

**Options Considered**:
1. Option A - Pros/Cons
2. Option B - Pros/Cons
3. Option C - Pros/Cons (chosen)

**Rationale**: Why we chose option C

**Consequences**: What this means for the codebase

### Decision 2: Title

[Repeat structure above]

## Examples

### Example 1: Common Pattern

\```typescript
// Complete code example
\```

### Example 2: Advanced Pattern

\```typescript
// Complete code example
\```

## Testing

How to test this architectural component.

## Migration Guide (if applicable)

How to migrate from old to new architecture.

## Related

- [Related Doc 1](../path/to/doc.md)
- [Related Doc 2](../path/to/doc.md)
```

## Guide Document Template

Use this for `docs/guides/*.md`:

```markdown
# {Guide Name}

Brief description of what this guide covers.

## Table of Contents

- [Section 1](#section-1)
- [Section 2](#section-2)
- [Section 3](#section-3)

## Prerequisites

- Prerequisite 1
- Prerequisite 2

## Section 1: Getting Started

### Subsection 1.1

Content with examples.

\```bash
# Command example
command --flag value
\```

### Subsection 1.2

Content with examples.

## Section 2: Main Content

### Step-by-step Instructions

1. **Step 1**: Description
   \```
   Example
   \```

2. **Step 2**: Description
   \```
   Example
   \```

3. **Step 3**: Description
   \```
   Example
   \```

### Common Tasks

#### Task 1: Name

\```bash
# How to do task 1
\```

#### Task 2: Name

\```bash
# How to do task 2
\```

## Section 3: Advanced Topics

### Advanced Topic 1

Detailed explanation with examples.

### Advanced Topic 2

Detailed explanation with examples.

## Troubleshooting

### Problem 1

**Symptom**: Description

**Cause**: Why it happens

**Solution**: How to fix

\```bash
# Solution command
\```

### Problem 2

[Repeat structure above]

## Best Practices

- ✅ **Do this**: Explanation
- ✅ **Do that**: Explanation
- ❌ **Don't do this**: Explanation
- ❌ **Don't do that**: Explanation

## Examples

### Example 1: Common Use Case

\```typescript
// Complete example
\```

### Example 2: Advanced Use Case

\```typescript
// Complete example
\```

## Reference

### Quick Reference Table

| Item       | Description    | Example        |
|------------|----------------|----------------|
| Item 1     | Description    | Example        |
| Item 2     | Description    | Example        |

## FAQ

**Q: Question 1?**

A: Answer 1

**Q: Question 2?**

A: Answer 2

## Related

- [Related Doc 1](../path/to/doc.md)
- [Related Doc 2](../path/to/doc.md)
```

## Template Selection Guide

| Document Type | Template | Max Lines | When to Use |
|---------------|----------|-----------|-------------|
| Screen Overview | Screen README | 300 | New screen, overview needed |
| Screen Tech | Screen Technical | 500 | Implementation details |
| Screen Features | Screen Features | 400 | Complex features (5+) |
| Screen Flows | Screen Flows | 300 | Complex workflows |
| Architecture | Architecture | 500 | New pattern/layer |
| Guide | Guide | 500 | User/developer guides |

## Template Variables

Replace these placeholders:

- `{Screen Name}` - Capitalized screen name (e.g., "Home", "Config")
- `{screen-name}` - Lowercase with hyphens (e.g., "home", "config")
- `{Architecture Topic}` - Topic name (e.g., "3-Layer Architecture")
- `{Guide Name}` - Guide name (e.g., "User Guide", "Development Guide")
