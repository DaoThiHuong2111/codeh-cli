# Implementation Plan

- [x] 1. Enhance MarkdownService with HTML sanitization
  - Add `sanitizeHtml()` method to remove HTML tags from text
  - Add `decodeHtmlEntities()` method to convert HTML entities to characters
  - Integrate sanitization into the main `parse()` method
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 1.1 Write property test for HTML tag removal
  - **Property 1: HTML tag removal**
  - **Validates: Requirements 1.1, 1.2**

- [x] 1.2 Write property test for HTML entity decoding
  - **Property 2: HTML entity decoding**
  - **Validates: Requirements 1.3**

- [x] 2. Add escape character handling
  - Implement `handleEscapedCharacters()` method to process backslash escapes
  - Update `parseInline()` to handle escaped markdown characters
  - Ensure escaped characters appear as literals in output
  - _Requirements: 3.1_

- [x] 2.1 Write property test for escaped character handling
  - **Property 6: Escaped character handling**
  - **Validates: Requirements 3.1**

- [x] 3. Add Unicode and special character support
  - Ensure parser preserves Unicode characters throughout processing
  - Add URL decoding for percent-encoded characters
  - Test with emoji, accented characters, and CJK text
  - _Requirements: 3.2, 3.5_

- [x] 3.1 Write property test for Unicode preservation
  - **Property 7: Unicode preservation**
  - **Validates: Requirements 3.2**

- [x] 3.2 Write property test for URL decoding
  - **Property 9: URL decoding**
  - **Validates: Requirements 3.5**

- [x] 4. Implement table parsing
  - Add `parseTable()` method to detect and parse markdown tables
  - Extract headers, alignment, and data rows
  - Add TABLE block type to BlockType enum
  - Update MarkdownBlock interface with table fields (headers, rows, alignments)
  - _Requirements: 2.1_

- [x] 4.1 Write property test for table structure parsing
  - **Property 3: Table parsing structure**
  - **Validates: Requirements 2.1**

- [x] 4.2 Write property test for table cell inline markdown
  - **Property 4: Table cell inline markdown**
  - **Validates: Requirements 2.4**

- [x] 4.3 Write property test for malformed table fallback
  - **Property 5: Malformed table fallback**
  - **Validates: Requirements 2.5**

- [x] 5. Implement horizontal rule parsing
  - Add `parseHorizontalRule()` method to detect `---`, `***`, `___` patterns
  - Add HORIZONTAL_RULE block type
  - Distinguish horizontal rules from list items
  - _Requirements: 4.1, 4.4_

- [x] 6. Enhance link parsing
  - Update `parseInline()` to extract links in `[text](url)` format
  - Add link token type to InlineToken
  - Implement bare URL recognition (http://, https://)
  - Handle edge cases like empty link text and special characters in URLs
  - _Requirements: 5.1, 5.4_

- [x] 6.1 Write property test for link parsing
  - **Property 10: Link parsing**
  - **Validates: Requirements 5.1**

- [x] 6.2 Write property test for bare URL recognition
  - **Property 11: Bare URL recognition**
  - **Validates: Requirements 5.4**

- [x] 7. Improve nested markdown handling
  - Enhance `parseInline()` to handle nested bold/italic combinations
  - Update blockquote parsing to recursively parse nested elements
  - Ensure inline code within formatted text works correctly
  - _Requirements: 6.1, 6.3, 6.5_

- [x] 7.1 Write property test for nested inline formatting
  - **Property 12: Nested inline formatting**
  - **Validates: Requirements 6.1, 6.5**

- [x] 7.2 Write property test for blockquote nested elements
  - **Property 13: Blockquote nested elements**
  - **Validates: Requirements 6.3**

- [x] 8. Add robust error handling
  - Wrap parsing logic in try-catch blocks
  - Handle unclosed formatting markers gracefully
  - Skip empty blocks without errors
  - Implement fallback to raw text on parse failures
  - _Requirements: 7.1, 7.4, 7.5_

- [x] 8.1 Write property test for unclosed marker handling
  - **Property 14: Unclosed marker handling**
  - **Validates: Requirements 7.1**

- [x] 8.2 Write property test for empty block handling
  - **Property 15: Empty block handling**
  - **Validates: Requirements 7.4**

- [x] 8.3 Write property test for parse error fallback
  - **Property 16: Parse error fallback**
  - **Validates: Requirements 7.5**

- [x] 9. Update MarkdownText component with new renderers
  - Create `TableBlock` component to render tables with borders and alignment
  - Create `HorizontalRule` component to render separator lines
  - Create `Link` component to display links with text and URL
  - Update main render switch to handle new block types
  - _Requirements: 2.2, 4.2, 5.2_

- [x] 9.1 Write unit tests for new rendering components
  - Test TableBlock renders correct structure
  - Test HorizontalRule displays properly
  - Test Link component formats links correctly
  - _Requirements: 2.2, 4.2, 5.2_

- [x] 10. Update MessageBubble integration
  - Ensure sanitized markdown flows through MessageBubble correctly
  - Add error boundary for markdown rendering failures
  - Test with real AI response examples
  - _Requirements: All_

- [x] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
