import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes/index.js';
import errorMiddleware from './common/middleware/error.middleware.js';
import env from './config/env.js';

const app = express();

const allowedOrigins = Array.isArray(env.corsOrigin)
  ? env.corsOrigin
  : String(env.corsOrigin)
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes('*')) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('CORS origin not allowed'));
    },
    credentials: true
  })
);
app.use(express.json());
app.use(morgan('dev'));

app.use('/', routes);
app.use(errorMiddleware);

export default app;
