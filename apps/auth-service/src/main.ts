import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorMiddleware } from '../../../packages/error-handler/error-middleware';

const app = express();
const corsOptions = {
  origin: ['http://localhost:3000'],
  credentials: true,
  allowHeaders:['Content-Type','Authorization']
}
app.use(cors(corsOptions))
app.use(express.json());
app.use(cookieParser());
app.use(errorMiddleware);

app.get('/', (req, res) => {
  res.send({ message: 'Hello API' });
});

const port=Number(process.env.PORT)|| 6001;
const server=app.listen(port,()=>{
    console.log(`Auth Service is  running at http://localhost:${port}/api`);
})
server.on('error',(err)=>{
  console.log("Server error", err);
});
