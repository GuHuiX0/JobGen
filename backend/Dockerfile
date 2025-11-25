FROM node:18-bullseye

# Set working directory
WORKDIR /app

# Install Python runtime and build tools for voice_analysis module
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      python3 \
      python3-pip \
      python3-venv \
      python3-dev \
      build-essential \
      libffi-dev \
      libopenblas-dev \
      liblapack-dev && \
    rm -rf /var/lib/apt/lists/*
ENV PYTHONUNBUFFERED=1

# Set environment variables
ENV NODE_ENV=production
# Render provides PORT; default to 3001 for local runs
ENV PORT=3001

# Copy Node.js package files (from backend subdirectory)
COPY backend/package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy backend source code
COPY backend/src/ ./src/

# Copy swagger
COPY backend/swagger.yaml ./swagger.yaml

# Copy Python voice analysis module and requirements into the image
COPY requirements.txt ./requirements.txt
COPY voice_analysis ./voice_analysis

# Install Python dependencies for voice_analysis
RUN python3 -m pip install --no-cache-dir -r requirements.txt

# Create non-root user for security
RUN groupadd -g 1001 nodejs && \
    useradd -m -u 1001 -g nodejs nodejs

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port (Render maps this dynamically)
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "import('http').then(http => http.get('http://localhost:' + process.env.PORT + '/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }))"

# Start the application
CMD ["node", "src/app.js"]
