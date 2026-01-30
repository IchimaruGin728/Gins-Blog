import type { Ai } from '@cloudflare/workers-types';
import type { VectorizeIndex } from '@cloudflare/workers-types';

export interface VectorizePost {
  id: string;
  title: string;
  content: string;
}

export async function generateEmbedding(ai: Ai, text: string) {
  const result = await ai.run('@cf/baai/bge-m3', {
    text: [text],
  }) as { data: number[][] }; // Cast to expected shape
  return result.data[0];
}

export async function insertPostVector(
  ai: Ai,
  index: VectorizeIndex,
  post: VectorizePost
) {
  // Create a combined text for embedding (Title + Content)
  // Truncate/Chunk if necessary, but bge-m3 handles reasonable length.
  // Ideally we chunk long content, but for simplicity/demo we take first chunk or full text if small.
  // Cloudflare AI text embeddings have input limits (~8192 tokens for bge-m3 usually safe).
  
  const textToEmbed = `${post.title} \n ${post.content}`;
  const values = await generateEmbedding(ai, textToEmbed);

  await index.upsert([
    {
      id: post.id.toString(),
      values,
      metadata: { title: post.title },
    },
  ]);
}

export async function deletePostVector(index: VectorizeIndex, id: string) {
  await index.deleteByIds([id]);
}

export async function querySimilarPosts(
  ai: Ai,
  index: VectorizeIndex,
  query: string,
  topK = 5
) {
  const values = await generateEmbedding(ai, query);
  
  const results = await index.query(values, {
    topK,
    returnMetadata: true,
  });

  return results.matches;
}
