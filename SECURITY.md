# Security Best Practices

## Implemented Security Measures

### 1. Input Validation
- **Email Content**: Max 100KB, must be string
- **Data Objects**: Max 100KB, must be object (not array)
- **AI Content**: Max 50KB, must be string
- **Script Names**: Whitelist validation to prevent path traversal

### 2. Rate Limiting
- **Global**: 100 requests per 15 minutes per IP
- **Workflow Endpoints**: 10 requests per minute per IP
- **AI Endpoints**: 10 requests per minute per IP

### 3. Command Injection Prevention
- Python scripts spawned with array arguments (not shell)
- Script names validated against whitelist
- No user input passed directly to shell

### 4. SQL Injection Prevention
- Parameterized queries using better-sqlite3 prepared statements
- No string concatenation in SQL queries

### 5. CORS Configuration
- Origin restriction via environment variable
- Default to localhost:5173 for development

### 6. Environment Variables
- API keys stored in .env (not committed)
- Separate .env.example provided as template

## Configuration

### Required Environment Variables

**Backend API** (`backend/api/.env`):
```
PORT=3001
NODE_ENV=production
ANTHROPIC_API_KEY=your_key_here  # Required for AI features
DATABASE_URL=./database.db
PYTHON_PATH=../python
CORS_ORIGIN=https://your-frontend-domain.com
```

**Frontend** (`frontend/.env.local`):
```
VITE_API_URL=https://your-api-domain.com
```

### Production Recommendations

1. **HTTPS Only**: Always use HTTPS in production
2. **API Key Rotation**: Rotate Anthropic API key regularly
3. **Database Backups**: Regular backups of SQLite database
4. **Monitor Logs**: Track failed requests and rate limit violations
5. **Update Dependencies**: Keep npm packages updated for security patches
6. **Firewall**: Restrict API access to known IPs if possible
7. **Authentication**: Add user authentication for production use

### Known Limitations

1. **No Authentication**: Current implementation has no user auth
2. **No CSRF Protection**: Should add CSRF tokens for production
3. **No Request Signing**: API requests are not cryptographically signed
4. **SQLite Limitations**: Not suitable for high-concurrency production

### Reporting Security Issues

Report security vulnerabilities via GitHub Issues (for demo purposes).
In production, use a private security disclosure process.
