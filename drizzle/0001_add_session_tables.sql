-- Add new study_sessions table
CREATE TABLE IF NOT EXISTS `study_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`exam_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`mode` text DEFAULT 'sequential' NOT NULL,
	`current_question_index` integer DEFAULT 0 NOT NULL,
	`total_questions` integer NOT NULL,
	`correct_answers` integer DEFAULT 0 NOT NULL,
	`incorrect_answers` integer DEFAULT 0 NOT NULL,
	`skipped_answers` integer DEFAULT 0 NOT NULL,
	`questions_order` text NOT NULL,
	`answers` text DEFAULT '{}' NOT NULL,
	`bookmarks` text DEFAULT '[]' NOT NULL,
	`flags` text DEFAULT '[]' NOT NULL,
	`started_at` integer NOT NULL,
	`last_activity_at` integer NOT NULL,
	`completed_at` integer,
	`time_spent_seconds` integer DEFAULT 0 NOT NULL,
	`show_explanations` integer DEFAULT 1 NOT NULL,
	`show_timer` integer DEFAULT 1 NOT NULL,
	`auto_advance` integer DEFAULT 0 NOT NULL,
	`metadata` text DEFAULT '{}',
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

-- Add new test_sessions table
CREATE TABLE IF NOT EXISTS `test_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`exam_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`time_limit_seconds` integer NOT NULL,
	`total_questions` integer NOT NULL,
	`passing_score` integer NOT NULL,
	`current_question_index` integer DEFAULT 0 NOT NULL,
	`answered_count` integer DEFAULT 0 NOT NULL,
	`flagged_count` integer DEFAULT 0 NOT NULL,
	`questions_order` text NOT NULL,
	`answers` text DEFAULT '{}' NOT NULL,
	`flagged` text DEFAULT '[]' NOT NULL,
	`started_at` integer NOT NULL,
	`last_activity_at` integer NOT NULL,
	`submitted_at` integer,
	`time_remaining_seconds` integer NOT NULL,
	`score` real,
	`correct_count` integer,
	`incorrect_count` integer,
	`unanswered_count` integer,
	`passed` integer,
	`last_auto_save_at` integer,
	`auto_save_count` integer DEFAULT 0 NOT NULL,
	`metadata` text DEFAULT '{}',
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS `study_sessions_user_idx` ON `study_sessions` (`user_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `study_sessions_exam_idx` ON `study_sessions` (`exam_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `study_sessions_status_idx` ON `study_sessions` (`status`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `study_sessions_user_exam_idx` ON `study_sessions` (`user_id`, `exam_id`);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS `test_sessions_user_idx` ON `test_sessions` (`user_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `test_sessions_exam_idx` ON `test_sessions` (`exam_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `test_sessions_status_idx` ON `test_sessions` (`status`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `test_sessions_user_exam_idx` ON `test_sessions` (`user_id`, `exam_id`);