// backend/src/services/configService.ts
import { db } from '../firebaseAdmin'

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
