import axios from "axios";

const BATCH_SIZE = 3;
const DELAY_BETWEEN_BATCHES = 2000;
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 5000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function generateEmbedding(text, retryCount = 0) {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        model: "models/text-embedding-004",
        content: {
          parts: [{ text }],
        },
      },
    );

    return response.data.embedding.values;
  } catch (error) {
    // Handle rate limit (429) with exponential backoff
    if (error.response?.status === 429 && retryCount < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      console.log(
        `Rate limited (429). Waiting ${delay / 1000}s before retry ${retryCount + 1}/${MAX_RETRIES}...`,
      );
      await sleep(delay);

      return generateEmbedding(text, retryCount + 1);
    }
    console.error("Embedding error:", error.message);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

export async function generateBatchEmbeddings(texts) {
  const embeddings = [];
  const totalBatches = Math.ceil(texts.length / BATCH_SIZE);

  console.log(
    `Starting embedding generation: ${texts.length} chunks in ${totalBatches} batches (batch size: ${BATCH_SIZE})`,
  );

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const batch = texts.slice(i, i + BATCH_SIZE);

    try {
      console.log(
        `Processing batch ${batchNumber}/${totalBatches} (${batch.length} chunks)`,
      );
      const batchEmbeddings = await Promise.all(
        batch.map((text) => generateEmbedding(text)),
      );

      embeddings.push(...batchEmbeddings);

      // Add delay between batches to allow garbage collection
      if (i + BATCH_SIZE < texts.length) {
        await new Promise((resolve) =>
          setTimeout(resolve, DELAY_BETWEEN_BATCHES),
        );
      }
    } catch (error) {
      console.error(`Error processing batch ${batchNumber}:`, error.message);
      throw error;
    }
  }

  console.log(
    `Completed embedding generation: ${embeddings.length} embeddings created`,
  );
  return embeddings;
}
