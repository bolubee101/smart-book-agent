// src/utils/responseHelper.ts
import { Response } from 'express';
import { redisConnection } from '../configs/redis';

interface ResponsePayload<T = any> {
  res: Response;
  status: string;
  code: number;
  data: T;
}

export const responseHelper = <T>(payload: ResponsePayload<T>) => {
  const { res, status, code, data } = payload;
  return res.status(code).json({ status, data });
};

export const stripCodeBlock = (text: string): string => {
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```$/, '')
    .trim();
};

