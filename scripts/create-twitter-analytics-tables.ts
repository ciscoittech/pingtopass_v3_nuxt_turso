#!/usr/bin/env node
import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import { sql } from 'drizzle-orm'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

if (!process.env.TURSO_DB_URL) {
  console.error('❌ TURSO_DB_URL is not set in environment variables')
  process.exit(1)
}

const client = createClient({
  url: process.env.TURSO_DB_URL!,
  authToken: process.env.TURSO_DB_TOKEN
})

const db = drizzle(client)

async function createTwitterAnalyticsTables() {
  console.log('Creating Twitter Analytics tables...')

  try {
    // Create twitter_competitors table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS twitter_competitors (
        id TEXT PRIMARY KEY,
        handle TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        avatar_url TEXT,
        followers_count INTEGER DEFAULT 0,
        following_count INTEGER DEFAULT 0,
        tweet_count INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `)
    console.log('✅ Created twitter_competitors table')

    // Create competitor_metrics table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS competitor_metrics (
        id TEXT PRIMARY KEY,
        competitor_id TEXT NOT NULL,
        engagement_rate REAL DEFAULT 0,
        avg_likes REAL DEFAULT 0,
        avg_retweets REAL DEFAULT 0,
        avg_replies REAL DEFAULT 0,
        posts_per_day REAL DEFAULT 0,
        growth_rate REAL DEFAULT 0,
        sentiment_score REAL DEFAULT 0,
        recorded_at INTEGER NOT NULL,
        FOREIGN KEY (competitor_id) REFERENCES twitter_competitors(id) ON DELETE CASCADE
      )
    `)
    console.log('✅ Created competitor_metrics table')

    // Create content_insights table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS content_insights (
        id TEXT PRIMARY KEY,
        competitor_id TEXT,
        content_type TEXT NOT NULL,
        topic TEXT NOT NULL,
        performance_score REAL DEFAULT 0,
        engagement_rate REAL DEFAULT 0,
        reach INTEGER DEFAULT 0,
        sentiment REAL DEFAULT 0,
        best_time_to_post TEXT,
        hashtags TEXT,
        insights TEXT,
        recorded_at INTEGER NOT NULL,
        FOREIGN KEY (competitor_id) REFERENCES twitter_competitors(id) ON DELETE SET NULL
      )
    `)
    console.log('✅ Created content_insights table')

    // Create trending_topics table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS trending_topics (
        id TEXT PRIMARY KEY,
        topic TEXT NOT NULL,
        category TEXT,
        volume INTEGER DEFAULT 0,
        growth_rate REAL DEFAULT 0,
        sentiment REAL DEFAULT 0,
        relevance_score REAL DEFAULT 0,
        opportunities TEXT,
        created_at INTEGER NOT NULL,
        expires_at INTEGER
      )
    `)
    console.log('✅ Created trending_topics table')

    // Create strategy_recommendations table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS strategy_recommendations (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        priority TEXT NOT NULL,
        impact_score REAL DEFAULT 0,
        effort_score REAL DEFAULT 0,
        category TEXT NOT NULL,
        action_items TEXT,
        expected_results TEXT,
        status TEXT DEFAULT 'pending',
        created_at INTEGER NOT NULL,
        completed_at INTEGER
      )
    `)
    console.log('✅ Created strategy_recommendations table')

    // Create monitoring_jobs table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS monitoring_jobs (
        id TEXT PRIMARY KEY,
        job_type TEXT NOT NULL,
        target_handle TEXT,
        schedule TEXT NOT NULL,
        last_run INTEGER,
        next_run INTEGER,
        status TEXT DEFAULT 'active',
        config TEXT,
        created_at INTEGER NOT NULL
      )
    `)
    console.log('✅ Created monitoring_jobs table')

    // Create monitoring_alerts table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS monitoring_alerts (
        id TEXT PRIMARY KEY,
        job_id TEXT,
        alert_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        data TEXT,
        is_read INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (job_id) REFERENCES monitoring_jobs(id) ON DELETE CASCADE
      )
    `)
    console.log('✅ Created monitoring_alerts table')

    // Create indexes for better performance
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_competitor_metrics_competitor_id ON competitor_metrics(competitor_id)`)
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_competitor_metrics_recorded_at ON competitor_metrics(recorded_at)`)
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_content_insights_competitor_id ON content_insights(competitor_id)`)
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_content_insights_recorded_at ON content_insights(recorded_at)`)
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_trending_topics_created_at ON trending_topics(created_at)`)
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_strategy_recommendations_status ON strategy_recommendations(status)`)
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_job_id ON monitoring_alerts(job_id)`)
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_is_read ON monitoring_alerts(is_read)`)
    
    console.log('✅ Created all indexes')

    console.log('\n✨ All Twitter Analytics tables created successfully!')

  } catch (error) {
    console.error('❌ Error creating tables:', error)
    process.exit(1)
  }
}

// Run the migration
createTwitterAnalyticsTables()
  .then(() => {
    console.log('\n🎉 Migration completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  })