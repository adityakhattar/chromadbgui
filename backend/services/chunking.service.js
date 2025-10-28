/**
 * Chunking Service
 *
 * Provides document chunking functionality with two modes:
 * 1. Semantic: Split by paragraphs (natural boundaries)
 * 2. Configurable: Fixed size with overlap
 */

class ChunkingService {
  /**
   * Chunk text based on mode
   * @param {string} text - Text to chunk
   * @param {object} options - Chunking options
   * @returns {Array<{text: string, index: number}>} Array of chunks
   */
  chunkText(text, options = {}) {
    const mode = options.mode || 'configurable'; // 'semantic' or 'configurable'

    if (mode === 'semantic') {
      return this.semanticChunk(text);
    } else {
      return this.configurableChunk(text, options);
    }
  }

  /**
   * Semantic chunking - split by paragraphs
   * @param {string} text - Text to chunk
   * @returns {Array<{text: string, index: number}>} Array of chunks
   */
  semanticChunk(text) {
    if (!text || text.trim().length === 0) {
      return [];
    }

    // Split by double newlines (paragraphs)
    const paragraphs = text
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    // If no paragraphs found, treat entire text as one chunk
    if (paragraphs.length === 0) {
      return [{ text: text.trim(), index: 0 }];
    }

    // Return each paragraph as a chunk
    return paragraphs.map((paragraph, index) => ({
      text: paragraph,
      index: index,
    }));
  }

  /**
   * Configurable chunking - fixed size with overlap
   * @param {string} text - Text to chunk
   * @param {object} options - Chunking options
   * @returns {Array<{text: string, index: number}>} Array of chunks
   */
  configurableChunk(text, options = {}) {
    const chunkSize = options.chunkSize || 500;
    const overlap = options.overlap || 50;

    if (!text || text.trim().length === 0) {
      return [];
    }

    const chunks = [];
    let startIndex = 0;
    let chunkIndex = 0;

    while (startIndex < text.length) {
      // Extract chunk
      const endIndex = Math.min(startIndex + chunkSize, text.length);
      const chunkText = text.substring(startIndex, endIndex);

      // Only add non-empty chunks
      if (chunkText.trim().length > 0) {
        chunks.push({
          text: chunkText.trim(),
          index: chunkIndex,
        });
        chunkIndex++;
      }

      // Move start index forward (accounting for overlap)
      startIndex = endIndex - overlap;

      // If we're at the end, break to avoid infinite loop
      if (startIndex >= text.length) {
        break;
      }
    }

    return chunks;
  }

  /**
   * Estimate number of chunks without actually chunking
   * @param {string} text - Text to estimate
   * @param {object} options - Chunking options
   * @returns {number} Estimated number of chunks
   */
  estimateChunks(text, options = {}) {
    const mode = options.mode || 'configurable';

    if (!text || text.trim().length === 0) {
      return 0;
    }

    if (mode === 'semantic') {
      // Count paragraphs
      const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
      return Math.max(1, paragraphs.length);
    } else {
      // Calculate based on size and overlap
      const chunkSize = options.chunkSize || 500;
      const overlap = options.overlap || 50;
      const textLength = text.length;

      if (textLength <= chunkSize) {
        return 1;
      }

      // Formula: ceil((length - chunkSize) / (chunkSize - overlap)) + 1
      const step = chunkSize - overlap;
      return Math.ceil((textLength - chunkSize) / step) + 1;
    }
  }

  /**
   * Create document objects for each chunk
   * @param {string} baseId - Base document ID
   * @param {string} text - Full text to chunk
   * @param {object} options - Chunking options
   * @param {object} baseMetadata - Base metadata to include in all chunks
   * @returns {Array<object>} Array of document objects ready for ChromaDB
   */
  createChunkedDocuments(baseId, text, options = {}, baseMetadata = {}) {
    const chunks = this.chunkText(text, options);
    const totalChunks = chunks.length;

    return chunks.map((chunk, index) => {
      const chunkId = `${baseId}_chunk_${index + 1}`;

      return {
        id: chunkId,
        text: chunk.text,
        metadata: {
          ...baseMetadata,
          parent_doc_id: baseId,
          chunk_index: index + 1,
          total_chunks: totalChunks,
          chunk_mode: options.mode || 'configurable',
        },
      };
    });
  }
}

// Export singleton instance
module.exports = new ChunkingService();
