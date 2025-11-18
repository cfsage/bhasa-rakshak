'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, Shield, Volume2 } from 'lucide-react'
import ArtifactCard from '@/components/ArtifactCard'

interface Artifact {
  id: number
  title: string
  language: string
  imageUrl: string
  audioUrl: string
  description: string
  keywords: string[]
}

const mockArtifacts: Artifact[] = [
  {
    id: 1,
    title: 'Lakhe Mask',
    language: 'Newari',
    imageUrl: '/images/lakhe-mask.svg',
    audioUrl: '/Audio/newari_story.wav',
    description: 'The Lakhe mask is a sacred artifact of the Newar community, representing the protective demon deity who dances through the streets of Kathmandu during Indra Jatra festival. This fierce-faced guardian with his third eye and golden ornaments wards off evil spirits while blessing the community with prosperity. The mask embodies centuries of Newari craftsmanship, where each carved detail tells stories of divine protection and cultural resilience passed down through generations of master artisans.',
    keywords: ['protection', 'ceremony', 'festival', 'mask', 'spirit', 'newar', 'kathmandu', 'indra jatra', 'guardian', 'deity']
  },
  {
    id: 2,
    title: 'Damphu Drum',
    language: 'Tamang',
    imageUrl: '/images/damphu-drum.svg',
    audioUrl: '/Audio/tamang_story.wav',
    description: 'The Damphu drum resonates with the heartbeat of Tamang culture, its rhythmic beats echoing through the Himalayan foothills where this indigenous community has lived for millennia. Crafted from wood and animal skin, this circular frame drum accompanies the Tamang Selo dance and preserves ancient stories of mountain life, Buddhist traditions, and the community\'s deep connection to the land. Each beat carries the wisdom of ancestors who used these rhythms to celebrate harvests, mark life passages, and maintain their unique linguistic and cultural identity.',
    keywords: ['music', 'celebration', 'drum', 'culture', 'storytelling', 'tamang', 'himalayan', 'selo', 'indigenous', 'rhythm']
  },
  {
    id: 3,
    title: 'Tharu Wall Art',
    language: 'Tharu',
    imageUrl: '/images/tharu-wall-art.svg',
    audioUrl: '/Audio/tharu_story.wav',
    description: 'Tharu wall paintings transform simple mud walls into vibrant canvases that tell the story of Nepal\'s first inhabitants, the Tharu people who have lived in the Terai forests for thousands of years. These earth-toned murals depict the sacred relationship between humans, nature, and the spiritual world - showing rice fields that sustain life, peacocks that bring good fortune, fish that represent abundance, and the sun that governs agricultural cycles. Each brushstroke preserves ancient knowledge of sustainable living and the Tharu community\'s role as guardians of the southern plains, where their unique language and customs have flourished despite centuries of change.',
    keywords: ['art', 'nature', 'harvest', 'village', 'painting', 'tharu', 'terai', 'agriculture', 'indigenous', 'sustainable']
  }
]

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null)
  const [results, setResults] = useState<{ id: number; confidence: number }[]>([])
  const [audit, setAudit] = useState<{ model?: string; method?: string; results?: { id: number; confidence: number }[]; timestamp?: string } | null>(null)
  const [showAudit, setShowAudit] = useState(false)
  const [showAudioDiag, setShowAudioDiag] = useState(false)
  const [audioDiag, setAudioDiag] = useState<{ src: string; ready?: string; duration?: number; error?: string }[]>([])
  const aNewari = useRef<HTMLAudioElement | null>(null)
  const aTamang = useRef<HTMLAudioElement | null>(null)
  const aTharu = useRef<HTMLAudioElement | null>(null)
  const reqIdRef = useRef(0)
  const [isSearching, setIsSearching] = useState(false)
  const [status, setStatus] = useState<{ provider?: string; model?: string; qdrantConnected?: boolean } | null>(null)

  const filteredArtifacts = mockArtifacts.filter(artifact => {
    const searchLower = searchTerm.toLowerCase()
    return (
      artifact.title.toLowerCase().includes(searchLower) ||
      artifact.language.toLowerCase().includes(searchLower) ||
      artifact.description.toLowerCase().includes(searchLower) ||
      artifact.keywords.some(keyword => keyword.toLowerCase().includes(searchLower))
    )
  })

  const highlightedIds = useMemo(() => new Set(results.map(r => r.id)), [results])
  const sortedArtifacts = useMemo(() => {
    return [...filteredArtifacts].sort((a, b) => {
      const ah = highlightedIds.has(a.id) ? 1 : 0
      const bh = highlightedIds.has(b.id) ? 1 : 0
      if (ah !== bh) return bh - ah
      return a.title.localeCompare(b.title)
    })
  }, [filteredArtifacts, highlightedIds])

  useEffect(() => {
    const timeout = setTimeout(async () => {
      const q = searchTerm.trim()
      const myId = ++reqIdRef.current
      if (!q) {
        if (myId === reqIdRef.current) {
          setResults([])
          setAudit(null)
          setIsSearching(false)
        }
        return
      }
      try {
        if (myId === reqIdRef.current) setIsSearching(true)
        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q }),
          cache: 'no-store',
        })
        if (res.ok) {
          const data = await res.json()
          if (myId === reqIdRef.current) {
            setResults(Array.isArray(data?.results) ? data.results : [])
            setAudit(data?.audit ?? null)
            setIsSearching(false)
          }
        } else {
          if (myId === reqIdRef.current) {
            setResults([])
            setAudit(null)
            setIsSearching(false)
          }
        }
      } catch {
        if (myId === reqIdRef.current) {
          setResults([])
          setAudit(null)
          setIsSearching(false)
        }
      }
    }, 350)
    return () => {
      clearTimeout(timeout)
    }
  }, [searchTerm])

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch('/api/status', { cache: 'no-store' })
        if (r.ok) {
          const j = await r.json()
          setStatus(j)
        }
      } catch {}
    }
    load()
  }, [])

  const handlePlay = (artifactId: number) => {
    if (currentlyPlaying === artifactId) {
      setCurrentlyPlaying(null)
    } else {
      setCurrentlyPlaying(artifactId)
    }
  }

  useEffect(() => {
    const sources: { ref: React.MutableRefObject<HTMLAudioElement | null>; label: string }[] = [
      { ref: aNewari, label: '/Audio/Newari_voice.mp4' },
      { ref: aTamang, label: '/Audio/tamang_Audio.mp4' },
      { ref: aTharu, label: '/Audio/Tharu_voice.mp4' },
    ]
    const update = () => {
      const rows = sources.map(s => {
        const el = s.ref.current
        return {
          src: s.label,
          ready: el ? String(el.readyState) : '0',
          duration: el && isFinite(el.duration) ? el.duration : undefined,
          error: el && el.error ? String(el.error.code) : undefined,
        }
      })
      setAudioDiag(rows)
    }
    const handlers: Array<{ el: HTMLAudioElement; fn: () => void }> = []
    for (const s of sources) {
      const el = s.ref.current
      if (el) {
        const fn = () => update()
        el.addEventListener('loadedmetadata', fn)
        el.addEventListener('canplaythrough', fn)
        el.addEventListener('error', fn)
        handlers.push({ el, fn })
      }
    }
    update()
    return () => {
      for (const h of handlers) {
        h.el.removeEventListener('loadedmetadata', h.fn)
        h.el.removeEventListener('canplaythrough', h.fn)
        h.el.removeEventListener('error', h.fn)
      }
    }
  }, [])

  return (
    <main className="min-h-screen bg-slate-900">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
        <div className="relative px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="flex justify-center mb-6">
              <Shield className="w-16 h-16 text-amber-500" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              <span className="text-amber-400">BHASA</span> RAKSHAK
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              Saving the Soul of Nepal&apos;s Endangered Languages
            </p>
            <div className="mt-8 flex items-center justify-center gap-2 text-amber-500">
              <Volume2 className="w-5 h-5" />
              <span className="text-sm font-medium">Digital Museum of Cultural Heritage</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 lg:px-8 py-12">
        <div className="mx-auto max-w-4xl">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search for stories (e.g., Protection, Harvest, Nature)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
            />
            {isSearching ? (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">Searching…</div>
            ) : null}
          </div>
          <div className="mt-4 flex gap-2 flex-wrap">
            {['Protection','Festival','Nature','Harvest','Drum','Painting'].map(s => (
              <button key={s} onClick={() => setSearchTerm(s)} className="text-sm px-3 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700">
                {s}
              </button>
            ))}
            <button onClick={() => setShowAudit(a => !a)} className="ml-auto text-xs px-2 py-1 rounded bg-amber-700/40 border border-amber-600 text-amber-200">
              {showAudit ? 'Hide audit' : 'Show audit'}
            </button>
            <button onClick={() => setShowAudioDiag(a => !a)} className="text-xs px-2 py-1 rounded bg-amber-700/40 border border-amber-600 text-amber-200">
              {showAudioDiag ? 'Hide audio diagnostics' : 'Show audio diagnostics'}
            </button>
            {status ? (
              <span className={`text-xs px-2 py-1 rounded border ${status.qdrantConnected ? 'border-emerald-600 text-emerald-200 bg-emerald-700/20' : 'border-red-600 text-red-200 bg-red-700/20'}`}>
                {status.provider || 'n/a'} • {status.model || 'n/a'} • {status.qdrantConnected ? 'Qdrant: connected' : 'Qdrant: offline'}
              </span>
            ) : null}
          </div>
          {showAudit && audit ? (
            <div className="mt-3 text-xs text-slate-300 bg-slate-800 border border-slate-700 rounded p-3">
              <div>Method: {audit.method ?? 'n/a'}</div>
              <div>Model: {audit.model ?? 'n/a'}</div>
              <div>Time: {audit.timestamp ?? ''}</div>
              <div className="mt-2">Results: {Array.isArray(audit.results) ? audit.results.map(r => `${r.id}:${r.confidence.toFixed(2)}`).join(', ') : ''}</div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(audit, null, 2)], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'search_audit.json'
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                  className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-200"
                >
                  Export audit JSON
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(audit ?? {}, null, 2))
                  }}
                  className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-200"
                >
                  Copy audit
                </button>
              </div>
            </div>
          ) : null}
          {showAudioDiag ? (
            <div className="mt-3 text-xs text-slate-300 bg-slate-800 border border-slate-700 rounded p-3">
              {audioDiag.map(d => (
                <div key={d.src} className="flex gap-4"><span>{d.src}</span><span>ready:{d.ready ?? 'n/a'}</span><span>dur:{d.duration ? d.duration.toFixed(2) : 'n/a'}</span><span>err:{d.error ?? 'none'}</span></div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="px-6 lg:px-8 pb-24">
        <div className="mx-auto max-w-7xl">
          {audit?.method === 'local_keywords' ? (
            <div className="mb-4 text-sm text-amber-200 bg-amber-700/20 border border-amber-600 rounded p-3">
              Using local keyword matching. Set GEMINI_API_KEY and seed Qdrant for semantic search.
            </div>
          ) : null}
          {sortedArtifacts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 text-lg">No artifacts found matching your search.</p>
              <p className="text-slate-500 text-sm mt-2">Try different keywords like &quot;protection&quot;, &quot;harvest&quot;, or &quot;nature&quot;</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sortedArtifacts.map((artifact) => (
                <ArtifactCard
                  key={artifact.id}
                  title={artifact.title}
                  language={artifact.language}
                  imageUrl={artifact.imageUrl}
                  audioUrl={artifact.audioUrl}
                  description={artifact.description}
                  onPlay={() => handlePlay(artifact.id)}
                  isPlaying={currentlyPlaying === artifact.id}
                  highlighted={highlightedIds.has(artifact.id)}
                  badgeText={highlightedIds.has(artifact.id)
                    ? `Matched • ${(results.find(r => r.id === artifact.id)?.confidence ?? 0).toFixed(2)}`
                    : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="hidden">
        <audio preload="auto" ref={aNewari} src="/Audio/Newari_voice.mp4" />
        <audio preload="auto" ref={aTamang} src="/Audio/tamang_Audio.mp4" />
        <audio preload="auto" ref={aTharu} src="/Audio/Tharu_voice.mp4" />
      </div>
    </main>
  )
}