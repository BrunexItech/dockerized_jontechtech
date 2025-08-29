# frontend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install deps with better caching
COPY package*.json ./
# If you have lockfile, npm ci is deterministic; fallback to install if no lock
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source
COPY . .

EXPOSE 5173

# Dev server; host must be 0.0.0.0 to be reachable from outside container
CMD ["npm", "run", "dev", "--", "--host", "--port", "5173"]
