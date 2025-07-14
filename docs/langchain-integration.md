# 🦜 LangChain Integration Guide

## Overview

PingToPass uses **LangChain**, **LangSmith**, and **LangGraph** for AI-powered question generation with full observability and workflow orchestration.

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Required environment variables
OPENROUTER_API_KEY=your-openrouter-key
LANGCHAIN_TRACING_V2=true                    # Enable LangSmith tracing
LANGCHAIN_API_KEY=your-langsmith-key         # Optional: for observability
LANGCHAIN_PROJECT=pingtopass-production      # Optional: project name
```

### 2. Basic Usage

```typescript
import { QuestionGenerator } from '~/server/utils/langchain/agents/generator'

const generator = new QuestionGenerator()
const result = await generator.generate({
  examCode: 'AWS-SAA-C03',
  examName: 'AWS Solutions Architect',
  objective: 'Design secure architectures',
  count: 5,
  difficulty: 'medium'
})
```

## 📁 Project Structure

```
server/utils/langchain/
├── client.ts              # LangChain client setup
├── agents/
│   └── generator.ts       # Question generation agent
├── workflows/
│   ├── simple.ts         # LangGraph workflow
│   └── state.ts          # Workflow state management
└── types.ts              # TypeScript interfaces
```

## 🧪 Test-Driven Development

All features are built using TDD methodology:

```bash
# Run all LangChain tests
pnpm test tests/unit/langchain/
pnpm test tests/integration/langchain/

# Run specific test suites
pnpm test tests/unit/langchain/langchain-setup.test.ts
pnpm test tests/unit/langchain/question-generator.test.ts
pnpm test tests/unit/langchain/generation-workflow.test.ts
```

## 🔄 LangGraph Workflow

The question generation uses a simple linear workflow:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Research   │────▶│  Generate   │────▶│  Validate   │
│  Objective  │     │  Questions  │     │  & Retry    │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Workflow Features

- **Automatic Retry**: Failed validations trigger regeneration (max 2 retries)
- **State Tracking**: Full history of workflow execution
- **Error Handling**: Graceful degradation with detailed error messages

## 🔍 LangSmith Observability

When `LANGCHAIN_TRACING_V2=true`, all LLM calls are traced:

1. **View Traces**: https://smith.langchain.com
2. **Monitor Costs**: Track token usage and costs per generation
3. **Debug Issues**: See exact prompts and responses
4. **Performance**: Analyze latency and optimization opportunities

### Trace Information

- Input/output for each LLM call
- Token usage and cost calculation
- Execution time for each step
- Error details and stack traces

## 💡 API Endpoints

### Generate Questions (v2)
```http
POST /api/admin/questions/generate-v2
Authorization: Required (Admin only)

{
  "examId": "exam_aws_saa_c03",
  "objectiveId": "obj_123",        // Optional
  "count": 5,
  "difficulty": "medium",
  "customPrompt": "Focus on...",   // Optional
  "autoSave": false
}
```

Response:
```json
{
  "success": true,
  "data": {
    "questions": [...],
    "metadata": {
      "modelUsed": "google/gemini-2.5-flash-preview-05-20",
      "totalTokens": 2500,
      "cost": 0.0047,
      "workflowSteps": ["research", "generate", "validate"],
      "retries": 0
    }
  }
}
```

## 🎯 Examples

### Basic Generation
```typescript
// See: tests/examples/basic-generation.example.ts
const result = await generator.generate({
  examCode: 'AWS-SAA-C03',
  examName: 'AWS Solutions Architect',
  objective: 'Design secure architectures',
  count: 3,
  difficulty: 'medium'
})
```

### Workflow with Custom Instructions
```typescript
// See: tests/examples/workflow-example.ts
const workflow = new QuestionGenerationWorkflow()
const result = await workflow.run({
  examCode: 'AZ-104',
  examName: 'Azure Administrator',
  objective: 'Manage identities',
  customPrompt: 'Focus on conditional access policies',
  count: 5
})
```

## 📊 Cost Optimization

Current model pricing (Gemini 2.5 Flash):
- Input: $0.075 per 1M tokens
- Output: $0.30 per 1M tokens
- Average: ~$0.19 per 1M tokens

Typical generation costs:
- 5 questions: ~$0.004-0.006
- 10 questions: ~$0.008-0.012

## 🛠️ Extending the System

### Adding New Agents

1. Create agent in `server/utils/langchain/agents/`
2. Write tests first (TDD)
3. Implement minimal functionality
4. Add to workflow if needed

### Custom Workflows

1. Extend `StateGraph` from LangGraph
2. Define state interface
3. Add nodes and edges
4. Implement conditional logic

### Model Selection

Update `server/utils/langchain/client.ts`:
```typescript
private defaultModel: string = 'google/gemini-2.5-flash-preview-05-20'
```

## 🚨 Troubleshooting

### Common Issues

1. **Empty responses**: Check API key and model availability
2. **High costs**: Monitor token usage, use cheaper models
3. **Slow generation**: Consider parallel processing
4. **Validation failures**: Adjust prompt clarity

### Debug Mode

Enable detailed logging:
```typescript
const client = new LangChainClient()
// Traces will appear in LangSmith dashboard
```

## 📚 Resources

- [LangChain JS Docs](https://js.langchain.com)
- [LangGraph Guide](https://langchain-ai.github.io/langgraphjs/)
- [LangSmith Dashboard](https://smith.langchain.com)
- [OpenRouter Models](https://openrouter.ai/models)

## 🎓 Teaching Points

This implementation demonstrates:

1. **TDD Methodology**: All features have tests written first
2. **Simple Architecture**: Minimal dependencies, clear structure
3. **Production Features**: Error handling, retries, observability
4. **Cost Awareness**: Token tracking and optimization
5. **Extensibility**: Easy to add new agents and workflows

Perfect for tutorials on:
- Building AI applications with LangChain
- Implementing observability with LangSmith
- Creating workflows with LangGraph
- TDD for AI features
- Cost-effective LLM usage