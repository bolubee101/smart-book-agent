import { scrapeBooks } from '../scraper/bookScraper';
import { enrichBook } from '../llm/enrichmentHelper';
import { computeBookMetrics } from '../utils/bookCalculations';
import { redisConnection } from '../configs/redis';

export const scrapeAndEnrich = async (theme: string, jobId: string) => {
    try {
        const books = await scrapeBooks(theme);
        const enrichedBooks = [];

        for (const book of books) {
            const enriched = await enrichBook(book.title, book.description, theme);
            const combined = computeBookMetrics({ ...book, ...enriched });
            enrichedBooks.push(combined);
        }

        await redisConnection.set(`job:${jobId}:status`, 'completed');
        await redisConnection.set(`job:${jobId}:result`, JSON.stringify(enrichedBooks));
    } catch (error) {
        console.log(error)
        await redisConnection.set(`job:${jobId}:status`, 'failed');
        await redisConnection.set(`job:${jobId}:error`, (error as Error).message);
    }
};
