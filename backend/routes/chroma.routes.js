/**
 * ChromaDB API Routes
 *
 * These routes provide a REST API for the ChromaGUI frontend
 * to interact with your custom ChromaDB instance.
 */

const chromaService = require('../services/customChroma.service');
const { readLogs, getLogFiles, cleanupOldLogs } = require('../services/logger.service');
const chunkingService = require('../services/chunking.service');
const urlFetcherService = require('../services/url-fetcher.service');

module.exports = function (app) {
  // ============================================
  // HEALTH & STATUS
  // ============================================

  /**
   * GET /api/chroma/health
   * Check ChromaDB connection health
   */
  app.get('/api/chroma/health', async (req, res) => {
    try {
      const result = await chromaService.health();
      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // ============================================
  // COLLECTIONS
  // ============================================

  /**
   * GET /api/chroma/collections
   * List all collections
   */
  app.get('/api/chroma/collections', async (req, res) => {
    try {
      const result = await chromaService.listCollections();
      if (result.success) {
        // Extract collections array from {collections: [...]} format
        const collections = result.data.collections || result.data || [];
        res.status(200).json({
          success: true,
          data: collections,
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /api/chroma/collections
   * Create a new collection
   * Body: { name: string }
   */
  app.post('/api/chroma/collections', async (req, res) => {
    try {
      const { name } = req.body;

      if (!name || typeof name !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Collection name is required and must be a string',
        });
      }

      const result = await chromaService.createCollection(name);
      if (result.success) {
        res.status(201).json({
          success: true,
          data: result.data,
          message: `Collection '${name}' created successfully`,
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * DELETE /api/chroma/collections/:name
   * Delete a collection
   */
  app.delete('/api/chroma/collections/:name', async (req, res) => {
    try {
      const { name } = req.params;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Collection name is required',
        });
      }

      const result = await chromaService.deleteCollection(name);
      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: `Collection '${name}' deleted successfully`,
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/chroma/collections/:name
   * Get collection details and statistics
   */
  app.get('/api/chroma/collections/:name', async (req, res) => {
    try {
      const { name } = req.params;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Collection name is required',
        });
      }

      const result = await chromaService.getCollectionStats(name);
      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
        });
      } else {
        res.status(404).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /api/chroma/collections/:oldName/rename
   * Rename a collection
   * Body: { newName: string }
   */
  app.post('/api/chroma/collections/:oldName/rename', async (req, res) => {
    try {
      const { oldName } = req.params;
      const { newName } = req.body;

      if (!oldName || !newName) {
        return res.status(400).json({
          success: false,
          error: 'Both old and new collection names are required',
        });
      }

      const result = await chromaService.renameCollection(oldName, newName);
      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: `Collection '${oldName}' renamed to '${newName}' successfully`,
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // ============================================
  // DOCUMENTS
  // ============================================

  /**
   * GET /api/chroma/collections/:name/documents
   * List documents in a collection
   * Query params: limit, offset (for pagination)
   */
  app.get('/api/chroma/collections/:name/documents', async (req, res) => {
    try {
      const { name } = req.params;
      const { limit, offset } = req.query;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Collection name is required',
        });
      }

      const options = {};
      if (limit) options.limit = parseInt(limit);
      if (offset) options.offset = parseInt(offset);

      const result = await chromaService.listDocuments(name, options);
      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /api/chroma/collections/:name/documents/url-fetch
   * Fetch content from URL, optionally chunk it, and create documents
   * Body: {
   *   url: string,
   *   baseId: string,
   *   authToken: string (optional),
   *   authType: string (optional: 'bearer', 'api-key', or custom),
   *   enableChunking: boolean,
   *   chunkingOptions: {
   *     mode: 'semantic' or 'configurable',
   *     chunkSize: number (for configurable mode),
   *     overlap: number (for configurable mode)
   *   },
   *   baseMetadata: object (optional - additional metadata for all docs/chunks)
   * }
   */
  app.post('/api/chroma/collections/:name/documents/url-fetch', async (req, res) => {
    try {
      const { name } = req.params;
      const {
        url,
        baseId,
        authToken,
        authType,
        enableChunking = false,
        chunkingOptions = {},
        baseMetadata = {},
      } = req.body;

      if (!name || !url || !baseId) {
        return res.status(400).json({
          success: false,
          error: 'Collection name, URL, and base ID are required',
        });
      }

      // Step 1: Fetch content from URL
      const fetchResult = await urlFetcherService.fetchURL(url, { authToken, authType });

      if (!fetchResult.success) {
        return res.status(400).json({
          success: false,
          error: fetchResult.error,
        });
      }

      // Step 2: Determine which documents to create
      let documentsToCreate = [];

      // Special handling for CSV (multiple rows)
      if (fetchResult.type === 'csv' && fetchResult.documents.length > 0) {
        // CSV: Each row is already a document
        documentsToCreate = fetchResult.documents.map((doc, index) => ({
          id: `${baseId}_row_${index + 1}`,
          text: doc.text,
          metadata: {
            ...baseMetadata,
            ...doc.metadata,
            ...fetchResult.metadata,
          },
        }));
      } else {
        // For non-CSV: single document with optional chunking
        const fullText = fetchResult.text;

        if (enableChunking && fullText) {
          // Apply chunking
          const chunkedDocs = chunkingService.createChunkedDocuments(
            baseId,
            fullText,
            chunkingOptions,
            {
              ...baseMetadata,
              ...fetchResult.metadata,
            }
          );
          documentsToCreate = chunkedDocs.map(doc => ({
            id: doc.id,
            text: doc.metadata.text || doc.text,
            metadata: doc.metadata,
          }));
        } else {
          // No chunking: single document
          documentsToCreate = [{
            id: baseId,
            text: fullText,
            metadata: {
              ...baseMetadata,
              ...fetchResult.metadata,
            },
          }];
        }
      }

      // Step 3: Add documents to ChromaDB
      if (documentsToCreate.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No content to create documents from',
        });
      }

      // Use batch add for efficiency
      const batchResult = await chromaService.batchAddDocuments(
        name,
        documentsToCreate,
        'id',
        Object.keys(documentsToCreate[0].metadata)
      );

      if (batchResult.success) {
        res.status(201).json({
          success: true,
          data: {
            ...batchResult.data,
            documentsCreated: documentsToCreate.length,
            source: fetchResult.type,
            sourceUrl: url,
          },
          message: `Successfully created ${documentsToCreate.length} document(s) from URL`,
        });
      } else {
        res.status(500).json({
          success: false,
          error: batchResult.error,
          data: batchResult.data,
        });
      }
    } catch (error) {
      console.error('URL fetch error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /api/chroma/collections/:name/documents
   * Add or update a document in a collection
   * Body: {
   *   idField: string,
   *   document: object,
   *   metadata: array,
   *   additionalParams: object
   * }
   */
  app.post('/api/chroma/collections/:name/documents', async (req, res) => {
    try {
      const { name } = req.params;
      const { idField, document, metadata = [], additionalParams = {} } = req.body;

      if (!name || !idField || !document) {
        return res.status(400).json({
          success: false,
          error: 'Collection name, idField, and document are required',
        });
      }

      const result = await chromaService.addOrUpdateDocument(
        name,
        document,
        idField,
        metadata,
        additionalParams
      );

      if (result.success) {
        res.status(201).json({
          success: true,
          data: result.data,
          message: 'Document added/updated successfully',
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * DELETE /api/chroma/collections/:name/documents/:id
   * Delete a document from a collection
   */
  app.delete('/api/chroma/collections/:name/documents/:id', async (req, res) => {
    try {
      const { name, id } = req.params;
      const { additionalParams = {} } = req.body;

      if (!name || !id) {
        return res.status(400).json({
          success: false,
          error: 'Collection name and document ID are required',
        });
      }

      const result = await chromaService.deleteDocument(name, id, additionalParams);
      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: `Document '${id}' deleted successfully`,
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // ============================================
  // QUERY / SEARCH
  // ============================================

  /**
   * POST /api/chroma/collections/:name/query
   * Perform similarity search in a collection
   * Body: {
   *   queryText: string,
   *   nResults: number (default: 10),
   *   where: object (optional metadata filter)
   * }
   */
  app.post('/api/chroma/collections/:name/query', async (req, res) => {
    try {
      const { name } = req.params;
      const { queryText, nResults = 10, where = null } = req.body;

      if (!name || !queryText) {
        return res.status(400).json({
          success: false,
          error: 'Collection name and query text are required',
        });
      }

      const result = await chromaService.query(name, queryText, nResults, where);
      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // ============================================
  // BATCH OPERATIONS
  // ============================================

  /**
   * POST /api/chroma/collections/:name/documents/batch
   * Add multiple documents at once
   * Body: {
   *   idField: string,
   *   documents: array,
   *   metadata: array
   * }
   */
  app.post('/api/chroma/collections/:name/documents/batch', async (req, res) => {
    try {
      const { name } = req.params;
      const { idField, documents, metadata = [] } = req.body;

      if (!name || !idField || !Array.isArray(documents)) {
        return res.status(400).json({
          success: false,
          error: 'Collection name, idField, and documents array are required',
        });
      }

      const result = await chromaService.batchAddDocuments(
        name,
        documents,
        idField,
        metadata
      );

      if (result.success) {
        res.status(201).json({
          success: true,
          data: result.data,
          message: `Batch operation complete: ${result.data.successful} successful, ${result.data.failed} failed`,
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error,
          data: result.data,
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // ============================================
  // IMPORT / EXPORT
  // ============================================

  /**
   * GET /api/chroma/collections/:name/export
   * Export collection to JSON format
   * Query params: format (json or csv, default: json)
   */
  app.get('/api/chroma/collections/:name/export', async (req, res) => {
    try {
      const { name } = req.params;
      const { format = 'json' } = req.query;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Collection name is required',
        });
      }

      // Get all documents from the collection (including embeddings)
      const result = await chromaService.listDocuments(name, {
        include: ['embeddings', 'documents', 'metadatas'],
      });
      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error,
        });
      }

      const { ids, embeddings, documents, metadatas } = result.data;

      if (format === 'csv') {
        // Export as CSV
        const rows = [];
        // Header row
        rows.push(['id', 'document', 'metadata'].join(','));

        // Data rows
        for (let i = 0; i < ids.length; i++) {
          const id = ids[i];
          const document = documents[i] || '';
          const metadata = metadatas[i] ? JSON.stringify(metadatas[i]) : '{}';

          // Escape CSV values
          const escapeCsv = (val) => {
            if (typeof val !== 'string') val = String(val);
            if (val.includes(',') || val.includes('"') || val.includes('\n')) {
              return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
          };

          rows.push([
            escapeCsv(id),
            escapeCsv(document),
            escapeCsv(metadata)
          ].join(','));
        }

        const csvContent = rows.join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${name}_export.csv"`);
        res.send(csvContent);
      } else {
        // Export as JSON
        const exportData = {
          collection: name,
          exportDate: new Date().toISOString(),
          documentCount: ids.length,
          documents: ids.map((id, i) => ({
            id,
            document: documents[i],
            metadata: metadatas[i],
            embedding: embeddings ? embeddings[i] : null,
          })),
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${name}_export.json"`);
        res.json(exportData);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /api/chroma/collections/:name/import
   * Import documents from JSON format
   * Body: {
   *   documents: array of {id, document, metadata, embedding?}
   *   idField: string (default: 'id')
   * }
   */
  app.post('/api/chroma/collections/:name/import', async (req, res) => {
    try {
      const { name } = req.params;
      const { documents, idField = 'id' } = req.body;

      if (!name || !Array.isArray(documents)) {
        return res.status(400).json({
          success: false,
          error: 'Collection name and documents array are required',
        });
      }

      // Transform import data to batch format
      const formattedDocs = documents.map(doc => {
        // If it's already in the right format
        if (doc.document !== undefined) {
          return doc;
        }
        // Otherwise, treat the whole object as the document
        return { document: doc };
      });

      const result = await chromaService.batchAddDocuments(
        name,
        formattedDocs,
        idField,
        []
      );

      if (result.success) {
        res.status(201).json({
          success: true,
          data: result.data,
          message: `Import complete: ${result.data.successful} successful, ${result.data.failed} failed`,
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error,
          data: result.data,
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // ============================================
  // EMBEDDINGS & VISUALIZATION
  // ============================================

  /**
   * GET /api/chroma/collections/:name/embeddings
   * Fetch all embeddings for visualization
   */
  app.get('/api/chroma/collections/:name/embeddings', async (req, res) => {
    try {
      const { name } = req.params;
      const { limit } = req.query;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Collection name is required',
        });
      }

      // Fetch all documents with embeddings
      const options = {
        include: ['embeddings', 'documents', 'metadatas'], // Explicitly request embeddings
      };
      if (limit) options.limit = parseInt(limit);

      const result = await chromaService.listDocuments(name, options);
      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch documents',
        });
      }

      const { ids, embeddings, documents, metadatas } = result.data;

      // Check if embeddings exist
      if (!embeddings || embeddings.length === 0) {
        return res.status(200).json({
          success: true,
          data: {
            hasEmbeddings: false,
            message: 'No embeddings found. Documents may not have been embedded yet.',
          },
        });
      }

      // Format data for visualization
      const visualizationData = ids.map((id, index) => ({
        id,
        embedding: embeddings[index],
        document: documents[index] || '',
        metadata: metadatas[index] || {},
      }));

      res.status(200).json({
        success: true,
        data: {
          hasEmbeddings: true,
          count: visualizationData.length,
          dimensions: embeddings[0]?.length || 0,
          points: visualizationData,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // ============================================
  // ANALYTICS & STATISTICS
  // ============================================

  /**
   * Analytics Cache
   * Cache analytics data for 5 hours to reduce load on ChromaDB
   */
  let analyticsCache = {
    data: null,
    timestamp: null,
    expiresAt: null,
  };

  const CACHE_DURATION_MS = 5 * 60 * 60 * 1000; // 5 hours in milliseconds

  /**
   * Helper function to check if cache is valid
   */
  function isCacheValid() {
    if (!analyticsCache.data || !analyticsCache.expiresAt) {
      return false;
    }
    return Date.now() < analyticsCache.expiresAt;
  }

  /**
   * Helper function to set cache
   */
  function setCache(data) {
    const now = Date.now();
    analyticsCache = {
      data: data,
      timestamp: now,
      expiresAt: now + CACHE_DURATION_MS,
    };
  }

  /**
   * Helper function to clear cache
   */
  function clearCache() {
    analyticsCache = {
      data: null,
      timestamp: null,
      expiresAt: null,
    };
  }

  /**
   * POST /api/analytics/cache/clear
   * Clear analytics cache (for manual refresh)
   */
  app.post('/api/analytics/cache/clear', (req, res) => {
    clearCache();
    res.status(200).json({
      success: true,
      message: 'Analytics cache cleared',
    });
  });

  /**
   * GET /api/analytics/cache/status
   * Get cache status
   */
  app.get('/api/analytics/cache/status', (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        cached: !!analyticsCache.data,
        timestamp: analyticsCache.timestamp,
        expiresAt: analyticsCache.expiresAt,
        valid: isCacheValid(),
        remainingTimeMs: analyticsCache.expiresAt ? Math.max(0, analyticsCache.expiresAt - Date.now()) : 0,
      },
    });
  });

  /**
   * GET /api/analytics/overview
   * Get overall system statistics (with 5-hour caching)
   */
  app.get('/api/analytics/overview', async (req, res) => {
    try {
      // Check if we should bypass cache (force refresh)
      const forceRefresh = req.query.refresh === 'true';

      // Return cached data if valid and not forcing refresh
      if (!forceRefresh && isCacheValid()) {
        return res.status(200).json({
          success: true,
          data: analyticsCache.data,
          cached: true,
          cacheTimestamp: analyticsCache.timestamp,
          cacheExpiresAt: analyticsCache.expiresAt,
        });
      }

      // Get all collections
      const collectionsResult = await chromaService.listCollections();
      if (!collectionsResult.success) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch collections',
        });
      }

      const collections = collectionsResult.data.collections || collectionsResult.data || [];
      const totalCollections = collections.length;

      // Get detailed stats for each collection
      let totalDocuments = 0;
      let totalEmbeddingDimensions = 0;
      let embeddingDimensionsCount = 0;
      const collectionStats = [];
      const metadataFields = new Set();
      const embeddingModels = new Set();
      const distanceFunctions = new Set();
      const vectorDimensions = {};

      for (const collectionName of collections) {
        try {
          const docsResult = await chromaService.listDocuments(collectionName, {});
          if (docsResult.success && docsResult.data.ids) {
            const docCount = docsResult.data.ids.length;
            totalDocuments += docCount;

            // Extract metadata fields
            if (docsResult.data.metadatas && Array.isArray(docsResult.data.metadatas)) {
              docsResult.data.metadatas.forEach(metadata => {
                if (metadata && typeof metadata === 'object') {
                  Object.keys(metadata).forEach(key => metadataFields.add(key));

                  // Track embedding models if present
                  if (metadata.embedding_model) {
                    embeddingModels.add(metadata.embedding_model);
                  }
                }
              });
            }

            // Track vector dimensions
            let dimensions = 0;
            if (docsResult.data.embeddings && docsResult.data.embeddings.length > 0) {
              dimensions = docsResult.data.embeddings[0].length;
              totalEmbeddingDimensions += dimensions;
              embeddingDimensionsCount++;
              vectorDimensions[dimensions] = (vectorDimensions[dimensions] || 0) + 1;
            }

            // Get collection metadata (distance function)
            try {
              const collectionResult = await chromaService.getCollection(collectionName);
              if (collectionResult.success && collectionResult.data.metadata) {
                if (collectionResult.data.metadata['hnsw:space']) {
                  distanceFunctions.add(collectionResult.data.metadata['hnsw:space']);
                }
              }
            } catch (err) {
              // Ignore collection metadata errors
            }

            collectionStats.push({
              name: collectionName,
              documentCount: docCount,
              dimensions: dimensions,
            });
          }
        } catch (err) {
          // Skip collections with errors
          collectionStats.push({
            name: collectionName,
            documentCount: 0,
            error: true,
          });
        }
      }

      // Calculate statistics
      const emptyCollections = collectionStats.filter(c => c.documentCount === 0 && !c.error).length;
      const errorCollections = collectionStats.filter(c => c.error).length;

      // Sort collections by document count (descending)
      collectionStats.sort((a, b) => b.documentCount - a.documentCount);

      const avgDocuments = totalCollections > 0 ? Math.round(totalDocuments / totalCollections) : 0;
      const avgDimensions = embeddingDimensionsCount > 0 ? Math.round(totalEmbeddingDimensions / embeddingDimensionsCount) : 0;

      // Calculate median documents
      const sortedCounts = collectionStats.filter(c => !c.error).map(c => c.documentCount).sort((a, b) => a - b);
      const medianDocuments = sortedCounts.length > 0
        ? sortedCounts.length % 2 === 0
          ? Math.round((sortedCounts[sortedCounts.length / 2 - 1] + sortedCounts[sortedCounts.length / 2]) / 2)
          : sortedCounts[Math.floor(sortedCounts.length / 2)]
        : 0;

      // Document distribution buckets
      const distributionBuckets = {
        '0': 0,
        '1-10': 0,
        '11-100': 0,
        '101-1000': 0,
        '1001-10000': 0,
        '10000+': 0,
      };

      collectionStats.forEach(c => {
        if (c.error) return;
        const count = c.documentCount;
        if (count === 0) distributionBuckets['0']++;
        else if (count <= 10) distributionBuckets['1-10']++;
        else if (count <= 100) distributionBuckets['11-100']++;
        else if (count <= 1000) distributionBuckets['101-1000']++;
        else if (count <= 10000) distributionBuckets['1001-10000']++;
        else distributionBuckets['10000+']++;
      });

      // Prepare response data
      const responseData = {
        // Basic stats
        totalCollections,
        totalDocuments,
        averageDocumentsPerCollection: avgDocuments,
        medianDocumentsPerCollection: medianDocuments,

        // Collection lists
        topCollections: collectionStats.slice(0, 5),
        bottomCollections: collectionStats.slice(-5).reverse(),
        allCollections: collectionStats,

        // Storage & Performance
        emptyCollections,
        errorCollections,

        // Vector & Embedding Analytics
        averageVectorDimensions: avgDimensions,
        embeddingModels: Array.from(embeddingModels),
        metadataFields: Array.from(metadataFields),
        distanceFunctions: Array.from(distanceFunctions),
        vectorDimensionDistribution: vectorDimensions,

        // Distribution
        distributionBuckets,
      };

      // Cache the data for 5 hours
      setCache(responseData);

      // Send response with cache info
      res.status(200).json({
        success: true,
        data: responseData,
        cached: false,
        cacheTimestamp: analyticsCache.timestamp,
        cacheExpiresAt: analyticsCache.expiresAt,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/analytics/collection/:name
   * Get detailed analytics for a specific collection
   */
  app.get('/api/analytics/collection/:name', async (req, res) => {
    try {
      const { name } = req.params;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Collection name is required',
        });
      }

      // Get all documents
      const docsResult = await chromaService.listDocuments(name, {});
      if (!docsResult.success) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch documents',
        });
      }

      const { ids, documents, metadatas } = docsResult.data;
      const documentCount = ids ? ids.length : 0;

      // Analyze metadata distribution
      const metadataKeys = new Set();
      const metadataDistribution = {};

      if (metadatas && Array.isArray(metadatas)) {
        metadatas.forEach(metadata => {
          if (metadata && typeof metadata === 'object') {
            Object.keys(metadata).forEach(key => {
              metadataKeys.add(key);
              if (!metadataDistribution[key]) {
                metadataDistribution[key] = {};
              }
              const value = String(metadata[key]);
              metadataDistribution[key][value] = (metadataDistribution[key][value] || 0) + 1;
            });
          }
        });
      }

      // Calculate document length statistics
      let totalLength = 0;
      let minLength = Infinity;
      let maxLength = 0;

      if (documents && Array.isArray(documents)) {
        documents.forEach(doc => {
          if (doc && typeof doc === 'string') {
            const length = doc.length;
            totalLength += length;
            minLength = Math.min(minLength, length);
            maxLength = Math.max(maxLength, length);
          }
        });
      }

      const avgLength = documentCount > 0 ? Math.round(totalLength / documentCount) : 0;

      res.status(200).json({
        success: true,
        data: {
          collection: name,
          documentCount,
          metadataKeys: Array.from(metadataKeys),
          metadataDistribution,
          documentLengthStats: {
            average: avgLength,
            min: minLength === Infinity ? 0 : minLength,
            max: maxLength,
            total: totalLength,
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // ============================================
  // LOGS
  // ============================================

  // Logging endpoints have been moved to index.simple.js
};
