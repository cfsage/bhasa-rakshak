import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

type SearchResult = {
  id: number
  confidence: number
}

const LOCAL_ARTIFACTS: { id: number; keywords: string[] }[] = [
  { id: 1, keywords: ['protection', 'ceremony', 'festival', 'mask', 'spirit', 'newar', 'indra jatra', 'guardian', 'deity'] },
  { id: 2, keywords: ['music', 'celebration', 'drum', 'culture', 'storytelling', 'tamang', 'selo', 'indigenous', 'rhythm'] },
  { id: 3, keywords: ['art', 'nature', 'harvest', 'village', 'painting', 'tharu', 'terai', 'agriculture', 'sustainable'] },
]

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const query: string = (body?.query || '').toString().trim()
    if (!query) {
      return NextResponse.json({ results: [] })
    }

    const QDRANT_URL = process.env.QDRANT_URL
    const QDRANT_API_KEY = process.env.QDRANT_API_KEY
    const QDRANT_COLLECTION = process.env.QDRANT_COLLECTION || 'nepal_heritage'
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY

    let auditModel: string | undefined
    let auditMethod: string | undefined
    let auditResults: SearchResult[] | undefined

    if (QDRANT_URL && QDRANT_API_KEY) {
      let vector: number[] | null = null
      const provider = (process.env.EMBED_PROVIDER || '').toLowerCase()
      if (provider === 'aimlapi') {
        const url = process.env.AIMLAPI_EMBED_URL || 'https://api.aimlapi.com/v1/embeddings'
        const key = process.env.AIMLAPI_KEY
        const model = process.env.AIMLAPI_EMBED_MODEL || 'text-embedding-3-large'
        if (key) {
          try {
            const res = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`,
              },
              body: JSON.stringify({ input: query, model }),
            })
            if (res.ok) {
              const data = await res.json()
              const arr = Array.isArray(data?.data) ? data.data : []
              const emb = arr[0]?.embedding as number[] | undefined
              if (Array.isArray(emb)) {
                vector = emb
                auditModel = model
              }
            }
          } catch {}
        }
      } else if (GEMINI_API_KEY) {
        try {
          const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
          try {
            const m1 = genAI.getGenerativeModel({ model: 'embedding-001' })
            const r1 = await m1.embedContent(query)
            vector = Array.isArray(r1?.embedding?.values) ? r1.embedding.values as number[] : null
            auditModel = 'embedding-001'
          } catch {
            const m2 = genAI.getGenerativeModel({ model: 'text-embedding-004' })
            const r2 = await m2.embedContent(query)
            vector = Array.isArray(r2?.embedding?.values) ? r2.embedding.values as number[] : null
            auditModel = 'text-embedding-004'
          }
        } catch {}
      }

      if (vector && Array.isArray(vector) && vector.length > 0) {
        try {
          const res = await fetch(`${QDRANT_URL}/collections/${QDRANT_COLLECTION}/points/search`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'api-key': QDRANT_API_KEY,
            },
            body: JSON.stringify({
              vector,
              limit: 5,
              with_payload: true,
            }),
          })
          if (res.ok) {
            const data = await res.json()
            const points = (data?.result || []) as Array<{ payload?: Record<string, unknown>; score?: number }>
            const results: SearchResult[] = []
            for (const p of points) {
              const id = Number(p?.payload?.artifactId)
              const conf = typeof p?.score === 'number' ? Math.max(0, Math.min(1, p.score)) : 0.75
              if (!Number.isNaN(id)) {
                results.push({ id, confidence: conf })
              }
            }
            if (results.length > 0) {
              auditMethod = 'vector_search'
              auditResults = results
              return NextResponse.json({ results, audit: { model: auditModel, method: auditMethod, results: auditResults, timestamp: new Date().toISOString() } })
            }
          }
        } catch {}
      }

      try {
        const res = await fetch(`${QDRANT_URL}/collections/${QDRANT_COLLECTION}/points/scroll`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': QDRANT_API_KEY,
          },
          body: JSON.stringify({
            limit: 10,
            filter: {
              should: [
                { key: 'keywords', match: { text: query } },
                { key: 'title', match: { text: query } },
                { key: 'description', match: { text: query } },
                { key: 'language', match: { text: query } },
              ],
            },
          }),
        })
        if (res.ok) {
          const data = await res.json()
          const points = (data?.result?.points || []) as Array<{ payload?: Record<string, unknown> }>
          const results: SearchResult[] = []
          for (const p of points) {
            const id = Number(p?.payload?.artifactId)
            if (!Number.isNaN(id)) {
              results.push({ id, confidence: 0.7 })
            }
          }
          if (results.length > 0) {
            auditMethod = 'payload_filter'
            auditResults = results
            return NextResponse.json({ results, audit: { model: auditModel, method: auditMethod, results: auditResults, timestamp: new Date().toISOString() } })
          }
        }
      } catch {}
    }

    const q = query.toLowerCase()
    const results: SearchResult[] = LOCAL_ARTIFACTS.map(a => {
      const score = a.keywords.reduce((acc, k) => acc + (k.includes(q) || q.includes(k) ? 1 : 0), 0)
      return { id: a.id, confidence: score > 0 ? Math.min(0.9, 0.5 + score * 0.1) : 0 }
    })
      .filter(r => r.confidence > 0)
      .sort((a, b) => b.confidence - a.confidence)

    auditMethod = 'local_keywords'
    auditResults = results
    return NextResponse.json({ results, audit: { model: auditModel, method: auditMethod, results: auditResults, timestamp: new Date().toISOString() } })
  } catch {
    return NextResponse.json({ results: [] })
  }
}