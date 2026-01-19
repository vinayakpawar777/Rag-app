import { chunkText } from '../utils/textChunker.js';
import { generateBatchEmbeddings } from '../utils/embeddings.js';
import { upsertVectors, initPinecone } from '../utils/vectorDatabase.js';
import { storeChunk } from '../utils/chunkManager.js';
import crypto from 'crypto';

export async function uploadDocument(req, res) {
  const startTime = Date.now();

  try {
    const { text, title, session_id } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    await initPinecone();

    const documentId = crypto.randomUUID();
    const documentTitle = title || `Document ${new Date().toISOString()}`;

    console.log(`Processing document: ${documentTitle} (${text.length} chars)`);

    const chunks = chunkText(text, documentId, documentTitle);
    console.log(`Created ${chunks.length} chunks`);

    const embeddings = await generateBatchEmbeddings(
      chunks.map(chunk => chunk.content)
    );

    const vectors = chunks.map((chunk, idx) => {
      const chunkId = `${documentId}-chunk-${idx}`;

      storeChunk(chunkId, chunk.content, chunk.metadata);

      return {
        id: chunkId,
        values: embeddings[idx],
        metadata: {
          document_id: chunk.metadata.document_id,
          document_title: chunk.metadata.document_title,
          chunk_index: chunk.metadata.chunk_index,
          start_char: chunk.metadata.start_char,
          end_char: chunk.metadata.end_char
        }
      };
    });

    console.log(`Upserting ${vectors.length} vectors to Pinecone...`);
    await upsertVectors(vectors, session_id);
    console.log(`Successfully upserted ${vectors.length} vectors`);
    const duration = Date.now() - startTime;

    res.json({
      success: true,
      document_id: documentId,
      title: documentTitle,
      chunks_created: chunks.length,
      characters: text.length,
      processing_time_ms: duration,
      estimated_tokens: Math.ceil(text.length / 4)
    });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({
      error: error.message || 'Failed to upload document'
    });
  }
}
