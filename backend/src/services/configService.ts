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


/**
 * Fetches all config_params and returns a flat key→value map.
 * If `country` is provided, looks for overrides in
 *   config_params/{paramId}/overrides where override.country === COUNTRY.
 */
export async function getConfig(country?: string): Promise<Record<string, any>> {
  const result: Record<string, any> = {}
  // 1️⃣ load all default params
  const snap = await db.collection('config_params').get()
  const countryCode = country?.toUpperCase()

  // 2️⃣ in one go, fetch every override doc whose `country` field matches
  const overrideMap: Record<string, any> = {}
  if (countryCode) {
    const oSnap = await db
      .collectionGroup('overrides')
      .where('country', '==', countryCode)
      .get()

    // build a map:  parentParamId → overrideValue
    oSnap.docs.forEach(d => {
      const parentId = d.ref.parent.parent!.id
      overrideMap[parentId] = d.data().value
    })
  }

  // 3️⃣ assemble final result, preferring overrides
  snap.docs.forEach(doc => {
    let val: any = overrideMap[doc.id] ?? doc.data().value

    // coerce strings to number/boolean if applicable
    if (typeof val === 'string') {
      if (/^-?\d+(\.\d+)?$/.test(val)) {
        val = parseFloat(val)
      } else if (/^(true|false)$/i.test(val)) {
        val = val.toLowerCase() === 'true'
      }
    }

    result[doc.data().key] = val
  })

  return result
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

export interface OverrideRecord {
  country: string
  value: any
  version: number
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

export interface UpdateOverridePayload {
  value:    any
  version:  number
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