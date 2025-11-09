---
name: documentation
description: Enforces documentation standards and structure for this project. Use when creating, updating, or organizing documentation to ensure compliance with project rules, prevent redundancy, and maintain screen-based organization. Activates when user asks to create/update docs or when documentation needs to be generated.
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash]
---

# Documentation Skill

Ensures all documentation follows project standards and prevents redundant files.

## Quick Start

Before creating ANY documentation:

1. **Check first**: Does similar documentation already exist?
   ```bash
   find docs -type f -name "*.md" -exec grep -l "topic-keyword" {} \;
   ```

2. **Verify need**: Is this feature complete and ready to document?

3. **Choose location**: Follow the structure in `structure.md`

4. **Use template**: Select from `templates.md`

5. **Validate**: Check against rules in `rules.md`

## Core Principles

### 1. DRY (Don't Repeat Yourself)
- Check existing docs FIRST
- Update instead of create
- Consolidate related info

### 2. Screen-Based Organization
```
docs/
├── README.md              # Master index (DO NOT MODIFY)
├── guides/                # User and developer guides
├── architecture/          # Architecture docs
└── screens/               # Screen-specific docs
    └── {screen-name}/
        ├── README.md      # Overview
        ├── features.md    # Features (optional)
        ├── technical.md   # Technical details
        └── flows.md       # Flows (optional)
```

### 3. Size Limits
- **Max 500 lines per file**
- Split if approaching limit
- Keep focused and scannable

## When to Create Documentation

### ✅ CREATE for:
- Complete implemented features
- Breaking changes in APIs
- New screens or major UI components
- Integration guides
- Architecture decisions

### ❌ DO NOT create for:
- Work in progress (WIP)
- Temporary implementation details
- Duplicate information
- Planning docs (use GitHub Issues)
- Personal notes

## Decision Flow

```
Need documentation?
  ↓
Check if similar exists → Yes → UPDATE existing
  ↓ No
Feature complete? → No → STOP (don't create)
  ↓ Yes
Choose location:
  ├─ Screen feature? → docs/screens/{screen}/
  ├─ Architecture? → docs/architecture/
  └─ Guide? → docs/guides/
  ↓
Select template from templates.md
  ↓
Create & validate (max 500 lines)
```

## Files in This Skill

- **SKILL.md** (this file): Core instructions
- **rules.md**: Detailed rules and standards
- **structure.md**: Directory structure details
- **workflow.md**: Complete workflows and checklists
- **templates.md**: Document templates
- **examples.md**: Real examples from project

## Quick Commands

**Check for existing docs:**
```bash
grep -r "keyword" docs/ --include="*.md"
```

**Count lines in file:**
```bash
wc -l docs/path/to/file.md
```

**List screen docs:**
```bash
ls -la docs/screens/*/
```

## Enforcement

When generating documentation, Claude MUST:

1. ✅ Check existing docs first
2. ✅ Ask user if unsure about duplication
3. ✅ Follow templates
4. ✅ Stay under 500 lines
5. ✅ Include code references (file:line)

## Questions to Ask User

Before creating documentation:

- "I found similar docs at {path}. Update instead?"
- "Is this feature complete?"
- "Should this go in screens/{screen}/ or guides/?"
- "File is 450+ lines. Should I split it?"

## Success Criteria

Good documentation is:
- ✅ Easy to find (follows structure)
- ✅ Easy to read (under 500 lines)
- ✅ No duplicates (DRY)
- ✅ Up to date (matches code)
- ✅ Actionable (includes examples)
- ✅ Traceable (code references)

## See Supporting Files

For detailed information:
- `rules.md` - Complete rules and anti-patterns
- `structure.md` - Directory structure details
- `workflow.md` - Step-by-step workflows
- `templates.md` - All document templates
- `examples.md` - Real project examples
