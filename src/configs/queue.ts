import { Queue, Worker } from 'bullmq';
import { redisConnection } from './redis';
import { scrapeAndEnrich } from '../jobs/scrapper';
import { getQueueConcurrency } from '../utils/getConcurrency';

export const scrapeQueue = new Queue('scrape-queue', {
    connection: redisConnection
});

export let scrapeWorker: Worker;

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
