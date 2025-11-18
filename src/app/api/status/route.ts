import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const provider = (process.env.EMBED_PROVIDER || '').toLowerCase()
    const model = provider === 'aimlapi' ? (process.env.AIMLAPI_EMBED_MODEL || '') : (process.env.GEMINI_API_KEY ? 'embedding-001' : '')
    const QDRANT_URL = process.env.QDRANT_URL
    const QDRANT_API_KEY = process.env.QDRANT_API_KEY
    const QDRANT_COLLECTION = process.env.QDRANT_COLLECTION || ''
    let qdrantConnected = false
    if (QDRANT_URL && QDRANT_API_KEY && QDRANT_COLLECTION) {
      try {
        const res = await fetch(`${QDRANT_URL}/collections/${QDRANT_COLLECTION}`, {
          headers: { 'api-key': QDRANT_API_KEY },
        })
        qdrantConnected = res.ok
      } catch {}
    }
    return NextResponse.json({ provider, model, collection: QDRANT_COLLECTION, qdrantConnected, timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json({ provider: '', model: '', collection: '', qdrantConnected: false, timestamp: new Date().toISOString() })
  }
}