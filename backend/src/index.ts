import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import { validateApiKey } from './middleware/validateApiKey'
import { validateFirebaseIdToken } from './middleware/validateFirebaseIdToken'
import { getConfig, addParam, updateParam, deleteParam, addOverride, updateOverride, deleteOverride, OverrideRecord } from './services/configService'
import path from 'path'


dotenv.config()
const app = express()
app.use(cors({
  origin: 'http://localhost:5173',      // or '*' for any origin
  methods: ['GET','POST','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','x-api-key','Authorization']
}))
const PORT = process.env.PORT || 8080
app.use(express.json())

// Public endpoint: returns defaults only
app.get('/v1/config', validateApiKey, async (req, res) => {
  try {
    // Extract country from query parameters
    const country = typeof req.query.country === 'string'
      ? req.query.country
      : undefined

    // pass it through to your service
    const json = await getConfig(country)
    res
      .set('Cache-Control', 'public, max-age=300')
      .json(json)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch config' })
  }
})

app.post('/v1/config',
  validateApiKey,
  validateFirebaseIdToken,    // ← runs after JSON-parsing
  async (req, res) => {
    try {
      // now req.body is defined
      const { key, value, description } = req.body
      if (!key || !value) {
        return res.status(400).json({ error: 'key and value are required' })
      }
      await addParam({ key, value, description })
      return res.status(201).json({ success: true })
    } catch (err) {
      console.error('addParam failed', err)
      return res.status(500).json({ error: 'Failed to add config param' })
    }
  }
)

app.patch(
  '/v1/config/:key',
  validateApiKey,
  validateFirebaseIdToken,
  async (req, res) => {
    const paramKey = req.params.key
    const { value, description, version } = req.body

    if (value === undefined || version === undefined) {
      return res
        .status(400)
        .json({ error: 'Must send { value, version, description? }' })
    }

    try {
      await updateParam(paramKey, { value, description, version })
      // 204 No Content on success
      return res.sendStatus(204)
    } catch (err: any) {
      console.error('updateParam failed', err)

      if (err.code === 'NOT_FOUND') {
        return res.status(404).json({ error: err.message })
      }
      if (err.code === 'VERSION_CONFLICT') {
        return res
          .status(409)
          .json({ error: 'Update conflict: version mismatch' })
      }

      return res.status(500).json({ error: 'Failed to update config param' })
    }
  }
)


app.delete(
  '/v1/config/:id',
  validateApiKey,
  validateFirebaseIdToken,
  async (req, res) => {
    await deleteParam(req.params.id)
    res.sendStatus(204)
  }
)

// add override
app.post(
  '/v1/config/:paramId/overrides',
  validateApiKey,
  validateFirebaseIdToken,
  async (req, res) => {
    const { country, value } = req.body
    if (!country || value === undefined) {
      return res
        .status(400)
        .json({ error: 'Must send { country, value }' })
    }
    try {
      await addOverride(req.params.paramId, country.toUpperCase(), value)
      return res.status(201).json({ success: true })
    } catch (err: any) {
      console.error(err)
      if (err.code === 'ALREADY_EXISTS') {
        return res.status(409).json({ error: err.message })
      }
      return res.status(500).json({ error: 'Failed to add override' })
    }
  }
)

// update override
app.patch(
  '/v1/config/:paramId/overrides/:country',
  validateApiKey,
  validateFirebaseIdToken,
  async (req, res) => {
    const { value, version } = req.body
    if (value === undefined || version === undefined) {
      return res
        .status(400)
        .json({ error: 'Must send { value, version }' })
    }
    try {
      await updateOverride(
        req.params.paramId,
        req.params.country.toUpperCase(),
        { value, version }
      )
      return res.sendStatus(204)
    } catch (err: any) {
      console.error(err)
      if (err.code === 'NOT_FOUND') {
        return res.status(404).json({ error: err.message })
      }
      if (err.code === 'VERSION_CONFLICT') {
        return res
          .status(409)
          .json({ error: 'Version conflict—please reload and try again' })
      }
      return res.status(500).json({ error: 'Failed to update override' })
    }
  }
)

// delete override
app.delete(
  '/v1/config/:paramId/overrides/:country',
  validateApiKey,
  validateFirebaseIdToken,
  async (req, res) => {
    try {
      await deleteOverride(
        req.params.paramId,
        req.params.country.toUpperCase()
      )
      return res.sendStatus(204)
    } catch (err) {
      console.error(err)
      return res.status(500).json({ error: 'Failed to delete override' })
    }
  }
)

app.use(express.static(path.join(__dirname, '../..', 'dist')))
// any “unknown” GET should serve your index.html:
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../..', 'dist', 'index.html'))
})


app.listen(PORT, () => {
  console.log(`Config API listening on http://localhost:${PORT}`)
})
