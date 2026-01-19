const CHUNK_SIZE_TOKENS = 1000;
const OVERLAP_PERCENTAGE = 0.15;
const CHARS_PER_TOKEN = 4;

const CHUNK_SIZE_CHARS = CHUNK_SIZE_TOKENS * CHARS_PER_TOKEN;
const OVERLAP_CHARS = Math.floor(CHUNK_SIZE_CHARS * OVERLAP_PERCENTAGE);

export function chunkText(text, documentId, title = 'Untitled') {
    if (!text || text.trim().length === 0) {
        throw new Error('Text cannot be empty');
    }

    if (text.length <= CHUNK_SIZE_CHARS) {
        return [{
            content: text.trim(),
            metadata: {
                document_id: documentId,
                document_title: title,
                chunk_index: 0,
                start_char: 0,
                end_char: text.length
            }
        }];
    }

    const chunks = [];
    let position = 0;

    while (position < text.length) {
        let chunkEnd = Math.min(position + CHUNK_SIZE_CHARS, text.length);
        let chunk = text.slice(position, chunkEnd);

        if (chunkEnd < text.length) {
            const lastPeriod = chunk.lastIndexOf('.');
            const lastNewline = chunk.lastIndexOf('\n');
            const splitPoint = Math.max(lastPeriod, lastNewline);

            if (splitPoint > chunk.length * 0.5) {
                chunk = chunk.slice(0, splitPoint + 1);
                chunkEnd = position + chunk.length;
            }
        }

        const trimmedChunk = chunk.trim();
        if (trimmedChunk.length > 0) {
            chunks.push({
                content: trimmedChunk,
                metadata: {
                    document_id: documentId,
                    document_title: title,
                    chunk_index: chunks.length,
                    start_char: position,
                    end_char: chunkEnd
                }
            });
        }

        if (chunkEnd >= text.length) {
            break;
        }

        position = chunkEnd - OVERLAP_CHARS;

        if (position <= chunks[chunks.length - 1].metadata.start_char) {
            position = chunkEnd;
        }
    }

    return chunks;
}

