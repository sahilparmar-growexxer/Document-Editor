# BlockNote

## Run locally

1. Start PostgreSQL:

```bash
docker compose up -d
```

2. Install backend dependencies:

```bash
cd api && npm install
```

3. Install frontend dependencies:

```bash
cd ../web && npm install
```

4. Run backend:

```bash
cd ../api && npm run dev
```

5. Run frontend:

```bash
cd ../web && npm run dev
```
