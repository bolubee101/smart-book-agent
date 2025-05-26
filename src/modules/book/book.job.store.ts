import { redisConnection } from '../../configs/redis';

export type JobStatus = 'processing' | 'completed' | 'failed';

export interface JobData {
    status: JobStatus;
    result?: any;
    error?: string;
}

const getJobKey = (jobId: string, field: 'status' | 'result' | 'error') => `job:${jobId}:${field}`;

export const createJob = async (jobId: string) => {
    await redisConnection.set(getJobKey(jobId, 'status'), 'processing');
};

export const updateJob = async (jobId: string, data: Partial<JobData>) => {
    if (data.status) {
        await redisConnection.set(getJobKey(jobId, 'status'), data.status);
    }
    if (data.result) {
        await redisConnection.set(getJobKey(jobId, 'result'), JSON.stringify(data.result));
    }
    if (data.error) {
        await redisConnection.set(getJobKey(jobId, 'error'), data.error);
    }
};

export const hasJob = async (jobId: string): Promise<boolean> => {
    const status = await redisConnection.get(getJobKey(jobId, 'status'));
    return !!status;
};

export const getJob = async (jobId: string): Promise<JobData | undefined> => {
    const status = await redisConnection.get(getJobKey(jobId, 'status'));
    if (!status) return undefined;

    const resultRaw = await redisConnection.get(getJobKey(jobId, 'result'));
    const error = await redisConnection.get(getJobKey(jobId, 'error'));

    return {
        status: status as JobStatus,
        result: resultRaw ? JSON.parse(resultRaw) : undefined,
        error: error || undefined
    };
};
