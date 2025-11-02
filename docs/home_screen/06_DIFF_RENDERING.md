# 06. DIFF RENDERING SYSTEM

## 📋 Tổng quan

Tài liệu này mô tả **cơ chế hiển thị file changes** dạng unified diff trong Gemini CLI.

---

## 1. UNIFIED DIFF FORMAT

### 1.1. Standard Format

```diff
--- a/src/App.tsx
+++ b/src/App.tsx
@@ -10,5 +10,5 @@
 import React from 'react';
 import { Box } from 'ink';

-function App() {
+function App({ config }: AppProps) {
   return (
```

### 1.2. Format Components

**File header**:
```
--- a/path/to/file.ts    (old version)
+++ b/path/to/file.ts    (new version)
```

**Hunk header**:
```
@@ -oldStart,oldCount +newStart,newCount @@

Ví dụ: @@ -10,5 +12,6 @@
  oldStart=10, oldCount=5   (5 lines starting from line 10 in old file)
  newStart=12, newCount=6   (6 lines starting from line 12 in new file)
```

**Diff lines**:
```
 <space>  = Context line (unchanged)
-         = Removed line
+         = Added line
```

---

## 2. DIFF PARSING

### 2.1. Parsed Structure

```typescript
interface ParsedDiff {
  filename: string
  hunks: DiffHunk[]
}

interface DiffHunk {
  oldStart: number
  oldLines: number
  newStart: number
  newLines: number
  lines: DiffLine[]
}

interface DiffLine {
  type: 'context' | 'add' | 'remove'
  content: string
  oldLineNumber: number | null
  newLineNumber: number | null
}
```

### 2.2. Parsing Flow

```
Input: Diff text string
    ↓
Split by lines
    ↓
For each line:
  Starts with "---" → File header (old)
  Starts with "+++" → File header (new)
  Starts with "@@"  → Hunk header
  Starts with "-"   → Removed line
  Starts with "+"   → Added line
  Starts with " "   → Context line
    ↓
Output: ParsedDiff object
```

### 2.3. Line Number Tracking

**Logic**:
```
oldLineNumber = hunk.oldStart
newLineNumber = hunk.newStart

For each line:
  If type == 'remove':
    line.oldLineNumber = oldLineNumber++
    line.newLineNumber = null

  If type == 'add':
    line.oldLineNumber = null
    line.newLineNumber = newLineNumber++

  If type == 'context':
    line.oldLineNumber = oldLineNumber++
    line.newLineNumber = newLineNumber++
```

---

## 3. RENDERING

### 3.1. Visual Output

```
┌────────────────────────────────────────────┐
│ File: src/App.tsx                           │
└────────────────────────────────────────────┘

@@ -10,5 +10,5 @@

  10  import React from 'react';
  11  import { Box } from 'ink';
  12
  13- function App() {
  13+ function App({ config }: AppProps) {
  14    return (
```

### 3.2. Color Coding

| Element | Color | Background |
|---------|-------|------------|
| Line numbers | Gray, dimmed | - |
| Context lines | White | - |
| Removed lines | Red | Red (subtle) |
| Added lines | Green | Green (subtle) |
| File header | Cyan | - |
| Hunk header | Magenta, dimmed | - |

### 3.3. Component Hierarchy

```
DiffRenderer
  └─ FileChanges (for each file)
      ├─ File header box
      └─ HunkDisplay (for each hunk)
          ├─ Hunk header
          └─ DiffLineDisplay (for each line)
              ├─ Line number
              ├─ Prefix (+/-)
              └─ Content (with syntax highlighting)
```

---

## 4. SYNTAX HIGHLIGHTING

### 4.1. Purpose
Highlight code trong diff lines để dễ đọc

### 4.2. Approaches

**Option 1: AST-based** (Babel parser)
- Accuracy: 100%
- Speed: Slow (~5-10ms per line)
- Complexity: High

**Option 2: Regex-based** (Simple patterns)
- Accuracy: 80-90%
- Speed: Fast (~0.1ms per line)
- Complexity: Low

**Gemini CLI choice**: Depends on language complexity

### 4.3. Highlighted Elements

```typescript
Keywords: function, const, let, if, return → Magenta
Strings: 'text', "text", `text` → Green
Numbers: 123, 0.5 → Cyan
Identifiers: variableNames, functionNames → Blue
Comments: // comment, /* comment */ → Gray
```

---

## 5. CONTEXT LINES

### 5.1. Purpose
Show unchanged lines around changes for better understanding

### 5.2. Typical Setting
**3 context lines** before and after each change

**Example**:
```diff
  10  import React from 'react';     // context
  11  import { Box } from 'ink';      // context
  12                                  // context
- 13  function App() {                // change
+ 13  function App({ config }) {     // change
  14    return (                      // context
  15      <Box>                        // context
```

### 5.3. Gap Handling

**Problem**: Many unchanged lines between changes

**Solution**: Collapse large gaps

```diff
  10  import React from 'react';
  11  import { Box } from 'ink';
  12
- 13  function App() {
+ 13  function App({ config }) {
  14    return (

  ... (50 lines unchanged) ...

  65  export default App;
- 66  export { OtherComponent };
+ 66  export { OtherComponent, NewComponent };
```

**Gap threshold**: 5+ lines → show collapse indicator

---

## 6. DIFF STATISTICS

### 6.1. Summary Display

```
┌────────────────────────────────────────────┐
│ Changes Summary:                            │
│                                              │
│ +25 additions  -10 deletions  3 files      │
│                                              │
│ src/App.tsx | +12 -5                       │
│ src/Header.tsx | +8 -3                     │
│ src/utils.ts | +5 -2                       │
└────────────────────────────────────────────┘
```

### 6.2. Calculation

```
For each file:
  additions = count(lines where type == 'add')
  deletions = count(lines where type == 'remove')

Total:
  totalAdditions = sum(all additions)
  totalDeletions = sum(all deletions)
  filesChanged = count(files)
```

---

## 7. SIDE-BY-SIDE DIFF

### 7.1. Layout

**Unified** (default):
```
  10  import React from 'react';
- 13  function App() {
+ 13  function App({ config }) {
```

**Side-by-side**:
```
Old                          │ New
─────────────────────────────┼─────────────────────────────
 10  import React...         │  10  import React...
 13  function App() {        │  13  function App({ config }) {
```

### 7.2. Use Cases

**Unified**: Better for small terminal width
**Side-by-side**: Better for comparing large changes

**Gemini CLI default**: Unified (terminal width limited)

---

## 8. WORD-LEVEL DIFF

### 8.1. Purpose
Highlight exact changed words within a line

### 8.2. Example

**Line-level** (default):
```diff
- function App() {
+ function App({ config }: AppProps) {
```

**Word-level** (enhanced):
```diff
- function App() {
          ^^^^  (dimmed - removed part)

+ function App({ config }: AppProps) {
          ^^^^^^^^^^^^^^^^^^  (bright - added part)
```

### 8.3. Implementation

**Algorithm**:
```
1. Detect changed line pairs (remove + add adjacent)
2. Split into words
3. Diff words using LCS algorithm
4. Highlight different words
```

**Complexity**: O(n*m) where n,m = word counts

**Usage**: Optional enhancement, not default in Gemini CLI

---

## 9. PERFORMANCE CONSIDERATIONS

### 9.1. Parser Performance

**Input**: Diff text string
**Parsing**: O(n) where n = number of lines
**Typical**: ~1ms for 100-line diff

### 9.2. Rendering Performance

**Challenge**: Re-render on every line
**Solution**: React.memo for non-changing diff sections

### 9.3. Syntax Highlighting

**AST parsing**: Slow for long files
**Solution**: Only highlight visible lines (lazy highlighting)

---

## 10. KEY TECHNICAL INSIGHTS

### 1. Standard Format
Unified diff là industry standard, dùng bởi git, GitHub, etc.

### 2. Incremental Parsing
Parse line-by-line thay vì load toàn bộ vào memory

### 3. Color Coding
Consistent colors với git/GitHub conventions:
- Green = additions
- Red = deletions
- Gray = context

### 4. Line Numbers
Show both old and new line numbers for clarity

### 5. Context Lines
Essential for understanding changes in context

---

## 📚 REFERENCES

### Files quan trọng:
- `diffParser.ts:15-200` - Parsing logic
- `DiffRenderer.tsx:20-180` - Rendering component
- `DiffLineDisplay.tsx:10-100` - Single line component

### External Resources:
- **Unified diff format**: GNU diffutils manual
- **diff library**: jsdiff (Node.js)
- **Syntax highlighting**: Prism.js, highlight.js

### Related Docs:
- **05_UI_AND_STREAMING.md** - Component architecture
- **08_DATA_STRUCTURES.md** - Diff data types

---

**Cập nhật**: 2025-11-02
**Loại**: Mô tả kỹ thuật (technical description)
**Không bao gồm**: Parsing/rendering implementation code
