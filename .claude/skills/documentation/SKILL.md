---
name: documentation
description: Enforces documentation standards and structure for this project. Use when creating, updating, or organizing documentation to ensure compliance with project rules, prevent redundancy, and maintain screen-based organization. Activates when user asks to create/update docs or when documentation needs to be generated.
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash]
---

# Documentation Skill

Ensures all documentation follows project standards and prevents redundant files.

## Quick Start

Before creating ANY documentation:

1. **Check first**: Use scripts for efficient search
   ```bash
   ./scripts/doc-search.sh "topic-keyword"
   ./scripts/doc-metadata.sh docs/path/to/file.md
   ```

2. **Verify need**: Is this feature complete and ready to document?

3. **Choose location**: See `structure.md` for directory organization

4. **Select workflow**: See `workflows/README.md` for step-by-step process

5. **Use template**: See `templates/README.md` for document templates

6. **Validate**: Check against rules in `rules.md`

## Efficient Scripts (Section-Level Interaction)

**Instead of reading entire files**, use these scripts for section-level operations:

```bash
# Get metadata without reading content
./scripts/doc-metadata.sh docs/screens/home/README.md

# List sections to navigate structure
./scripts/doc-list-sections.sh docs/screens/home/README.md

# Get specific section only (not entire file)
./scripts/doc-get-section.sh docs/screens/home/README.md "Features"

# Search across docs
./scripts/doc-search.sh "slash command" docs/screens/home

# Update section without reading full file
./scripts/doc-update-section.sh docs/file.md "Section" new-content.md

# Delete section
./scripts/doc-delete-section.sh docs/file.md "Old Section"

# Find duplicates
./scripts/doc-find-duplicates.sh docs/
```

**See**: `scripts/README.md` for complete documentation

**Benefits**: 80-98% reduction in context usage vs reading full files

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
        ├── README.md      # Overview (required)
        ├── features.md    # Features (optional)
        ├── technical.md   # Technical (required)
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

## Progressive Disclosure

This skill uses **filesystem-based progressive disclosure** to minimize context usage:

### Core Files (Always Available)
- `SKILL.md` (this file) - Core instructions
- `rules.md` - Detailed rules
- `structure.md` - Directory structure

### On-Demand Resources

**Templates** (load when creating docs):
```
templates/
├── README.md            # Template index
├── screen-readme.md     # For docs/screens/{name}/README.md
├── screen-technical.md  # For docs/screens/{name}/technical.md
├── screen-features.md   # For docs/screens/{name}/features.md
├── screen-flows.md      # For docs/screens/{name}/flows.md
├── architecture.md      # For docs/architecture/*.md
└── guide.md             # For docs/guides/*.md
```

**Workflows** (load when performing task):
```
workflows/
├── README.md               # Workflow index + decision trees
├── create-screen.md        # Creating new screen docs
├── update-existing.md      # Updating existing docs
├── consolidate-duplicates.md  # Consolidating duplicates
├── split-large-file.md     # Splitting files >500 lines
├── add-examples.md         # Adding examples
└── review-quarterly.md     # Quarterly review
```

**Examples** (load when need reference):
```
examples.md              # Real examples from this project
```

## Usage Pattern

**When user asks to create screen documentation:**
1. Read `SKILL.md` (this file) → understand principles
2. Read `workflows/create-screen.md` → get step-by-step process
3. Read `templates/screen-readme.md` → get template
4. Read `templates/screen-technical.md` → get template
5. Create documentation

**Total context**: ~700 lines instead of 2,800 lines

## Enforcement

When generating documentation, Claude MUST:

1. ✅ Check existing docs first (Grep/Glob)
2. ✅ Ask user if unsure about duplication
3. ✅ Load appropriate workflow from `workflows/`
4. ✅ Load appropriate template from `templates/`
5. ✅ Follow rules from `rules.md`
6. ✅ Stay under 500 lines
7. ✅ Include code references (file:line)

## Questions to Ask User

Before creating documentation:

- "I found similar docs at {path}. Update instead?"
- "Is this feature complete?"
- "Should this go in screens/{screen}/ or guides/?"
- "File is 450+ lines. Should I split it?"

## Decision Trees

See `workflows/README.md` for:
- Should I create documentation?
- Where should documentation go?
- Should I split this file?

## Quick Commands

```bash
# Check for existing docs
grep -r "keyword" docs/ --include="*.md"

# Count lines
wc -l docs/path/to/file.md

# List screens
ls -la docs/screens/

# Test links
grep -o "\[.*\](.*)" docs/file.md
```

## Success Criteria

Good documentation is:
- ✅ Easy to find (follows structure)
- ✅ Easy to read (under 500 lines)
- ✅ No duplicates (DRY)
- ✅ Up to date (matches code)
- ✅ Actionable (includes examples)
- ✅ Traceable (code references)

## File Structure

```
.claude/skills/documentation/
├── SKILL.md              # This file (core instructions)
├── rules.md              # Detailed rules and standards
├── structure.md          # Directory structure details
├── examples.md           # Real examples from project
│
├── scripts/              # Efficient doc interaction scripts
│   ├── README.md         # Scripts documentation
│   ├── doc-search.sh     # Search without reading full files
│   ├── doc-list-sections.sh      # List sections (structure)
│   ├── doc-get-section.sh        # Get section only
│   ├── doc-update-section.sh     # Update section
│   ├── doc-delete-section.sh     # Delete section
│   ├── doc-insert-after.sh       # Insert content
│   ├── doc-metadata.sh           # Get file metadata
│   └── doc-find-duplicates.sh    # Find redundant content
│
├── templates/            # Document templates (on-demand)
│   ├── README.md
│   ├── screen-readme.md
│   ├── screen-technical.md
│   ├── screen-features.md
│   ├── screen-flows.md
│   ├── architecture.md
│   └── guide.md
│
└── workflows/            # Step-by-step workflows (on-demand)
    ├── README.md
    ├── create-screen.md
    ├── update-existing.md
    ├── consolidate-duplicates.md
    ├── split-large-file.md
    ├── add-examples.md
    └── review-quarterly.md
```

## Next Steps

Depending on the task:

- **Creating screen docs?** → Read `workflows/create-screen.md`
- **Updating docs?** → Read `workflows/update-existing.md`
- **File too large?** → Read `workflows/split-large-file.md`
- **Found duplicates?** → Read `workflows/consolidate-duplicates.md`
- **Need examples?** → Read `workflows/add-examples.md` or `examples.md`
- **Need template?** → Read `templates/README.md` then specific template
- **Quarterly review?** → Read `workflows/review-quarterly.md`
