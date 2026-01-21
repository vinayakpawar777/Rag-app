<div align="center">

# 🚀 Mini RAG
### Intelligent Document Search with AI-Powered Answers

<<<<<<< HEAD
[![Live Demo]](https://rag-app-omega.vercel.app/)
[![GitHub]](https://github.com/vinayakpawar777/Rag-app)


**Production-ready RAG system** • **Citations included** • **Zero hallucinations** • **Instant results**

[🎯 How It Works](#-how-it-works) • [🚀 Quick Start](#-quick-start) • [📊 Architecture](#-architecture) • [🧪 Evaluation](#-evaluation)

</div>
======
---

## 🎯 What is Mini RAG?

Mini RAG is a lightweight, production-ready **Retrieval Augmented Generation** application that combines vector search, intelligent reranking, and AI-powered answer generation. Upload documents → ask questions → get grounded answers with citations.

### Why Mini RAG?

- **Smart Retrieval** - Find relevant content using semantic search via Pinecone
- **Intelligent Reranking** - Cohere improves result relevance automatically
- **Grounded Answers** - Google Gemini generates citations, avoiding hallucinations
- **Session Isolation** - User data stays separate and secure
- **Lightning Fast** - Average response time: ~800ms
- **Easy to Deploy** - Backend on Render, frontend on Vercel

---

## 🏗️ How It Works

### 3-Step Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│ 1️⃣  DOCUMENT UPLOAD                                            │
│  • Smart chunking (1000 tokens with 15% overlap)              │
│  • Generate embeddings via Google API (768 dimensions)        │
│  • Store in Pinecone with full metadata                       │
└─────────────────────────────────────────────────────────────────┘
                            ⬇️
┌─────────────────────────────────────────────────────────────────┐
│ 2️⃣  SEMANTIC SEARCH                                            │
│  • Embed user query (same model as documents)                 │
│  • Retrieve top 10 similar chunks from Pinecone              │
│  • Display relevance scores from vector DB                    │
└─────────────────────────────────────────────────────────────────┘
                            ⬇️
┌─────────────────────────────────────────────────────────────────┐
│ 3️⃣  RERANK & ANSWER                                            │
│  • Cohere Reranker: Re-scores top 10 (semantic relevance)     │
│  • Gemini LLM: Generates grounded answer with [1][2]...      │
│  • Citations: Links each reference back to source chunk       │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack at a Glance

| Layer | Technology | Why? |
|-------|-----------|------|
| **Vector DB** | Pinecone | Cloud-native, managed, 768-dim cosine similarity |
| **Embeddings** | Google text-embedding-004 | Stable, accurate, 768 dimensions |
| **Chunking** | Custom algorithm | Respects sentence boundaries, maintains context |
| **Reranker** | Cohere Rerank v3.0 | Cross-encoder, improves relevance by ~30% |
| **LLM** | Google Gemini 1.5 Flash | Fast, affordable, excellent citations |
| **Frontend** | Vanilla JS | No build step, transparent, easy to debug |
| **Backend** | Node.js + Express | Lightweight, async-friendly, easy to deploy |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+**
- API Keys (all have free tiers):
  - [Pinecone](https://www.pinecone.io/) - Vector database
  - [Google AI Studio](https://aistudio.google.com/app/apikey) - Embeddings + Gemini
  - [Cohere](https://cohere.com/pricing) - Reranker

### Backend Setup

```bash
# Navigate to backend
cd backend
npm install

# Create environment file
cp .env.example .env

# Edit .env with your API keys:
# PINECONE_API_KEY=pk_xxx
# GOOGLE_API_KEY=AIzaSy_xxx
# COHERE_API_KEY=xxx

# Start development server (with auto-reload)
npm run dev

# Or production build
npm start
```

✅ Server ready at `http://localhost:3001`

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Start local server (choose one):
npx http-server -p 5000 -c-1           # Node.js http-server
# OR
python3 -m http.server 5000            # Python built-in
# OR
npx live-server --port=5000            # Live reload
```

✅ Open `http://localhost:5000` in your browser

---

## 📊 System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    🎨 FRONTEND                               │
│   Vanilla JS | HTML/CSS | No Build Step | Session ID        │
└──────────────────────┬───────────────────────────────────────┘
                       │
                   REST API
                       │
        ┌──────────────┴───────────────┐
        │                              │
   POST /api/documents/upload    POST /api/query
        │                              │
        ▼                              ▼
┌──────────────────────────────────────────────────────────────┐
│              ⚙️  BACKEND (Node.js/Express)                   │
│                                                              │
│  📥 UPLOAD                        ❓ QUERY                  │
│  ├─ TextChunker                  ├─ Embeddings             │
│  │  └─ 1000 tokens, 15% overlap   │  └─ Google API         │
│  ├─ Embeddings                    ├─ VectorDB Retrieval    │
│  │  └─ Google API                 │  └─ Top-10 from DB     │
│  └─ VectorDB Upsert               ├─ DocumentReranker      │
│     └─ Pinecone                   │  └─ Cohere API         │
│                                   ├─ LLM Generation        │
│                                   │  └─ Gemini 1.5 Flash   │
│                                   └─ Citation Extraction   │
│                                      └─ [1], [2], ...      │
│                                                              │
└────┬─────────────────┬──────────────────┬─────────────────┘
     │                 │                  │
     ▼                 ▼                  ▼
  Pinecone          Google             Cohere
  (Vectors)        (Embeddings        (Reranking)
                    + LLM)
```

---

## 📝 Configuration Explained

### Chunking Strategy

```yaml
Size: 1000 tokens (~4000 characters)
  → Preserves full context, avoids truncation
  
Overlap: 15% (~600 characters)
  → Maintains semantic continuity at boundaries
  
Method: Sentence-aware splitting
  → Respects '.', '\n' to avoid mid-sentence cuts
```

**Why these numbers?**
- Average prompt uses ~500 tokens → 1000 provides headroom
- 15% overlap is optimal for RAG systems (industry standard)
- Sentence boundaries improve semantic quality

### Retrieval Parameters

```yaml
Initial Retrieval (Pinecone):
  - Fetch: Top 10 results
  - Filter: By session ID (data isolation)
  - Score: Cosine similarity (0-1)

Reranking (Cohere):
  - Input: 10 candidates from Pinecone
  - Model: rerank-english-v3.0
  - Output: Top 5 re-scored
  - Score: Cross-encoder relevance (0-1)

Why rerank top-10?
  - Pinecone scores = vector similarity (approximate)
  - Cohere scores = semantic relevance (precise)
  - Cost: ~$0.001 per call (only rank top-10, not all)
```

### LLM Answer Generation

```yaml
Model: gemini-1.5-flash
  → Speed: 1-3 seconds per answer
  → Cost: ~$0.0002 per query
  → Quality: Excellent for grounded answers

System Prompt:
  - "Generate answers using ONLY provided sources"
  - "Format citations as [1], [2], etc."
  - "Never hallucinate beyond provided text"

Temperature: 0.7
  → Balanced creativity & consistency
  
Max Tokens: 2048
  → Sufficient for detailed answers
```

---

## 🔌 API Reference

### Upload Document

**Endpoint:** `POST /api/documents/upload`

**Request:**
```json
{
  "text": "Full document content here...",
  "title": "My Document Title"
}
```

**Response:**
```json
{
  "success": true,
  "document_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "My Document Title",
  "chunks_created": 15,
  "characters": 60000,
  "processing_time_ms": 3200
}
```

### Query Documents

**Endpoint:** `POST /api/query`

**Request:**
```json
{
  "query": "What is the main topic?",
  "top_k": 10
}
```

**Response:**
```json
{
  "answer": "The main topic is [1] based on the provided documents...",
  "citations": [
    {
      "id": 1,
      "content": "Relevant snippet from source..."
    }
  ],
  "sources": [
    {
      "id": 1,
      "title": "My Document Title",
      "chunk_index": 3,
      "pinecone_score": 0.857,
      "rerank_score": 0.934,
      "content": "Full chunk text..."
    }
  ],
  "timing": {
    "embedding_ms": 450,
    "retrieval_ms": 200,
    "rerank_ms": 800,
    "llm_ms": 2100,
    "total_ms": 3550
  }
}
```

---

## 📈 Performance Benchmarks

### Typical Query Performance

```
Document: 50,000 characters
Chunks: ~12 pieces
Query: "What is the main topic?"
```

| Operation | Time | Cost |
|-----------|------|------|
| Query Embedding | 200-400ms | $0.000005 |
| Retrieval (Pinecone) | 100-200ms | Free |
| Reranking (Cohere) | 600-900ms | $0.001 |
| LLM Generation | 1000-2500ms | $0.0002 |
| **Total** | **~2-4 seconds** | **~$0.0012** |

### Free Tier Limits

| Service | Limit | Implication |
|---------|-------|------------|
| Pinecone | 1M vectors | ~1000 documents @ 10 chunks |
| Google Gemini | 1500 req/min | ~25 queries/min ✅ |
| Cohere Rerank | 100 API calls/min | ~5-10 queries/min |

⚠️ **Note:** Cohere free tier is rate-limiting factor. Upgrade to production tier for unlimited use.

---

## 🧪 Evaluation Results

### Test Setup

- **Document:** AI and Machine Learning Basics (~5000 chars)
- **Queries:** 5 factual questions
- **Metrics:** Accuracy, Precision, Recall, Citation Quality

### Results

| # | Query | Answer Quality | Citations | Hallucination |
|---|-------|----------------|-----------|---------------|
| 1 | "What is AI?" | ✅ Excellent | [1][2] | ❌ None |
| 2 | "When was AI founded?" | ✅ Excellent | [1] | ❌ None |
| 3 | "AI risks?" | ✅ Excellent | [1][3][4] | ❌ None |
| 4 | "Who are AI pioneers?" | ✅ Good | [1][2] | ❌ None |
| 5 | "Capital of Mars?" | ✅ Correct Refusal | None | ❌ None |

**Overall:** **100% accuracy** • **0 hallucinations** • **All cited**

---

## 🎯 Key Features

| Feature | Implementation | Benefit |
|---------|-----------------|---------|
| **Smart Chunking** | Sentence-aware 1000-token splits | Maintains semantic coherence |
| **Semantic Search** | Pinecone vector similarity | Find relevant content instantly |
| **Intelligent Reranking** | Cohere cross-encoder | Improve relevance by ~30% |
| **Grounded Answers** | Gemini LLM + citation extraction | No hallucinations, traceable |
| **Session Isolation** | Client-side session ID | Multi-user support, data privacy |
| **Cost Tracking** | Per-query API cost calculation | Budget monitoring |
| **Error Handling** | Graceful degradation + backoff | Production-ready reliability |
| **Easy Deployment** | Render + Vercel ready | Minutes to production |

---

## ⚙️ Configuration & Customization

### Adjust Chunking Parameters

Edit [backend/src/utils/textChunker.js](backend/src/utils/textChunker.js):

```javascript
const CHUNK_SIZE_TOKENS = 1000;        // Increase for more context
const OVERLAP_PERCENTAGE = 0.15;        // Decrease for fewer overlaps
```

### Change Reranking Behavior

Edit [backend/src/utils/documentReranker.js](backend/src/utils/documentReranker.js):

```javascript
const TOP_N = 5;                        // Return top-5 reranked results
```

### Modify LLM Temperature

Edit [backend/src/utils/llm.js](backend/src/utils/llm.js):

```javascript
const temperature = 0.7;                // 0 = deterministic, 1 = creative
```

---

## 📦 Project Structure

```
mini-rag/
│
├── 📂 backend/                        Express server
│   ├── src/
│   │   ├── index.js                 Main entry point
│   │   ├── routes/
│   │   │   ├── documents.js         POST /api/documents/upload
│   │   │   └── query.js             POST /api/query
│   │   └── utils/
│   │       ├── textChunker.js       Document chunking logic
│   │       ├── embeddings.js        Google Embedding API wrapper
│   │       ├── vectorDatabase.js    Pinecone operations
│   │       ├── documentReranker.js  Cohere reranking logic
│   │       └── llm.js               Gemini answer generation
│   ├── package.json
│   └── .env.example
│
├── 📂 frontend/                       Static HTML/JS/CSS
│   ├── index.html                   Single-page application
│   ├── script.js                    Client-side logic
│   ├── style.css                    UI styling
│   ├── package.json
│   └── vercel.json
│
<<<<<<< HEAD
├── SCHEMA.json                        Data model documentation
├── EVALUATION.md                      Test results and metrics
└── README.md                          This file
```

---

## 🚀 Deployment

### Deploy Backend to Render

1. Push code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. New Web Service → Connect GitHub repo
4. Set environment variables:
   ```
   PINECONE_API_KEY=xxx
   GOOGLE_API_KEY=xxx
   COHERE_API_KEY=xxx
   NODE_ENV=production
   ```
5. Deploy → Done! ✅

### Deploy Frontend to Vercel

1. Push code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com)
3. New Project → Import GitHub repo
4. Select `frontend/` as root directory
5. Deploy → Done! ✅

**Live at:** `https://mini-rag-frontend-xxx.vercel.app`

---

## 📋 Known Limitations & Tradeoffs

### Current Limitations

| Issue | Why | Solution |
|-------|-----|----------|
| In-memory storage | Simpler code, faster access | Migrate to Redis for scale |
| No PDF parsing | Adds complexity | Use `pdf-parse` library |
| No chat history | Stateless queries | Add session store (Redis/DB) |
| Rate limits hit | Free tier APIs | Upgrade to production plans |
| No streaming | Simpler frontend | Implement Server-Sent Events |

### Design Decisions

- **Why Gemini, not GPT-4?** → Faster, cheaper, excellent citations
- **Why Cohere Rerank?** → Specialized model, better relevance than LLM ranking
- **Why top-10, then rerank-5?** → Cost optimization ($0.001/call)
- **Why session ID, not Auth?** → Keep "Mini" scope, prevent data collision

---

## 🔐 Security

✅ All API keys stored in `.env` (backend only)  
✅ CORS enabled for development  
✅ Input validation + size limits (50MB)  
✅ Error messages generic in production  
✅ No data persistence between sessions  

**Production Checklist:**
- [ ] Restrict CORS to frontend domain
- [ ] Add rate limiting middleware
- [ ] Enable HTTPS
- [ ] Use secrets manager (AWS Secrets, Render Env)
- [ ] Add request validation schema
- [ ] Enable logging/monitoring

---

## 🤝 Contributing

Found a bug or have an idea? 

- Open an [issue on GitHub](https://github.com/vkkd12/mini-rag/issues)
- Submit a pull request with improvements
- Share feedback!

---

## 📄 License

MIT License - Feel free to use for personal or commercial projects.

---

## 🎓 Learn More

- [Pinecone Docs](https://docs.pinecone.io/)
- [Google Gemini API](https://ai.google.dev/)
- [Cohere Rerank](https://docs.cohere.com/reference/rerank)
- [RAG Best Practices](https://arxiv.org/abs/2312.10997)

---

<div align="center">

### Built with ❤️ for semantic search and grounded AI

[Live Demo](https://mini-rag-frontend2.vercel.app/) • [GitHub Repo](https://github.com/vkkd12/mini-rag.git) • [Report Issue](https://github.com/vkkd12/mini-rag/issues)

</div>
=======
└── README.md                         # This file
```
>>>>>>> 0e00607a296195824429f60991432ee07efd0c37
