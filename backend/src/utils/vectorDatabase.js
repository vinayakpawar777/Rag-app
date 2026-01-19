import { Pinecone } from '@pinecone-database/pinecone';

let pineconeClient = null;
let indexName = null;

export async function initPinecone() {
    if (pineconeClient) return pineconeClient;

    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
        console.error('❌ PINECONE_API_KEY not found in environment variables');
        console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('PINE') || k.includes('GOOGLE') || k.includes('COHERE')));
        throw new Error('PINECONE_API_KEY is required. Check your .env file in the backend folder.');
    }

    try {
        pineconeClient = new Pinecone({
            apiKey: apiKey,
        });

        indexName = process.env.PINECONE_INDEX_NAME || 'mini-rag-index';

        const existingIndexes = await pineconeClient.listIndexes();
        const existingIndex = existingIndexes.indexes?.find(idx => idx.name === indexName);

        if (!existingIndex) {
            console.log(`Index "${indexName}" not found. Creating it now...`);
            await pineconeClient.createIndex({
                name: indexName,
                dimension: 768,
                metric: 'cosine',
                spec: {
                    serverless: {
                        cloud: 'aws',
                        region: 'us-east-1'
                    }
                }
            });
            console.log(`✓ Created Pinecone index: ${indexName}`);
            console.log('Waiting for index to be ready...');
            await new Promise(resolve => setTimeout(resolve, 30000));
        } else if (existingIndex.dimension !== 768) {
            console.log(`Index "${indexName}" has wrong dimensions (${existingIndex.dimension}). Recreating with 768...`);
            await pineconeClient.deleteIndex(indexName);
            await new Promise(resolve => setTimeout(resolve, 5000));
            await pineconeClient.createIndex({
                name: indexName,
                dimension: 768,
                metric: 'cosine',
                spec: {
                    serverless: {
                        cloud: 'aws',
                        region: 'us-east-1'
                    }
                }
            });
            console.log(`✓ Recreated Pinecone index: ${indexName} with 768 dimensions`);
            console.log('Waiting for index to be ready...');
            await new Promise(resolve => setTimeout(resolve, 30000));
        }

        console.log(`✓ Connected to Pinecone index: ${indexName}`);
        return pineconeClient;
    } catch (error) {
        console.error('Failed to initialize Pinecone:', error.message);
        throw error;
    }
}

export async function upsertVectors(vectors, sessionId) {
    if (!pineconeClient) {
        throw new Error('Pinecone not initialized');
    }

    const UPSERT_BATCH_SIZE = 100;
    const index = pineconeClient.Index(indexName);

    // Add session_id to metadata
    const taggedVectors = vectors.map(v => ({
        ...v,
        metadata: { ...v.metadata, session_id: sessionId }
    }));

    try {
        let upsertedCount = 0;
        for (let i = 0; i < taggedVectors.length; i += UPSERT_BATCH_SIZE) {
            const batch = taggedVectors.slice(i, i + UPSERT_BATCH_SIZE);
            console.log(`Upserting batch ${Math.floor(i / UPSERT_BATCH_SIZE) + 1}/${Math.ceil(taggedVectors.length / UPSERT_BATCH_SIZE)} (${batch.length} vectors)`);
            await index.upsert(batch);
            upsertedCount += batch.length;
        }
        console.log(`✓ Upserted ${upsertedCount} vectors to Pinecone`);
        return { success: true, count: upsertedCount };
    } catch (error) {
        console.error('Upsert error:', error);
        throw new Error(`Failed to upsert vectors: ${error.message}`);
    }
}

export async function queryVectors(queryVector, topK = 10, sessionId) {

    if (!pineconeClient) {
        throw new Error('Pinecone not initialized');
    }
    try {
        const index = pineconeClient.Index(indexName);
        const results = await index.query({
            vector: queryVector,
            topK,
            includeMetadata: true,
            filter: sessionId ? { session_id: { '$eq': sessionId } } : undefined
        });

        return results.matches || [];
    } catch (error) {
        console.error('Query error:', error);
        throw new Error(`Failed to query vectors: ${error.message}`);
    }
}

