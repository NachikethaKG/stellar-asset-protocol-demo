# Simple Dockerfile for demo API
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD [ "node", "api/server.js" ]
