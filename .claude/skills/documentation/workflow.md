# Documentation Workflows

Step-by-step workflows for common documentation tasks.

## Workflow 1: Creating New Screen Documentation

### Prerequisites
- Screen is fully implemented
- Screen is tested
- Screen is merged to main branch

### Steps

**1. Check for Existing Documentation**
```bash
# Search for screen name
grep -r "ScreenName" docs/ --include="*.md"

# List all screen docs
ls -la docs/screens/
```

**2. Create Directory**
```bash
mkdir -p docs/screens/{screen-name}
```

**3. Create Required Files**

**Create README.md:**
```bash
# Use template from templates.md → Screen README
# Include:
# - Overview
# - Features (bullet points)
# - Basic usage
# - Component hierarchy
# - Keyboard shortcuts
```

**Create technical.md:**
```bash
# Use template from templates.md → Screen Technical
# Include:
# - Architecture diagram
# - State management
# - Code examples
# - Testing approach
```

**4. Optional: Create features.md**
Only if screen has 5+ complex features:
```bash
# Use template from templates.md → Screen Features
# Document each feature in detail
```

**5. Optional: Create flows.md**
Only if screen has complex workflows:
```bash
# Use template from templates.md → Screen Flows
# Include diagrams and step-by-step flows
```

**6. Validate**
```bash
# Check line counts
wc -l docs/screens/{screen-name}/*.md

# Check for duplicates
grep -r "duplicate content" docs/ --include="*.md"
```

**7. Update Main Index**
Edit `docs/README.md` to add links to new screen.

**8. Test Links**
Verify all cross-references work.

**9. Commit**
```bash
git add docs/screens/{screen-name}/
git commit -m "docs(screen-name): add screen documentation

- Add overview and features
- Document technical implementation
- Include usage examples
"
```

### Checklist
- [ ] Searched for existing docs
- [ ] Screen is complete and tested
- [ ] Created README.md
- [ ] Created technical.md
- [ ] Created optional files (if needed)
- [ ] All files under 500 lines
- [ ] Code references include file:line
- [ ] All examples tested
- [ ] Updated docs/README.md
- [ ] Tested all links
- [ ] Committed with descriptive message

---

## Workflow 2: Updating Existing Documentation

### Prerequisites
- Code has changed
- Documentation is now outdated

### Steps

**1. Identify Outdated Docs**
```bash
# Find docs mentioning changed code
grep -r "OldFunctionName" docs/ --include="*.md"
```

**2. Check Current Implementation**
```bash
# Read current code
cat source/path/to/file.ts
```

**3. Update Documentation**
- Update code references (file:line)
- Update examples
- Update diagrams if needed
- Update feature descriptions

**4. Test Examples**
Manually test or run all code examples.

**5. Validate Changes**
```bash
# Check line count
wc -l docs/path/to/updated-file.md

# If >500 lines, split file
```

**6. Commit**
```bash
git add docs/path/to/updated-file.md
git commit -m "docs(topic): update for latest changes

- Update code references to match new structure
- Fix outdated examples
- Update diagrams
"
```

### Checklist
- [ ] All code references updated
- [ ] All examples tested
- [ ] Diagrams updated if needed
- [ ] File still under 500 lines
- [ ] Links still work
- [ ] Committed with explanation

---

## Workflow 3: Consolidating Duplicate Documentation

### Prerequisites
- Found duplicate or redundant documentation

### Steps

**1. Identify Duplicates**
```bash
# Search for similar content
grep -r "topic keyword" docs/ --include="*.md"
```

**2. List Duplicate Files**
```
docs/old-guide.md
docs/another-guide.md
docs/screens/home/duplicate.md
```

**3. Analyze Content**
- Identify unique content in each file
- Identify redundant content
- Decide which file to keep

**4. Create Consolidation Plan**
```
Keep: docs/screens/home/README.md
Merge from: docs/old-guide.md (sections 1-3)
Merge from: docs/another-guide.md (section 5)
Delete: docs/old-guide.md, docs/another-guide.md
```

**5. Merge Content**
- Copy unique content to primary file
- Remove duplicates
- Reorganize for clarity
- Update cross-references

**6. Delete Redundant Files**
```bash
git rm docs/old-guide.md
git rm docs/another-guide.md
```

**7. Update Links**
Search and replace links to deleted files:
```bash
grep -r "old-guide.md" docs/ --include="*.md"
# Update each reference
```

**8. Validate**
```bash
# Check consolidated file size
wc -l docs/screens/home/README.md

# Check for broken links
grep -r "\[.*\](.*)" docs/ --include="*.md"
```

**9. Commit**
```bash
git add -A docs/
git commit -m "docs: consolidate duplicate documentation

- Merged 3 duplicate files into screens/home/README.md
- Removed 15 redundant lines
- Updated all cross-references
- Deleted old-guide.md and another-guide.md
"
```

### Checklist
- [ ] Identified all duplicates
- [ ] Merged unique content
- [ ] Deleted redundant files
- [ ] Updated all links
- [ ] Consolidated file under 500 lines
- [ ] No broken links
- [ ] Committed with detailed message

---

## Workflow 4: Splitting Large Documentation

### Prerequisites
- Documentation file exceeds 500 lines
- Or approaching 500 lines (450+)

### Steps

**1. Count Lines**
```bash
wc -l docs/path/to/large-file.md
# Output: 650 large-file.md
```

**2. Analyze Content**
Identify logical sections:
```
Section 1: Overview (100 lines)
Section 2: Features (300 lines)  ← Split this
Section 3: Technical (250 lines) ← Split this
```

**3. Plan Split**
```
Keep in README.md:
- Overview
- Basic features (top 5)
- Quick start

Move to features.md:
- Detailed features (all)
- Advanced usage

Move to technical.md:
- Implementation details
- Code examples
```

**4. Create New Files**
```bash
# Create features.md
touch docs/screens/home/features.md

# Create technical.md
touch docs/screens/home/technical.md
```

**5. Move Content**
- Cut sections from large file
- Paste into new files
- Use templates from templates.md

**6. Add Cross-References**

In README.md:
```markdown
For detailed features, see [features.md](./features.md).
For technical details, see [technical.md](./technical.md).
```

In features.md:
```markdown
See [README.md](./README.md) for overview.
```

**7. Validate**
```bash
# Check all file sizes
wc -l docs/screens/home/*.md

# Test all links
```

**8. Commit**
```bash
git add docs/screens/home/
git commit -m "docs(home): split large documentation

- Split 650-line README into 3 files
- README.md now 200 lines (overview)
- features.md now 300 lines (detailed features)
- technical.md now 250 lines (implementation)
- Added cross-references between files
"
```

### Checklist
- [ ] Identified split points
- [ ] All files under 500 lines
- [ ] Used appropriate templates
- [ ] Added cross-references
- [ ] Tested all links
- [ ] Committed with explanation

---

## Workflow 5: Adding Examples to Existing Docs

### Prerequisites
- Documentation lacks examples
- Or new usage pattern discovered

### Steps

**1. Identify Missing Examples**
Read through documentation and note sections without examples.

**2. Write Examples**
For each feature/concept:
```typescript
// Real, working code example
const result = useFeature();
```

**3. Test Examples**
- Copy example code
- Run in actual codebase
- Verify it works
- Capture output/result

**4. Add to Documentation**

Format:
```markdown
### Feature Name

Description of feature.

**Example:**
\```typescript
// Example code
const result = useFeature({
  option: 'value'
});
\```

**Result:**
\```
Expected output
\```

**Location:** source/path/to/file.ts:123
```

**5. Validate**
```bash
# Check file size
wc -l docs/path/to/file.md

# If approaching 500 lines, consider splitting
```

**6. Commit**
```bash
git add docs/path/to/file.md
git commit -m "docs(topic): add usage examples

- Add 5 working code examples
- Include expected outputs
- Add code references
"
```

### Checklist
- [ ] All examples tested
- [ ] Examples include expected results
- [ ] Code references added (file:line)
- [ ] File under 500 lines
- [ ] Committed

---

## Workflow 6: Reviewing Documentation

Quarterly or before major releases.

### Steps

**1. List All Documentation**
```bash
find docs -type f -name "*.md" | sort
```

**2. Check Each File**

**a. Verify Accuracy**
- Read documentation
- Compare with current code
- Check code references (file:line)
- Test examples

**b. Check Links**
```bash
# Extract all markdown links
grep -o "\[.*\](.*)" docs/file.md
```
Verify each link works.

**c. Check Size**
```bash
wc -l docs/**/*.md
```
Flag files >450 lines.

**d. Check for Duplicates**
```bash
# Search for similar content
grep -r "keyword" docs/ --include="*.md"
```

**3. Create Fix List**
```
- [ ] Update home/README.md examples
- [ ] Fix broken link in guides/user-guide.md
- [ ] Split architecture/overview.md (550 lines)
- [ ] Consolidate duplicate config docs
```

**4. Fix Issues**
Follow appropriate workflows above.

**5. Document Review**
```bash
git commit -m "docs: quarterly documentation review

- Updated 12 code references
- Fixed 3 broken links
- Split 2 large files
- Tested all examples
- All docs now current
"
```

### Review Checklist
- [ ] All files reviewed
- [ ] All code references accurate
- [ ] All links working
- [ ] All files under 500 lines
- [ ] No duplicates
- [ ] All examples tested
- [ ] Committed changes

---

## Decision Trees

### Should I Create Documentation?

```
Is feature complete? ──No──> STOP (don't create)
       │
      Yes
       │
Does similar doc exist? ──Yes──> UPDATE existing
       │
       No
       │
Is it temporary/WIP? ──Yes──> STOP (use GitHub Issue)
       │
       No
       │
CREATE documentation
```

### Where Should Documentation Go?

```
What are you documenting?
       │
       ├─ Screen feature?
       │  └─> docs/screens/{screen-name}/
       │
       ├─ User guide?
       │  └─> docs/guides/
       │
       ├─ Architecture/patterns?
       │  └─> docs/architecture/
       │
       └─ Configuration?
          └─> docs/guides/configuration.md
```

### Which Template Should I Use?

```
What type of document?
       │
       ├─ Screen overview?
       │  └─> templates.md → Screen README
       │
       ├─ Screen implementation?
       │  └─> templates.md → Screen Technical
       │
       ├─ Screen features?
       │  └─> templates.md → Screen Features
       │
       ├─ Screen workflows?
       │  └─> templates.md → Screen Flows
       │
       ├─ Architecture?
       │  └─> templates.md → Architecture
       │
       └─ User/dev guide?
          └─> templates.md → Guide
```

### Should I Split This File?

```
Current lines: ___

       │
   >500 lines? ──Yes──> MUST split immediately
       │
       No
       │
   >450 lines? ──Yes──> SHOULD split soon
       │
       No
       │
   >400 lines? ──Yes──> CONSIDER splitting
       │
       No
       │
     <400 lines ──────> OK (no split needed)
```

## Quick Reference

**Before creating docs:**
```bash
grep -r "topic" docs/ --include="*.md"
```

**Count lines:**
```bash
wc -l docs/path/to/file.md
```

**List screens:**
```bash
ls -la docs/screens/
```

**Test links:**
```bash
grep -o "\[.*\](.*)" docs/file.md
```

**Commit:**
```bash
git commit -m "docs(scope): description"
```
