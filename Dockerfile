# Multi-stage Dockerfile for Automation Dashboard

# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Backend with Python and Node.js
FROM node:20-alpine
WORKDIR /app

# Install Python and dependencies
RUN apk add --no-cache python3 py3-pip

# Copy backend
COPY backend/ ./backend/

# Install Python dependencies
WORKDIR /app/backend/python
RUN pip3 install --no-cache-dir -r requirements.txt

# Install Node.js dependencies
WORKDIR /app/backend/api
RUN npm ci --only=production

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV PYTHON_PATH=/app/backend/python

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Start API server
CMD ["node", "server.js"]
