import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import { responseHelper } from './utils/responseHelper';

dotenv.config();

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

app.get('/', (_req: Request, res: Response): any => {
  return responseHelper({
    res,
    status: 'success',
    code: 200,
    data: { message: 'Smart Book Agent is live!' }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
