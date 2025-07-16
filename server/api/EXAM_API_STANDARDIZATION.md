# Exam API Standardization Documentation

## Overview

This document describes the standardization of exam APIs completed as part of FOUND-003 task.

## Changes Made

### 1. Created Standard Response Types (`/server/utils/types/examTypes.ts`)

- **ExamBase**: Core exam fields shared across all responses
- **ExamDetails**: Full exam information with vendor, objectives, and statistics
- **ExamListItem**: Lightweight exam data for list views with user progress
- **ExamListResponse**: Paginated list response with metadata
- **ExamDetailResponse**: Single exam detail response
- **ExamStatsResponse**: Statistics-only response

### 2. Created Comprehensive Exam Service (`/server/utils/examService.ts`)

Core methods:
- `getList()`: Paginated, filtered exam listing with user progress
- `getById()`: Get exam by ID with full details
- `getByCode()`: Get exam by code (e.g., "N10-008")
- `getStatistics()`: Get exam statistics (question counts, etc.)
- `search()`: Quick search across exam codes and names
- `create()`, `update()`, `delete()`: Admin operations

### 3. Updated API Endpoints

#### `/api/exams.get.ts`
- Now supports comprehensive filtering and pagination
- Query parameters validated with Zod
- Returns standardized `ExamListResponse`
- Supports: vendorId, difficulty, search, sorting, pagination

#### `/api/exams/[id].get.ts`
- Supports both exam IDs and codes (e.g., "N10-008")
- Returns standardized `ExamDetailResponse`
- Includes vendor info, objectives, and statistics
- Checks exam availability based on user role

#### `/api/exams/search.get.ts` (NEW)
- Quick search endpoint for autocomplete
- Query parameter: `q` (min 2 chars)
- Returns matched exams with vendor names

#### `/api/exams/[id]/stats.get.ts` (NEW)
- Dedicated statistics endpoint
- Returns question counts, objective counts, etc.

#### `/api/vendors/[vendorId]/exams.get.ts` (NEW)
- Get all exams for a specific vendor
- Supports same pagination/sorting as main list

## Key Improvements

1. **Consistent Response Format**: All endpoints return `{ success: true, data: {...} }`
2. **Type Safety**: Full TypeScript types with Zod validation
3. **Error Handling**: Standardized error responses with proper status codes
4. **Performance**: Efficient queries with proper indexing
5. **User Context**: APIs include user progress when authenticated
6. **Flexibility**: Support for both exam IDs and codes in routing

## Migration Notes

Frontend components using old API responses need updates:
- `examCode` → `code`
- `examName` → `name`
- `numberOfQuestions` → `totalQuestions`
- `examDuration` → `duration`

## Example Usage

```typescript
// Get paginated exam list
const response = await $fetch('/api/exams?limit=20&offset=0&sortBy=name')

// Get exam by code
const exam = await $fetch('/api/exams/N10-008')

// Search exams
const results = await $fetch('/api/exams/search?q=comptia')

// Get vendor exams
const vendorExams = await $fetch('/api/vendors/vendor_123/exams')
```

## Next Steps

1. Update frontend components to use new response formats
2. Add caching layer for frequently accessed exams
3. Implement WebSocket support for real-time updates
4. Add bulk operations for admin users