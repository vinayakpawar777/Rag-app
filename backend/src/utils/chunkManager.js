const chunkStore = new Map();

export function storeChunk(chunkId, content, metadata) {
    chunkStore.set(chunkId, { content, metadata });
}

export function retrieveChunk(chunkId) {
    return chunkStore.get(chunkId) || null;
}

export function getChunkContent(chunkId) {
    const chunk = chunkStore.get(chunkId);
    return chunk ? chunk.content : '';
}

export function clearChunks() {
    chunkStore.clear();
}

export function getStoreStats() {
    let totalSize = 0;
    chunkStore.forEach(chunk => {
        totalSize += chunk.content.length;
    });
    return {
        chunks_stored: chunkStore.size,
        total_size_bytes: totalSize,
        avg_size_bytes: chunkStore.size > 0 ? Math.floor(totalSize / chunkStore.size) : 0
    };
}
