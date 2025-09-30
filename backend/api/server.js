import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { workflowDb, logDb, summaryDb } from './database.js';
import { parseEmail, cleanData } from './pythonRunner.js';
import { generateSummary, generateWorkflowInsights, generateReportSummary } from './claude.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const workflowLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit workflow endpoints to 10 per minute
  message: 'Too many workflow requests, please try again later.',
});

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(limiter);

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ===== WORKFLOW ENDPOINTS =====

// Trigger email parsing workflow
app.post('/api/workflows/email-parse', workflowLimiter, async (req, res) => {
  const workflowId = uuidv4();
  const { emailContent } = req.body;

  if (!emailContent) {
    return res.status(400).json({ error: 'emailContent is required' });
  }

  // Input validation
  if (typeof emailContent !== 'string') {
    return res.status(400).json({ error: 'emailContent must be a string' });
  }

  if (emailContent.length > 100000) {
    return res.status(400).json({ error: 'emailContent too large (max 100KB)' });
  }

  try {
    // Create workflow record
    const workflow = {
      id: workflowId,
      type: 'email_parse',
      status: 'running',
      started_at: new Date().toISOString(),
    };
    workflowDb.create(workflow);

    // Log start
    logDb.create({
      workflow_id: workflowId,
      level: 'info',
      message: 'Email parsing workflow started',
    });

    // Execute Python script
    const result = await parseEmail(emailContent);

    // Update workflow with result
    workflowDb.update(workflowId, {
      status: result.status,
      completed_at: new Date().toISOString(),
      result: result.result,
      error: result.error,
    });

    // Log completion
    logDb.create({
      workflow_id: workflowId,
      level: result.status === 'completed' ? 'info' : 'error',
      message: result.status === 'completed'
        ? 'Email parsing completed successfully'
        : `Email parsing failed: ${result.error}`,
    });

    res.json({
      workflow_id: workflowId,
      status: result.status,
      result: result.result,
    });
  } catch (error) {
    workflowDb.update(workflowId, {
      status: 'failed',
      completed_at: new Date().toISOString(),
      error: error.message,
    });

    logDb.create({
      workflow_id: workflowId,
      level: 'error',
      message: `Error: ${error.message}`,
    });

    res.status(500).json({ error: error.message, workflow_id: workflowId });
  }
});

// Trigger data cleaning workflow
app.post('/api/workflows/data-clean', workflowLimiter, async (req, res) => {
  const workflowId = uuidv4();
  const { data } = req.body;

  if (!data) {
    return res.status(400).json({ error: 'data is required' });
  }

  // Input validation
  if (typeof data !== 'object' || Array.isArray(data)) {
    return res.status(400).json({ error: 'data must be an object' });
  }

  // Check object size
  const dataStr = JSON.stringify(data);
  if (dataStr.length > 100000) {
    return res.status(400).json({ error: 'data too large (max 100KB)' });
  }

  try {
    // Create workflow record
    const workflow = {
      id: workflowId,
      type: 'data_clean',
      status: 'running',
      started_at: new Date().toISOString(),
    };
    workflowDb.create(workflow);

    // Log start
    logDb.create({
      workflow_id: workflowId,
      level: 'info',
      message: 'Data cleaning workflow started',
    });

    // Execute Python script
    const result = await cleanData(data);

    // Update workflow with result
    workflowDb.update(workflowId, {
      status: result.status,
      completed_at: new Date().toISOString(),
      result: result.result,
      error: result.error,
    });

    // Log completion
    logDb.create({
      workflow_id: workflowId,
      level: result.status === 'completed' ? 'info' : 'error',
      message: result.status === 'completed'
        ? 'Data cleaning completed successfully'
        : `Data cleaning failed: ${result.error}`,
    });

    res.json({
      workflow_id: workflowId,
      status: result.status,
      result: result.result,
    });
  } catch (error) {
    workflowDb.update(workflowId, {
      status: 'failed',
      completed_at: new Date().toISOString(),
      error: error.message,
    });

    logDb.create({
      workflow_id: workflowId,
      level: 'error',
      message: `Error: ${error.message}`,
    });

    res.status(500).json({ error: error.message, workflow_id: workflowId });
  }
});

// Get all workflows
app.get('/api/workflows', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const workflows = workflowDb.getAll(limit);
    res.json(workflows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get workflow by ID
app.get('/api/workflows/:id', (req, res) => {
  try {
    const workflow = workflowDb.getById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    res.json(workflow);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== LOG ENDPOINTS =====

// Get all logs
app.get('/api/logs', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 500;
    const logs = logDb.getAll(limit);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get logs by workflow ID
app.get('/api/logs/:workflowId', (req, res) => {
  try {
    const logs = logDb.getByWorkflowId(req.params.workflowId);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== AI SUMMARIZATION ENDPOINTS =====

// Generate summary
app.post('/api/summarize', workflowLimiter, async (req, res) => {
  const summaryId = uuidv4();
  const { content, type, workflowId } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'content is required' });
  }

  // Input validation
  if (typeof content !== 'string') {
    return res.status(400).json({ error: 'content must be a string' });
  }

  if (content.length > 50000) {
    return res.status(400).json({ error: 'content too large (max 50KB)' });
  }

  const validTypes = ['general', 'workflow', 'report'];
  if (type && !validTypes.includes(type)) {
    return res.status(400).json({ error: 'invalid type' });
  }

  try {
    const result = await generateSummary(content, { type });

    // Save summary to database
    summaryDb.create({
      id: summaryId,
      workflow_id: workflowId || null,
      content: result.content,
      token_count: result.usage.input_tokens + result.usage.output_tokens,
    });

    res.json({
      id: summaryId,
      summary: result.content,
      usage: result.usage,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate workflow insights
app.get('/api/insights/workflows', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const workflows = workflowDb.getAll(limit);

    if (workflows.length === 0) {
      return res.json({
        message: 'No workflows to analyze',
        insights: null,
      });
    }

    const result = await generateWorkflowInsights(workflows);

    res.json({
      insights: result.content,
      analyzed_count: workflows.length,
      usage: result.usage,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate report summary
app.post('/api/reports/summarize', async (req, res) => {
  const { data } = req.body;

  if (!data) {
    return res.status(400).json({ error: 'data is required' });
  }

  try {
    const result = await generateReportSummary(data);

    res.json({
      summary: result.content,
      usage: result.usage,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all summaries
app.get('/api/summaries', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const summaries = summaryDb.getAll(limit);
    res.json(summaries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== STATS ENDPOINT =====

// Get dashboard stats
app.get('/api/stats', (req, res) => {
  try {
    const allWorkflows = workflowDb.getAll(1000);
    const recentLogs = logDb.getAll(100);

    const stats = {
      total_workflows: allWorkflows.length,
      completed: allWorkflows.filter(w => w.status === 'completed').length,
      failed: allWorkflows.filter(w => w.status === 'failed').length,
      running: allWorkflows.filter(w => w.status === 'running').length,
      by_type: {},
      recent_activity: recentLogs.slice(0, 10),
    };

    // Count by type
    allWorkflows.forEach(w => {
      stats.by_type[w.type] = (stats.by_type[w.type] || 0) + 1;
    });

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Automation Dashboard API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health\n`);
});
