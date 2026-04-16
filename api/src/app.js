import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes/index.js';
import errorMiddleware from './common/middleware/error.middleware.js';
import requestIdMiddleware from './common/middleware/request-id.middleware.js';
import securityHeadersMiddleware from './common/middleware/security.middleware.js';
import env from './config/env.js';

const app = express();
app.set('trust proxy', 1);

const allowedOrigins = [
  "http://localhost:3000",
  "https://document-editor-qx2l.vercel.app/"
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  credentials: true
}));

morgan.token('request-id', (req) => req.requestId || '-');



app.use(securityHeadersMiddleware);
app.use(requestIdMiddleware);

app.use(express.json({ limit: '1mb' }));
app.use(morgan(':request-id :method :url :status :response-time ms'));

app.use('/', routes);
app.use(errorMiddleware);

export default app;
