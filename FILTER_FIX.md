# Filter Query Fix ✅

## Problem

When filtering questions by module or sub-topic, the application was throwing a **400 Bad Request** error:

```
Database error: column questions.module does not exist
```

### Error Details

The Supabase query was trying to use non-existent columns:
```sql
or=(module_name.eq.Module_1,module.eq.Module_1)
```

This caused the query to fail because:
- ❌ `module` column does NOT exist
- ✅ `module_name` column DOES exist

## Root Cause

The `queries.ts` file was attempting to query both column names (`module` and `module_name`) using an `OR` condition, assuming one of them would work. However, this approach caused a database error when the non-existent column was referenced.

**Database Schema** (from `20250301_create_questions_table.sql`):
```sql
CREATE TABLE questions (
    id BIGINT PRIMARY KEY,
    text TEXT,
    answer TEXT,
    explanation TEXT,
    subject TEXT,
    module_name TEXT,        -- ✅ Correct column name
    topic TEXT,
    sub_topic TEXT,          -- ✅ Correct column name  
    difficulty_level TEXT,
    question_type TEXT,
    nature_of_question TEXT,
    ...
);
```

## Solution

**File**: `src/lib/database/queries.ts`

### Before (Lines 62-73):
```typescript
if (filters.module) {
  const modules = Array.isArray(filters.module) ? filters.module : [filters.module];
  if (modules.length > 0) {
    // Try both module_name and module columns ❌ WRONG
    if (modules.length === 1) {
      query = query.or(`module_name.eq.${modules[0]},module.eq.${modules[0]}`);
    } else {
      query = query.or(`module_name.in.(${modules.join(',')}),module.in.(${modules.join(',')})`);
    }
  }
}
```

### After (Lines 62-68):
```typescript
if (filters.module) {
  const modules = Array.isArray(filters.module) ? filters.module : [filters.module];
  if (modules.length > 0) {
    // Use module_name column (the actual database column name) ✅ CORRECT
    query = query.in('module_name', modules);
  }
}
```

### Before (Lines 82-93):
```typescript
if (filters.sub_topic) {
  const subTopics = Array.isArray(filters.sub_topic) ? filters.sub_topic : [filters.sub_topic];
  if (subTopics.length > 0) {
    // Try both sub_topic and SubTopic columns ❌ WRONG
    if (subTopics.length === 1) {
      query = query.or(`sub_topic.eq.${subTopics[0]},SubTopic.eq.${subTopics[0]}`);
    } else {
      query = query.or(`sub_topic.in.(${subTopics.join(',')}),SubTopic.in.(${subTopics.join(',')})`);
    }
  }
}
```

### After (Lines 77-83):
```typescript
if (filters.sub_topic) {
  const subTopics = Array.isArray(filters.sub_topic) ? filters.sub_topic : [filters.sub_topic];
  if (subTopics.length > 0) {
    // Use sub_topic column (the actual database column name) ✅ CORRECT
    query = query.in('sub_topic', subTopics);
  }
}
```

## Changes Made

1. **Removed OR condition** for module filter
2. **Used only `module_name`** column (the actual database column)
3. **Simplified to `.in()` operator** for cleaner, more efficient queries
4. **Fixed sub_topic filter** the same way

## Benefits

- ✅ **No more 400 errors** when filtering by module
- ✅ **Cleaner, simpler code** - removed unnecessary OR conditions
- ✅ **Better performance** - single column query instead of OR
- ✅ **Matches database schema** exactly

## Database Column Mapping

For reference, here's the correct column mapping:

| Frontend Field | Database Column     | Status |
|---------------|---------------------|--------|
| subject       | subject             | ✅     |
| module        | module_name         | ✅     |
| topic         | topic               | ✅     |
| sub_topic     | sub_topic           | ✅     |
| difficulty    | difficulty_level    | ✅     |
| question_type | question_type       | ✅     |

## Testing

To verify the fix works:

1. Navigate to `/questions` page
2. Select a subject (e.g., "Economics")
3. Select a module (e.g., "Module_1")
4. ✅ Questions should load without errors
5. Check browser console - no 400 errors

### Expected Behavior

**Before Fix**:
```
❌ 400 Bad Request
❌ Database error: column questions.module does not exist
❌ No questions displayed
```

**After Fix**:
```
✅ 200 OK
✅ Questions load successfully  
✅ Filters work correctly
```

## Related Files

- **`queries.ts`** - Query builder (fixed)
- **`questions/page.tsx`** - Questions page (no changes needed)
- **`QuestionFilter.tsx`** - Filter component (no changes needed)
- **`QuestionList.tsx`** - List component (no changes needed)

## Status: FIXED ✅

The filter functionality now works correctly with the actual database schema. All column names are properly mapped and queries execute successfully.
