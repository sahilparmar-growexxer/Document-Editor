import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes/index.js';
import errorMiddleware from './common/middleware/error.middleware.js';
import env from './config/env.js';
import dotenv from "dotenv";
dotenv.config();

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(morgan('dev'));

app.use('/', routes);
app.use(errorMiddleware);

export default app;
