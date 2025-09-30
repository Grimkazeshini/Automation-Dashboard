# Automation Dashboard

A full-stack automation dashboard for API workflows and reporting with AI-powered summarization.

## Features

- **Python Backend Scripts**: Email parsing and data cleaning automation
- **Node.js API**: RESTful endpoints to trigger workflows
- **AI Summarization**: Claude AI integration for intelligent report generation
- **React Dashboard**: Real-time monitoring with charts, logs, and status indicators
- **Deployment Ready**: Configured for Vercel (frontend) and Render (backend)

## Project Structure

```
dash/
├── backend/
│   ├── python/          # Python automation scripts
│   └── api/             # Node.js Express API
├── frontend/            # React dashboard
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.9+ (3.10+ recommended)
- npm or yarn

### ⚠️ Important Notes

- **Python Dependencies**: Only `pydantic` and `python-dotenv` are required (simplified)
- **API Key**: Anthropic API key required for AI summarization features
- **Security**: Rate limiting and input validation enabled by default

### Backend Setup

#### Python Scripts
```bash
cd backend/python
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### Node.js API
```bash
cd backend/api
npm install
cp .env.example .env
# Configure your environment variables
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Configure API URL
npm run dev
```

## Environment Variables

### Backend API (.env)
```
PORT=3001
DATABASE_URL=sqlite:./database.db
ANTHROPIC_API_KEY=your_claude_api_key_here
PYTHON_PATH=../python
```

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:3001
```

## Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
vercel deploy
```

### Backend (Render)
- Push to GitHub
- Connect repository to Render
- Use `render.yaml` configuration for automatic deployment

## API Endpoints

- `POST /api/workflows/email-parse` - Trigger email parsing
- `POST /api/workflows/data-clean` - Trigger data cleaning
- `POST /api/summarize` - Generate AI summary
- `GET /api/workflows` - Get all workflows
- `GET /api/workflows/:id` - Get workflow by ID
- `GET /api/logs` - Get workflow logs

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Recharts
- **Backend API**: Node.js, Express, SQLite
- **Python**: email, pandas, pydantic
- **AI**: Anthropic Claude API

## License

MIT
