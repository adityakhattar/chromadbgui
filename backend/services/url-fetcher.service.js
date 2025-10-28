/**
 * URL Fetcher Service
 *
 * Fetches content from URLs and parses various formats:
 * - HTML pages
 * - Markdown files
 * - Plain text files
 * - CSV files (each row becomes a document)
 * - JSON files (pretty printed)
 */

const axios = require('axios');
const cheerio = require('cheerio');
const { parse: parseCSV } = require('csv-parse/sync');

class URLFetcherService {
  /**
   * Fetch content from URL
   * @param {string} url - URL to fetch
   * @param {object} options - Fetch options
   * @returns {Promise<object>} Fetched content and metadata
   */
  async fetchURL(url, options = {}) {
    const { authToken, authType } = options;

    try {
      // Prepare headers
      const headers = {
        'User-Agent': 'ChromaDBUI/1.0',
      };

      // Add authentication if provided
      if (authToken) {
        if (authType === 'bearer') {
          headers['Authorization'] = `Bearer ${authToken}`;
        } else if (authType === 'api-key') {
          headers['X-API-Key'] = authToken;
        } else {
          headers['Authorization'] = authToken;
        }
      }

      // Fetch URL with 30 second timeout
      const response = await axios.get(url, {
        headers,
        timeout: 30000,
        maxContentLength: 50 * 1024 * 1024, // 50MB max
        responseType: 'text',
      });

      const contentType = response.headers['content-type'] || '';
      const content = response.data;

      // Parse based on content type
      let result = await this.parseContent(content, contentType, url);

      return {
        success: true,
        ...result,
        metadata: {
          ...result.metadata,
          source_url: url,
          fetched_at: new Date().toISOString(),
          content_type: contentType,
        },
      };
    } catch (error) {
      console.error('Error fetching URL:', error);

      let errorMessage = 'Failed to fetch URL';
      if (error.response) {
        errorMessage = `HTTP ${error.response.status}: ${error.response.statusText}`;
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out (30s limit)';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Parse content based on type
   * @param {string} content - Raw content
   * @param {string} contentType - Content MIME type
   * @param {string} url - Original URL (for extension detection)
   * @returns {Promise<object>} Parsed content
   */
  async parseContent(content, contentType, url) {
    const lowerType = contentType.toLowerCase();
    const urlLower = url.toLowerCase();

    // CSV
    if (lowerType.includes('csv') || urlLower.endsWith('.csv')) {
      return this.parseCSV(content);
    }

    // JSON
    if (lowerType.includes('json') || urlLower.endsWith('.json')) {
      return this.parseJSON(content);
    }

    // Markdown
    if (lowerType.includes('markdown') || urlLower.endsWith('.md')) {
      return this.parseMarkdown(content);
    }

    // HTML
    if (lowerType.includes('html') || urlLower.endsWith('.html') || urlLower.endsWith('.htm')) {
      return this.parseHTML(content);
    }

    // Plain text (default)
    return this.parsePlainText(content);
  }

  /**
   * Parse HTML content
   * @param {string} html - HTML content
   * @returns {object} Parsed content
   */
  parseHTML(html) {
    const $ = cheerio.load(html);

    // Remove script and style tags
    $('script, style, nav, header, footer').remove();

    // Extract text from body
    const text = $('body').text()
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n\n')
      .trim();

    // Extract title
    const title = $('title').text() || $('h1').first().text() || 'Untitled';

    return {
      type: 'html',
      text,
      documents: [{ text }],
      metadata: {
        title: title.trim(),
        doc_type: 'html_page',
      },
    };
  }

  /**
   * Parse Markdown content
   * @param {string} markdown - Markdown content
   * @returns {object} Parsed content
   */
  parseMarkdown(markdown) {
    return {
      type: 'markdown',
      text: markdown.trim(),
      documents: [{ text: markdown.trim() }],
      metadata: {
        doc_type: 'markdown',
      },
    };
  }

  /**
   * Parse plain text content
   * @param {string} text - Plain text content
   * @returns {object} Parsed content
   */
  parsePlainText(text) {
    return {
      type: 'text',
      text: text.trim(),
      documents: [{ text: text.trim() }],
      metadata: {
        doc_type: 'text',
      },
    };
  }

  /**
   * Parse JSON content
   * @param {string} json - JSON string
   * @returns {object} Parsed content
   */
  parseJSON(json) {
    try {
      const data = JSON.parse(json);
      const prettyJSON = JSON.stringify(data, null, 2);

      return {
        type: 'json',
        text: prettyJSON,
        documents: [{ text: prettyJSON }],
        metadata: {
          doc_type: 'json',
        },
      };
    } catch (error) {
      // If JSON parsing fails, treat as plain text
      return this.parsePlainText(json);
    }
  }

  /**
   * Parse CSV content - each row becomes a document
   * @param {string} csv - CSV string
   * @returns {object} Parsed content
   */
  parseCSV(csv) {
    try {
      const records = parseCSV(csv, {
        columns: true, // Use first row as column names
        skip_empty_lines: true,
        trim: true,
      });

      if (records.length === 0) {
        return {
          type: 'csv',
          text: '',
          documents: [],
          metadata: {
            doc_type: 'csv',
            row_count: 0,
          },
        };
      }

      // Convert each row to a document
      const documents = records.map((row, index) => {
        // Try to find a text/content column
        const textColumn = this.findTextColumn(row);
        const text = textColumn ? row[textColumn] : this.formatRowAsText(row);

        // All columns become metadata
        const metadata = { ...row };

        return {
          text,
          metadata: {
            ...metadata,
            row_index: index + 1,
            doc_type: 'csv_row',
          },
        };
      });

      return {
        type: 'csv',
        text: csv, // Keep original CSV as full text
        documents,
        metadata: {
          doc_type: 'csv',
          row_count: records.length,
          columns: Object.keys(records[0]),
        },
      };
    } catch (error) {
      console.error('CSV parsing error:', error);
      // If CSV parsing fails, treat as plain text
      return this.parsePlainText(csv);
    }
  }

  /**
   * Find a column that likely contains main text content
   * @param {object} row - CSV row object
   * @returns {string|null} Column name or null
   */
  findTextColumn(row) {
    const textColumnNames = ['text', 'content', 'description', 'body', 'message', 'document'];

    for (const colName of textColumnNames) {
      if (row.hasOwnProperty(colName)) {
        return colName;
      }
    }

    // Check case-insensitive
    const keys = Object.keys(row);
    for (const colName of textColumnNames) {
      const match = keys.find(k => k.toLowerCase() === colName.toLowerCase());
      if (match) {
        return match;
      }
    }

    return null;
  }

  /**
   * Format CSV row as text (when no text column found)
   * @param {object} row - CSV row object
   * @returns {string} Formatted text
   */
  formatRowAsText(row) {
    return Object.entries(row)
      .map(([key, value]) => `${key}: ${value}`)
      .join(' | ');
  }
}

// Export singleton instance
module.exports = new URLFetcherService();
