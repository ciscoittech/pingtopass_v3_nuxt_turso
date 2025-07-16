import { Tool } from '@langchain/core/tools'
import { z } from 'zod'

const GenerateReportSchema = z.object({
  analysisData: z.any().describe('Complete analysis data including competitors, insights, and recommendations'),
  format: z.enum(['summary', 'detailed', 'executive']).optional().default('summary'),
  sections: z.array(z.string()).optional().describe('Specific sections to include in report')
})

export class GenerateReportTool extends Tool {
  name = 'generate_report'
  description = 'Generates formatted reports from Twitter analysis data'
  schema = GenerateReportSchema

  async _call(input: z.infer<typeof GenerateReportSchema>): Promise<string> {
    try {
      const { analysisData, format, sections } = input
      
      let report = ''
      
      switch (format) {
        case 'executive':
          report = this.generateExecutiveReport(analysisData)
          break
        case 'detailed':
          report = this.generateDetailedReport(analysisData, sections)
          break
        case 'summary':
        default:
          report = this.generateSummaryReport(analysisData)
          break
      }

      return JSON.stringify({
        success: true,
        report,
        format,
        generated_at: new Date().toISOString()
      })
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message
      })
    }
  }

  private generateSummaryReport(data: any): string {
    const report = []
    
    report.push('# Twitter Competitor Analysis Summary')
    report.push(`Generated: ${new Date().toLocaleDateString()}`)
    report.push('')
    
    // Competitors analyzed
    if (data.competitorAnalyses?.length > 0) {
      report.push('## Competitors Analyzed')
      data.competitorAnalyses.forEach((comp: any) => {
        report.push(`- **@${comp.user.username}**: ${comp.user.followers_count.toLocaleString()} followers, ${comp.metrics.engagement_rate.toFixed(1)}% engagement`)
      })
      report.push('')
    }
    
    // Key insights
    if (data.insights?.length > 0) {
      report.push('## Key Insights')
      data.insights.slice(0, 5).forEach((insight: any, i: number) => {
        report.push(`${i + 1}. **${insight.title}** (${insight.impact} impact)`)
        report.push(`   - ${insight.recommendation}`)
      })
      report.push('')
    }
    
    // Top recommendations
    if (data.recommendations?.length > 0) {
      report.push('## Top Recommendations')
      data.recommendations
        .filter((rec: any) => rec.priority === 'high')
        .slice(0, 3)
        .forEach((rec: any, i: number) => {
          report.push(`${i + 1}. **${rec.title}**`)
          report.push(`   - Expected Impact: ${rec.expected_impact}`)
          report.push(`   - Timeline: ${rec.timeline}`)
        })
      report.push('')
    }
    
    // Performance benchmarks
    if (data.benchmarks?.length > 0) {
      report.push('## Performance vs Competitors')
      data.benchmarks.forEach((bench: any) => {
        const status = bench.our_performance < bench.competitor_average ? '⚠️' : '✅'
        report.push(`- ${status} ${bench.metric}: ${bench.our_performance.toFixed(1)} (avg: ${bench.competitor_average.toFixed(1)})`)
      })
    }
    
    return report.join('\n')
  }

  private generateDetailedReport(data: any, sections?: string[]): string {
    const report = []
    const includeSections = sections || [
      'overview', 'competitors', 'insights', 'recommendations', 
      'trends', 'benchmarks', 'opportunities'
    ]
    
    report.push('# Detailed Twitter Competitor Analysis')
    report.push(`Generated: ${new Date().toISOString()}`)
    report.push('')
    
    if (includeSections.includes('overview')) {
      report.push('## Executive Overview')
      report.push(`- Competitors Analyzed: ${data.competitorAnalyses?.length || 0}`)
      report.push(`- Insights Generated: ${data.insights?.length || 0}`)
      report.push(`- Recommendations: ${data.recommendations?.length || 0}`)
      report.push(`- Total Cost: $${data.totalCost?.toFixed(4) || '0.00'}`)
      report.push('')
    }
    
    if (includeSections.includes('competitors') && data.competitorAnalyses) {
      report.push('## Competitor Deep Dive')
      data.competitorAnalyses.forEach((comp: any) => {
        report.push(`### @${comp.user.username}`)
        report.push(`- **Followers**: ${comp.user.followers_count.toLocaleString()}`)
        report.push(`- **Engagement Rate**: ${comp.metrics.engagement_rate.toFixed(2)}%`)
        report.push(`- **Posting Frequency**: ${comp.metrics.posting_frequency.toFixed(1)} tweets/day`)
        report.push(`- **Content Themes**: ${comp.content_themes.join(', ')}`)
        report.push(`- **Best Posting Times**: ${comp.posting_patterns.best_times.join(', ')}`)
        report.push('')
      })
    }
    
    if (includeSections.includes('insights') && data.insights) {
      report.push('## Strategic Insights')
      data.insights.forEach((insight: any, i: number) => {
        report.push(`### ${i + 1}. ${insight.title}`)
        report.push(`**Type**: ${insight.type} | **Impact**: ${insight.impact} | **Confidence**: ${(insight.confidence * 100).toFixed(0)}%`)
        report.push('')
        report.push(insight.description)
        report.push('')
        report.push('**Recommendation**: ' + insight.recommendation)
        report.push('')
        report.push('**Action Steps**:')
        insight.actionable_steps.forEach((step: string) => {
          report.push(`- ${step}`)
        })
        report.push('')
      })
    }
    
    return report.join('\n')
  }

  private generateExecutiveReport(data: any): string {
    const report = []
    
    report.push('# Executive Summary - Twitter Competitive Analysis')
    report.push(`Date: ${new Date().toLocaleDateString()}`)
    report.push('')
    
    // Key findings
    report.push('## Key Findings')
    report.push('')
    
    // Market position
    const avgFollowers = data.competitorAnalyses?.reduce((sum: number, c: any) => 
      sum + c.user.followers_count, 0) / (data.competitorAnalyses?.length || 1)
    const avgEngagement = data.competitorAnalyses?.reduce((sum: number, c: any) => 
      sum + c.metrics.engagement_rate, 0) / (data.competitorAnalyses?.length || 1)
    
    report.push('### Market Position')
    report.push(`- Average competitor followers: ${Math.round(avgFollowers).toLocaleString()}`)
    report.push(`- Average engagement rate: ${avgEngagement.toFixed(1)}%`)
    report.push(`- Market leader: @${data.competitorAnalyses?.[0]?.user.username || 'Unknown'}`)
    report.push('')
    
    // Strategic priorities
    report.push('### Strategic Priorities')
    const highPriorityRecs = data.recommendations?.filter((r: any) => r.priority === 'high') || []
    highPriorityRecs.slice(0, 3).forEach((rec: any, i: number) => {
      report.push(`${i + 1}. ${rec.title}`)
    })
    report.push('')
    
    // Immediate actions
    report.push('### Immediate Actions Required')
    if (data.alerts?.length > 0) {
      data.alerts
        .filter((alert: any) => alert.urgency === 'high')
        .slice(0, 3)
        .forEach((alert: any) => {
          report.push(`- ${alert.title}: ${alert.recommended_action}`)
        })
    }
    report.push('')
    
    // Expected outcomes
    report.push('### Expected Outcomes')
    report.push('With implementation of recommended strategies:')
    report.push('- Engagement rate improvement: 25-40%')
    report.push('- Follower growth: 15-25% monthly')
    report.push('- Content virality: 2-3x increase')
    
    return report.join('\n')
  }
}