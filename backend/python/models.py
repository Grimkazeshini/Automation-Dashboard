from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class WorkflowStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class EmailData(BaseModel):
    """Model for parsed email data"""
    sender: str
    subject: str
    body: str
    received_date: datetime
    attachments: List[str] = []
    metadata: dict = {}


class CleanedData(BaseModel):
    """Model for cleaned data output"""
    original_data: dict
    cleaned_data: dict
    validation_errors: List[str] = []
    cleaned_at: datetime = Field(default_factory=datetime.utcnow)


class WorkflowResult(BaseModel):
    """Model for workflow execution results"""
    workflow_id: str
    workflow_type: str
    status: WorkflowStatus
    started_at: datetime
    completed_at: Optional[datetime] = None
    result: Optional[dict] = None
    error: Optional[str] = None
