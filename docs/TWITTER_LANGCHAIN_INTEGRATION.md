# Twitter Intelligence System - LangChain Integration

## Overview

The Twitter Intelligence System has been refactored to leverage LangChain, LangGraph, and LangSmith for improved observability, reliability, and maintainability.

## Architecture

### 1. LangChain Agents

We've created specialized agents for different aspects of Twitter analysis:

#### TwitterCompetitorAgent
- **Purpose**: Analyzes individual competitor Twitter accounts
- **Input**: Username, tweets, user info
- **Output**: Competitor analysis, insights, cost tracking
- **Location**: `/server/utils/langchain/agents/twitter/competitor.ts`

#### TwitterContentAgent
- **Purpose**: Generates content strategy recommendations
- **Input**: Multiple competitor analyses
- **Output**: Strategy recommendations, content opportunities, content calendar
- **Location**: `/server/utils/langchain/agents/twitter/content.ts`

#### TwitterTrendsAgent
- **Purpose**: Detects and analyzes trends across competitors
- **Input**: Competitor analyses, historical data
- **Output**: Trend report, alerts, predictions
- **Location**: `/server/utils/langchain/agents/twitter/trends.ts`

### 2. LangGraph Workflow

The `TwitterAnalysisWorkflow` orchestrates the entire analysis process:

```
Fetch Twitter Data → Analyze Competitors → Generate Insights 
    ↓                                           ↓
    → Generate Recommendations (optional) → Analyze Trends
                                               ↓
                                        Calculate Benchmarks
```

**Features**:
- Parallel processing of competitors
- Conditional recommendation generation
- Error handling and retry logic
- Cost tracking across all operations
- State management for progress tracking

### 3. LangSmith Observability

All Twitter operations are traced with LangSmith when enabled:

- **Trace Metadata**: Workflow type, competitors, settings
- **Tags**: twitter, competitor-analysis, langchain
- **Cost Tracking**: Per-operation cost analysis
- **Performance Metrics**: Execution time, token usage

## API Endpoints

### New LangChain Endpoint

**POST** `/api/admin/twitter/analyze-langchain`

```typescript
{
  competitorIds: string[]      // Array of competitor IDs
  includeRecommendations: boolean // Generate strategy recommendations
}
```

**Response**:
```typescript
{
  success: boolean
  data: {
    analyzed_competitors: number
    insights_generated: number
    recommendations_created: number
    benchmarks: Benchmark[]
    trends: TrendReport
    alerts: TrendAlert[]
    predictions: TrendPrediction[]
    opportunities: ContentOpportunity
    workflow: {
      steps_completed: string[]
      total_cost: string
      execution_time: string
      errors: string[]
    }
  }
}
```

## Usage Example

```typescript
// Basic usage
const response = await $fetch('/api/admin/twitter/analyze-langchain', {
  method: 'POST',
  body: {
    competitorIds: ['comp1', 'comp2', 'comp3'],
    includeRecommendations: true
  }
})

// With error handling
try {
  const result = await analyzeCompetitors()
  if (result.data.workflow.errors.length > 0) {
    console.warn('Analysis completed with errors:', result.data.workflow.errors)
  }
} catch (error) {
  console.error('Analysis failed:', error)
}
```

## Configuration

### Environment Variables

```bash
# LangSmith Tracing (optional)
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your_langsmith_api_key
LANGCHAIN_PROJECT=pingtopass-twitter

# Twitter API (optional - uses mock data if not provided)
TWITTER_API_KEY=your_twitter_api_key

# OpenRouter for LLM calls
OPENROUTER_API_KEY=your_openrouter_api_key
```

## Benefits of LangChain Integration

1. **Observability**: Full tracing of all operations with LangSmith
2. **Reliability**: Built-in retry logic and error handling
3. **Scalability**: Parallel processing with LangGraph
4. **Cost Tracking**: Detailed cost analysis per operation
5. **Maintainability**: Consistent patterns with other LangChain code
6. **Testing**: Easier to test with mocked agents
7. **Structured Output**: Zod schemas ensure consistent data

## Testing

### Unit Tests
```bash
npm run test tests/unit/langchain/twitter-agents.test.ts
```

### Integration Tests
```bash
npm run test tests/integration/langchain/twitter-workflow.test.ts
```

### Manual Testing
1. Enable LangSmith tracing in `.env`
2. Run analysis through admin UI
3. Check LangSmith dashboard for traces
4. Verify cost tracking and performance

## Monitoring

### LangSmith Dashboard

When LangSmith is enabled, you can monitor:
- Workflow execution traces
- Agent performance metrics
- Token usage and costs
- Error rates and patterns
- Latency by operation

### Custom Metrics

The workflow tracks:
- Total cost per analysis
- Execution time per step
- Success/failure rates
- API call volumes

## Future Enhancements

1. **Streaming Support**: Real-time updates during analysis
2. **Caching Layer**: Reduce API calls and costs
3. **Advanced Workflows**: Multi-stage analysis with human feedback
4. **Custom Tools**: Twitter-specific LangChain tools
5. **Fine-tuned Models**: Specialized models for Twitter analysis

## Troubleshooting

### Common Issues

1. **No Twitter Data**: Workflow uses mock data when API key not provided
2. **High Costs**: Adjust agent temperature and max tokens
3. **Slow Performance**: Enable caching, reduce competitor count
4. **Missing Traces**: Verify LangSmith environment variables

### Debug Mode

Enable debug logging:
```typescript
const workflow = new TwitterAnalysisWorkflow()
// Logs will show in console with [AgentName] prefix
```