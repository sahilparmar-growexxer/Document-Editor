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

const corsOptions = {
  origin: ["http://localhost:3000" , 'http://127.0.0.1:3000']
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(morgan('dev'));

app.use('/', routes);
app.use(errorMiddleware);

export default app;
