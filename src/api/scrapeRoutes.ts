import { Router } from 'express';
import { scrapeRateLimiter } from '../middleware/rateLimiter';
import { handleResultsFetch, handleScrapeRequest, handleStatusCheck } from '../modules/book/book.controller';

const router = Router();

router.post('/scrape', scrapeRateLimiter, handleScrapeRequest);
router.get('/status/:jobId', handleStatusCheck);
router.get('/results/:jobId', handleResultsFetch);

export default router;
