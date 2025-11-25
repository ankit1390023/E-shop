import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorMiddleware } from '../../../packages/error-handler/error-middleware';
import router from './routes/auth.router';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from parent directory
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const swaggerPath = path.join(__dirname, 'assets', 'swagger-output.json');
const swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, 'utf-8'));

const app = express();
const corsOptions = {
  origin: ['http://localhost:3000'],
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send({ message: 'Hello API' });
});

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/docs-json', (req, res) => {
  res.json(swaggerDocument);
});

// routes
app.use('/api', router);

app.use(errorMiddleware);

const port = Number(process.env.PORT) || 6001;
const server = app.listen(port, () => {
  console.log(`Auth Service is  running at http://localhost:${port}/api`);
  console.log(`Swagger UI is available at http://localhost:${port}/api-docs`);
  console.log(`Swagger JSON is available at http://localhost:${port}/docs-json`);
});

server.on('error', (err) => {
  console.log('Server error', err);
});
