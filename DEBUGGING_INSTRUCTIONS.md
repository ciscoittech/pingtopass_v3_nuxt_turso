# Debugging Instructions for Study Flow Issue

## Issue Summary
The user is experiencing a 4.8 second delay when clicking the Quick Start button, and the study interface isn't loading properly. The route changes to `/study/exam_1752523451149_7ca9j5a83` but something isn't working.

## Key Finding: Exam ID Format Mismatch
The exam ID in the route (`exam_1752523451149_7ca9j5a83`) uses prefix `exam_` but the ID generation function uses prefix `exm_`. This suggests the ID might be coming from a different source or there's a bug in ID generation.

## Debugging Steps

### 1. Check Browser Console
With the dev server running (`npm run dev`), open the browser and:

1. Navigate to http://localhost:3001
2. Open DevTools (F12)
3. Go to Console tab
4. Navigate to http://localhost:3001/study
5. Click the Quick Start button
6. Look for these console logs:
   ```
   [StudyModeConfig] startSession called
   [Study Page] startStudySession called with config
   [Study Store] startSession called with config
   [Study Store] Making API call to /api/sessions/study/start
   ```

### 2. Check Network Tab
1. In DevTools, go to Network tab
2. Clear the network log
3. Click the Quick Start button
4. Look for the `/api/sessions/study/start` request
5. Check:
   - Request payload (should have examId)
   - Response status (401 = auth issue, 404 = exam not found)
   - Response body for error messages

### 3. Check Server Logs
In the terminal running the dev server, look for:
```
[Study API] Start session endpoint called
[Study API] User authenticated: <user_id>
[Study API] Request body: { examId: ... }
[Study API] Fetching exam: <exam_id>
[Study API] Exam found: Yes/No
[QuestionService] getQuestionsForSession called
```

### 4. Likely Issues

#### A. Exam Not Found (404)
If you see "Exam not found" errors, the exam ID format is wrong. Check:
- What exam IDs are in the database
- Whether the seeding script ran successfully
- If exam IDs use `exm_` prefix not `exam_`

#### B. No Questions Found
If you see "No questions found for this exam", then:
- Questions weren't seeded properly
- Questions have wrong exam_id reference
- The exam_id column wasn't populated correctly

#### C. Authentication Issue (401)
If you get 401 errors:
- User isn't logged in properly
- Session cookie is missing or expired
- Auth middleware is blocking the request

### 5. Quick Fixes to Try

1. **Check if exams exist in database:**
   ```bash
   # Connect to Turso database
   turso db shell pingtopassprod
   # Run query
   SELECT id, code, name FROM exams;
   ```

2. **Check if questions exist:**
   ```bash
   SELECT COUNT(*) FROM questions WHERE exam_id IS NOT NULL;
   ```

3. **Run the seeding script again:**
   ```bash
   npm run db:seed
   ```

4. **Clear browser cookies and login again**

## Console Output to Share
When debugging, copy and share:
1. All console logs starting with `[StudyModeConfig]`, `[Study Page]`, `[Study Store]`
2. The Network request/response for `/api/sessions/study/start`
3. Any error messages in red
4. Server logs from the terminal

This will help identify exactly where the flow is breaking.