import { db } from '../firebaseAdmin'
import * as admin from 'firebase-admin'
import { Firestore } from 'firebase-admin/firestore'
const dbAdmin = admin.firestore() as Firestore

export interface UpdateParamPayload {
  value: any
  description?: string
  version: number          // client’s last‐known version
}

export interface UpdateOverridePayload {
  value:    any
  version:  number
}

export interface OverrideRecord {
  country: string
  value: any
  version: number
}

// get a specific config param by ID
export async function listOverrides(paramId: string): Promise<OverrideRecord[]> {
  const snap = await db
    .collection('config_params')
    .doc(paramId)
    .collection('overrides')
    .get()

  return snap.docs.map(d => {
    const data = d.data()
    return {
      country: d.id,
      value:   data.value,
      version: data.version ?? 0,
    }
  })
}

// add new override under optimistic-lock (version starts at 0)
export async function addOverride(
  paramId: string,
  country: string,
  value: any
): Promise<void> {
  const ref = dbAdmin
    .collection('config_params')
    .doc(paramId)
    .collection('overrides')
    .doc(country)

  await dbAdmin.runTransaction(async tx => {
    const snap = await tx.get(ref)
    if (snap.exists) {
      const err = new Error(`Override for ${country} already exists`)
      ;(err as any).code = 'ALREADY_EXISTS'
      throw err
    }
    tx.create(ref, {
      country,
      value,
      version:     0,
      createdAt:   admin.firestore.FieldValue.serverTimestamp(),
      updatedAt:   admin.firestore.FieldValue.serverTimestamp(),
    })
  })
}


// update an existing override under optimistic-lock
export async function updateOverride(
  paramId: string,
  country: string,
  payload: UpdateOverridePayload
): Promise<void> {
  const ref = dbAdmin
    .collection('config_params')
    .doc(paramId)
    .collection('overrides')
    .doc(country)

  await dbAdmin.runTransaction(async tx => {
    const snap = await tx.get(ref)
    if (!snap.exists) {
      const err = new Error(`Override not found for ${country}`)
      ;(err as any).code = 'NOT_FOUND'
      throw err
    }
    const data = snap.data() as any
    const currentVersion = typeof data.version === 'number' ? data.version : 0
    if (currentVersion !== payload.version) {
      const err = new Error(
        `Version mismatch (current=${currentVersion}, you sent=${payload.version})`
      )
      ;(err as any).code = 'VERSION_CONFLICT'
      throw err
    }
    tx.update(ref, {
      value:       payload.value,
      updatedAt:   admin.firestore.FieldValue.serverTimestamp(),
      version:     currentVersion + 1,
    })
  })
}

// delete an override
export async function deleteOverride(
  paramId: string,
  country: string
): Promise<void> {
  await dbAdmin
    .collection('config_params')
    .doc(paramId)
    .collection('overrides')
    .doc(country)
    .delete()
}