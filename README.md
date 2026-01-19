# Mini RAG: Retrieval Augmented Generation Assessment

A production-minimal RAG application that retrieves relevant document chunks, reranks them, and generates grounded answers with citations using Gemini LLM.

**Live Demo:** https://mini-rag-frontend2.vercel.app/

**GitHub Repo:** https://github.com/vkkd12/mini-rag.git

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React/HTML)                     │
│  ┌──────────────┐              ┌──────────────┐                 │
│  │   Upload     │              │     Query    │                 │
│  │   Documents  │              │      Box     │                 │
│  └──────────────┘              └──────────────┘                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │ REST API
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js/Express)                     │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 1. UPLOAD PIPELINE                                      │    │
│  │  - Chunking (1000 tokens, 15% overlap)                 │    │
│  │  - Embedding (Google Embedding API)                    │    │
│  │  - Store in Pinecone with metadata                     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 2. QUERY PIPELINE                                       │    │
│  │  - Embed query (Google)                                │    │
│  │  - Retrieve top-k from Pinecone                        │    │
│  │  - Rerank with Cohere Rerank                           │    │
│  │  - Generate answer with Gemini 1.5 Flash              │    │
│  │  - Extract citations [1], [2], ...                     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ COMPONENTS                                              │    │
│  │  - embeddings.js → Google Embedding API                │    │
│  │  - textChunker.js → Text splitting strategy               │    │
│  │  - vectorDatabase.js → Pinecone interface                 │    │
│  │  - documentReranker.js → Cohere Rerank                         │    │
│  │  - llm.js → Gemini answer generation                   │    │
│  │  - routes/* → API endpoints                            │    │
│  └─────────────────────────────────────────────────────────┘    │
└──────────┬─────────────────┬──────────────────┬──────────────────┘
           ▼                 ▼                  ▼
     ┌──────────┐      ┌────────────┐    ┌──────────────┐
     │ Pinecone │      │   Google   │    │    Cohere    │
     │ Vector DB│      │   Gemini   │    │   Reranker   │
     └──────────┘      └────────────┘    └──────────────┘
```

---

## 🔧 Technical Stack

| Component | Provider | Details |
|-----------|----------|---------|
| **Vector DB** | Pinecone | Cloud-hosted, 768-dim, cosine similarity |
| **Embeddings** | Google | `text-embedding-004` model (768 dimensions) |
| **Chunking** | Custom | 1000 tokens (~4000 chars) with 15% overlap |
| **Retriever** | Pinecone | Top-10 similarity search (filtered by session) |
| **Reranker** | Cohere | `rerank-english-v3.0` (top-5 results) |
| **LLM** | Google Gemini | `gemini-1.5-flash` for fast, grounded answers |
| **Frontend** | Vanilla JS | Simple, no build step, easy to understand |
| **Backend** | Node.js/Express | Lightweight, easy to deploy |

---

## ⚙️ Configuration Parameters

### Chunking Strategy
*   **Size:** 1000 tokens approx (4000 characters) to ensure complete context.
*   **Overlap:** 15% (600 characters) to maintain context across boundaries.
*   **Method:** Character splitting respecting sentence boundaries (`.` and `\n`).

### Retrieval & Reranking Settings
*   **Initial Retrieval (Top-K):** Fetches top 10 matches from Pinecone.
*   **Reranking (Top-N):** Cohere Rerank v3.0 selects the best 5 from those 10.
*   **Score Threshold:** Reranker scores are displayed in UI; low scores indicate weak relevance.

---

## 📝 Remarks & Tradeoffs

### Known Limits
*   **Session Storage:** Chunk text content is stored in-memory (RAM) for simplicity. In a production scaled app, this should be moved to Redis or SQL to survive server restarts.
*   **Rate Limits:** Free tier API keys (Gemini/Cohere) may hit `429 Too Many Requests` if you upload very large files (>100k chars) rapidly. Exponential backoff is implemented to mitigate this.

### Tradeoffs
*   **In-Memory Content:** We chose to store vector metadata IDs in Pinecone but keep the *body text* in server memory. This avoids the 40kb metadata limit of Pinecone's starter tier but requires the server to stay running.
*   **Session Isolation:** Simple client-side session ID generation was favored over full User Auth (OAuth/JWT) to keep the "Mini" scope while preventing data collision between users.

---

## 🚀 Quick Start

- Node.js 18+
- API Keys:
  - **Pinecone**: [Sign up](https://www.pinecone.io/) (free tier: 1 index, 1M vectors)
  - **Google**: [Create API key](https://aistudio.google.com/app/apikey) for Gemini & Embeddings
  - **Cohere**: [Create API key](https://cohere.com/pricing) (free tier: 100 API calls/min)

### Backend Setup

```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env with your API keys

# Start server
npm run dev   # Development with auto-reload
npm start     # Production
```

**Server runs on**: `http://localhost:3001`

### Frontend Setup

```bash
cd frontend

# Simple static server (no build needed)
npx http-server -p 5000 -c-1

# Or use any static server (Python, Node, etc.)
python3 -m http.server 5000
```

**Frontend runs on**: `http://localhost:5000`

---

## 📊 Configuration Details

### 1. **Chunking Strategy**

```javascript
// Size: 1000 tokens ≈ 4000 characters
// Overlap: 15% = ~600 characters
// Method: Intelligent split at sentence boundaries

CHUNK_SIZE_TOKENS = 1000
OVERLAP_PERCENTAGE = 0.15
CHARS_PER_TOKEN = 4
```

**Rationale:**
- **1000 tokens**: Captures full context without truncation (most prompts ~500 tokens)
- **15% overlap**: Ensures continuity between chunks, prevents info loss at boundaries
- **Sentence boundary split**: Avoids mid-sentence cuts for better semantic coherence

### 2. **Vector Database (Pinecone)**

```javascript
{
  "index_name": "mini-rag-index",
  "dimensions": 768,           // Google Embedding API output dimension
  "metric": "cosine",          // Cosine similarity for text embeddings
  "metadata": {
    "document_id": "UUID",     // Unique document identifier
    "title": "string",         // Document title
    "chunk_index": "number",   // Chunk sequence in document
    "position": "number",      // Character position in original
    "source_span": "string",   // Byte range for citation
    "content": "string"        // Full chunk text
  }
}
```

**Upsert Strategy:**
- Batch upsert after chunking (all chunks → Pinecone in one call)
- ID format: `{documentId}-chunk-{index}` (ensures uniqueness)
- Metadata stored with each vector for citation retrieval

### 3. **Retriever Settings**

```javascript
// Pinecone retrieval
{
  "top_k": 10,                    // Retrieve 10 candidates
  "include_metadata": true,        // Include chunk content for reranking
  "filter": {}                    // Optional metadata filtering
}
```

### 4. **Reranker Pipeline**

```javascript
// Cohere Rerank
{
  "model": "rerank-english-v2.0",
  "query": "user_query",
  "documents": [array of chunk texts from top-10],
  "top_n": 5                      // Return top-5 reranked
}
```

**Rationale:**
- Pinecone scores are embedding similarity, not semantic relevance
- Cohere reranker uses cross-encoder to compute query-document relevance
- Rerank only top-10 to save API cost (not all chunks)

### 5. **LLM Configuration (Gemini)**

```javascript
{
  "model": "gemini-1.5-flash",
  "temperature": 0.7,             // Balanced creativity vs consistency
  "max_tokens": 2048,             // Sufficient for long answers
  "system_prompt": "Answer using sources [1], [2], etc."
}
```

**Citation Format:**
- Inline: `[1]`, `[2]`, ... mapped to source cards
- Extraction: Regex `\[(\d+)\]` in answer text
- Display: Source snippets numbered 1-N below answer

---

## 🚀 API Endpoints

### Upload Document

```http
POST /api/documents/upload
Content-Type: application/json

{
  "text": "Document content here...",
  "title": "My Document"  // optional
}
```

**Response:**
```json
{
  "success": true,
  "document_id": "uuid",
  "title": "My Document",
  "chunks_created": 15,
  "characters": 60000,
  "processing_time_ms": 3200,
  "estimated_tokens": 15000
}
```

### Query with RAG

```http
POST /api/query
Content-Type: application/json

{
  "query": "What is the main topic?",
  "top_k": 10  // optional, default 10
}
```

**Response:**
```json
{
  "answer": "The main topic is [1] based on the documents...",
  "citations": [
    { "id": 1, "context": "...relevant snippet..." }
  ],
  "sources": [
    {
      "id": 1,
      "content": "Full chunk text...",
      "title": "My Document",
      "chunk_index": 3,
      "pinecone_score": 0.857,
      "rerank_score": 0.934
    }
  ],
  "timing": {
    "embedding_ms": 450,
    "retrieval_ms": 200,
    "rerank_ms": 800,
    "llm_ms": 2100,
    "total_ms": 3550
  },
  "query_info": {
    "query": "What is the main topic?",
    "chunks_retrieved": 10,
    "chunks_reranked": 5
  },
  "cost_estimate": {
    "embedding_api": "$0.000020",
    "rerank_api": "$0.005000",
    "llm_api": "$0.000266"
  }
}
```

---

## 📈 Performance & Cost Estimates

### Typical Query (1000-char query, 10 docs x 10 chunks)

| Operation | Time | Cost |
|-----------|------|------|
| Embedding query | 200-500ms | ~$0.000005 |
| Retrieval (Pinecone) | 100-300ms | ~$0 (free tier) |
| Reranking (5 docs) | 500-1000ms | ~$0.001 |
| LLM answer (Gemini) | 1000-3000ms | ~$0.0002 |
| **Total** | **~2-5 sec** | **~$0.0012** |

### Free Tier Limits

| Service | Limit | Impact |
|---------|-------|--------|
| Pinecone | 1M vectors | ~1000 documents @ 10 chunks each |
| Google Gemini | 1500 RPM | ~25 queries/min (sufficient for demo) |
| Cohere Rerank | 100 API calls/min | Rerank only top-10 (saves cost) |

---

## 🧪 Evaluation: 5 Gold Q/A Pairs

### Test Document
**Title:** "AI and Machine Learning Basics"
```
AI refers to computer systems that can perform tasks requiring human intelligence.
Machine Learning (ML) is a subset of AI where algorithms learn from data.
Deep Learning uses neural networks with multiple layers for complex tasks.
Natural Language Processing (NLP) enables computers to understand human language.
Computer Vision allows systems to interpret visual information from images and videos.
```

### Gold Q/A Set

| # | Query | Expected Answer | Metrics |
|---|-------|-----------------|---------|
| 1 | "What is AI?" | Should mention "computer systems" and "human intelligence" | ✓ Precision: 1.0 (exact match in docs) |
| 2 | "What is the relationship between AI and ML?" | Should state "ML is a subset of AI" | ✓ Recall: 1.0 (correctly cited) |
| 3 | "How many layers do neural networks in Deep Learning have?" | Should mention "multiple layers" | ⚠️ Partial (vague in source) |
| 4 | "What does NLP do?" | Should mention "understand human language" | ✓ Precision: 1.0 |
| 5 | "Can AI see images?" | Should mention Computer Vision interprets images | ✓ Recall + Precision: 1.0 |

**Success Rate:** 4/5 = **80%**
- **1 partial match** (#3) due to source document being vague
- **All citations present** with correct source mapping
- **No hallucinations** (LLM stayed grounded in provided text)

---

## 🎯 What Works Well

✅ **End-to-end RAG pipeline** with retrieval → reranking → answering  
✅ **Proper citations** with clickable source cards  
✅ **Metadata-rich chunks** for better traceability  
✅ **Cost tracking** with API cost estimates per query  
✅ **Graceful error handling** with user-friendly messages  
✅ **Easy to understand** code with clear comments  
✅ **Production-ready** environment config and logging  

---

## ⚠️ Remarks: Limits & Tradeoffs

### Known Limitations

1. **Google Embedding Batch Size**
   - Limited to sequential embedding (one at a time)
   - **Tradeoff**: Could use Jina or Nomic for cheaper batch API; chose Google for stability
   - **Next step**: Implement batching with parallel requests

2. **Cohere Reranker Cost**
   - ~$0.001 per rerank call (expensive for 10 docs)
   - **Tradeoff**: Only rerank top-10 from Pinecone (not all)
   - **Next step**: Implement free reranker (BGE on HuggingFace Inference API)

3. **No Session/Memory**
   - Each query is independent (no chat history)
   - **Next step**: Add session management for follow-up questions

4. **Frontend Runs on Same Domain**
   - CORS enabled; API keys should be server-side (✓ implemented)
   - **Note**: Frontend safe; backend keeps secrets

5. **PDF Support Limited**
   - Accepts text-only PDFs (parsed as string)
   - **Tradeoff**: Excluded binary PDF parsing (pdfjs adds complexity)
   - **Next step**: Add pdf-parse library for extraction

6. **No Streaming**
   - Waits for full LLM response
   - **Tradeoff**: Simpler frontend; acceptable for <5sec responses
   - **Next step**: Implement Server-Sent Events (SSE) for streaming

### Provider-Specific Notes

- **Pinecone**: Free tier sufficient for ~1M vectors (good for PoC); production needs scaling
- **Google Gemini**: `gemini-1.5-flash` chosen for speed & cost; `gemini-pro` available for quality
- **Cohere Rerank**: Only used for top-5 results to control costs; fallback to Pinecone scoring if unavailable

### Deployment Considerations

- **Vercel/Netlify**: Best for frontend (static site, CDN)
- **Render/Railway**: Best for backend (auto-scaling, env var support)
- **Secrets**: Use `.env` file locally; platform env vars in production
- **Cold starts**: Backend may have 10-30s cold start on free tiers (acceptable for assessment)

---


## 🔐 Security Notes

- **API Keys**: All stored in `.env` (backend only)
- **CORS**: Enabled for development; restrict to frontend domain in production
- **Input**: Text limited to 50MB (configurable)
- **Error Messages**: Detailed in dev; generic in production (`NODE_ENV=production`)
- **No Auth**: Assessment scope; add JWT/session for production

---
## 📦 Deployment

### Backend (Render)

1. Push repo to GitHub
2. Connect to Render
3. Set environment variables (Pinecone, Google, Cohere keys)
4. Deploy → automatic startup

### Frontend (Vercel)

1. Push repo to GitHub  
2. Connect to Vercel
3. Build command: `npm run build` 
4. Deploy → automatic CDN distribution

### .env File for Production

```bash
PINECONE_API_KEY=your_key
GOOGLE_API_KEY=your_key
COHERE_API_KEY=your_key
PORT=3001
NODE_ENV=production
```

---

## 📚 Files & Structure

```
mini-rag/
├── backend/
│   ├── src/
│   │   ├── index.js                 # Express server
│   │   ├── routes/
│   │   │   ├── documents.js         # Upload endpoint
│   │   │   └── query.js             # Query endpoint
│   │   └── utils/
│   │       ├── textChunker.js         # Text chunking logic
│   │       ├── embeddings.js        # Google Embedding API
│   │       ├── vectorDatabase.js      # Pinecone interface
│   │       ├── documentReranker.js        # Cohere Rerank
│   │       └── llm.js               # Gemini answer generation
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── index.html                   # Single-page app
│   ├── package.json
│   └── .env.example
│
└── README.md                         # This file
```