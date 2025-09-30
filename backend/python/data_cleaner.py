import json
import sys
from typing import Dict, Any, List
from datetime import datetime
from models import CleanedData, WorkflowResult, WorkflowStatus
import uuid
import re


def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_phone(phone: str) -> bool:
    """Validate phone number format"""
    pattern = r'^[\d\s\-\+\(\)]{10,}$'
    return bool(re.match(pattern, phone))


def clean_text(text: str) -> str:
    """Clean and normalize text"""
    if not text:
        return ""

    # Remove extra whitespace
    text = ' '.join(text.split())

    # Remove special characters (keep alphanumeric, spaces, basic punctuation)
    text = re.sub(r'[^\w\s\.,!?@-]', '', text)

    return text.strip()


def clean_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Clean and validate data dictionary.

    Args:
        data: Raw data dictionary

    Returns:
        Cleaned data dictionary and validation errors
    """
    cleaned = {}
    errors = []

    for key, value in data.items():
        # Skip None values
        if value is None:
            errors.append(f"Field '{key}' is null")
            continue

        # Email validation
        if 'email' in key.lower() and isinstance(value, str):
            if validate_email(value):
                cleaned[key] = value.lower().strip()
            else:
                errors.append(f"Invalid email format: {key}")
                cleaned[key] = value.lower().strip()  # Keep it but flag error

        # Phone validation
        elif 'phone' in key.lower() and isinstance(value, str):
            if validate_phone(value):
                cleaned[key] = value.strip()
            else:
                errors.append(f"Invalid phone format: {key}")
                cleaned[key] = value.strip()

        # Text cleaning
        elif isinstance(value, str):
            cleaned[key] = clean_text(value)

        # Number normalization
        elif isinstance(value, (int, float)):
            cleaned[key] = value

        # Date handling
        elif isinstance(value, datetime):
            cleaned[key] = value.isoformat()

        # Nested dictionaries
        elif isinstance(value, dict):
            nested_result = clean_data(value)
            cleaned[key] = nested_result

        # Lists
        elif isinstance(value, list):
            cleaned[key] = [clean_text(str(item)) if isinstance(item, str) else item
                          for item in value]

        else:
            cleaned[key] = value

    return cleaned, errors


def process_data_cleaning(data: Dict[str, Any]) -> WorkflowResult:
    """
    Process data cleaning workflow.

    Args:
        data: Raw data to clean

    Returns:
        WorkflowResult object
    """
    workflow_id = str(uuid.uuid4())
    started_at = datetime.utcnow()

    try:
        cleaned_data, validation_errors = clean_data(data)

        cleaned_result = CleanedData(
            original_data=data,
            cleaned_data=cleaned_data,
            validation_errors=validation_errors,
            cleaned_at=datetime.utcnow()
        )

        result = WorkflowResult(
            workflow_id=workflow_id,
            workflow_type="data_clean",
            status=WorkflowStatus.COMPLETED,
            started_at=started_at,
            completed_at=datetime.utcnow(),
            result=cleaned_result.model_dump(mode='json')
        )

    except Exception as e:
        result = WorkflowResult(
            workflow_id=workflow_id,
            workflow_type="data_clean",
            status=WorkflowStatus.FAILED,
            started_at=started_at,
            completed_at=datetime.utcnow(),
            error=str(e)
        )

    return result


def main():
    """CLI entry point for data cleaning"""
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No input provided"}))
        sys.exit(1)

    try:
        # Parse JSON input
        input_data = json.loads(sys.argv[1])
        result = process_data_cleaning(input_data)
        print(json.dumps(result.model_dump(mode='json'), default=str))
    except json.JSONDecodeError:
        result = WorkflowResult(
            workflow_id=str(uuid.uuid4()),
            workflow_type="data_clean",
            status=WorkflowStatus.FAILED,
            started_at=datetime.utcnow(),
            completed_at=datetime.utcnow(),
            error="Invalid JSON input"
        )
        print(json.dumps(result.model_dump(mode='json'), default=str))
        sys.exit(1)
    except Exception as e:
        result = WorkflowResult(
            workflow_id=str(uuid.uuid4()),
            workflow_type="data_clean",
            status=WorkflowStatus.FAILED,
            started_at=datetime.utcnow(),
            completed_at=datetime.utcnow(),
            error=str(e)
        )
        print(json.dumps(result.model_dump(mode='json'), default=str))
        sys.exit(1)


if __name__ == "__main__":
    main()
