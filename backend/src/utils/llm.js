import axios from 'axios';
import { getChunkContent } from './chunkManager.js';

export async function generateAnswer(query, sources) {
    if (!sources || sources.length === 0) {
        return {
            answer: 'No relevant information found to answer your query.',
            citations: [],
            sources: []
        };
    }

    try {
        const contextText = sources
            .map((source, idx) => {
                const content = getChunkContent(source.id);
                return `[${idx + 1}] ${content}`;
            })
            .join('\n\n');

        const prompt = `You are a helpful assistant that answers questions based on provided documents. 
Answer the following question using ONLY the provided sources. 
Include inline citations like [1], [2] that reference the sources below.
If the answer cannot be found in the sources, say so clearly.

Question: ${query}

Sources:
${contextText}

Answer:`;

        const response = await axios.post("https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent",
            {
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048,
                }
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": process.env.GOOGLE_API_KEY
                }
            }
        );

        const answer = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate answer.';

        return {
            answer,
            citations: extractCitations(answer, sources),
            sources: sources.map((source, idx) => ({
                id: idx + 1,
                content: getChunkContent(source.id),
                title: source.metadata?.document_title || source.metadata?.title || 'Unknown',
                chunk_index: source.metadata?.chunk_index || 0,
                document_id: source.metadata?.document_id || '',
                pinecone_score: source.score || 0,
                rerank_score: source.rerank_score || null
            }))
        };
    } catch (error) {
        console.error('LLM error:', error.message);
        throw new Error(`Failed to generate answer: ${error.message}`);
    }
}

function extractCitations(text, sources) {
    const citationPattern = /\[(\d+)\]/g;
    const citations = [];
    let match;

    while ((match = citationPattern.exec(text)) !== null) {
        const citationNum = parseInt(match[1]);
        if (citationNum > 0 && citationNum <= sources.length) {
            citations.push({
                id: citationNum,
                context: `...${text.substring(Math.max(0, match.index - 40), Math.min(text.length, match.index + 80))}...`
            });
        }
    }

    return citations;
}

