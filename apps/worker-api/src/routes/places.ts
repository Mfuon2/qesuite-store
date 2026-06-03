import { Hono } from 'hono'
import { Env, Variables } from '../types'

const places = new Hono<{ Bindings: Env; Variables: Variables }>()

// GET /api/places/autocomplete?q=... — proxy to Google Places (key stays server-side)
places.get('/autocomplete', async (c) => {
  const q = c.req.query('q')
  if (!q || q.trim().length < 2) {
    return c.json({ success: true, data: [], error: null })
  }

  if (!c.env.GOOGLE_PLACES_KEY) {
    return c.json({ success: false, error: 'Places API not configured', data: null }, 503)
  }

  try {
    const qs = new URLSearchParams({
      input: q,
      key: c.env.GOOGLE_PLACES_KEY,
      components: 'country:ke',
      language: 'en',
      types: 'geocode|establishment',
    })
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${qs}`
    )
    const data = await res.json() as {
      status: string
      predictions: Array<{
        place_id: string
        description: string
        structured_formatting: { main_text: string; secondary_text?: string }
      }>
    }

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places autocomplete error:', data.status)
      return c.json({ success: false, error: data.status, data: null }, 502)
    }

    return c.json({ success: true, data: data.predictions ?? [], error: null })
  } catch (err) {
    console.error('places autocomplete error', err)
    return c.json({ success: false, error: 'Places lookup failed', data: null }, 500)
  }
})

// GET /api/places/details?place_id=... — get lat/lng for a selected place
places.get('/details', async (c) => {
  const placeId = c.req.query('place_id')
  if (!placeId) return c.json({ success: false, error: 'place_id required', data: null }, 400)

  if (!c.env.GOOGLE_PLACES_KEY) {
    return c.json({ success: false, error: 'Places API not configured', data: null }, 503)
  }

  try {
    const qs = new URLSearchParams({
      place_id: placeId,
      fields: 'geometry,formatted_address',
      key: c.env.GOOGLE_PLACES_KEY,
    })
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${qs}`
    )
    const data = await res.json() as {
      status: string
      result?: {
        formatted_address: string
        geometry: { location: { lat: number; lng: number } }
      }
    }

    if (data.status !== 'OK' || !data.result) {
      return c.json({ success: false, error: 'Place not found', data: null }, 404)
    }

    return c.json({
      success: true,
      data: {
        address: data.result.formatted_address,
        lat: data.result.geometry.location.lat,
        lng: data.result.geometry.location.lng,
      },
      error: null,
    })
  } catch (err) {
    console.error('places details error', err)
    return c.json({ success: false, error: 'Places details failed', data: null }, 500)
  }
})

export default places
