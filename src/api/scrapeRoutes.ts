import { Router } from 'express';
import {
    handleScrapeRequest,
    handleStatusCheck,
    handleResultsFetch
} from '../controllers/scrapeController';

const router = Router();

router.post('/scrape', handleScrapeRequest);
router.get('/status/:jobId', handleStatusCheck);
router.get('/results/:jobId', handleResultsFetch);

export default router;
