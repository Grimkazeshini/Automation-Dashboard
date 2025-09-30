import json
import sys
from email import message_from_string
from email.utils import parsedate_to_datetime
from datetime import datetime
from typing import Dict, Any
from models import EmailData, WorkflowResult, WorkflowStatus
import uuid


def parse_email_content(email_content: str) -> Dict[str, Any]:
    """
    Parse email content and extract relevant information.

    Args:
        email_content: Raw email content as string

    Returns:
        Dictionary with parsed email data
    """
    try:
        msg = message_from_string(email_content)

        # Extract sender
        sender = msg.get('From', 'unknown@example.com')
        if '<' in sender:
            sender = sender.split('<')[1].split('>')[0]

        # Extract subject
        subject = msg.get('Subject', 'No Subject')

        # Extract date
        date_str = msg.get('Date')
        try:
            received_date = parsedate_to_datetime(date_str) if date_str else datetime.utcnow()
        except:
            received_date = datetime.utcnow()

        # Extract body
        body = ""
        if msg.is_multipart():
            for part in msg.walk():
                content_type = part.get_content_type()
                if content_type == "text/plain":
                    body = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                    break
        else:
            body = msg.get_payload(decode=True).decode('utf-8', errors='ignore')

        # Extract attachments
        attachments = []
        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_disposition() == 'attachment':
                    filename = part.get_filename()
                    if filename:
                        attachments.append(filename)

        # Create validated email data
        email_data = EmailData(
            sender=sender,
            subject=subject,
            body=body[:1000],  # Truncate body for demo
            received_date=received_date,
            attachments=attachments,
            metadata={
                "message_id": msg.get('Message-ID', ''),
                "to": msg.get('To', ''),
                "cc": msg.get('Cc', '')
            }
        )

        return email_data.model_dump(mode='json')

    except Exception as e:
        raise ValueError(f"Failed to parse email: {str(e)}")


def process_email_file(file_path: str) -> WorkflowResult:
    """
    Process an email file and return structured result.

    Args:
        file_path: Path to email file

    Returns:
        WorkflowResult object
    """
    workflow_id = str(uuid.uuid4())
    started_at = datetime.utcnow()

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            email_content = f.read()

        parsed_data = parse_email_content(email_content)

        result = WorkflowResult(
            workflow_id=workflow_id,
            workflow_type="email_parse",
            status=WorkflowStatus.COMPLETED,
            started_at=started_at,
            completed_at=datetime.utcnow(),
            result=parsed_data
        )

    except Exception as e:
        result = WorkflowResult(
            workflow_id=workflow_id,
            workflow_type="email_parse",
            status=WorkflowStatus.FAILED,
            started_at=started_at,
            completed_at=datetime.utcnow(),
            error=str(e)
        )

    return result


def main():
    """CLI entry point for email parsing"""
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No input provided"}))
        sys.exit(1)

    input_data = sys.argv[1]

    try:
        # Parse direct email content
        parsed = parse_email_content(input_data)
        result = WorkflowResult(
            workflow_id=str(uuid.uuid4()),
            workflow_type="email_parse",
            status=WorkflowStatus.COMPLETED,
            started_at=datetime.utcnow(),
            completed_at=datetime.utcnow(),
            result=parsed
        )
        print(json.dumps(result.model_dump(mode='json'), default=str))
    except Exception as e:
        result = WorkflowResult(
            workflow_id=str(uuid.uuid4()),
            workflow_type="email_parse",
            status=WorkflowStatus.FAILED,
            started_at=datetime.utcnow(),
            completed_at=datetime.utcnow(),
            error=str(e)
        )
        print(json.dumps(result.model_dump(mode='json'), default=str))
        sys.exit(1)


if __name__ == "__main__":
    main()
