import os
import json
import requests
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct
import google.generativeai as genai

def load_dotenv(path: str = ".env"):
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#"): 
                        continue
                    if "=" in line:
                        k, v = line.split("=", 1)
                        os.environ.setdefault(k.strip(), v.strip())
        except Exception:
            pass

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv(".env")

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "nepal_heritage")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
EMBED_PROVIDER = (os.getenv("EMBED_PROVIDER") or "").lower()
AIMLAPI_KEY = os.getenv("AIMLAPI_KEY")
AIMLAPI_EMBED_MODEL = os.getenv("AIMLAPI_EMBED_MODEL", "text-embedding-3-large")
AIMLAPI_EMBED_URL = os.getenv("AIMLAPI_EMBED_URL", "https://api.aimlapi.com/v1/embeddings")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def embed(text: str):
    if EMBED_PROVIDER == "aimlapi" and AIMLAPI_KEY:
        try:
            res = requests.post(
                AIMLAPI_EMBED_URL,
                headers={"Content-Type": "application/json", "Authorization": f"Bearer {AIMLAPI_KEY}"},
                data=json.dumps({"input": text, "model": AIMLAPI_EMBED_MODEL}),
                timeout=20,
            )
            if res.ok:
                data = res.json()
                arr = data.get("data") or []
                emb = arr[0].get("embedding") if arr else None
                if isinstance(emb, list):
                    return emb
        except Exception:
            pass
    if GEMINI_API_KEY:
        try:
            r1 = genai.embed_content(model="embedding-001", content=text)
            v1 = r1.get("embedding")
            if v1:
                return v1
        except Exception:
            pass
        r2 = genai.embed_content(model="text-embedding-004", content=text)
        return r2.get("embedding")
    return []

artifacts = [
    {
        "id": 1,
        "artifactId": 1,
        "title": "Lakhe Mask",
        "language": "Newari",
        "description": "The Lakhe mask is a sacred artifact of the Newar community, representing the protective demon deity who dances through the streets of Kathmandu during Indra Jatra festival. This fierce-faced guardian with his third eye and golden ornaments wards off evil spirits while blessing the community with prosperity. The mask embodies centuries of Newari craftsmanship, where each carved detail tells stories of divine protection and cultural resilience passed down through generations of master artisans.",
        "keywords": ["protection", "ceremony", "festival", "mask", "spirit", "newar", "kathmandu", "indra jatra", "guardian", "deity"],
    },
    {
        "id": 2,
        "artifactId": 2,
        "title": "Damphu Drum",
        "language": "Tamang",
        "description": "The Damphu drum resonates with the heartbeat of Tamang culture, its rhythmic beats echoing through the Himalayan foothills where this indigenous community has lived for millennia. Crafted from wood and animal skin, this circular frame drum accompanies the Tamang Selo dance and preserves ancient stories of mountain life, Buddhist traditions, and the community's deep connection to the land. Each beat carries the wisdom of ancestors who used these rhythms to celebrate harvests, mark life passages, and maintain their unique linguistic and cultural identity.",
        "keywords": ["music", "celebration", "drum", "culture", "storytelling", "tamang", "himalayan", "selo", "indigenous", "rhythm"],
    },
    {
        "id": 3,
        "artifactId": 3,
        "title": "Tharu Wall Art",
        "language": "Tharu",
        "description": "Tharu wall paintings transform simple mud walls into vibrant canvases that tell the story of Nepal's first inhabitants, the Tharu people who have lived in the Terai forests for thousands of years. These earth-toned murals depict the sacred relationship between humans, nature, and the spiritual world - showing rice fields that sustain life, peacocks that bring good fortune, fish that represent abundance, and the sun that governs agricultural cycles. Each brushstroke preserves ancient knowledge of sustainable living and the Tharu community's role as guardians of the southern plains, where their unique language and customs have flourished despite centuries of change.",
        "keywords": ["art", "nature", "harvest", "village", "painting", "tharu", "terai", "agriculture", "indigenous", "sustainable"],
    },
]

def main():
    have_embed = (EMBED_PROVIDER == "aimlapi" and bool(AIMLAPI_KEY)) or bool(GEMINI_API_KEY)
    if not QDRANT_URL or not QDRANT_API_KEY or not have_embed:
        raise RuntimeError("Missing env")
    v0 = embed(artifacts[0]["description"]) or []
    size = len(v0)
    client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
    if client.collection_exists(QDRANT_COLLECTION):
        try:
            client.delete_collection(QDRANT_COLLECTION)
        except Exception:
            pass
    client.create_collection(
        collection_name=QDRANT_COLLECTION,
        vectors_config=VectorParams(size=size, distance=Distance.COSINE),
    )
    points = []
    for a in artifacts:
        vec = embed(a["description"]) or []
        p = PointStruct(id=a["id"], vector=vec, payload=a)
        points.append(p)
    client.upsert(collection_name=QDRANT_COLLECTION, points=points)

if __name__ == "__main__":
    main()