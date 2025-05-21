type JobStatus = 'processing' | 'completed' | 'failed';

interface JobData {
    status: JobStatus;
    result?: any;
    error?: string;
}

const jobStore = new Map<string, JobData>();

export const createJob = (jobId: string) => {
    jobStore.set(jobId, { status: 'processing' });
};

export const updateJob = (jobId: string, data: Partial<JobData>) => {
    const current = jobStore.get(jobId);
    if (current) {
        jobStore.set(jobId, { ...current, ...data });
    }
};

export const getJob = (jobId: string): JobData | undefined => {
    return jobStore.get(jobId);
};

export const hasJob = (jobId: string): boolean => {
    return jobStore.has(jobId);
};
