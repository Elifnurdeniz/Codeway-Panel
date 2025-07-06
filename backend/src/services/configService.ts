// backend/src/services/configService.ts
import { db } from '../firebaseAdmin'
import * as admin from 'firebase-admin'
import { Firestore } from 'firebase-admin/firestore'
const dbAdmin = admin.firestore() as Firestore


export interface NewParam {
  key: string
  value: any
  description?: string
}

export interface UpdateParamPayload {
  value: any
  description?: string
  version: number          // client’s last‐known version
}

export interface ParamRecord {
  id: string
  key: string
  value: string
  description?: string
  createdAt: string
  version: number
}

/**
 * Lists parameters with pagination.
 */
export async function listParams(
  sort: 'asc' | 'desc',
  pageSize: number,
  startAfterId?: string
): Promise<{
  items: ParamRecord[]
  nextCursor?: string
}> {
  const fetchSize = pageSize + 1
  let q = db
    .collection('config_params')
    .orderBy('createdAt', sort)
    .limit(fetchSize)

  if (startAfterId) {
    const lastDoc = await db.doc(`config_params/${startAfterId}`).get()
    if (lastDoc.exists) q = q.startAfter(lastDoc)
  }

  const snap = await q.get()
  const docs = snap.docs

  const hasMore = docs.length === fetchSize
  const pageDocs = hasMore ? docs.slice(0, pageSize) : docs

  const items = pageDocs.map(d => {
    const data = d.data()
    return {
      id:          d.id,
      key:         data.key,
      value:       data.value,
      description: data.description,
      createdAt:   data.createdAt.toDate().toISOString(),
      version:     data.version ?? 0,
    }
  })

  const nextCursor = hasMore
    ? pageDocs[pageDocs.length - 1].id
    : undefined

  return { items, nextCursor }
}



/**
 * Adds a new parameter to the collection.
 */
export async function addParam(p: {
  key: string
  value: any
  description?: string
}) {
  return await db.collection('config_params').add({
    key:         p.key,
    value:       p.value,
    description: p.description ?? '',
    createdAt:   admin.firestore.FieldValue.serverTimestamp(),
    updatedAt:   admin.firestore.FieldValue.serverTimestamp(),
    version:     0
  })
}

/**
 * Updates an existing parameter by its Firestore document ID.
 */
export async function updateParam(
  paramKey: string,
  payload: UpdateParamPayload
): Promise<void> {
  await db.runTransaction(async tx => {
    // 1) look up the one doc whose `key === paramKey`
    const col = db.collection('config_params')
    const q   = col.where('key', '==', paramKey).limit(1)
    const snap = await tx.get(q)

    if (snap.empty) {
      const err = new Error(`No parameter found with key="${paramKey}"`)
      ;(err as any).code = 'NOT_FOUND'
      throw err
    }

    const docSnap = snap.docs[0]
    const docRef  = docSnap.ref
    const data    = docSnap.data()
    const currentVersion = typeof data.version === 'number' ? data.version : 0

    // 2) optimistic‐lock check
    if (currentVersion !== payload.version) {
      const err = new Error(
        `Version mismatch (current=${currentVersion}, you sent=${payload.version})`
      )
      ;(err as any).code = 'VERSION_CONFLICT'
      throw err
    }

    // 3) apply the update + bump version
    const newVersion = currentVersion + 1
    const updateData: Record<string, any> = {
      value:       payload.value,
      updatedAt:   admin.firestore.FieldValue.serverTimestamp(),
      version:     newVersion
    }
    if (payload.description !== undefined) {
      updateData.description = payload.description
    }

    tx.update(docRef, updateData)
  })
}


/**
 * Deletes a parameter.
 */
export async function deleteParam(id: string) {
  await db.collection('config_params').doc(id).delete()
}

