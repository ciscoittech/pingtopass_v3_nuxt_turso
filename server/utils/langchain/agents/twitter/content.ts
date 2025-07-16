import { StructuredOutputParser } from '@langchain/core/output_parsers'
import { BaseTwitterAgent } from './base'
import { 
  strategyRecommendationSchema,
  contentOpportunitySchema,
  type StrategyRecommendation,
  type ContentOpportunity,
  type CompetitorAnalysis
} from './types'
import { z } from 'zod'

interface ContentAgentInput {
  competitorAnalyses: CompetitorAnalysis[]
  currentPerformance?: {
    followers: number
    engagement_rate: number
    posting_frequency: number
  }
  focusAreas?: string[]
}

interface ContentAgentOutput {
  recommendations: StrategyRecommendation[]
  opportunities: ContentOpportunity
  contentCalendar: ContentCalendarItem[]
  cost: number
}

interface ContentCalendarItem {
  date: string
  time: string
  contentType: string
  topic: string
  hashtags: string[]
  expectedEngagement: 'high' | 'medium' | 'low'
}

const contentCalendarSchema = z.object({
  calendar: z.array(z.object({
    date: z.string(),
    time: z.string(),
    contentType: z.string(),
    topic: z.string(),
    hashtags: z.array(z.string()),
    expectedEngagement: z.enum(['high', 'medium', 'low'])
  }))
})

export class TwitterContentAgent extends BaseTwitterAgent<ContentAgentInput, ContentAgentOutput> {
  private recommendationsParser: StructuredOutputParser<{ recommendations: StrategyRecommendation[] }>
  private opportunitiesParser: StructuredOutputParser<z.infer<typeof contentOpportunitySchema>>
  private calendarParser: StructuredOutputParser<z.infer<typeof contentCalendarSchema>>

  constructor(modelName?: string) {
    super(modelName || 'google/gemini-2.5-flash-preview-05-20', 0.8, 4000)
    this.recommendationsParser = StructuredOutputParser.fromZodSchema(
      z.object({ recommendations: z.array(strategyRecommendationSchema) })
    )
    this.opportunitiesParser = StructuredOutputParser.fromZodSchema(contentOpportunitySchema)
    this.calendarParser = StructuredOutputParser.fromZodSchema(contentCalendarSchema)
  }

  getName(): string {
    return 'TwitterContentAgent'
  }

  getDescription(): string {
    return 'Generates content strategy recommendations and identifies opportunities based on competitor analysis'
  }

  async process(input: ContentAgentInput): Promise<ContentAgentOutput> {
    console.log(`[${this.getName()}] Generating content strategy for ${input.competitorAnalyses.length} competitors`)

    // Generate strategy recommendations
    const recommendations = await this.generateRecommendations(input)
    
    // Identify content opportunities
    const opportunities = await this.identifyOpportunities(input)
    
    // Create content calendar
    const contentCalendar = await this.generateContentCalendar(input, opportunities)

    // Calculate total cost
    const totalTokens = 6000 // Estimate
    const cost = this.calculateCost(totalTokens)

    return {
      recommendations,
      opportunities,
      contentCalendar,
      cost
    }
  }

  private async generateRecommendations(input: ContentAgentInput): Promise<StrategyRecommendation[]> {
    const competitorSummary = this.summarizeCompetitors(input.competitorAnalyses)
    
    const template = `
Analyze these competitor strategies and generate content recommendations for an IT certification training company:

COMPETITOR SUMMARY:
{competitorSummary}

OUR CURRENT PERFORMANCE:
{currentPerformance}

FOCUS AREAS:
{focusAreas}

Generate 6-8 actionable content strategy recommendations covering:
1. Content types and formats that drive engagement
2. Optimal posting times and frequency
3. Hashtag strategies for reach
4. Engagement tactics that work
5. Audience growth strategies

For each recommendation provide:
- Category (content/timing/hashtags/engagement/audience)
- Clear, actionable title
- Detailed description with rationale
- Priority (high/medium/low) based on impact
- Effort required (high/medium/low)
- Expected impact with metrics
- 4-6 specific implementation steps
- Success metrics to track
- Realistic timeline
- Budget requirements

{formatInstructions}

Generate recommendations that are specific to the IT certification industry.`

    const formatInstructions = this.recommendationsParser.getFormatInstructions()
    
    const prompt = this.buildPrompt(template, {
      competitorSummary,
      currentPerformance: this.formatCurrentPerformance(input.currentPerformance),
      focusAreas: input.focusAreas?.join(', ') || 'General improvement',
      formatInstructions
    })

    const response = await this.callLLM(prompt)
    
    try {
      const parsed = await this.parseStructuredOutput(response, this.recommendationsParser)
      return parsed.recommendations
    } catch (error) {
      console.error(`[${this.getName()}] Failed to parse recommendations:`, error)
      return []
    }
  }

  private async identifyOpportunities(input: ContentAgentInput): Promise<ContentOpportunity> {
    const template = `
Based on these competitor analyses, identify content opportunities for IT certification training:

COMPETITOR THEMES AND PERFORMANCE:
{themeAnalysis}

TOP PERFORMING CONTENT:
{topContent}

Analyze and provide:

1. TRENDING THEMES (top 10):
- Themes competitors are using frequently
- Average engagement rate for each theme
- Sort by engagement potential

2. CONTENT GAPS (top 5):
- Topics competitors aren't covering well
- Opportunity description
- Implementation difficulty

3. VIRAL PATTERNS (top 3):
- Content patterns that consistently go viral
- Examples from competitor tweets
- Success rate (0-1)

{formatInstructions}

Focus on actionable opportunities specific to IT certification content.`

    const themeAnalysis = this.analyzeThemes(input.competitorAnalyses)
    const topContent = this.extractTopContent(input.competitorAnalyses)
    const formatInstructions = this.opportunitiesParser.getFormatInstructions()
    
    const prompt = this.buildPrompt(template, {
      themeAnalysis,
      topContent,
      formatInstructions
    })

    const response = await this.callLLM(prompt)
    
    try {
      return await this.parseStructuredOutput(response, this.opportunitiesParser)
    } catch (error) {
      console.error(`[${this.getName()}] Failed to parse opportunities:`, error)
      // Return default structure
      return {
        trending_themes: [],
        content_gaps: [],
        viral_patterns: []
      }
    }
  }

  private async generateContentCalendar(
    input: ContentAgentInput, 
    opportunities: ContentOpportunity
  ): Promise<ContentCalendarItem[]> {
    const template = `
Create a 7-day content calendar for an IT certification training company based on these insights:

TRENDING THEMES:
{trendingThemes}

CONTENT OPPORTUNITIES:
{opportunities}

BEST POSTING TIMES:
{bestTimes}

Generate a content calendar with:
- One post per day for 7 days
- Variety of content types (tips, questions, insights, news, etc.)
- Optimal posting times based on competitor analysis
- Relevant hashtags (3-5 per post)
- Expected engagement level

Each calendar item should include:
- date: ISO date string
- time: 24-hour format (e.g., "14:00")
- contentType: Type of content
- topic: Specific topic/title
- hashtags: Array of relevant hashtags
- expectedEngagement: high/medium/low

{formatInstructions}

Make content specific to IT certifications like CompTIA, Cisco, AWS, etc.`

    const trendingThemes = opportunities.trending_themes
      .slice(0, 5)
      .map(t => `${t.theme} (engagement: ${t.engagement.toFixed(1)})`)
      .join('\n')
    
    const bestTimes = this.extractBestTimes(input.competitorAnalyses)
    const formatInstructions = this.calendarParser.getFormatInstructions()
    
    const prompt = this.buildPrompt(template, {
      trendingThemes,
      opportunities: opportunities.content_gaps.map(g => g.gap).join(', '),
      bestTimes,
      formatInstructions
    })

    const response = await this.callLLM(prompt)
    
    try {
      const parsed = await this.parseStructuredOutput(response, this.calendarParser)
      return parsed.calendar
    } catch (error) {
      console.error(`[${this.getName()}] Failed to parse calendar:`, error)
      return []
    }
  }

  private summarizeCompetitors(analyses: CompetitorAnalysis[]): string {
    return analyses.map(a => `
@${a.user.username} (${a.user.followers_count} followers):
- Engagement Rate: ${a.metrics.engagement_rate.toFixed(1)}%
- Posting Frequency: ${a.metrics.posting_frequency.toFixed(1)}/day
- Top Themes: ${a.content_themes.slice(0, 3).join(', ')}
- Best Times: ${a.posting_patterns.best_times.slice(0, 3).join(', ')}`
    ).join('\n')
  }

  private formatCurrentPerformance(performance?: ContentAgentInput['currentPerformance']): string {
    if (!performance) return 'No current performance data provided'
    
    return `
- Followers: ${performance.followers}
- Engagement Rate: ${performance.engagement_rate.toFixed(1)}%
- Posting Frequency: ${performance.posting_frequency.toFixed(1)}/day`
  }

  private analyzeThemes(analyses: CompetitorAnalysis[]): string {
    const themeMap = new Map<string, { count: number; totalEngagement: number }>()
    
    analyses.forEach(analysis => {
      analysis.content_themes.forEach(theme => {
        const existing = themeMap.get(theme) || { count: 0, totalEngagement: 0 }
        themeMap.set(theme, {
          count: existing.count + 1,
          totalEngagement: existing.totalEngagement + analysis.metrics.engagement_rate
        })
      })
    })

    return Array.from(themeMap.entries())
      .map(([theme, data]) => `${theme}: used by ${data.count} competitors, avg engagement ${(data.totalEngagement / data.count).toFixed(1)}%`)
      .join('\n')
  }

  private extractTopContent(analyses: CompetitorAnalysis[]): string {
    const allTweets = analyses.flatMap(a => a.metrics.top_performing_tweets)
    const topTweets = allTweets
      .sort((a, b) => (b.public_metrics?.like_count || 0) - (a.public_metrics?.like_count || 0))
      .slice(0, 5)
    
    return topTweets.map((tweet, i) => 
      `${i + 1}. "${tweet.text.substring(0, 100)}..." - ${tweet.public_metrics?.like_count || 0} likes`
    ).join('\n')
  }

  private extractBestTimes(analyses: CompetitorAnalysis[]): string {
    const allTimes = analyses.flatMap(a => a.posting_patterns.best_times)
    const timeFrequency = new Map<string, number>()
    
    allTimes.forEach(time => {
      timeFrequency.set(time, (timeFrequency.get(time) || 0) + 1)
    })
    
    return Array.from(timeFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([time, count]) => `${time} (${count} competitors)`)
      .join(', ')
  }
}