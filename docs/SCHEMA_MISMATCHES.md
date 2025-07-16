# Database Schema Mismatches Documentation

## Overview
The database uses snake_case column names while Drizzle ORM expects camelCase property names. This causes queries to fail when looking for columns that don't exist.

## Critical Mismatches

### 1. Questions Table
| Database Column | ORM Property | Used In |
|----------------|--------------|---------|
| exam_id | examId | `/api/exams/[id]/questions/count.get.ts` |
| objective_id | objectiveId | Question fetching APIs |
| question_text | questionText | All question APIs |
| question_type | questionType | All question APIs |
| correct_answer | correctAnswer | Study/Test modes |
| is_active | isActive | Question filtering |
| created_at | createdAt | Timestamps |

### 2. Exams Table
| Database Column | ORM Property | Used In |
|----------------|--------------|---------|
| vendor_id | vendorId | Exam listings |
| passing_score | passingScore | Exam details |
| question_count | questionCount | Exam stats |
| is_active | isActive | Exam filtering |
| created_at | createdAt | Timestamps |
| updated_at | updatedAt | Sorting |

### 3. Objectives Table
| Database Column | ORM Property | Used In |
|----------------|--------------|---------|
| exam_id | examId | Objective fetching |
| is_active | isActive | Objective filtering |

### 4. Study Sessions Table
| Database Column | ORM Property | Used In |
|----------------|--------------|---------|
| user_id | userId | Session queries |
| exam_id | examId | Session creation |
| current_question_index | currentQuestionIndex | Progress tracking |
| questions_order | questionsOrder | Question navigation |
| time_spent_seconds | timeSpentSeconds | Time tracking |
| started_at | startedAt | Session timing |
| last_activity_at | lastActivityAt | Session updates |

## Impact Analysis

### High Priority Issues
1. **Question Count API** - Returns 0 because `questions.examId` doesn't exist
2. **Question Fetching** - Fails to load questions for study sessions
3. **Session Creation** - Can't link questions to exams

### Medium Priority Issues
1. **Filtering** - Active/inactive filters don't work properly
2. **Timestamps** - Date sorting and display issues

## Solution Approach

### Option 1: Fix Column References (Recommended)
Update all TypeScript/ORM code to use the actual database column names:
```typescript
// Before
eq(questions.examId, examId)

// After
eq(questions.exam_id, examId)
```

### Option 2: Use Column Aliases
Define column mappings in schema:
```typescript
examId: text('exam_id').notNull(),
```

### Option 3: Database Migration
Rename all columns to camelCase (not recommended - requires full migration)

## Files Requiring Updates

### Phase 1 - Critical APIs
- `/server/api/exams/[id]/questions/count.get.ts`
- `/server/utils/questionService.ts`
- `/server/api/sessions/study/start.post.ts`

### Phase 2 - Supporting APIs
- `/server/api/exams/[id]/questions.get.ts`
- `/server/api/progress/exams.get.ts`
- `/server/utils/sessions.ts`

### Phase 3 - Admin APIs
- `/server/api/admin/exams/[id]/questions.get.ts`
- `/server/api/admin/questions/index.post.ts`

## Testing Requirements
1. Verify question count returns correct values
2. Ensure study sessions load questions
3. Test filtering and sorting functionality
4. Validate session progress tracking