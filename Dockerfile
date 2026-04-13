# ----------- STAGE 1: BUILD FRONTEND -----------
FROM node:20 AS frontend-build

WORKDIR /app/web

COPY web/package*.json ./
RUN npm install

COPY web/ .
RUN npm run build


# ----------- STAGE 2: BUILD BACKEND -----------
FROM node:20 AS backend-build

WORKDIR /app/api

COPY api/package*.json ./
RUN npm install

COPY api/ .
RUN npm run build


# ----------- STAGE 3: FINAL IMAGE -----------
FROM node:20

WORKDIR /app

# Copy backend build
COPY --from=backend-build /app/api /app/api

# Copy frontend build
# VITE → dist
COPY --from=frontend-build /app/web/dist /app/web/dist

# Install serve to host frontend
RUN npm install -g serve

# Expose backend port
EXPOSE 5000

# Start both frontend + backend
CMD sh -c "serve -s /app/web/dist -l 3000 & node /app/api/dist/server.js"