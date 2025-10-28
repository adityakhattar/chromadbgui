/**
 * Custom ChromaDB Service
 *
 * This service layer provides a wrapper around your custom ChromaDB API
 * with endpoints at http://34.93.4.115:5000
 *
 * Authentication: x-api-key header
 */

const axios = require('axios');

class CustomChromaService {
  constructor() {
    this.baseURL = process.env.CHROMA_API_URL || 'http://34.93.4.115:5000';
    this.apiKey = process.env.CHROMA_API_KEY || '';
    this.apiKeyHeader = process.env.CHROMA_API_KEY_HEADER || 'x-api-key';

    // Create axios instance with default config
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
        [this.apiKeyHeader]: this.apiKey,
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('ChromaDB API Error:', error.message);
        if (error.response) {
          console.error('Response data:', error.response.data);
          console.error('Response status:', error.response.status);
        }
        throw error;
      }
    );
  }

  /**
   * Health Check
   * GET /health
   */
  async health() {
    try {
      const response = await this.client.get('/health');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * List All Collections
   * GET /list_collections
   */
  async listCollections() {
    try {
      const response = await this.client.get('/list_collections');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Create Collection
   * POST /create_collection
   * Body: { name: string }
   */
  async createCollection(name) {
    try {
      const response = await this.client.post('/create_collection', { name });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete Collection
   * POST /delete_collection
   * Body: { name: string }
   */
  async deleteCollection(name) {
    try {
      const response = await this.client.post('/delete_collection', { name });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * List Documents in Collection
   * POST /list_documents
   * Body: { name: string, include: array (optional) }
   *
   * Options:
   *  - include: array of fields to include (e.g., ['embeddings', 'documents', 'metadatas'])
   *  - limit: number of documents to return
   *  - offset: starting position
   */
  async listDocuments(collectionName, options = {}) {
    try {
      const body = {
        name: collectionName,
        ...options, // Allow pagination, filters, include parameter, etc.
      };
      const response = await this.client.post('/list_documents', body);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Add or Update Document
   * POST /add_update
   * Body: {
   *   collection_name: string,
   *   id_field: string,
   *   document: object,
   *   metadata: array,
   *   additional_params: object
   * }
   */
  async addOrUpdateDocument(collectionName, document, idField, metadata = [], additionalParams = {}) {
    const body = {
      collection_name: collectionName,
      id_field: idField,
      document,
      metadata,
      additional_params: additionalParams,
    };

    try {
      console.log('===== ADD/UPDATE DOCUMENT REQUEST =====');
      console.log('Request Body:', JSON.stringify(body, null, 2));
      console.log('========================================');
      const response = await this.client.post('/add_update', body);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('===== ADD/UPDATE DOCUMENT ERROR =====');
      console.error('Request Body:', JSON.stringify(body, null, 2));
      console.error('Error:', error.message);
      console.error('=====================================');
      return { success: false, error: error.message };
    }
  }

  /**
   * Query Collection (Similarity Search)
   * POST /query
   * Body: {
   *   collection_name: string,
   *   query_text: string,
   *   n_results: number,
   *   where: object (optional metadata filter)
   * }
   */
  async query(collectionName, queryText, nResults = 10, where = null) {
    try {
      const body = {
        collection_name: collectionName,
        query_text: queryText,
        n_results: nResults,
      };

      // Add metadata filter if provided
      if (where && Object.keys(where).length > 0) {
        body.where = where;
      }

      const response = await this.client.post('/query', body);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete Document
   * POST /delete
   * Body: {
   *   collection_name: string,
   *   id: string,
   *   additional_params: object
   * }
   */
  async deleteDocument(collectionName, id, additionalParams = {}) {
    try {
      const body = {
        collection_name: collectionName,
        id,
        additional_params: additionalParams,
      };
      const response = await this.client.post('/delete', body);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Rename/Copy Collection
   * POST /rename_collection
   * Body: {
   *   old_name: string,
   *   new_name: string
   * }
   */
  async renameCollection(oldName, newName) {
    try {
      const body = {
        old_name: oldName,
        new_name: newName,
      };
      const response = await this.client.post('/rename_collection', body);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get Collection Statistics
   * This is a helper method that fetches collection info and document count
   */
  async getCollectionStats(collectionName) {
    try {
      const documentsResult = await this.listDocuments(collectionName);
      if (!documentsResult.success) {
        return { success: false, error: documentsResult.error };
      }

      const documents = documentsResult.data.documents || documentsResult.data || [];
      const count = Array.isArray(documents) ? documents.length : 0;

      return {
        success: true,
        data: {
          name: collectionName,
          count,
          documents: documents,
        },
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Batch Operations Helper
   * Add multiple documents at once
   */
  async batchAddDocuments(collectionName, documents, idField, metadata = []) {
    const results = [];
    const errors = [];

    for (const doc of documents) {
      // Extract metadata object and remove from document
      const { metadata: metadataObj, embedding: _, ...baseDoc } = doc;

      // Prepare document and metadata fields
      let documentToSend = { ...baseDoc };
      let metadataFields = [];

      // If document has metadata object, add its fields to the document
      // and track the field names for the metadata array
      if (metadataObj && typeof metadataObj === 'object' && Object.keys(metadataObj).length > 0) {
        // Add metadata fields directly to the document
        Object.assign(documentToSend, metadataObj);
        // Track which fields are metadata (array of field names)
        metadataFields = Object.keys(metadataObj);
      }

      const result = await this.addOrUpdateDocument(
        collectionName,
        documentToSend,
        idField,
        metadataFields, // Array of field names, not JSON strings
        {
          resource_id: documentToSend[idField],
          resource_type: 'document',
          event_type: 'add',
        }
      );

      if (result.success) {
        results.push(result.data);
      } else {
        errors.push({ document: doc, error: result.error });
      }
    }

    return {
      success: errors.length === 0,
      data: {
        successful: results.length,
        failed: errors.length,
        results,
        errors,
      },
    };
  }
}

// Export singleton instance
module.exports = new CustomChromaService();
