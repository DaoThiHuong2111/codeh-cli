# 🚨 Error Handling

> **Phần 8/9** - Technical Documentation | [← Prev: Keyboard](./07-keyboard.md) | [Next: Best Practices →](./09-best-practices.md) | [Up: Index ↑](../README.md)

---

## Error Categories

### 1. Validation Errors

```javascript
// Empty input
if (!userInput.trim()) {
	this.inputError = 'Please enter a message';
	return;
}

// Too long
if (userInput.length > 10000) {
	this.inputError = 'Message too long (max 10,000 characters)';
	return;
}
```

### 2. API Errors

```javascript
try {
	await this.conversationService.sendMessage(userInput);
} catch (error) {
	this.inputError = error.message || 'An error occurred';
	this.isLoading = false;
}
```

### 3. Configuration Errors

```javascript
if (!this.apiClient) {
	throw new Error(
		'API not configured. Please configure your API key and provider.',
	);
}
```

### 4. Network Errors

```javascript
// Handled by API client
// Anthropic API error: 401 - Invalid API key
// Anthropic API error: 500 - Server error
// Anthropic API error: 429 - Rate limit exceeded
```

---

## Error Display Strategy

```
┌─────────────────────────────────────────────┐
│ ConversationArea                            │
│                                             │
│ > You: Hello                                │
│ ✗ Error: API not configured. Please        │
│          configure your API key...          │
│                                             │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│ ⚠ Message too long (max 10,000 characters) │ ← Input Error
├─────────────────────────────────────────────┤
│ > Your message here_                        │
└─────────────────────────────────────────────┘
```

---

## 🔗 Navigation

[← Prev: Keyboard](./07-keyboard.md) | [Next: Best Practices →](./09-best-practices.md) | [Up: Index ↑](../README.md)

---

**Last Updated**: 2025-01-08 | **Part**: 8/9
