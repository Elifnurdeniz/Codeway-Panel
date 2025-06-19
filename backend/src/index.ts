import express from 'express'
import dotenv from 'dotenv'
import { validateApiKey } from './middleware/validateApiKey'
import { getConfig }      from './services/configService'

dotenv.config()
const app = express()
const PORT = process.env.PORT || 8080

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

app.listen(PORT, () => {
  console.log(`Config API listening on http://localhost:${PORT}`)
})
