// backend/src/services/configService.ts
import { db } from '../firebaseAdmin'

/**
 * Fetches all config_params and returns a flat key→value map.
 * If `country` is provided, looks for overrides in config_params/{paramId}/overrides/{COUNTRY}.
 */
export async function getConfig(country?: string): Promise<Record<string, any>> {
  const result: Record<string, any> = {}
  const snap = await db.collection('config_params').get()
  const countryCode = country?.toUpperCase()

  for (const doc of snap.docs) {
    const data = doc.data()
    let val: any = data.value

    // if a country was specified, try to fetch an override
    if (countryCode) {
      const overrideSnap = await db
        .collection('config_params')
        .doc(doc.id)
        .collection('overrides')
        .doc(countryCode)
        .get()

      if (overrideSnap.exists) {
        const overrideData = overrideSnap.data()
        // use override value if present
        if (overrideData && overrideData.value !== undefined) {
          val = overrideData.value
        }
      }
    }

    // If it's a string, try to parse numbers & booleans
    if (typeof val === 'string') {
      // number? (integers or floats, including negatives)
      if (/^-?\d+(\.\d+)?$/.test(val)) {
        val = parseFloat(val)
      }
      // boolean?
      else if (/^(true|false)$/i.test(val)) {
        val = val.toLowerCase() === 'true'
      }
    }

    result[data.key] = val
  }

  return result
}
