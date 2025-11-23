import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorMiddleware } from '../../../packages/error-handler/error-middleware';
import router from './routes/auth.router';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger-output.json';
const app = express();
const corsOptions = {
  origin: ['http://localhost:3000'],
  credentials: true,
  allowHeaders:['Content-Type','Authorization']
}
app.use(cors(corsOptions))
app.use(express.json());
app.use(cookieParser());


app.get('/', (req, res) => {
  res.send({ message: 'Hello API' });
});

app.use("/api-docs",swaggerUi.serve,swaggerUi.setup(swaggerDocument))
app.get("/docs-json", (re,res) => {
  res.json(swaggerDocument);
})
//routes
app.use("/api", router);

app.use(errorMiddleware);

const port=Number(process.env.PORT)|| 6001;
const server=app.listen(port,()=>{
  console.log(`Auth Service is  running at http://localhost:${port}/api`);
  console.log(`swagger docs is available at http://localhost:${port}/docs`);
})
server.on('error',(err)=>{
  console.log("Server error", err);
});
