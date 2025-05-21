import { redisConnection } from '../configs/redis';

export const getQueueConcurrency = async (key = 'settings:scrape_queue_concurrency'): Promise<number> => {
    const value = await redisConnection.get(key);
    const parsed = parseInt(value || '10', 20)
    return isNaN(parsed) ? 20 : parsed;
};
