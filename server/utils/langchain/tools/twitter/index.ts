export { FetchTweetsTool } from './fetch-tweets'
export { AnalyzeMetricsTool } from './analyze-metrics'
export { CompareCompetitorsTool } from './compare-competitors'
export { GenerateReportTool } from './generate-report'

// Re-export all tools as an array for easy registration
import { FetchTweetsTool } from './fetch-tweets'
import { AnalyzeMetricsTool } from './analyze-metrics'
import { CompareCompetitorsTool } from './compare-competitors'
import { GenerateReportTool } from './generate-report'

export const twitterTools = [
  FetchTweetsTool,
  AnalyzeMetricsTool,
  CompareCompetitorsTool,
  GenerateReportTool
]