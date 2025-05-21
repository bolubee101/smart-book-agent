import rateLimit from 'express-rate-limit';

export const scrapeRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        status: 'fail',
        data: { message: 'Too many scrape requests from this IP. Please try again later.' }
    },
    standardHeaders: true,
    legacyHeaders: false
});
