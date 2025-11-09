/**
 * Mock response data for different scenarios
 */

export const MOCK_RESPONSES = {
	// Simple greeting
	greeting: `Hello! I'm a mock AI assistant. I can help you test the LLM integration with streaming responses.`,

	// Code example response
	codeExample: `Here's a simple example in TypeScript:

\`\`\`typescript
function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10)); // 55
\`\`\`

This recursive implementation calculates the nth Fibonacci number.`,

	// Markdown features showcase
	markdownShowcase: `# Markdown Features Demo

## Text Formatting

This response demonstrates **bold text**, *italic text*, and \`inline code\`.

## Lists

**Ordered List:**
1. First item
2. Second item
3. Third item

**Unordered List:**
- Bullet point one
- Bullet point two
- Bullet point three

## Code Block

\`\`\`python
def greet(name):
    return f"Hello, {name}!"

print(greet("World"))
\`\`\`

## Table

| Feature | Status | Notes |
|---------|--------|-------|
| Streaming | ✓ | Real-time |
| Markdown | ✓ | Full support |
| Syntax | ✓ | 15+ languages |

## Blockquote

> "The best way to predict the future is to invent it."
> - Alan Kay

---

That's the markdown showcase!`,

	// Long response for testing scrolling
	longResponse: `This is a longer response to test scrolling and performance.

## Introduction

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

## Section 1: Background

Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

\`\`\`javascript
// Example code
const data = {
  name: "Test",
  value: 42,
  active: true
};
\`\`\`

## Section 2: Details

Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.

### Subsection 2.1

More details here with **bold** and *italic* text.

### Subsection 2.2

- Point A
- Point B
- Point C

## Conclusion

Totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.`,

	// Error simulation response
	errorSimulation: `I apologize, but I encountered an issue. This is a simulated error response for testing error handling.`,

	// Default fallback
	default: `I received your message! This is a mock response from the test server. The streaming is working correctly.`,
};

/**
 * Get mock response based on user message content
 */
export function getMockResponse(userMessage: string): string {
	const msg = userMessage.toLowerCase();

	if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
		return MOCK_RESPONSES.greeting;
	}

	if (msg.includes('code') || msg.includes('example') || msg.includes('function')) {
		return MOCK_RESPONSES.codeExample;
	}

	if (msg.includes('markdown') || msg.includes('demo') || msg.includes('showcase')) {
		return MOCK_RESPONSES.markdownShowcase;
	}

	if (msg.includes('long') || msg.includes('scroll') || msg.includes('test')) {
		return MOCK_RESPONSES.longResponse;
	}

	if (msg.includes('error') || msg.includes('fail')) {
		return MOCK_RESPONSES.errorSimulation;
	}

	return MOCK_RESPONSES.default;
}
