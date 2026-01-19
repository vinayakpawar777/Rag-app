import axios from 'axios';
import { getChunkContent } from './chunkManager.js';

export async function rerank(query, documents, topK = 5) {
    if (!documents || documents.length === 0) {
        return [];
    }

    try {
        const docTexts = documents.map(doc => {
            const chunkId = doc.id;
            const content = getChunkContent(chunkId);
            return content || '';
        });

        const response = await axios.post(
            'https://api.cohere.com/v1/rerank',
            {
                model: 'rerank-english-v3.0',
                query: query,
                documents: docTexts,
                top_n: Math.min(topK, documents.length),
                return_documents: true
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data.results.map(result => ({
            ...documents[result.index],
            rerank_score: result.relevance_score,
            original_index: result.index
        }));
    } catch (error) {
        console.error('Reranking error:', error.message);
        return documents.slice(0, topK);
    }
}

