'use client'

export default function Workflow() {
  return (
    <main className="min-h-screen bg-slate-900 text-white px-6 lg:px-8 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold">Opus Workflow: Intake → Understand → Decide → Review → Deliver</h1>
        <p className="mt-3 text-slate-300">A visual explanation of the preservation pipeline used for BHASA RAKSHAK.</p>

        <div className="mt-8 bg-slate-800 border border-slate-700 rounded p-6">
          <ol className="list-decimal list-inside space-y-3 text-slate-200">
            <li>Intake: Receive audio/video recordings of elders. Extract audio if needed.</li>
            <li>Understand: Transcribe and summarize with Gemini; extract key fields and confidence.</li>
            <li>Decide: Deterministic rules + AI scoring; route low-confidence items to review.</li>
            <li>Review: Agentic policy checks, then Human Review for authenticity/cultural safety.</li>
            <li>Deliver: Save embeddings + payload to Qdrant; export JSON audit; notify via email/Sheets.</li>
          </ol>

          <div className="mt-6 text-sm text-slate-400">
            Audit artifact contains inputs, extracted fields, scores/rationales, rules fired, review actions, timestamps, IDs, and source URLs.
          </div>
        </div>

        <div className="mt-6 text-sm text-slate-400">
          Record this page + the scripts running to produce your 2–3 minute demo video.
        </div>
      </div>
    </main>
  )
}