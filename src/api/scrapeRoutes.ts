import { Router } from 'express';
import {
    handleScrapeRequest,
    handleStatusCheck,
    handleResultsFetch
} from '../controllers/scrapeController';
import { scrapeRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/scrape', scrapeRateLimiter, handleScrapeRequest);
router.get('/status/:jobId', handleStatusCheck);
router.get('/results/:jobId', handleResultsFetch);

export default router;
