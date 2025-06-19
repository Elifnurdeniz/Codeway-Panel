import { Request, Response, NextFunction } from 'express'
import * as admin from 'firebase-admin'

export async function validateFirebaseIdToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const auth = req.header('Authorization') || ''
  if (!auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Authorization header' })
  }
  const idToken = auth.split('Bearer ')[1]
  try {
    const decoded = await admin.auth().verifyIdToken(idToken)
    ;(req as any).user = decoded   // if you want user info later
    return next()
  } catch (e) {
    console.error('Token verify failed', e)
    return res.status(401).json({ error: 'Unauthorized' })
  }
}
