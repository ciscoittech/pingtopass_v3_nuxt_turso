import type { 
  CompetitorAnalysis, 
  CompetitorInsight, 
  StrategyRecommendation,
  ContentOpportunity,
  Benchmark,
  Tweet
} from '../../agents/twitter/types'

export interface TwitterWorkflowState {
  // Input
  competitorUsernames: string[]
  includeRecommendations: boolean
  
  // Twitter API Data
  twitterData: Map<string, {
    user: any
    tweets: Tweet[]
  }>
  
  // Analysis Results
  competitorAnalyses: CompetitorAnalysis[]
  insights: CompetitorInsight[]
  recommendations: StrategyRecommendation[]
  benchmarks: Benchmark[]
  opportunities: ContentOpportunity | null
  
  // Trend Analysis
  trendReport: any
  alerts: any[]
  predictions: any[]
  
  // Metadata
  totalCost: number
  errors: string[]
  retries: number
  workflowSteps: string[]
  startTime: number
  endTime: number | null
}