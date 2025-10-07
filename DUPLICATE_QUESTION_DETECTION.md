# Duplicate Question Detection & Conflict Management ✅

## Overview

Implemented a comprehensive conflict management system that prevents reusing questions in the same batch. When saving or exporting a draft, the system checks if any questions have been previously used in the same batch and displays a warning dialog with detailed information.

## Features Implemented

### 1. Duplicate Detection API
**File**: `src/app/api/questions/check-duplicates/route.ts`

**Endpoint**: `POST /api/questions/check-duplicates`

**Request Body**:
```json
{
  "questionIds": [1, 2, 3, 4, 5],
  "batch": "Batch 2024-A"
}
```

**Response**:
```json
{
  "hasDuplicates": true,
  "duplicates": [
    {
      "questionId": 3,
      "questionText": "What is the capital of France?...",
      "subject": "Geography",
      "topic": "World Capitals",
      "testId": "test_123_abc",
      "testName": "Geography Quiz - Week 1"
    }
  ],
  "message": "Found 1 question(s) already used in this batch",
  "totalDuplicates": 1
}
```

**How It Works**:
1. Queries `carts` table for all tests in the specified batch
2. Checks `cart_items` for questions that match the provided IDs
3. Retrieves question details from `questions` table
4. Returns comprehensive information about duplicates

### 2. Cart Component Integration
**File**: `src/components/Cart.tsx`

**New State Variables**:
```typescript
const [duplicateWarning, setDuplicateWarning] = useState<{
  hasDuplicates: boolean;
  duplicates: any[];
  message: string;
  totalDuplicates?: number;
} | null>(null);
const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
const [checkingDuplicates, setCheckingDuplicates] = useState(false);
```

**New Function**: `checkForDuplicates()`
```typescript
const checkForDuplicates = useCallback(async (batch: string, questionIds: number[]) => {
  try {
    setCheckingDuplicates(true);
    const response = await fetch('/api/questions/check-duplicates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionIds, batch }),
    });
    const data = await response.json();
    return data;
  } finally {
    setCheckingDuplicates(false);
  }
}, []);
```

**Updated**: `handleSaveDraft()` function
- Now accepts `forceSave` parameter
- Checks for duplicates before saving (unless `forceSave = true`)
- Shows warning dialog if duplicates found
- Requires batch to be filled

### 3. Warning Dialog UI

**Features**:
- ⚠️ Warning icon and colored header
- Alert banner with duplicate count
- Scrollable list of duplicate questions
- Each duplicate shows:
  - Question ID
  - Question text preview (first 100 characters)
  - Subject and Topic chips
  - Test name where it was previously used
- Two action buttons:
  - **Cancel - Review Cart**: Close dialog and review questions
  - **Proceed Anyway**: Force save despite duplicates

**Visual Design**:
- Warning color scheme (orange/amber)
- Clear visual hierarchy
- Scrollable content for many duplicates
- Responsive layout

## User Flow

### Scenario 1: No Duplicates
```
1. User fills cart with questions
2. Clicks "Save Draft" or "Export"
3. Enters test details (name, batch, date)
4. Clicks "Save Draft"
5. ✅ System checks for duplicates
6. ✅ No duplicates found
7. ✅ Draft saved successfully
```

### Scenario 2: Duplicates Found
```
1. User fills cart with questions
2. Clicks "Save Draft" or "Export"
3. Enters test details (name, batch, date)
4. Clicks "Save Draft"
5. ⚠️  System checks for duplicates
6. ⚠️  Duplicates detected!
7. ⚠️  Warning dialog appears showing:
   - Number of duplicate questions
   - List of each duplicate with details
   - Which test they were used in
8. User has two options:
   a) Cancel - Review Cart
      - Dialog closes
      - User can remove duplicate questions
   b) Proceed Anyway
      - Draft saves despite duplicates
      - User accepts the risk
```

## Database Schema

The system relies on these tables:

### carts table
```sql
- id (integer, primary key)
- test_id (text, unique identifier)
- user_id (text)
- metadata (jsonb) -- Contains: { testName, batch, date }
```

### cart_items table
```sql
- id (integer, primary key)
- cart_id (integer, foreign key to carts)
- question_id (integer, foreign key to questions)
```

### questions table
```sql
- id (integer, primary key)
- text (text)
- subject (text)
- topic (text)
- ... other fields
```

## Validation

### Required Fields
Before duplicate check runs:
- ✅ Test Name (required)
- ✅ Batch (required for duplicate detection)
- Date (optional, defaults to today)

### Error Messages
- "Test Name is required"
- "Batch is required"
- "No valid questions in cart"
- "Failed to check for duplicates"

## Benefits

### 1. Test Integrity
- Prevents accidental question reuse
- Maintains test security
- Ensures fair assessment

### 2. User Awareness
- Clear warning when duplicates detected
- Detailed information about where questions were used
- Informed decision-making

### 3. Flexibility
- Option to proceed despite duplicates (for legitimate cases)
- Non-blocking warning (doesn't prevent saving)
- User retains control

### 4. Audit Trail
- System tracks which questions were used where
- Batch-level tracking
- Historical usage data

## Testing

### Test Case 1: First Use (No Duplicates)
1. Create a new test with batch "2024-A"
2. Add questions 1, 2, 3
3. Save draft
4. ✅ Should save without warning

### Test Case 2: Reuse in Same Batch
1. Create another test with batch "2024-A"
2. Add questions 2, 4, 5 (question 2 is duplicate)
3. Save draft
4. ⚠️  Should show warning for question 2
5. Dialog shows which test used question 2
6. User can cancel or proceed

### Test Case 3: Different Batch
1. Create a test with batch "2024-B"
2. Add questions 1, 2, 3 (same as first test)
3. Save draft
4. ✅ Should save without warning (different batch)

### Test Case 4: Multiple Duplicates
1. Create test with batch "2024-A"
2. Add questions 1, 2, 3 (all duplicates)
3. Save draft
4. ⚠️  Should show warning for all 3 questions
5. List shows all duplicates with details

### Test Case 5: Force Save
1. Get duplicate warning
2. Click "Proceed Anyway"
3. ✅ Should save despite duplicates
4. ✅ Success message shown

## Edge Cases Handled

1. **Empty Batch**: Requires batch to be filled
2. **No Questions**: Validates cart has questions
3. **API Failure**: Gracefully handles API errors, allows save
4. **Network Error**: Catches errors, doesn't block save
5. **Missing Data**: Handles missing question details gracefully

## Performance Considerations

1. **Lazy Loading**: Only checks when user tries to save
2. **Efficient Queries**: Uses database indexes on cart_id and question_id
3. **Batch Processing**: Single API call for all questions
4. **Caching**: Could be added for frequently accessed batches

## Future Enhancements

### Possible Improvements:
1. **Auto-Remove Duplicates**: Option to automatically remove duplicates
2. **Batch History**: Show all tests in a batch
3. **Question Usage Count**: Display how many times each question used
4. **Usage Analytics**: Dashboard showing question usage patterns
5. **Expiry Rules**: Auto-allow reuse after certain time period
6. **Subject-Level Tracking**: Track duplicates per subject
7. **Export with Warnings**: Include duplicate warnings in export

### Advanced Features:
1. **Similar Question Detection**: AI-powered detection of similar questions
2. **Difficulty Balance**: Warn if test difficulty differs from batch average
3. **Topic Coverage**: Ensure balanced topic distribution
4. **Question Pool Management**: Suggest unused questions

## Configuration

### Environment Variables
No additional environment variables needed. Uses existing:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Feature Flags
Could add:
```typescript
const ENABLE_DUPLICATE_CHECK = true;
const ALLOW_FORCE_SAVE = true;
const MAX_DUPLICATES_SHOWN = 50;
```

## Error Handling

### API Errors
- Returns 400 for invalid input
- Returns 500 for database errors
- Detailed error messages in response

### Client Errors
- Graceful fallback if API fails
- User can still save (doesn't block)
- Error logged to console

## Security

### Considerations:
- ✅ Uses service role key for database access
- ✅ No sensitive data exposed in responses
- ✅ Input validation on API endpoint
- ✅ SQL injection prevention (Supabase handles this)

## Documentation

### For Users:
- Warning dialog is self-explanatory
- Clear action buttons
- Detailed information provided

### For Developers:
- Well-commented code
- TypeScript types defined
- API endpoint documented
- Error handling explained

## Status: COMPLETE ✅

The duplicate question detection and conflict management system is fully implemented and ready for use. It provides:

- ✅ Automatic duplicate detection
- ✅ Clear warning dialogs
- ✅ Detailed duplicate information
- ✅ User choice (cancel or proceed)
- ✅ Batch-level tracking
- ✅ Comprehensive error handling
- ✅ Modern, intuitive UI

Users can now confidently manage their question banks while maintaining test integrity!
