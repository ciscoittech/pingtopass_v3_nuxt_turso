import { StructuredOutputParser } from '@langchain/core/output_parsers'
import { BaseTwitterAgent } from './base'
import { z } from 'zod'
import type { CompetitorAnalysis, Tweet } from './types'

// Trend Analysis Schemas
const trendSchema = z.object({
  topic: z.string(),
  momentum: z.enum(['rising', 'stable', 'declining']),
  volume: z.number(),
  engagement_rate: z.number(),
  competitors_using: z.array(z.string()),
  example_content: z.array(z.string()),
  recommendation: z.string()
})

const emergingOpportunitySchema = z.object({
  opportunity: z.string(),
  description: z.string(),
  first_mover_advantage: z.enum(['high', 'medium', 'low']),
  implementation_difficulty: z.enum(['easy', 'medium', 'hard']),
  expected_impact: z.string(),
  action_items: z.array(z.string())
})

const trendReportSchema = z.object({
  trends: z.array(trendSchema),
  emerging_opportunities: z.array(emergingOpportunitySchema),
  seasonal_patterns: z.array(z.object({
    pattern: z.string(),
    timing: z.string(),
    preparation_needed: z.string()
  })),
  competitive_advantages: z.array(z.object({
    advantage: z.string(),
    how_to_leverage: z.string()
  }))
})

interface TrendsAgentInput {
  competitorAnalyses: CompetitorAnalysis[]
  historicalData?: {
    period: string
    trends: Array<{ topic: string; volume: number; date: string }>
  }
  industryContext?: string
}

interface TrendsAgentOutput {
  report: z.infer<typeof trendReportSchema>
  alerts: TrendAlert[]
  predictions: TrendPrediction[]
  cost: number
}

interface TrendAlert {
  type: 'opportunity' | 'threat' | 'competitor_move'
  urgency: 'high' | 'medium' | 'low'
  title: string
  description: string
  recommended_action: string
}

interface TrendPrediction {
  trend: string
  timeframe: string
  confidence: number
  rationale: string
  preparation_steps: string[]
}

export class TwitterTrendsAgent extends BaseTwitterAgent<TrendsAgentInput, TrendsAgentOutput> {
  private reportParser: StructuredOutputParser<z.infer<typeof trendReportSchema>>

  constructor(modelName?: string) {
    super(modelName || 'google/gemini-2.5-flash-preview-05-20', 0.7, 3500)
    this.reportParser = StructuredOutputParser.fromZodSchema(trendReportSchema)
  }

  getName(): string {
    return 'TwitterTrendsAgent'
  }

  getDescription(): string {
    return 'Detects and analyzes trends from competitor Twitter data to identify opportunities'
  }

  async process(input: TrendsAgentInput): Promise<TrendsAgentOutput> {
    console.log(`[${this.getName()}] Analyzing trends from ${input.competitorAnalyses.length} competitors`)

    // Generate trend report
    const report = await this.analyzeTrends(input)
    
    // Generate alerts based on trends
    const alerts = await this.generateAlerts(report, input)
    
    // Generate predictions
    const predictions = await this.generatePredictions(report, input)

    // Calculate cost
    const totalTokens = 5000 // Estimate
    const cost = this.calculateCost(totalTokens)

    return {
      report,
      alerts,
      predictions,
      cost
    }
  }

  private async analyzeTrends(input: TrendsAgentInput): Promise<z.infer<typeof trendReportSchema>> {
    const competitorContent = this.extractCompetitorContent(input.competitorAnalyses)
    const topicAnalysis = this.analyzeTopicFrequency(input.competitorAnalyses)
    
    const template = `
Analyze Twitter trends for the IT certification training industry based on competitor data:

COMPETITOR CONTENT ANALYSIS:
{competitorContent}

TOPIC FREQUENCY AND ENGAGEMENT:
{topicAnalysis}

INDUSTRY CONTEXT:
{industryContext}

{historicalContext}

Provide a comprehensive trend analysis including:

1. CURRENT TRENDS (8-10 items):
- Topic/theme name
- Momentum (rising/stable/declining)
- Volume (number of mentions)
- Average engagement rate
- Which competitors are using it
- Example content snippets
- Specific recommendation for leveraging this trend

2. EMERGING OPPORTUNITIES (3-5 items):
- New topics or approaches not widely adopted
- Description of the opportunity
- First-mover advantage level
- Implementation difficulty
- Expected impact
- Concrete action items

3. SEASONAL PATTERNS:
- Certification exam seasons
- Industry events and announcements
- Hiring cycles affecting cert demand

4. COMPETITIVE ADVANTAGES:
- Unique angles we could take
- How to differentiate from competitors

{formatInstructions}

Focus on actionable insights for IT certification content marketing.`

    const historicalContext = input.historicalData ? 
      `HISTORICAL TREND DATA:\n${this.formatHistoricalData(input.historicalData)}` : ''
    
    const formatInstructions = this.reportParser.getFormatInstructions()
    
    const prompt = this.buildPrompt(template, {
      competitorContent,
      topicAnalysis,
      industryContext: input.industryContext || 'IT certification training market',
      historicalContext,
      formatInstructions
    })

    const response = await this.callLLM(prompt)
    
    try {
      return await this.parseStructuredOutput(response, this.reportParser)
    } catch (error) {
      console.error(`[${this.getName()}] Failed to parse trend report:`, error)
      // Return minimal valid structure
      return {
        trends: [],
        emerging_opportunities: [],
        seasonal_patterns: [],
        competitive_advantages: []
      }
    }
  }

  private async generateAlerts(
    report: z.infer<typeof trendReportSchema>, 
    input: TrendsAgentInput
  ): Promise<TrendAlert[]> {
    const alerts: TrendAlert[] = []

    // Check for high-momentum rising trends
    report.trends
      .filter(t => t.momentum === 'rising' && t.engagement_rate > 5)
      .forEach(trend => {
        alerts.push({
          type: 'opportunity',
          urgency: trend.volume > 100 ? 'high' : 'medium',
          title: `Rising Trend: ${trend.topic}`,
          description: `${trend.topic} is gaining momentum with ${trend.engagement_rate.toFixed(1)}% engagement rate. ${trend.competitors_using.length} competitors are already leveraging this.`,
          recommended_action: trend.recommendation
        })
      })

    // Check for emerging opportunities
    report.emerging_opportunities
      .filter(opp => opp.first_mover_advantage === 'high')
      .forEach(opp => {
        alerts.push({
          type: 'opportunity',
          urgency: opp.implementation_difficulty === 'easy' ? 'high' : 'medium',
          title: `First-Mover Opportunity: ${opp.opportunity}`,
          description: opp.description,
          recommended_action: opp.action_items[0] || 'Investigate this opportunity immediately'
        })
      })

    // Check for competitive threats
    const dominantCompetitors = this.identifyDominantCompetitors(input.competitorAnalyses)
    if (dominantCompetitors.length > 0) {
      alerts.push({
        type: 'threat',
        urgency: 'medium',
        title: 'Competitor Dominance Alert',
        description: `${dominantCompetitors.join(', ')} are dominating key topics with high engagement rates`,
        recommended_action: 'Analyze their strategies and develop counter-positioning'
      })
    }

    return alerts
  }

  private async generatePredictions(
    report: z.infer<typeof trendReportSchema>,
    input: TrendsAgentInput
  ): Promise<TrendPrediction[]> {
    const predictions: TrendPrediction[] = []

    // Predict based on rising trends
    report.trends
      .filter(t => t.momentum === 'rising')
      .slice(0, 3)
      .forEach(trend => {
        predictions.push({
          trend: trend.topic,
          timeframe: '2-4 weeks',
          confidence: 0.75,
          rationale: `Based on ${trend.volume} mentions and ${trend.engagement_rate.toFixed(1)}% engagement, this trend is likely to continue growing`,
          preparation_steps: [
            `Create content strategy around ${trend.topic}`,
            'Prepare educational materials and tips',
            'Identify relevant hashtags and communities',
            'Schedule content for optimal times'
          ]
        })
      })

    // Predict based on seasonal patterns
    report.seasonal_patterns.forEach(pattern => {
      predictions.push({
        trend: pattern.pattern,
        timeframe: pattern.timing,
        confidence: 0.85,
        rationale: 'Historical seasonal pattern with consistent occurrence',
        preparation_steps: [pattern.preparation_needed]
      })
    })

    return predictions
  }

  private extractCompetitorContent(analyses: CompetitorAnalysis[]): string {
    return analyses.map(a => {
      const topTweets = a.metrics.top_performing_tweets.slice(0, 3)
      const themes = a.content_themes.slice(0, 5).join(', ')
      
      return `@${a.user.username}:
- Main themes: ${themes}
- Engagement rate: ${a.metrics.engagement_rate.toFixed(1)}%
- Top content: ${topTweets.map(t => `"${t.text.substring(0, 50)}..."`).join('; ')}`
    }).join('\n\n')
  }

  private analyzeTopicFrequency(analyses: CompetitorAnalysis[]): string {
    const topicMap = new Map<string, { count: number; totalEngagement: number; users: Set<string> }>()
    
    analyses.forEach(analysis => {
      analysis.content_themes.forEach(theme => {
        const existing = topicMap.get(theme) || { count: 0, totalEngagement: 0, users: new Set() }
        existing.count++
        existing.totalEngagement += analysis.metrics.engagement_rate
        existing.users.add(analysis.user.username)
        topicMap.set(theme, existing)
      })
    })

    return Array.from(topicMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 15)
      .map(([topic, data]) => 
        `${topic}: ${data.count} mentions, ${(data.totalEngagement / data.count).toFixed(1)}% avg engagement, used by ${Array.from(data.users).join(', ')}`
      )
      .join('\n')
  }

  private formatHistoricalData(historicalData: TrendsAgentInput['historicalData']): string {
    if (!historicalData) return ''
    
    const trendSummary = historicalData.trends
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10)
      .map(t => `${t.topic}: ${t.volume} mentions on ${t.date}`)
      .join('\n')
    
    return `Period: ${historicalData.period}\nTop trends:\n${trendSummary}`
  }

  private identifyDominantCompetitors(analyses: CompetitorAnalysis[]): string[] {
    return analyses
      .filter(a => a.metrics.engagement_rate > 10 && a.user.followers_count > 5000)
      .map(a => `@${a.user.username}`)
      .slice(0, 3)
  }
}