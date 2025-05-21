import { Request, Response, NextFunction } from 'express';

export const logUrl = (req: Request, _res: Response, next: NextFunction) => {
    const {
        method,
        protocol,
        originalUrl,
        params,
        query,
        headers,
        connection: { remoteAddress }
    } = req;

    const log = {
        method,
        protocol,
        host: req.get('host'),
        originalUrl,
        ip: remoteAddress,
        params,
        query,
        headers,
        fullUrl: `${protocol}://${req.get('host')}${originalUrl}`
    };

    console.log('Incoming Request:', JSON.stringify(log, null, 2));
    next();
};
