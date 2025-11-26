# Use node LTS
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy rest
COPY . .

# Expose port for health checks (Render will set PORT)
ENV PORT 3000
EXPOSE ${PORT}

# Start
CMD ["node", "index.js"]
