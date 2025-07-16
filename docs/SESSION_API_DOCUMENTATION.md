# Session API Documentation

## Overview

The Session API provides endpoints for managing study and test sessions in PingToPass. All endpoints require authentication and follow RESTful conventions.

## Base URL

```
/api/sessions
```

## Authentication

All endpoints require a valid user session. Include the session cookie with each request.

## Common Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "statusCode": 400,
  "statusMessage": "Error message",
  "data": {
    // Additional error details
  }
}
```

## Study Session Endpoints

### Start Study Session

Creates a new study session or returns an existing active session.

**Endpoint:** `POST /api/sessions/study/start`

**Request Body:**
```json
{
  "examId": "exam_abc123",
  "mode": "sequential", // optional: sequential|random|flagged|incorrect|weak_areas
  "maxQuestions": 50, // optional: limit number of questions
  "objectiveIds": ["obj_1", "obj_2"], // optional: filter by objectives
  "showExplanations": true, // optional: default true
  "showTimer": true, // optional: default true
  "autoAdvance": false // optional: default false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "study_xyz789",
      "status": "active",
      "totalQuestions": 50,
      "currentQuestionIndex": 0,
      // ... other session fields
    },
    "questions": [
      {
        "id": "q_123",
        "questionText": "What is...",
        "questionType": "multiple-choice",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswers": [0], // indices of correct options
        "explanation": "The correct answer is...",
        "codeBlock": "// code example",
        "resources": []
      }
    ],
    "isResuming": false
  }
}
```

### Get Study Session

Retrieves a study session by ID.

**Endpoint:** `GET /api/sessions/study/{id}`

**Query Parameters:**
- `includeQuestions` (boolean): Include full question data

**Response:**
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "study_xyz789",
      "status": "active",
      "questionsOrder": ["q_1", "q_2", "q_3"],
      "answers": {
        "q_1": {
          "questionId": "q_1",
          "selectedAnswers": [0],
          "isCorrect": true,
          "timeSpent": 45,
          "answeredAt": "2024-01-15T10:30:00Z"
        }
      },
      "bookmarks": ["q_2"],
      "flags": [],
      // ... other fields
    },
    "questions": [] // if includeQuestions=true
  }
}
```

### Update Study Session

Updates session progress, answers, bookmarks, or flags.

**Endpoint:** `PUT /api/sessions/study/{id}`

**Request Body:**
```json
{
  "currentQuestionIndex": 5, // optional
  "answer": { // optional: submit an answer
    "questionId": "q_123",
    "selectedAnswers": [0, 2],
    "isCorrect": false,
    "timeSpent": 60
  },
  "bookmark": { // optional: toggle bookmark
    "questionId": "q_123",
    "action": "add" // or "remove"
  },
  "flag": { // optional: toggle flag
    "questionId": "q_123",
    "action": "add" // or "remove"
  },
  "timeSpentSeconds": 300 // optional: update total time
}
```

### End Study Session

Completes or abandons a study session.

**Endpoint:** `DELETE /api/sessions/study/{id}`

**Request Body:**
```json
{
  "action": "complete" // or "abandon"
}
```

**Response includes final statistics:**
```json
{
  "success": true,
  "data": {
    "session": { /* session data */ },
    "statistics": {
      "totalQuestions": 50,
      "questionsAnswered": 45,
      "correctAnswers": 38,
      "incorrectAnswers": 7,
      "skippedAnswers": 5,
      "accuracy": 84.4,
      "timeSpentSeconds": 2700,
      "bookmarkedCount": 3,
      "flaggedCount": 2
    }
  }
}
```

## Test Session Endpoints

### Start Test Session

Creates a new test session or returns an existing active session.

**Endpoint:** `POST /api/sessions/test/start`

**Request Body:**
```json
{
  "examId": "exam_abc123",
  "timeLimitMinutes": 90, // optional: override exam default
  "maxQuestions": 75 // optional: limit questions
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "test_xyz789",
      "status": "active",
      "timeLimitSeconds": 5400,
      "totalQuestions": 75,
      "passingScore": 70,
      "timeRemainingSeconds": 5400,
      // ... other fields
    },
    "questions": [
      {
        "id": "q_123",
        "questionText": "What is...",
        "questionType": "multiple-choice",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "codeBlock": "// code example"
        // Note: No correct answers or explanations in test mode
      }
    ],
    "isResuming": false
  }
}
```

### Update Test Session (Auto-save)

Updates test progress and saves answers.

**Endpoint:** `PUT /api/sessions/test/{id}`

**Request Body:**
```json
{
  "currentQuestionIndex": 10, // optional
  "answer": { // optional: save answer
    "questionIndex": 5,
    "selectedAnswers": [1]
  },
  "flag": { // optional: toggle flag
    "questionIndex": 5,
    "flagged": true
  },
  "timeRemainingSeconds": 4500 // optional: update time
}
```

### Submit Test

Submits test for scoring and returns results.

**Endpoint:** `POST /api/sessions/test/{id}/submit`

**Response:**
```json
{
  "success": true,
  "data": {
    "session": { /* completed session data */ },
    "results": {
      "score": 85.3,
      "passed": true,
      "correctCount": 64,
      "incorrectCount": 11,
      "unansweredCount": 0,
      "totalQuestions": 75,
      "passingScore": 70,
      "timeSpent": 3600,
      "detailedResults": [
        {
          "questionId": "q_123",
          "questionText": "What is...",
          "options": ["A", "B", "C", "D"],
          "userAnswer": [1],
          "correctAnswer": [1],
          "isCorrect": true,
          "explanation": "..."
        }
      ]
    }
  }
}
```

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Access denied to resource |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

## Rate Limiting

API endpoints are rate-limited to:
- 100 requests per minute per user
- 10 session creations per hour per user

## Best Practices

1. **Auto-save Progress**: For test sessions, auto-save every 30-60 seconds
2. **Handle Resumption**: Check for existing sessions before creating new ones
3. **Error Handling**: Implement retry logic for network failures
4. **Time Sync**: Sync client time with server for accurate test timing
5. **Cleanup**: Properly end sessions when users navigate away

## WebSocket Support (Future)

Real-time updates for:
- Time synchronization
- Live progress tracking
- Collaborative features