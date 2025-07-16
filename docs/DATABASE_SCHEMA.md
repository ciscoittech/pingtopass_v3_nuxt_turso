# Database Schema Documentation

## Overview

This document describes the database schema for the PingToPass Study & Test Mode sessions. The system uses SQLite (via Turso) for data persistence.

## Session Tables

### study_sessions

Stores individual study sessions for users practicing exam questions.

| Column | Type | Description | Default |
|--------|------|-------------|---------|
| `id` | TEXT | Primary key, unique session identifier | Required |
| `user_id` | TEXT | Foreign key to users table | Required |
| `exam_id` | TEXT | Foreign key to exams table | Required |
| `status` | TEXT | Session status: 'active', 'paused', 'completed', 'abandoned' | 'active' |
| `mode` | TEXT | Study mode: 'sequential', 'random', 'flagged', 'incorrect', 'weak_areas' | 'sequential' |
| `current_question_index` | INTEGER | Current position in question list | 0 |
| `total_questions` | INTEGER | Total number of questions in session | Required |
| `correct_answers` | INTEGER | Count of correct answers | 0 |
| `incorrect_answers` | INTEGER | Count of incorrect answers | 0 |
| `skipped_answers` | INTEGER | Count of skipped questions | 0 |
| `questions_order` | TEXT | JSON array of question IDs in session order | Required |
| `answers` | TEXT | JSON object mapping question IDs to answer data | '{}' |
| `bookmarks` | TEXT | JSON array of bookmarked question IDs | '[]' |
| `flags` | TEXT | JSON array of flagged question IDs | '[]' |
| `started_at` | INTEGER | Unix timestamp when session started | Required |
| `last_activity_at` | INTEGER | Unix timestamp of last activity | Required |
| `completed_at` | INTEGER | Unix timestamp when session completed | NULL |
| `time_spent_seconds` | INTEGER | Total time spent in seconds | 0 |
| `show_explanations` | INTEGER | Boolean - show explanations after answers | 1 |
| `show_timer` | INTEGER | Boolean - display timer during study | 1 |
| `auto_advance` | INTEGER | Boolean - auto-advance to next question | 0 |
| `metadata` | TEXT | JSON object for additional data | '{}' |
| `created_at` | INTEGER | Unix timestamp of record creation | unixepoch() |
| `updated_at` | INTEGER | Unix timestamp of last update | unixepoch() |

**Indexes:**
- `study_sessions_user_idx` on (`user_id`)
- `study_sessions_exam_idx` on (`exam_id`)
- `study_sessions_status_idx` on (`status`)
- `study_sessions_user_exam_idx` on (`user_id`, `exam_id`)

**Answer Data Structure (JSON):**
```json
{
  "question_id": {
    "questionId": "string",
    "selectedAnswers": [0, 1],
    "isCorrect": true,
    "timeSpent": 45,
    "answeredAt": "2024-01-15T10:30:00Z"
  }
}
```

### test_sessions

Stores formal test sessions with time limits and scoring.

| Column | Type | Description | Default |
|--------|------|-------------|---------|
| `id` | TEXT | Primary key, unique session identifier | Required |
| `user_id` | TEXT | Foreign key to users table | Required |
| `exam_id` | TEXT | Foreign key to exams table | Required |
| `status` | TEXT | Session status: 'active', 'paused', 'submitted', 'expired', 'abandoned' | 'active' |
| `time_limit_seconds` | INTEGER | Test duration limit in seconds | Required |
| `total_questions` | INTEGER | Total number of questions in test | Required |
| `passing_score` | INTEGER | Percentage required to pass (e.g., 70) | Required |
| `current_question_index` | INTEGER | Current question position | 0 |
| `answered_count` | INTEGER | Number of answered questions | 0 |
| `flagged_count` | INTEGER | Number of flagged questions | 0 |
| `questions_order` | TEXT | JSON array of question IDs in test order | Required |
| `answers` | TEXT | JSON object mapping question index to answers | '{}' |
| `flagged` | TEXT | JSON array of flagged question indices | '[]' |
| `started_at` | INTEGER | Unix timestamp when test started | Required |
| `last_activity_at` | INTEGER | Unix timestamp of last activity | Required |
| `submitted_at` | INTEGER | Unix timestamp when test submitted | NULL |
| `time_remaining_seconds` | INTEGER | Seconds remaining when paused/saved | Required |
| `score` | REAL | Final percentage score | NULL |
| `correct_count` | INTEGER | Number of correct answers | NULL |
| `incorrect_count` | INTEGER | Number of incorrect answers | NULL |
| `unanswered_count` | INTEGER | Number of unanswered questions | NULL |
| `passed` | INTEGER | Boolean - whether user passed | NULL |
| `last_auto_save_at` | INTEGER | Unix timestamp of last auto-save | NULL |
| `auto_save_count` | INTEGER | Number of auto-saves performed | 0 |
| `metadata` | TEXT | JSON object for additional data | '{}' |
| `created_at` | INTEGER | Unix timestamp of record creation | unixepoch() |
| `updated_at` | INTEGER | Unix timestamp of last update | unixepoch() |

**Indexes:**
- `test_sessions_user_idx` on (`user_id`)
- `test_sessions_exam_idx` on (`exam_id`)
- `test_sessions_status_idx` on (`status`)
- `test_sessions_user_exam_idx` on (`user_id`, `exam_id`)

**Answer Data Structure (JSON):**
```json
{
  "0": [1],      // Question index 0, selected answer index 1
  "1": [0, 2],   // Question index 1, selected answers 0 and 2
  "3": [3]       // Question index 3, selected answer 3
}
```

## Key Design Decisions

### 1. JSON Storage
Questions order, answers, bookmarks, and flags are stored as JSON to provide flexibility and avoid complex join tables. This is appropriate for our use case where:
- Data is always accessed as a complete set
- Updates are atomic to the session
- Query patterns don't require filtering by these fields

### 2. Unix Timestamps
All timestamps use Unix epoch (seconds since 1970-01-01) for:
- Consistency across timezones
- Easy calculation of durations
- Compatibility with SQLite date functions

### 3. Separate Session Tables
Study and test sessions have different requirements:
- **Study sessions**: Focus on learning, allow navigation, show answers
- **Test sessions**: Time-limited, enforce sequence, hide answers until submission

### 4. Status Tracking
Both tables use status fields to handle:
- Session recovery after disconnection
- Progress tracking
- Analytics on completion rates

### 5. Performance Indexes
Indexes are created on:
- Foreign keys for join performance
- Status fields for filtering active sessions
- Composite user+exam for user history queries

## Migration Notes

The schema was created using Drizzle ORM with the following migration:
- File: `/drizzle/0001_add_session_tables.sql`
- Applied: Successfully on production database

## Future Considerations

1. **Partitioning**: As data grows, consider partitioning by date or user
2. **Archiving**: Move completed sessions older than 1 year to archive tables
3. **Analytics Tables**: Create aggregate tables for faster reporting
4. **Question Performance**: Track per-question statistics in separate tables