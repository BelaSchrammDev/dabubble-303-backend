# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY --from=builder /app/dist ./dist

# Create upload directories
RUN mkdir -p /app/uploads/profile-pictures /app/uploads/message-attachments

EXPOSE 3000
CMD ["node", "dist/main.js"]
