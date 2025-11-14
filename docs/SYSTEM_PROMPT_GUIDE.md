# System Prompt Guide: How to Create Effective Tool Prompts

## Overview

System prompts guide the AI on **when** and **how** to use tools. This is critical for autonomous AI agents that need to decide which tool to call without user intervention.

## Core Principles

### 1. **Clarity**: Be explicit about tool purpose
### 2. **Specificity**: Give concrete examples
### 3. **Context**: Explain when NOT to use the tool
### 4. **Chaining**: Show how tools work together

---

## System Prompt Structure

Mỗi tool prompt nên có 4 phần chính:

```
1. Tool Overview - What it does
2. When to Use - Specific scenarios
3. Parameters Guide - How to fill arguments
4. Examples - Concrete use cases
```

---

## Example: Phân Tích Tool Prompt Thực Tế

### `symbol_search` Tool

####  **BAD Prompt** (Vague):
```
Tool: symbol_search
Description: Search for symbols in code
Use it when you need to find something
```

#### ✅ **GOOD Prompt** (Specific):
```
### symbol_search

**When to use:**
- User asks to "find", "search", or "locate" a class, function, method, or interface
- User wants to see the definition or signature of a symbol
- User asks "where is X defined?"
- User asks "show me the code for X"

**Do NOT use when:**
- User wants to find text/strings → use search_for_pattern instead
- User wants to find files → use find_file instead

**Parameters:**
- namePath: Can be simple ("UserService") or path-like ("UserService/login")
- filePath: Optional - restrict search to specific file
- includeBody: Set to true if user wants to see implementation

**Example conversations:**
User: "Find the UserService class"
→ Call: symbol_search(namePath="UserService")

User: "Show me the login method in UserService"
→ Call: symbol_search(namePath="UserService/login", includeBody=true)

User: "Where is fetchData defined?"
→ Call: symbol_search(namePath="fetchData")
```

---

## How I Create System Prompts (Step-by-Step Process)

### Step 1: Understand Tool's Core Purpose

**Ask yourself:**
- What problem does this tool solve?
- What user intent does it serve?
- How is it different from similar tools?

**Example for `get_type_information`:**
- **Problem**: User needs to know what type a variable/function has
- **Intent**: Understanding code without reading implementation
- **Different from**: `symbol_search` shows definition, this shows just the type

### Step 2: List All Use Cases

**Brainstorm scenarios:**

For `get_type_information`:
1. User asks: "What's the type of result?"
2. User asks: "What does fetchUser return?"
3. User asks: "Is this function async?"
4. User asks: "Is this parameter optional?"

### Step 3: Write Trigger Phrases

**Extract keywords from use cases:**

```
Trigger phrases:
- "what's the type"
- "what type is"
- "what does X return"
- "is this async"
- "is this optional"
- "show me the signature"
```

### Step 4: Write Parameter Guide

**For each parameter, explain:**
- What it is
- When to use it
- Examples of valid values

```
**Parameters:**
- filePath (required): Path to file containing the symbol
  Example: "src/services/UserService.ts"

- symbolName (required): Name of the symbol
  Example: "fetchUser" or "result" or "UserService"

- line (optional): Specific line number if symbol appears multiple times
  Example: 42
```

### Step 5: Add Concrete Examples

**Show complete conversation flows:**

```
**Examples:**

1. Simple type query:
   User: "What's the type of user variable in line 50?"
   AI → get_type_information(filePath="src/main.ts", symbolName="user", line=50)
   Result: { typeString: "User | null", isOptional: true }
   AI Response: "The `user` variable is of type `User | null`, and it's optional."

2. Return type query:
   User: "What does fetchData return?"
   AI → get_type_information(filePath="src/api.ts", symbolName="fetchData")
   Result: { typeString: "Promise<ApiResponse>", isAsync: true, signature: "(url: string) => Promise<ApiResponse>" }
   AI Response: "fetchData returns `Promise<ApiResponse>`. It's an async function with signature: `(url: string) => Promise<ApiResponse>`"
```

### Step 6: Add Tool Chaining Logic

**Show how tools combine:**

```
**Tool Chaining:**

Scenario: User wants comprehensive info about a function

1. First: symbol_search → Get basic info (name, location)
2. Then: get_type_information → Get type details
3. Then: find_references → See who calls it
4. Finally: smart_context_extractor → Get full context

Example flow:
User: "Tell me everything about fetchUser function"

AI thinks:
- Need location → symbol_search
- Need type → get_type_information
- Need callers → find_references
- Combine all → smart_context_extractor (does all at once!)

AI calls: smart_context_extractor(symbolName="fetchUser", includeTypes=true, includeCallers=true)
```

---

## System Prompt Template

Đây là template tôi dùng cho mọi tool:

```markdown
### [TOOL_NAME]

**Purpose:**
[One sentence summary of what this tool does]

**When to use:**
- [Trigger scenario 1]
- [Trigger scenario 2]
- [Trigger scenario 3]

**Do NOT use when:**
- [Anti-pattern 1] → use [alternative] instead
- [Anti-pattern 2] → use [alternative] instead

**Parameters:**
- param1 (required): [Description]
  Example: [concrete value]
- param2 (optional): [Description]
  Default: [default value]

**Examples:**

Example 1: [Simple case]
User: "[user question]"
AI → [tool call with args]
Result: [expected result]

Example 2: [Complex case]
User: "[user question]"
AI → [tool call with args]
Result: [expected result]

**Tool Chaining:**
- Use after: [tool A, tool B]
- Use before: [tool C, tool D]
- Combine with: [tool E for better results]
```

---

## Advanced Techniques

### 1. **Negative Examples** (Anti-patterns)

```markdown
**Common Mistakes:**

 WRONG: Using symbol_search for text search
User: "Find all TODO comments"
→ symbol_search(namePath="TODO") // Will fail!

✅ CORRECT: Use search_for_pattern
→ search_for_pattern(pattern="TODO:")
```

### 2. **Conditional Logic**

```markdown
**Decision Tree:**

If user wants to find:
- Class/Function/Method → symbol_search
- Text/String/Comment → search_for_pattern
- File by name → find_file
- Who uses a function → find_references
- Type information → get_type_information
```

### 3. **Performance Hints**

```markdown
**Performance Tips:**

- ⚡ Fast: find_file (uses filesystem)
- 🐢 Slow: find_references (analyzes entire codebase)

If performance matters:
1. Start with fast tools (find_file, search_for_pattern)
2. Use slow tools only when necessary
3. Use caching tools (smart_context_extractor) for repeated queries
```

---

## Real Example: `SmartContextExtractorTool` Prompt

```markdown
### smart_context_extractor

**Purpose:**
Intelligently extract ALL relevant context needed to understand a symbol (function, class, etc.). This is a high-level tool that combines multiple operations.

**When to use:**
- User wants to "understand" a function/class
- User asks "how does X work?"
- User asks "explain X to me"
- User asks "show me everything about X"
- You need comprehensive context before making changes

**When NOT to use:**
- User just wants definition → use symbol_search
- User just wants type → use get_type_information
- User just wants callers → use find_references

**What it includes automatically:**
✅ Symbol definition (code)
✅ Type information
✅ Who calls it (references)
✅ Related types
✅ Child methods (if class)

**Parameters:**
- symbolName (required): Name of symbol
- filePath (required): File containing symbol
- includeCallers (optional, default=true): Include functions that call this
- includeDependencies (optional, default=true): Include symbols this depends on
- includeTypes (optional, default=true): Include type definitions
- maxDepth (optional, default=2): How deep to traverse dependencies

**Examples:**

Example 1: Understand a function before modifying
User: "I need to modify fetchUser function. Show me everything about it."

AI thinks: "User needs comprehensive context → smart_context_extractor"

AI → smart_context_extractor(
  symbolName="fetchUser",
  filePath="src/api.ts",
  includeCallers=true,
  includeTypes=true
)

Result:
{
  definition: { code: "async function fetchUser..." },
  callers: [
    { symbol: "handleLogin", file: "auth.ts", line: 42 },
    { symbol: "loadProfile", file: "profile.ts", line: 15 }
  ],
  typeInfo: {
    type: "Promise<User>",
    isAsync: true,
    signature: "(id: string) => Promise<User>"
  }
}

AI Response: "Here's everything about `fetchUser`:
- It's an async function that returns `Promise<User>`
- Called by `handleLogin` (auth.ts:42) and `loadProfile` (profile.ts:15)
- [shows full code]
Now, what changes do you want to make?"
```

---

## Testing Your Prompts

### Checklist:

1. ✅ **Clarity Test**: Can AI understand when to use this tool?
2. ✅ **Trigger Test**: Does AI call tool for expected user questions?
3. ✅ **Parameter Test**: Does AI fill parameters correctly?
4. ✅ **Edge Case Test**: Does AI handle ambiguous cases?
5. ✅ **Alternative Test**: Does AI know when NOT to use this tool?

### Testing Process:

```
1. Write prompt
2. Test with real user questions
3. Check if AI calls correct tool
4. If wrong → refine trigger phrases
5. If right tool but wrong params → refine parameter guide
6. Repeat until 95%+ accuracy
```

---

## Summary

**Good system prompt = Clear triggers + Parameter guide + Concrete examples + Tool chaining**

**My process:**
1. Understand tool purpose
2. List all use cases
3. Extract trigger phrases
4. Write parameter guide
5. Add concrete examples
6. Add tool chaining logic
7. Test and refine

**Key insight**: AI learns by example! More concrete examples = better tool usage.
