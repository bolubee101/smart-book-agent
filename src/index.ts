import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import scrapeRoutes from './api/scrapeRoutes';
import { responseHelper } from './utils/helpers';
import { logUrl } from './middleware/logUrl';
import { initializeScrapeWorker } from './configs/queue';

dotenv.config();

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);

app.use(logUrl)
app.use(express.json());

app.use('/api', scrapeRoutes);

app.get('/', (_req: Request, res: Response): any => {
  return responseHelper({
    res,
    status: 'success',
    code: 200,
    data: { message: 'Smart Book Agent is live!' }
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

(async () => {
  await initializeScrapeWorker();
})();
