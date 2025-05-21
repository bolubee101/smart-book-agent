import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { scrapeBooks } from '../scraper/bookScraper';
import { enrichBook } from '../llm/enrichmentHelper';
import { computeBookMetrics } from '../utils/bookCalculations';
import { createJob, updateJob, getJob, hasJob } from '../store/jobStore';
import { responseHelper } from '../utils/responseHelper';
import { sendToMakeWebhook } from '../services/webHookSender';

export const handleScrapeRequest = async (req: Request, res: Response): Promise<any> => {
    const { theme } = req.body;

    if (!theme || typeof theme !== 'string') {
        return responseHelper({ res, status: 'fail', code: 400, data: { message: 'Invalid theme' } });
    }

    const jobId = uuidv4();
    createJob(jobId);

    (async () => {
        try {
            const books = await scrapeBooks(theme);
            const enrichedBooks = [];

            for (const book of books) {
                const enriched = await enrichBook(book.title, book.description, theme);
                const combined = computeBookMetrics({ ...book, ...enriched });
                enrichedBooks.push(combined);
            }
            updateJob(jobId, { status: 'completed', result: enrichedBooks })
            await sendToMakeWebhook({
                books: enrichedBooks
            });
        } catch (error) {
            updateJob(jobId, { status: 'failed', error: (error as Error).message });
        }
    })();

    return responseHelper({ res, status: 'success', code: 202, data: { jobId } });
};

export const handleStatusCheck = async (req: Request, res: Response): Promise<any> => {
    const { jobId } = req.params;

    if (!hasJob(jobId)) {
        return responseHelper({ res, status: 'fail', code: 404, data: { message: 'Job not found' } });
    }

    const job = getJob(jobId);
    return responseHelper({ res, status: 'success', code: 200, data: { status: job?.status } });
};

export const handleResultsFetch = async (req: Request, res: Response): Promise<any> => {
    const { jobId } = req.params;

    if (!hasJob(jobId)) {
        return responseHelper({ res, status: 'fail', code: 404, data: { message: 'Job not found' } });
    }

    const job = getJob(jobId);

    if (job && job?.status !== 'completed') {
        return responseHelper({
            res,
            status: 'fail',
            code: 400,
            data: { message: `Job is ${job.status}` }
        });
    }

    return responseHelper({
        res,
        status: 'success',
        code: 200,
        data: job?.result
    });
};
