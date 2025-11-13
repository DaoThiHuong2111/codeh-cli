# Documentation Consolidation Plan

## 📊 Current Status

**Total: 58 markdown files** scattered across the project

### Location Breakdown:
- **Root level**: 19 files (need consolidation)
- **docs/**: 12 files (organized)
- **.claude/**: 17 files (keep as-is, internal)
- **.serena/**: 4 files (keep as-is, memories)
- **mock-server/**: 2 files (keep as-is, subproject)
- **source/**: 1 file (needs moving)
- **test/**: 1 file (keep as-is)

---

## 🎯 Consolidation Strategy

### Phase 1: Keep at Root (Standard Files)
These files STAY at root level:
- ✅ `readme.md` - Main project README
- ✅ `CHANGELOG.md` - Version history
- ✅ `CONTRIBUTING.md` - Contribution guidelines
- ✅ `CLAUDE.md` - AI agent instructions

### Phase 2: Move to docs/development/
**Development and implementation docs:**
1. `IMPLEMENTATION_ROADMAP.md` → `docs/development/roadmap.md`
2. `IMPLEMENTATION_SUMMARY.md` → `docs/development/implementation-summary.md`
3. `PHASE2_PROGRESS_SUMMARY.md` → **DELETE** (outdated, Phase 2 complete)
4. `SERENA_INTEGRATION_PLAN.md` → `docs/development/serena-integration.md`
5. `TESTING_TOOL_EXECUTION.md` → `docs/development/testing-tools.md`
6. `TYPESCRIPT_TOOLS_IMPLEMENTATION.md` → `docs/development/typescript-tools.md`
7. `MANUAL_TEST_GUIDE.md` → `docs/development/manual-testing.md`
8. `TOOLS_COMPARISON_ANALYSIS.md` → `docs/architecture/tools-comparison.md`

### Phase 3: Move to docs/guides/
**User-facing guides:**
1. `KEYBOARD_SHORTCUTS.md` → `docs/guides/keyboard-shortcuts.md`
2. `MODE_SWITCHING_GUIDE.md` → `docs/guides/mode-switching.md`
3. `UI_COMPONENTS_GUIDE.md` → `docs/guides/ui-components.md`

### Phase 4: Consolidate Shortcut Docs
**Merge 4 shortcut files into ONE:**
- `SHORTCUT_ARCHITECTURE_VISUAL.md` (571 lines)
- `SHORTCUT_MANAGEMENT_ANALYSIS.md` (667 lines)
- `SHORTCUT_MANAGER_GUIDE.md` (656 lines)
- `SHORTCUT_MANAGER_IMPLEMENTATION.md` (350 lines)

**→ Consolidate into:** `docs/architecture/shortcut-system.md`

**Rationale:** These docs have overlapping content and should be one comprehensive guide.

### Phase 5: Move Screen Documentation
**Screen doc in wrong location:**
- `source/presentation/screens/HomeScreen/README.md` → Already exists at `docs/screens/home/README.md`
- **Action:** Merge content and delete source copy

### Phase 6: Clean Up Outdated Docs
**Files to DELETE (outdated or redundant):**
1. `PHASE2_PROGRESS_SUMMARY.md` - Phase 2 is complete, info in CHANGELOG
2. Duplicate shortcut docs after consolidation

---

## 📂 Final Structure

```
codeh-cli/
├── readme.md                    # Main README
├── CHANGELOG.md                 # Version history
├── CONTRIBUTING.md              # How to contribute
├── CLAUDE.md                    # AI instructions
│
├── docs/
│   ├── README.md                # Documentation hub
│   │
│   ├── architecture/            # System architecture
│   │   ├── overview.md
│   │   ├── shortcut-system.md  # ✨ Consolidated from 4 files
│   │   ├── tools-comparison.md # Moved from root
│   │   └── llm-api-integration.md
│   │
│   ├── development/             # Development docs
│   │   ├── roadmap.md          # Moved from root
│   │   ├── implementation-summary.md
│   │   ├── serena-integration.md
│   │   ├── testing-tools.md
│   │   ├── typescript-tools.md
│   │   └── manual-testing.md
│   │
│   ├── guides/                  # User guides
│   │   ├── configuration.md
│   │   ├── development.md
│   │   ├── user-guide.md
│   │   ├── keyboard-shortcuts.md  # Moved from root
│   │   ├── mode-switching.md      # Moved from root
│   │   └── ui-components.md       # Moved from root
│   │
│   ├── api/                     # API documentation
│   │   ├── README.md
│   │   ├── tools/
│   │   ├── core/
│   │   └── infrastructure/
│   │
│   └── screens/                 # Screen documentation
│       ├── home/
│       ├── config/
│       └── welcome/
│
├── .claude/                     # Keep as-is
├── .serena/                     # Keep as-is
├── mock-server/                 # Keep as-is
└── test/                        # Keep as-is
```

---

## ✅ Action Items

### Immediate Actions:
1. ✅ Create `docs/development/` directory
2. ✅ Move development docs from root to `docs/development/`
3. ✅ Move user guides from root to `docs/guides/`
4. ✅ Consolidate 4 shortcut docs into one
5. ✅ Delete outdated docs (PHASE2_PROGRESS_SUMMARY.md)
6. ✅ Update all internal links
7. ✅ Update root README to reference new locations
8. ✅ Verify all docs are accessible

### Post-Consolidation:
- Review each moved doc for outdated info
- Update cross-references between docs
- Add missing documentation
- Create docs index in main README

---

## 📋 Benefits

### Before:
- 19 files at root level
- Confusing organization
- Duplicate information
- Hard to find docs

### After:
- 4 files at root (standard)
- Clear hierarchy
- No duplication
- Easy navigation
- Professional structure

---

## 🚀 Implementation Order

1. **Create directories** (1 min)
2. **Move guides** (5 min)
3. **Move development docs** (5 min)
4. **Consolidate shortcuts** (15 min) - Most complex
5. **Clean up** (5 min)
6. **Update links** (10 min)
7. **Verify** (5 min)

**Total estimated time:** ~45 minutes

---

## 📝 Notes

- Keep .claude/ and .serena/ untouched (internal systems)
- Mock server docs stay separate (subproject)
- Test docs stay in test/ directory
- All moved docs should have redirects in comments
- Update CONTRIBUTING.md references
