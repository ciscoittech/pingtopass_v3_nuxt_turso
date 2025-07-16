# 📡 API Documentation

## Overview

This document provides comprehensive documentation for all API endpoints in the PingToPass Nuxt application.

## Table of Contents

1. [Authentication](#authentication)
2. [User Endpoints](#user-endpoints)
3. [Exam Endpoints](#exam-endpoints)
4. [Study Endpoints](#study-endpoints)
5. [Progress Endpoints](#progress-endpoints)
6. [Analytics Endpoints](#analytics-endpoints)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)

## Authentication

All API endpoints except auth routes require authentication via session cookies.

### Login with Google

```http
GET /api/auth/oauth/google
```

Redirects to Google OAuth flow.

### Get Current User

```http
GET /api/auth/user
```

**Response:**
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "name": "John Doe",
  "picture": "https://...",
  "role": "user",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Logout

```http
POST /api/auth/logout
```

Clears session and logs out user.

## User Endpoints

### Get User Profile

```http
GET /api/users/profile
```

**Response:**
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": "https://...",
    "stats": {
      "totalExams": 15,
      "studyStreak": 7,
      "averageScore": 85.5,
      "studyHours": 124
    }
  }
}
```

### Update User Profile

```http
PUT /api/users/profile
```

**Request Body:**
```json
{
  "name": "John Doe",
  "preferences": {
    "notifications": true,
    "studyReminders": "daily",
    "theme": "dark"
  }
}
```

### Get User Stats

```http
GET /api/users/stats
```

**Response:**
```json
{
  "totalStudyTime": 7440, // minutes
  "examsCompleted": 23,
  "questionsAnswered": 1250,
  "correctAnswers": 1067,
  "currentStreak": 7,
  "longestStreak": 21,
  "achievements": ["early_bird", "perfect_score", "week_warrior"]
}
```

## Exam Endpoints

### List All Exams

```http
GET /api/exams
```

**Query Parameters:**
- `vendor`: Filter by vendor ID
- `search`: Search in exam name/code
- `difficulty`: Filter by difficulty (easy, intermediate, hard)
- `sort`: Sort by field (popularity, name, date)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 12)

**Response:**
```json
{
  "data": [
    {
      "id": "exam_123",
      "code": "AZ-900",
      "name": "Microsoft Azure Fundamentals",
      "vendorId": "vendor_microsoft",
      "vendorName": "Microsoft",
      "difficulty": "easy",
      "questionCount": 60,
      "duration": 85,
      "passingScore": 700,
      "price": 0,
      "isActive": true,
      "popularity": 95,
      "userProgress": 45,
      "isBookmarked": false,
      "tags": ["cloud", "azure", "fundamentals"],
      "description": "Demonstrate foundational knowledge of cloud concepts..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 45,
    "pages": 4
  }
}
```

### Get Exam Details

```http
GET /api/exams/:examId
```

**Response:**
```json
{
  "exam": {
    "id": "exam_123",
    "code": "AZ-900",
    "name": "Microsoft Azure Fundamentals",
    "objectives": [
      {
        "title": "Describe cloud concepts",
        "weight": "20-25%",
        "topics": ["Benefits of cloud", "Cloud service types"]
      }
    ],
    "prerequisites": [],
    "recommendedExperience": "6 months of cloud experience",
    "examFormat": "Multiple choice and multi-select",
    "retakePolicy": "24 hours wait for first retake"
  }
}
```

### Get Exam Questions

```http
GET /api/exams/:examId/questions
```

**Query Parameters:**
- `mode`: study or test
- `count`: Number of questions (test mode)
- `shuffle`: Shuffle questions (default: true)

**Response:**
```json
{
  "questions": [
    {
      "id": "q_123",
      "examId": "exam_123",
      "text": "What is the primary benefit of cloud computing?",
      "type": "single",
      "options": [
        {
          "id": "opt_1",
          "text": "Cost savings",
          "isCorrect": true
        }
      ],
      "explanation": "Cloud computing provides cost savings by...",
      "references": ["https://docs.microsoft.com/..."],
      "difficulty": "easy",
      "tags": ["cloud-concepts"]
    }
  ],
  "totalQuestions": 150
}
```

## Study Endpoints

### Start Study Session

```http
POST /api/study/sessions
```

**Request Body:**
```json
{
  "examId": "exam_123",
  "mode": "study"
}
```

**Response:**
```json
{
  "sessionId": "session_456",
  "examId": "exam_123",
  "startTime": "2024-01-01T10:00:00Z",
  "questions": [...]
}
```

### Submit Answer

```http
POST /api/study/sessions/:sessionId/answers
```

**Request Body:**
```json
{
  "questionId": "q_123",
  "selectedOptions": ["opt_1"],
  "timeSpent": 45 // seconds
}
```

**Response:**
```json
{
  "correct": true,
  "explanation": "This is correct because...",
  "userAnswer": ["opt_1"],
  "correctAnswer": ["opt_1"]
}
```

### End Study Session

```http
POST /api/study/sessions/:sessionId/end
```

**Response:**
```json
{
  "sessionId": "session_456",
  "duration": 3600, // seconds
  "questionsAnswered": 45,
  "correctAnswers": 38,
  "score": 84.4,
  "performance": {
    "strengths": ["cloud-concepts", "security"],
    "weaknesses": ["networking"],
    "recommendations": ["Review networking fundamentals"]
  }
}
```

### Get Study History

```http
GET /api/study/history
```

**Query Parameters:**
- `examId`: Filter by exam
- `dateFrom`: Start date
- `dateTo`: End date
- `limit`: Results per page

**Response:**
```json
{
  "sessions": [
    {
      "id": "session_456",
      "examCode": "AZ-900",
      "examName": "Azure Fundamentals",
      "date": "2024-01-01T10:00:00Z",
      "duration": 3600,
      "questionsAnswered": 45,
      "score": 84.4,
      "mode": "study"
    }
  ],
  "totalSessions": 23,
  "averageScore": 82.5
}
```

## Progress Endpoints

### Get Learning Progress

```http
GET /api/progress
```

**Response:**
```json
{
  "overall": {
    "level": 12,
    "currentXP": 2450,
    "nextLevelXP": 3000,
    "rank": "Intermediate",
    "percentile": 78
  },
  "exams": [
    {
      "examId": "exam_123",
      "examCode": "AZ-900",
      "progress": 67,
      "lastStudied": "2024-01-01T10:00:00Z",
      "averageScore": 85.5,
      "questionsAnswered": 89,
      "totalQuestions": 150
    }
  ],
  "achievements": {
    "unlocked": ["first_exam", "week_streak", "perfect_score"],
    "recent": [
      {
        "id": "perfect_score",
        "name": "Perfect Score",
        "description": "Score 100% on a practice test",
        "unlockedAt": "2024-01-01T12:00:00Z",
        "xpReward": 100
      }
    ]
  }
}
```

### Update Exam Progress

```http
POST /api/progress/exams/:examId
```

**Request Body:**
```json
{
  "questionsAnswered": 10,
  "correctAnswers": 8,
  "timeSpent": 600
}
```

## Analytics Endpoints

### Get Dashboard Analytics

```http
GET /api/analytics/dashboard
```

**Response:**
```json
{
  "summary": {
    "totalStudyTime": 12580, // minutes
    "averageSessionLength": 45,
    "studyStreak": 7,
    "totalExams": 5
  },
  "recentActivity": [
    {
      "type": "study_session",
      "examCode": "AZ-900",
      "timestamp": "2024-01-01T10:00:00Z",
      "duration": 45,
      "score": 88
    }
  ],
  "weeklyProgress": [
    {
      "date": "2024-01-01",
      "studyTime": 120,
      "questionsAnswered": 45,
      "averageScore": 85
    }
  ]
}
```

### Get Exam Analytics

```http
GET /api/analytics/exams/:examId
```

**Response:**
```json
{
  "performance": {
    "averageScore": 82.5,
    "bestScore": 96,
    "totalAttempts": 12,
    "passRate": 83.3
  },
  "topicPerformance": [
    {
      "topic": "Cloud Concepts",
      "correctRate": 92,
      "questionsAnswered": 48
    }
  ],
  "timeAnalysis": {
    "averageTimePerQuestion": 45,
    "totalTimeSpent": 7200
  }
}
```

## Error Handling

All API endpoints follow a consistent error response format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  }
}
```

### Common Error Codes

- `UNAUTHORIZED`: User not authenticated
- `FORBIDDEN`: User lacks permission
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid input
- `RATE_LIMITED`: Too many requests
- `SERVER_ERROR`: Internal server error

### HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Too Many Requests
- `500`: Internal Server Error

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Authenticated users**: 100 requests per minute
- **Study endpoints**: 200 requests per minute
- **Analytics endpoints**: 50 requests per minute

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1641024000
```

## Best Practices

### 1. Pagination

Always use pagination for list endpoints:

```typescript
const { data } = await $fetch('/api/exams', {
  query: {
    page: 1,
    limit: 20
  }
})
```

### 2. Error Handling

Implement proper error handling:

```typescript
try {
  const response = await $fetch('/api/exams')
} catch (error) {
  if (error.statusCode === 401) {
    // Handle unauthorized
  }
}
```

### 3. Caching

Use appropriate caching strategies:

```typescript
const { data } = await useFetch('/api/exams', {
  key: 'exams-list',
  cache: 'default'
})
```

### 4. Request Optimization

Batch related requests when possible:

```typescript
const [exams, progress] = await Promise.all([
  $fetch('/api/exams'),
  $fetch('/api/progress')
])
```