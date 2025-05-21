import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { scrapeQueue } from '../configs/queue';
import { responseHelper } from '../utils/responseHelper';
import { createJob, getJob, hasJob } from '../store/jobStore';

export const handleScrapeRequest = async (req: Request, res: Response): Promise<any> => {
    const { theme } = req.body;

    if (!theme || typeof theme !== 'string') {
        return responseHelper({ res, status: 'fail', code: 400, data: { message: 'Invalid theme' } });
    }

    const jobId = uuidv4();

    await createJob(jobId);
    await scrapeQueue.add('scrape', { theme, jobId });

    return responseHelper({ res, status: 'success', code: 202, data: { jobId } });
};

export const handleStatusCheck = async (req: Request, res: Response): Promise<any> => {
    const { jobId } = req.params;

    if (!(await hasJob(jobId))) {
        return responseHelper({ res, status: 'fail', code: 404, data: { message: 'Job not found' } });
    }

    const job = await getJob(jobId);
    return responseHelper({ res, status: 'success', code: 200, data: { status: job?.status } });
};

export const handleResultsFetch = async (req: Request, res: Response): Promise<any> => {
    const { jobId } = req.params;

    if (!(await hasJob(jobId))) {
        return responseHelper({ res, status: 'fail', code: 404, data: { message: 'Job not found' } });
    }

    const job = await getJob(jobId);

    if (!job || job.status !== 'completed') {
        return responseHelper({
            res,
            status: 'fail',
            code: 400,
            data: { message: `Job is ${job?.status}` }
        });
    }

    return responseHelper({
        res,
        status: 'success',
        code: 200,
        data: job.result
    });
};
