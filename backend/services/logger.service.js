/**
 * Logging Service
 *
 * Provides structured logging with daily file rotation
 * Logs are stored in logs/ directory with format: chromagui-YYYY-MM-DD.log
 */

const pino = require('pino');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Get current date for log file name
function getLogFileName() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `chromagui-${year}-${month}-${day}.log`;
}

// Create log file path
function getLogFilePath() {
  return path.join(logsDir, getLogFileName());
}

// Create pino logger with file transport
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
}, pino.destination(getLogFilePath()));

// Track current log file for rotation
let currentLogFile = getLogFileName();

// Check and rotate log file daily
function checkRotation() {
  const newLogFile = getLogFileName();
  if (newLogFile !== currentLogFile) {
    currentLogFile = newLogFile;
    logger.flush();
  }
}

// Check for rotation every hour
setInterval(checkRotation, 3600000);

/**
 * Log an API request
 * @param {Object} data - Log data
 */
function logRequest(data) {
  logger.info({
    type: 'request',
    ...data
  });
}

/**
 * Log an error
 * @param {Object} data - Error data
 */
function logError(data) {
  logger.error({
    type: 'error',
    ...data
  });
}

/**
 * Log a warning
 * @param {Object} data - Warning data
 */
function logWarning(data) {
  logger.warn({
    type: 'warning',
    ...data
  });
}

/**
 * Read log files with optional filtering
 * @param {Object} options - Filter options
 * @returns {Array} Filtered log entries
 */
function readLogs(options = {}) {
  const {
    startDate = null,
    endDate = null,
    level = null,
    collection = null,
    action = null,
    limit = 100
  } = options;

  const logs = [];
  const files = fs.readdirSync(logsDir)
    .filter(f => f.startsWith('chromagui-') && f.endsWith('.log'))
    .sort()
    .reverse(); // Most recent first

  for (const file of files) {
    const filePath = path.join(logsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim()).reverse(); // Reverse to get newest first

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);

        // Apply filters
        if (startDate && entry.time < new Date(startDate).toISOString()) continue;
        if (endDate && entry.time > new Date(endDate).toISOString()) continue;
        if (level && entry.level !== level) continue;
        if (collection && entry.collection !== collection) continue;
        if (action && entry.action !== action) continue;

        logs.push(entry);

        // Limit results
        if (logs.length >= limit) break;
      } catch (e) {
        // Skip invalid JSON lines
        continue;
      }
    }

    if (logs.length >= limit) break;
  }

  return logs;
}

/**
 * Get list of available log files
 * @returns {Array} List of log files with metadata
 */
function getLogFiles() {
  const files = fs.readdirSync(logsDir)
    .filter(f => f.startsWith('chromagui-') && f.endsWith('.log'))
    .map(f => {
      const filePath = path.join(logsDir, f);
      const stats = fs.statSync(filePath);
      return {
        name: f,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    })
    .sort((a, b) => b.modified - a.modified);

  return files;
}

/**
 * Delete old log files
 * @param {number} retentionDays - Number of days to keep logs
 */
function cleanupOldLogs(retentionDays = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const files = fs.readdirSync(logsDir)
    .filter(f => f.startsWith('chromagui-') && f.endsWith('.log'));

  let deletedCount = 0;
  for (const file of files) {
    const filePath = path.join(logsDir, file);
    const stats = fs.statSync(filePath);

    if (stats.mtime < cutoffDate) {
      fs.unlinkSync(filePath);
      deletedCount++;
    }
  }

  return deletedCount;
}

module.exports = {
  logger,
  logRequest,
  logError,
  logWarning,
  readLogs,
  getLogFiles,
  cleanupOldLogs
};
