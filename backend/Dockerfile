# DevTrack Backend - Dockerfile for EC2
FROM node:20-alpine

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json* ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy application source
COPY . .

# Create uploads directory for multer
RUN mkdir -p uploads

EXPOSE 5000

CMD ["node", "src/server.js"]
