CREATE TABLE `chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`session_id` text,
	`role` text,
	`content` text,
	`created_at` text DEFAULT datetime('now'),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `chat_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`title` text,
	`context` text,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT datetime('now'),
	`updated_at` text DEFAULT datetime('now'),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `exams` (
	`id` text PRIMARY KEY NOT NULL,
	`vendor_id` text NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`passing_score` integer,
	`time_limit_minutes` integer,
	`difficulty` text DEFAULT 'intermediate',
	`is_beta` integer DEFAULT false,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `objectives` (
	`id` text PRIMARY KEY NOT NULL,
	`exam_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`weight` real,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `achievements` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`icon` text,
	`points` integer DEFAULT 0,
	`requirement_type` text,
	`requirement_value` integer,
	`created_at` text DEFAULT datetime('now')
);
--> statement-breakpoint
CREATE UNIQUE INDEX `achievements_name_unique` ON `achievements` (`name`);--> statement-breakpoint
CREATE TABLE `learning_path_exams` (
	`id` text PRIMARY KEY NOT NULL,
	`path_id` text,
	`exam_id` text,
	`order_index` integer,
	`is_required` integer DEFAULT true,
	FOREIGN KEY (`path_id`) REFERENCES `learning_paths`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `learning_paths` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`difficulty` text DEFAULT 'intermediate',
	`estimated_hours` integer,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT datetime('now')
);
--> statement-breakpoint
CREATE TABLE `user_badges` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`achievement_id` text,
	`earned_at` text DEFAULT datetime('now'),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`achievement_id`) REFERENCES `achievements`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`full_name` text,
	`google_id` text,
	`is_active` integer DEFAULT true,
	`is_admin` integer DEFAULT false,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_google_id_unique` ON `users` (`google_id`);--> statement-breakpoint
CREATE TABLE `vendors` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`website` text,
	`logo_url` text,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vendors_name_unique` ON `vendors` (`name`);--> statement-breakpoint
CREATE TABLE `answers` (
	`id` text PRIMARY KEY NOT NULL,
	`question_id` text NOT NULL,
	`answer_text` text NOT NULL,
	`is_correct` integer DEFAULT false,
	`order_index` integer DEFAULT 0,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` text PRIMARY KEY NOT NULL,
	`objective_id` text NOT NULL,
	`question_text` text NOT NULL,
	`question_type` text NOT NULL,
	`difficulty` integer DEFAULT 3,
	`explanation` text,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`objective_id`) REFERENCES `objectives`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `study_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`exam_id` text,
	`started_at` text DEFAULT datetime('now'),
	`last_activity` text DEFAULT datetime('now'),
	`questions_answered` integer DEFAULT 0,
	`correct_answers` integer DEFAULT 0,
	`total_time_seconds` integer DEFAULT 0,
	`is_active` integer DEFAULT true,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `test_responses` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`question_id` text NOT NULL,
	`selected_answer_id` text,
	`is_correct` integer DEFAULT false,
	`time_spent_seconds` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`session_id`) REFERENCES `test_sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`selected_answer_id`) REFERENCES `answers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `test_session_questions` (
	`id` text PRIMARY KEY DEFAULT lower(hex(randomblob(16))) NOT NULL,
	`session_id` text NOT NULL,
	`question_id` text NOT NULL,
	`question_order` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`session_id`) REFERENCES `test_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `test_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`exam_id` text NOT NULL,
	`session_type` text NOT NULL,
	`score` real DEFAULT 0,
	`passed` integer DEFAULT false,
	`time_spent_seconds` integer,
	`completed` integer DEFAULT false,
	`started_at` text DEFAULT CURRENT_TIMESTAMP,
	`completed_at` text,
	`status` text DEFAULT 'in_progress',
	`start_time` text DEFAULT CURRENT_TIMESTAMP,
	`end_time` text,
	`time_limit_minutes` integer DEFAULT 90,
	`questions_count` integer DEFAULT 0,
	`questions_answered` integer DEFAULT 0,
	`question_ids` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`score_percentage` real DEFAULT 0,
	`passing_score` real DEFAULT 70,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `question_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`question_id` text,
	`user_id` text,
	`selected_answer_id` text,
	`is_correct` integer,
	`time_spent_seconds` integer,
	`attempt_number` integer DEFAULT 1,
	`created_at` text DEFAULT datetime('now'),
	FOREIGN KEY (`session_id`) REFERENCES `study_sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `study_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`question_id` text NOT NULL,
	`exam_id` text,
	`objective_id` text,
	`times_seen` integer DEFAULT 0,
	`times_correct` integer DEFAULT 0,
	`last_seen` text,
	`mastery_level` integer DEFAULT 0,
	`is_study_mode` integer DEFAULT true,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`objective_id`) REFERENCES `objectives`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`objective_id` text NOT NULL,
	`exam_id` text NOT NULL,
	`questions_seen` integer DEFAULT 0,
	`questions_correct` integer DEFAULT 0,
	`total_questions` integer DEFAULT 0,
	`attempted_questions` integer DEFAULT 0,
	`correct_answers` integer DEFAULT 0,
	`accuracy_rate` real DEFAULT 0,
	`mastery_level` real DEFAULT 0,
	`mastery_level_text` text DEFAULT 'beginner',
	`last_studied` text,
	`last_activity` text DEFAULT CURRENT_TIMESTAMP,
	`current_streak` integer DEFAULT 0,
	`best_streak` integer DEFAULT 0,
	`last_streak_date` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`objective_id`) REFERENCES `objectives`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `twitter_engagement_queue` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`action` text NOT NULL,
	`status` text DEFAULT 'pending',
	`scheduled_for` text,
	`processed_at` text,
	`error` text,
	`retry_count` integer DEFAULT 0,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `twitter_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`content` text NOT NULL,
	`author_username` text,
	`author_name` text,
	`likes` integer DEFAULT 0,
	`retweets` integer DEFAULT 0,
	`replies` integer DEFAULT 0,
	`views` integer DEFAULT 0,
	`posted_at` text,
	`scraped_at` text DEFAULT CURRENT_TIMESTAMP,
	`engagement_score` real DEFAULT 0,
	`hashtags` text,
	`mentions` text,
	`urls` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `twitter_posts_post_id_unique` ON `twitter_posts` (`post_id`);--> statement-breakpoint
CREATE TABLE `twitter_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`display_name` text,
	`bio` text,
	`followers` integer DEFAULT 0,
	`following` integer DEFAULT 0,
	`tweets_count` integer DEFAULT 0,
	`verified` integer DEFAULT false,
	`profile_image_url` text,
	`last_scraped` text DEFAULT CURRENT_TIMESTAMP,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `twitter_profiles_username_unique` ON `twitter_profiles` (`username`);