# Workflow Guidelines

## Testing Before Completion
**CRITICAL RULE**: ALWAYS test the application before marking any task as complete or delivering updates to the user.

### Testing Process:
1. Build the project: `npm run build`
2. Run the application: `node dist/cli.js`
3. Verify the feature works as expected
4. Test edge cases and error scenarios
5. Only after successful testing, report completion to user

### Why This Matters:
- Prevents delivering broken or untested code
- Catches issues early before user discovers them
- Maintains code quality and user trust
- Avoids wasting time with multiple broken iterations

### Example:
```bash
npm run build
node dist/cli.js
# Test the feature manually
# Verify it works correctly
# Then report to user
```

**Never skip testing even if the code "looks correct" or builds successfully.**
