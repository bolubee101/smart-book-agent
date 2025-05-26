import { Queue, Worker } from 'bullmq';
import { redisConnection } from './redis';
import { scrapeAndEnrich } from '../modules/book/book.scraper';

export const scrapeQueue = new Queue('scrape-queue', {
    connection: redisConnection
});

export let scrapeWorker: Worker;

export const getQueueConcurrency = async (key = 'settings:scrape_queue_concurrency'): Promise<number> => {
    const value = await redisConnection.get(key);
    const parsed = parseInt(value || '5', 10);
    return isNaN(parsed) ? 5 : parsed;
};

export const initializeScrapeWorker = async () => {
    const concurrency = await getQueueConcurrency();

    scrapeWorker = new Worker(
        'scrape-queue',
        async job => {
            await scrapeAndEnrich(job.data.theme, job.data.jobId);
        },
        {
            connection: redisConnection,
            concurrency
        }
    );

    console.log(`[Scrape Worker] Started with concurrency: ${concurrency}`);
};
