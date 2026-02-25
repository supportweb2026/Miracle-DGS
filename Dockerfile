FROM node:20.9.0

# Install Chromium for Puppeteer
RUN apt-get update && apt-get install -y chromium \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install specific npm version
RUN npm install -g npm@10.2.4

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install dependencies with specific npm version
RUN npm install --no-package-lock
RUN cd frontend && npm install --no-package-lock
RUN cd backend && npm install --no-package-lock

# Copy source code
COPY . .

# Build frontend with increased memory limit
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN cd frontend && npm run build

# Set working directory to backend
WORKDIR /app/backend

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"] 