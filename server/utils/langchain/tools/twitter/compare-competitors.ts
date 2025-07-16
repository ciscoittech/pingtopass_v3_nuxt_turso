import { Tool } from '@langchain/core/tools'
import { z } from 'zod'
import type { CompetitorAnalysis } from '../../agents/twitter/types'

const CompareCompetitorsSchema = z.object({
  analyses: z.array(z.any()).describe('Array of competitor analysis objects'),
  metrics: z.array(z.string()).optional().describe('Specific metrics to compare')
})

export class CompareCompetitorsTool extends Tool {
  name = 'compare_competitors'
  description = 'Compares multiple competitors across various metrics and identifies leaders'
  schema = CompareCompetitorsSchema

  async _call(input: z.infer<typeof CompareCompetitorsSchema>): Promise<string> {
    try {
      const analyses = input.analyses as CompetitorAnalysis[]
      const metricsToCompare = input.metrics || [
        'followers', 'engagement_rate', 'posting_frequency', 'avg_likes'
      ]

      if (analyses.length === 0) {
        return JSON.stringify({
          success: false,
          error: 'No competitor analyses provided'
        })
      }

      // Create comparison matrix
      const comparison: Record<string, any> = {}
      const rankings: Record<string, string[]> = {}

      metricsToCompare.forEach(metric => {
        const values = analyses.map(analysis => {
          let value = 0
          let displayValue = ''
          
          switch (metric) {
            case 'followers':
              value = analysis.user.followers_count
              displayValue = value.toLocaleString()
              break
            case 'engagement_rate':
              value = analysis.metrics.engagement_rate
              displayValue = `${value.toFixed(2)}%`
              break
            case 'posting_frequency':
              value = analysis.metrics.posting_frequency
              displayValue = `${value.toFixed(1)}/day`
              break
            case 'avg_likes':
              value = analysis.metrics.avg_likes
              displayValue = value.toFixed(0)
              break
            case 'avg_retweets':
              value = analysis.metrics.avg_retweets
              displayValue = value.toFixed(0)
              break
            case 'consistency':
              value = analysis.posting_patterns.consistency_score
              displayValue = `${value}%`
              break
          }

          return {
            username: analysis.user.username,
            value,
            displayValue
          }
        })

        // Sort by value (descending)
        const sorted = [...values].sort((a, b) => b.value - a.value)
        
        comparison[metric] = sorted
        rankings[metric] = sorted.map(item => item.username)
      })

      // Calculate overall leader
      const leaderboard: Record<string, number> = {}
      
      Object.values(rankings).forEach(ranking => {
        ranking.forEach((username, index) => {
          leaderboard[username] = (leaderboard[username] || 0) + (analyses.length - index)
        })
      })

      const overallRanking = Object.entries(leaderboard)
        .sort((a, b) => b[1] - a[1])
        .map(([username, score]) => ({ username, score }))

      // Identify strengths and weaknesses
      const insights: any[] = []
      
      // Find dominant competitors
      const dominantMetrics: Record<string, string[]> = {}
      Object.entries(rankings).forEach(([metric, ranking]) => {
        const leader = ranking[0]
        if (!dominantMetrics[leader]) {
          dominantMetrics[leader] = []
        }
        dominantMetrics[leader].push(metric)
      })

      Object.entries(dominantMetrics).forEach(([username, metrics]) => {
        if (metrics.length >= 2) {
          insights.push({
            type: 'dominance',
            competitor: username,
            message: `@${username} leads in ${metrics.join(', ')}`,
            metrics
          })
        }
      })

      // Find opportunities (metrics where top performer is significantly ahead)
      Object.entries(comparison).forEach(([metric, values]) => {
        const topValue = values[0].value
        const avgValue = values.reduce((sum: number, v: any) => sum + v.value, 0) / values.length
        
        if (topValue > avgValue * 1.5) {
          insights.push({
            type: 'opportunity',
            metric,
            message: `Large gap in ${metric}: top performer has ${values[0].displayValue} vs avg ${(avgValue).toFixed(1)}`,
            leader: values[0].username,
            gap_percentage: ((topValue - avgValue) / avgValue * 100).toFixed(0)
          })
        }
      })

      return JSON.stringify({
        success: true,
        comparison,
        overall_ranking: overallRanking,
        insights,
        summary: {
          total_competitors: analyses.length,
          metrics_compared: metricsToCompare.length,
          clear_leader: overallRanking[0].username,
          most_competitive_metric: Object.entries(comparison)
            .map(([metric, values]) => {
              const variance = this.calculateVariance(values.map((v: any) => v.value))
              return { metric, variance }
            })
            .sort((a, b) => a.variance - b.variance)[0].metric
        }
      })
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message
      })
    }
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2))
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length
  }
}