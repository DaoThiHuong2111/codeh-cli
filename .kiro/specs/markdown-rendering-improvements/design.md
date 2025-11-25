# Design Document

## Overview

This design improves the markdown rendering system to handle complex markdown content, HTML tags, tables, special characters, and edge cases. The solution enhances the existing MarkdownService to properly parse and sanitize markdown, and updates the MarkdownText component to render new block types like tables and horizontal rules.

## Architecture

The markdown rendering system follows a two-stage pipeline:

1. **Parsing Stage**: MarkdownService parses raw markdown text into structured blocks
2. **Rendering Stage**: MarkdownText component renders blocks into terminal-friendly React components

```
Raw Markdown Text
      ↓
MarkdownService.parse()
      ↓
Structured Blocks (Array<MarkdownBlock>)
      ↓
MarkdownText Component
      ↓
Terminal Display
```

## Components and Interfaces

### Enhanced MarkdownService

The MarkdownService will be extended with:

```typescript
class MarkdownService {
  // Existing methods
  parse(text: string): MarkdownBlock[]
  parseInline(text: string): InlineToken[]
  
  // New methods
  private sanitizeHtml(text: string): string
  private decodeHtmlEntities(text: string): string
  private parseTable(lines: string[], startIndex: number): {block: MarkdownBlock; nextIndex: number}
  private parseHorizontalRule(line: string): MarkdownBlock | null
  private handleEscapedCharacters(text: string): string
  private parseLinks(text: string): InlineToken[]
}
```

### New Block Types

```typescript
export enum BlockType {
  HEADING = 'heading',
  PARAGRAPH = 'paragraph',
  CODE_BLOCK = 'code_block',
  LIST = 'list',
  BLOCKQUOTE = 'blockquote',
  TABLE = 'table',           // NEW
  HORIZONTAL_RULE = 'hr',    // NEW
}

export interface MarkdownBlock {
  type: BlockType;
  content: string;
  level?: number;
  language?: string;
  items?: string[];
  // New fields for tables
  headers?: string[];
  rows?: string[][];
  alignments?: ('left' | 'center' | 'right')[];
}
```

### Enhanced MarkdownText Component

New sub-components will be added:

```typescript
const TableBlock: React.FC<{headers: string[]; rows: string[][]; alignments?: string[]}> 
const HorizontalRule: React.FC<{}>
const Link: React.FC<{text: string; url: string}>
```

## Data Models

### InlineToken

Enhanced to support links:

```typescript
interface InlineToken {
  type: 'text' | 'bold' | 'italic' | 'code' | 'link';
  content: string;
  url?: string;  // For links
}
```

### Table Structure

```typescript
interface TableData {
  headers: string[];
  rows: string[][];
  alignments: ('left' | 'center' | 'right')[];
}
```

## C
orrectness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Property 1: HTML tag removal
*For any* text containing HTML tags, after parsing and sanitizing, the output should contain no HTML tag patterns (text matching `<[^>]+>`)
**Validates: Requirements 1.1, 1.2**

Property 2: HTML entity decoding
*For any* text containing HTML entities from a known set (like `&nbsp;`, `&lt;`, `&gt;`, `&amp;`, `&quot;`), after parsing, those entities should be replaced with their corresponding characters
**Validates: Requirements 1.3**

Property 3: Table parsing structure
*For any* valid markdown table, after parsing, the resulting block should have the correct number of headers matching the header row and the correct number of data rows matching the table body
**Validates: Requirements 2.1**

Property 4: Table cell inline markdown
*For any* markdown table where cells contain inline markdown (bold, italic, code), after parsing, those inline elements should be correctly identified within the cell content
**Validates: Requirements 2.4**

Property 5: Malformed table fallback
*For any* malformed or incomplete table structure, the parser should not throw errors and should fall back to treating it as plain text or paragraph blocks
**Validates: Requirements 2.5**

Property 6: Escaped character handling
*For any* text containing escaped markdown characters (like `\*`, `\#`, `\_`, `\[`, `\]`), after parsing, the backslash should be removed and the character should appear as a literal
**Validates: Requirements 3.1**

Property 7: Unicode preservation
*For any* text containing Unicode characters (emoji, accented characters, CJK characters), after parsing, those characters should be preserved exactly
**Validates: Requirements 3.2**

Property 8: Code block content preservation
*For any* code block containing special characters, after parsing, the content should be identical to the original (no escaping or modification)
**Validates: Requirements 3.3**

Property 9: URL decoding
*For any* text containing URL-encoded characters (like `%20`, `%2F`, `%3A`), after parsing, those should be decoded to their character equivalents
**Validates: Requirements 3.5**

Property 10: Link parsing
*For any* markdown link in the format `[text](url)`, after parsing inline elements, there should be a link token with both the text and URL extracted correctly
**Validates: Requirements 5.1**

Property 11: Bare URL recognition
*For any* text containing bare URLs (starting with `http://` or `https://`), after parsing, those URLs should be recognized and marked as link tokens
**Validates: Requirements 5.4**

Property 12: Nested inline formatting
*For any* text with nested inline formatting (bold containing italic, or vice versa), after parsing, both formatting types should be preserved in the token structure
**Validates: Requirements 6.1, 6.5**

Property 13: Blockquote nested elements
*For any* blockquote containing other markdown elements (lists, code, bold text), after parsing, those nested elements should be correctly identified within the blockquote content
**Validates: Requirements 6.3**

Property 14: Unclosed marker handling
*For any* text with unclosed formatting markers (single `*`, `**`, `` ` ``, `[`), after parsing, those markers should appear as literal characters in the output
**Validates: Requirements 7.1**

Property 15: Empty block handling
*For any* markdown containing empty code blocks (` ``` ``` `) or empty lists, the parser should not throw errors and should skip or handle them gracefully
**Validates: Requirements 7.4**

Property 16: Parse error fallback
*For any* input text, if parsing encounters an unexpected error, the system should catch it and fall back to displaying the raw text without crashing
**Validates: Requirements 7.5**

## Error Handling

The markdown parser will implement defensive programming practices:

1. **Try-Catch Blocks**: Wrap parsing logic in try-catch to prevent crashes
2. **Fallback Rendering**: If parsing fails, display raw text
3. **Validation**: Check for null/undefined before accessing properties
4. **Graceful Degradation**: Malformed markdown renders as plain text rather than breaking

Error handling strategy:
```typescript
try {
  const blocks = markdownService.parse(content);
  return <MarkdownText blocks={blocks} />;
} catch (error) {
  logger.error('Markdown parsing failed', error);
  return <Text>{content}</Text>; // Fallback to raw text
}
```

## Testing Strategy

### Unit Testing

Unit tests will cover:
- HTML sanitization with specific examples (common tags, attributes, entities)
- Table parsing with well-formed and malformed examples
- Escape sequence handling with specific characters
- Link parsing with various formats
- Edge cases like empty blocks, unclosed markers

### Property-Based Testing

We will use **fast-check** (JavaScript/TypeScript property-based testing library) to verify correctness properties.

Each property-based test will:
- Run a minimum of 100 iterations
- Generate random inputs appropriate to the property
- Verify the property holds for all generated inputs
- Be tagged with a comment referencing the design document property

Example property test structure:
```typescript
// Feature: markdown-rendering-improvements, Property 1: HTML tag removal
test('HTML tags are removed from parsed content', () => {
  fc.assert(
    fc.property(
      fc.string(), // base text
      fc.array(fc.htmlTag()), // random HTML tags
      (text, tags) => {
        const input = insertRandomTags(text, tags);
        const parsed = markdownService.parse(input);
        const output = blocksToString(parsed);
        return !/<[^>]+>/.test(output); // No HTML tags in output
      }
    ),
    { numRuns: 100 }
  );
});
```

Property tests will be written for:
- HTML tag removal (Property 1)
- HTML entity decoding (Property 2)
- Table structure parsing (Property 3)
- Escaped character handling (Property 6)
- Unicode preservation (Property 7)
- Code block preservation (Property 8)
- Link parsing (Property 10)
- Nested formatting (Property 12)
- Error handling (Properties 14, 15, 16)

### Integration Testing

Integration tests will verify:
- End-to-end flow from raw markdown to rendered components
- Interaction between MarkdownService and MarkdownText component
- Proper rendering in the MessageBubble component
- Performance with large markdown documents

## Implementation Notes

### HTML Sanitization

Use a whitelist approach - remove all HTML tags rather than trying to sanitize them. This is safer for terminal display.

```typescript
private sanitizeHtml(text: string): string {
  // Remove HTML tags
  let sanitized = text.replace(/<[^>]*>/g, '');
  // Decode HTML entities
  sanitized = this.decodeHtmlEntities(sanitized);
  return sanitized;
}
```

### Table Parsing

Markdown tables follow this format:
```
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
```

The parser will:
1. Detect table start (line with `|` separators)
2. Parse header row
3. Parse alignment row (optional)
4. Parse data rows
5. Handle inline markdown in cells

### Performance Considerations

- Cache parsed results for repeated content
- Use efficient regex patterns
- Avoid excessive string concatenation
- Limit recursion depth for nested elements

### Terminal Compatibility

- Use box-drawing characters for tables (─, │, ┌, ┐, └, ┘)
- Respect terminal width for wrapping
- Use ANSI color codes supported by most terminals
- Test on different terminal emulators (iTerm, Terminal.app, Windows Terminal)
