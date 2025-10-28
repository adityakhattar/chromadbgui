/**
 * Logging Service
 *
 * Provides centralized logging for the application with:
 * - In-memory log storage
 * - Filtering by date range, level, and search query
 * - Export functionality
 * - Automatic log rotation
 */

class LoggingService {
  constructor() {
    this.logs = [];
    this.maxLogs = 10000; // Keep last 10,000 logs
  }

  /**
   * Add a log entry
   * @param {string} level - Log level: 'info', 'warn', 'error', 'debug'
   * @param {string} message - Log message
   * @param {object} metadata - Additional metadata
   * @returns {object} The created log entry
   */
  log(level, message, metadata = {}) {
    const logEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata,
    };

    this.logs.unshift(logEntry); // Add to beginning

    // Rotate logs if exceeds max
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // Also console.log for debugging
    const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
    console[consoleMethod](`[${level.toUpperCase()}] ${message}`, metadata);

    return logEntry;
  }

  /**
   * Convenience methods for different log levels
   */
  info(message, metadata = {}) {
    return this.log('info', message, metadata);
  }

  warn(message, metadata = {}) {
    return this.log('warn', message, metadata);
  }

  error(message, metadata = {}) {
    return this.log('error', message, metadata);
  }

  debug(message, metadata = {}) {
    return this.log('debug', message, metadata);
  }

  /**
   * Get logs with optional filtering and pagination
   * @param {object} filters - Filter options
   * @returns {object} Paginated logs with metadata
   */
  getLogs(filters = {}) {
    let filtered = [...this.logs];

    // Filter by date range
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filtered = filtered.filter(log => new Date(log.timestamp) >= startDate);
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      filtered = filtered.filter(log => new Date(log.timestamp) <= endDate);
    }

    // Filter by level
    if (filters.level && filters.level !== 'all') {
      filtered = filtered.filter(log => log.level === filters.level);
    }

    // Filter by search query (searches message and metadata)
    if (filters.query && filters.query.trim()) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(log => {
        const messageMatch = log.message.toLowerCase().includes(query);
        const metadataMatch = JSON.stringify(log.metadata).toLowerCase().includes(query);
        return messageMatch || metadataMatch;
      });
    }

    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 50;
    const start = (page - 1) * limit;
    const end = start + limit;

    const paginatedLogs = filtered.slice(start, end);

    return {
      logs: paginatedLogs,
      total: filtered.length,
      page,
      limit,
      pages: Math.ceil(filtered.length / limit),
      filters: filters,
    };
  }

  /**
   * Export all logs matching filters
   * @param {object} filters - Filter options
   * @returns {array} Array of log entries
   */
  exportLogs(filters = {}) {
    // Get all logs without pagination
    const { logs } = this.getLogs({ ...filters, page: 1, limit: 999999 });
    return logs;
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    const count = this.logs.length;
    this.logs = [];
    this.info('Logs cleared', { count });
    return { success: true, message: `Cleared ${count} logs` };
  }

  /**
   * Get statistics about logs
   * @returns {object} Log statistics
   */
  getStats() {
    const stats = {
      total: this.logs.length,
      byLevel: {
        info: 0,
        warn: 0,
        error: 0,
        debug: 0,
      },
      oldest: this.logs.length > 0 ? this.logs[this.logs.length - 1].timestamp : null,
      newest: this.logs.length > 0 ? this.logs[0].timestamp : null,
    };

    this.logs.forEach(log => {
      if (stats.byLevel.hasOwnProperty(log.level)) {
        stats.byLevel[log.level]++;
      }
    });

    return stats;
  }
}

// Export singleton instance
module.exports = new LoggingService();
