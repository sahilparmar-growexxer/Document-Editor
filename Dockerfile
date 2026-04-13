# ----------- STAGE 1: BUILD FRONTEND -----------
FROM node:20 AS frontend-build

WORKDIR /app/web

COPY web/package*.json ./
RUN npm install

COPY web/ .
RUN npm run build


# ----------- STAGE 2: SETUP BACKEND -----------
FROM node:20

WORKDIR /app

# Copy backend
COPY api/package*.json ./api/
WORKDIR /app/api
RUN npm install

COPY api/ .

# Copy frontend build into backend
WORKDIR /app
COPY --from=frontend-build /app/web/dist ./web/dist

# Expose port
EXPOSE 5000

# Run backend
CMD ["node", "api/src/server.js"]