import { createClient } from '@libsql/client'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const db = createClient({
  url: process.env.TURSO_DB_URL!,
  authToken: process.env.TURSO_DB_TOKEN!,
})

async function setupTwitterTables() {
  console.log('Setting up Twitter Intelligence tables...')

  try {
    // Create twitter_competitors table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS twitter_competitors (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        name TEXT,
        followers_count INTEGER,
        following_count INTEGER,
        tweet_count INTEGER,
        verified INTEGER DEFAULT 0,
        description TEXT,
        category TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'medium',
        is_active INTEGER DEFAULT 1,
        added_at INTEGER NOT NULL DEFAULT (unixepoch()),
        last_analyzed INTEGER,
        last_metrics TEXT,
        tags TEXT,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `)
    console.log('✅ Created twitter_competitors table')

    // Create content_insights table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS content_insights (
        id TEXT PRIMARY KEY,
        tweet_id TEXT UNIQUE,
        content TEXT NOT NULL,
        author_username TEXT NOT NULL,
        author_name TEXT,
        metrics TEXT NOT NULL,
        insights TEXT NOT NULL,
        performance_score INTEGER NOT NULL,
        category TEXT,
        tags TEXT,
        recommendations TEXT,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        analyzed_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `)
    console.log('✅ Created content_insights table')

    // Create trending_topics table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS trending_topics (
        id TEXT PRIMARY KEY,
        topic TEXT NOT NULL,
        category TEXT NOT NULL,
        volume INTEGER,
        growth_rate REAL,
        sentiment TEXT,
        related_hashtags TEXT,
        opportunities TEXT,
        tracked_since INTEGER NOT NULL DEFAULT (unixepoch()),
        last_updated INTEGER NOT NULL DEFAULT (unixepoch()),
        is_active INTEGER DEFAULT 1
      )
    `)
    console.log('✅ Created trending_topics table')

    // Create twitter_analysis_runs table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS twitter_analysis_runs (
        id TEXT PRIMARY KEY,
        run_type TEXT NOT NULL,
        status TEXT NOT NULL,
        started_at INTEGER NOT NULL DEFAULT (unixepoch()),
        completed_at INTEGER,
        results TEXT,
        error TEXT,
        metadata TEXT
      )
    `)
    console.log('✅ Created twitter_analysis_runs table')

    // Create twitter_automation_rules table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS twitter_automation_rules (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        config TEXT NOT NULL,
        schedule TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        last_run INTEGER,
        next_run INTEGER,
        run_count INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `)
    console.log('✅ Created twitter_automation_rules table')

    // Add is_active column to vendors table if it doesn't exist
    try {
      await db.execute(`ALTER TABLE vendors ADD COLUMN is_active INTEGER DEFAULT 1`)
      console.log('✅ Added is_active column to vendors table')
    } catch (e) {
      // Column might already exist
      console.log('ℹ️  is_active column may already exist in vendors table')
    }

    console.log('\n✅ All Twitter Intelligence tables created successfully!')

  } catch (error) {
    console.error('❌ Error setting up tables:', error)
    throw error
  } finally {
    db.close()
  }
}

// Run the setup
setupTwitterTables().catch(console.error)