import { Request, Response, NextFunction } from 'express'
import dotenv from 'dotenv'
dotenv.config()

export function validateApiKey(req: Request, res: Response, next: NextFunction) {
  const key = req.header('x-api-key')
  if (key !== process.env.PUBLIC_API_KEY) {
    return res.status(401).json({ error: 'Invalid or missing API key' })
  }
  next()
}
