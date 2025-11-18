# BHASA RAKSHAK — Digital Museum for Nepal’s Endangered Languages

An end‑to‑end demo preserving cultural heritage with instant audio playback, semantic search powered by AI/ML API embeddings + Qdrant, and an auditable decision workflow.

## Overview

- Artifact cards for Lakhe Mask (Newari), Damphu Drum (Tamang), Tharu Wall Art (Tharu)
- Zero‑latency audio playback using pre‑generated assets
- Semantic search backed by vector embeddings (AI/ML API or Gemini) and Qdrant nearest match
- Explainable results with an Audit panel (method, model, confidences, timestamp)
- Status badge displaying provider/model and Qdrant connectivity
- Workflow page explaining Intake → Understand → Decide → Review → Deliver

## Architecture

- Frontend: Next.js app (`src/app/page.tsx`, `src/components/ArtifactCard.tsx`)
- Intelligence: Embeddings via AI/ML API (OpenAI‑style) or Gemini
- Memory: Qdrant collection `hackathon` storing vectors + payloads
- Preservation: Voice cloning stub (OpenVoice V2 via Gradio) in `scripts/voice_clone_openvoice.py`
- Governance: `/workflow` page outlining Opus‑style pipeline and audit artifact

## Tech Stack

- Next.js 16, React 19, Tailwind CSS 4, lucide-react
- Qdrant Cloud (vector search)
- AI/ML API embeddings (default) or Google Gemini (fallback)

## Environment Variables

Create `bhasa-rakshak/.env`:

```env
QDRANT_URL=YOUR_QDRANT_URL
QDRANT_API_KEY=YOUR_QDRANT_API_KEY
QDRANT_COLLECTION=hackathon

# Embedding provider: aimlapi (default) or leave unset to use Gemini fallback
EMBED_PROVIDER=aimlapi
AIMLAPI_KEY=YOUR_AIMLAPI_KEY
AIMLAPI_EMBED_MODEL=text-embedding-3-large
AIMLAPI_EMBED_URL=https://api.aimlapi.com/v1/embeddings

# Optional fallback (if EMBED_PROVIDER not set or AIMLAPI_KEY missing)
GEMINI_API_KEY=YOUR_GEMINI_KEY
```

## Assets

Place audio and images in `public/`:

- `public/Audio/Newari_voice.mp4`
- `public/Audio/tamang_Audio.mp4`
- `public/Audio/Tharu_voice.mp4`
- `public/images/lakhe-mask.svg`
- `public/images/damphu-drum.svg`
- `public/images/tharu-wall-art.svg`

## Seed Qdrant (Python)

Populate the `hackathon` collection with 3 artifacts (vectors + payloads):

```bash
cd bhasa-rakshak
python -m pip install google-generativeai qdrant-client moviepy gradio_client requests
python scripts/seed_database.py
```

The script auto‑loads `.env` and supports both AI/ML API and Gemini embeddings.

## Run Locally

```bash
cd bhasa-rakshak
npm install
npm run dev
# open http://localhost:3000/
```

## API Endpoints

- `POST /api/search`
  - Body: `{ "query": "Protection" }`
  - Returns: `{ results: [{ id, confidence }], audit: { method, model, results, timestamp } }`
  - Methods: `vector_search` (Qdrant `points/search`), `payload_filter`, or `local_keywords`

- `GET /api/status`
  - Returns: `{ provider, model, collection, qdrantConnected, timestamp }`

## Demo Workflow

Open `http://localhost:3000/workflow` for the narrative of Intake → Understand → Decide → Review → Deliver, including audit artifact contents (fields, confidences, rules fired, review actions, timestamps, IDs, source URLs).

## Submission Checklist

- Public GitHub repository: Next.js app + `scripts/` (seeding + voice cloning stub)
- Cover image: screenshot of the museum grid
- Video presentation: 2–3 min demo of UI, audio, search audit, seeding, and workflow
- Slide presentation: one‑pager with stack (AI/ML API + Qdrant + Next.js + Opus)
- App hosting & URL: local demo video; optionally deploy and supply live link

## Security

- Do not commit secrets. Keep `AIMLAPI_KEY`, `QDRANT_API_KEY`, and `GEMINI_API_KEY` in `.env`.
