// src/utils/responseHelper.ts
import { Response } from 'express';

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
