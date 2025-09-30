import { useState } from 'react';
import { workflowApi, summaryApi } from '../api';
import { useStore } from '../store';

export function WorkflowActions() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { addWorkflow } = useStore();

  const handleEmailParse = async () => {
    setIsProcessing(true);
    try {
      const sampleEmail = `From: user@example.com
To: admin@company.com
Subject: Quarterly Report Request
Date: Mon, 30 Sep 2024 10:00:00 -0000

Hello,

Please send me the quarterly report for Q3 2024.

Best regards,
John Doe`;

      const response = await workflowApi.parseEmail(sampleEmail);
      addWorkflow(response.data as any);
      alert(`Email parsed successfully! Workflow ID: ${response.data.workflow_id}`);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDataClean = async () => {
    setIsProcessing(true);
    try {
      const sampleData = {
        name: '  John   Doe  ',
        email: 'JOHN.DOE@EXAMPLE.COM',
        phone: '+1-555-0123',
        address: '123 Main St, City, State 12345',
        notes: 'Special   characters: @#$%^&*()   ',
      };

      const response = await workflowApi.cleanData(sampleData);
      addWorkflow(response.data as any);
      alert(`Data cleaned successfully! Workflow ID: ${response.data.workflow_id}`);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateInsights = async () => {
    setIsProcessing(true);
    try {
      const response = await summaryApi.getWorkflowInsights();
      alert(`Insights generated:\n\n${response.data.insights}`);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="actions-section">
      <h2 className="card-title">Workflow Actions</h2>
      <div className="actions-grid">
        <div className="action-card">
          <div className="action-title">Parse Email</div>
          <div className="action-description">
            Extract and parse email content with metadata
          </div>
          <button
            className="button"
            onClick={handleEmailParse}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Run Email Parser'}
          </button>
        </div>

        <div className="action-card">
          <div className="action-title">Clean Data</div>
          <div className="action-description">
            Validate and clean data with error detection
          </div>
          <button
            className="button"
            onClick={handleDataClean}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Run Data Cleaner'}
          </button>
        </div>

        <div className="action-card">
          <div className="action-title">Generate Insights</div>
          <div className="action-description">
            AI-powered analysis of workflow performance
          </div>
          <button
            className="button button-secondary"
            onClick={handleGenerateInsights}
            disabled={isProcessing}
          >
            {isProcessing ? 'Generating...' : 'Generate Insights'}
          </button>
        </div>
      </div>
    </div>
  );
}
