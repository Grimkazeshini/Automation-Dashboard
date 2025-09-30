import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Generate a summary using Claude AI
 * @param {string} content - Content to summarize
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Summary result with content and metadata
 */
export async function generateSummary(content, options = {}) {
  const {
    maxTokens = 1024,
    type = 'general',
  } = options;

  const prompts = {
    general: 'Please provide a concise summary of the following content, highlighting key points and important information:',
    workflow: 'Analyze the following workflow execution data and provide a summary of what was processed, key results, and any issues encountered:',
    report: 'Generate an executive summary report based on the following data, focusing on metrics, trends, and actionable insights:',
  };

  const prompt = prompts[type] || prompts.general;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: `${prompt}\n\n${content}`,
        },
      ],
    });

    return {
      content: message.content[0].text,
      model: message.model,
      usage: {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens,
      },
      stop_reason: message.stop_reason,
    };
  } catch (error) {
    throw new Error(`Claude API error: ${error.message}`);
  }
}

/**
 * Generate insights from workflow data
 * @param {Array} workflows - Array of workflow objects
 * @returns {Promise<Object>} AI-generated insights
 */
export async function generateWorkflowInsights(workflows) {
  const summary = workflows.map(w => ({
    type: w.type,
    status: w.status,
    duration: w.completed_at
      ? new Date(w.completed_at) - new Date(w.started_at)
      : null,
    hasError: !!w.error,
  }));

  const content = `Workflow Execution Summary:\n${JSON.stringify(summary, null, 2)}`;

  return generateSummary(content, { type: 'workflow' });
}

/**
 * Generate a report summary
 * @param {Object} data - Report data
 * @returns {Promise<Object>} AI-generated report summary
 */
export async function generateReportSummary(data) {
  const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  return generateSummary(content, { type: 'report', maxTokens: 2048 });
}
