import { generateEmbedding } from '../utils/embeddings.js';
import { queryVectors, initPinecone } from '../utils/vectorDatabase.js';
import { rerank } from '../utils/documentReranker.js';
import { generateAnswer } from '../utils/llm.js';

export async function queryRag(req, res) {
    const startTime = Date.now();

    try {
        const { query, top_k = 10, session_id } = req.body;

        if (!query || query.trim().length === 0) {
            return res.status(400).json({ error: 'Query is required' });
        }

        await initPinecone();

        console.log(`Processing query: "${query}"`);

        const queryEmbedding = await generateEmbedding(query);
        const embeddingTime = Date.now() - startTime;

        const retrievedChunks = await queryVectors(queryEmbedding, top_k, session_id);
        const retrievalTime = Date.now() - startTime - embeddingTime;

        if (retrievedChunks.length === 0) {
            return res.json({
                answer: 'No relevant documents found to answer your query.',
                citations: [],
                sources: [],
                timing: {
                    embedding_ms: embeddingTime,
                    retrieval_ms: retrievalTime,
                    rerank_ms: 0,
                    llm_ms: 0,
                    total_ms: Date.now() - startTime
                },
                query_info: {
                    query,
                    chunks_retrieved: 0,
                    chunks_reranked: 0
                }
            });
        }

        const rankerStartTime = Date.now();
        const rerankedChunks = await rerank(query, retrievedChunks, Math.min(5, retrievedChunks.length));
        const rerankTime = Date.now() - rankerStartTime;

        const llmStartTime = Date.now();
        const result = await generateAnswer(query, rerankedChunks);
        const llmTime = Date.now() - llmStartTime;

        const totalTime = Date.now() - startTime;

        res.json({
            answer: result.answer,
            citations: result.citations,
            sources: result.sources,
            timing: {
                embedding_ms: embeddingTime,
                retrieval_ms: retrievalTime,
                rerank_ms: rerankTime,
                llm_ms: llmTime,
                total_ms: totalTime
            },
            query_info: {
                query,
                chunks_retrieved: retrievedChunks.length,
                chunks_reranked: rerankedChunks.length,
                top_k_requested: top_k
            },
            cost_estimate: {
                note: 'Approximate costs (USD)',
                embedding_api: `$${(retrievedChunks.length * 0.00002).toFixed(6)}`,
                rerank_api: `$${(rerankedChunks.length * 0.001).toFixed(6)}`,
                llm_api: `$${(Math.ceil(totalTime / 1000) * 0.000075).toFixed(6)}`
            }
        });
    } catch (error) {
        console.error('Query error:', error);
        res.status(500).json({
            error: error.message || 'Failed to process query',
            answer: 'An error occurred while processing your query.'
        });
    }
}
