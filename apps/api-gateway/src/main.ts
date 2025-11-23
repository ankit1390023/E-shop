import express from 'express';
import proxy from 'express-http-proxy';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import morgan from 'morgan';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'; 

dotenv.config();

const app = express();

const corsOptions = {
  origin: ['http://localhost:3000'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({limit:'100mb'}));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(morgan('dev'));
app.set("trust proxy", true);



const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, //15 min
  max: (req:any) => (req.user ? 100 : 10),
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req:any) => ipKeyGenerator(req), 
});

app.use(limiter);

app.get('/api', (req, res) => {
  res.send({ message: 'Welcome to api-gateway!' });
});


app.get('/gateway-health', (req, res) => {
  res.send({ message: 'Gateway is healthy!' });
})

app.use('/', proxy('http://localhost:6001'));

const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
