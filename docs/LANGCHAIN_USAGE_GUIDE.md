# 📖 LangChain Question Generation - Usage Guide

## 🚀 Quick Start

### 1. Set Environment Variables

First, make sure your `.env` file has the required API key:

```bash
# Required
OPENROUTER_API_KEY=your-openrouter-api-key

# Optional (for LangSmith tracing)
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your-langsmith-api-key
LANGCHAIN_PROJECT=pingtopass-production
```

### 2. Access the Generation Page

Navigate to: **http://localhost:3001/admin/ai-generation**

You must be logged in as an admin user to access this page.

### 3. Generate Questions

1. **Select an Exam**: Choose the target certification exam
2. **Select Objective** (Optional): Focus on a specific learning objective
3. **Set Question Count**: Use the slider (1-10 questions)
4. **Choose Difficulty**: Easy, Medium, or Hard
5. **Add Custom Instructions** (Optional): Provide specific guidance
6. **Click "Generate Questions"**

### 4. Review Generated Questions

After generation completes (typically 10-30 seconds):

- **View Generation Details**: See tokens used, cost, and workflow steps
- **Review Each Question**: Expand to see options and explanations
- **Save Questions**: Individually save approved questions to the database
- **Edit if Needed**: Make modifications before saving

## 🎯 Features

### LangChain Integration
- Uses **Gemini 2.5 Flash** model via OpenRouter
- Implements a 3-step workflow: Research → Generate → Validate
- Automatic retry on validation failures (max 2 attempts)

### Cost Optimization
- Average cost: ~$0.001 per question
- Batch generation is more efficient
- Model optimized for speed and quality

### Observability (with LangSmith)
When LangSmith is enabled:
- Full trace of generation process
- Token usage breakdown
- Latency metrics
- Error debugging

## 💡 Best Practices

### For Better Results

1. **Be Specific with Objectives**
   - Select targeted objectives for focused questions
   - Use custom prompts for specific scenarios

2. **Batch Generation**
   - Generate 5-10 questions at once for efficiency
   - Review and save only the best ones

3. **Custom Instructions Examples**
   ```
   "Focus on practical scenarios involving AWS S3 bucket policies"
   "Include questions about Azure AD conditional access"
   "Emphasize troubleshooting and best practices"
   ```

### Quality Control

- Generated questions are **not** auto-saved by default
- Review each question for:
  - Accuracy
  - Clarity
  - Appropriate difficulty
  - Good distractors (wrong answers)

## 🔧 Troubleshooting

### Common Issues

1. **"Failed to generate questions"**
   - Check your OPENROUTER_API_KEY in .env
   - Verify you have API credits
   - Try reducing the question count

2. **Slow Generation**
   - Normal generation takes 10-30 seconds
   - Complex objectives may take longer
   - Check your internet connection

3. **Poor Quality Questions**
   - Be more specific with objectives
   - Use custom instructions
   - Try different difficulty levels

### Debug Mode

Enable LangSmith tracing to see:
- Exact prompts sent to the model
- Step-by-step workflow execution
- Token usage per step
- Any errors or retries

## 📊 Understanding the Metadata

After generation, you'll see:

- **Model**: Always "Gemini 2.5 Flash" (via LangChain)
- **Tokens Used**: Total tokens consumed (prompt + completion)
- **Cost**: Estimated cost in USD
- **Workflow Steps**: Usually "research → generate → validate"

## 🎓 Advanced Usage

### API Endpoint

You can also use the API directly:

```bash
curl -X POST http://localhost:3001/api/admin/questions/generate-v2 \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "examId": "exam_aws_saa_c03",
    "count": 5,
    "difficulty": "medium",
    "customPrompt": "Focus on S3 security"
  }'
```

### Extending the System

The LangChain integration is modular:
- Question Generator: `/server/utils/langchain/agents/generator.ts`
- Workflow: `/server/utils/langchain/workflows/simple.ts`
- API Endpoint: `/server/api/admin/questions/generate-v2.post.ts`

## 🚨 Important Notes

1. **No Auto-Save**: Questions are NOT automatically saved to prevent low-quality content
2. **Manual Review**: Always review generated content before saving
3. **Cost Awareness**: Monitor token usage for budget control
4. **Rate Limits**: OpenRouter has rate limits - space out large generations

---

**Need Help?** Check the [LangChain Integration Guide](./langchain-integration.md) for technical details.