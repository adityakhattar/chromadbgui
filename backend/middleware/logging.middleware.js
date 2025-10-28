/**
 * Logging Middleware
 *
 * Logs all API requests with timing and status information
 */

const loggingService = require('../services/logging.service');

/**
 * Extract collection name from request path
 * @param {string} path - Request path
 * @returns {string|null} Collection name or null
 */
function extractCollectionName(path) {
  const match = path.match(/\/api\/chroma\/collections\/([^\/]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Extract action type from request
 * @param {string} method - HTTP method
 * @param {string} path - Request path
 * @returns {string} Action type
 */
function extractAction(method, path) {
  if (path.includes('/health')) return 'health_check';
  if (path.includes('/query')) return 'query';
  if (path.includes('/documents/batch')) return 'batch_add';
  if (path.includes('/documents') && method === 'GET') return 'list_documents';
  if (path.includes('/documents') && method === 'POST') return 'create_document';
  if (path.includes('/documents') && method === 'DELETE') return 'delete_document';
  if (path.includes('/collections') && method === 'GET' && !path.match(/\/collections\/[^\/]+/)) return 'list_collections';
  if (path.includes('/collections') && method === 'GET') return 'get_collection';
  if (path.includes('/collections') && method === 'POST') return 'create_collection';
  if (path.includes('/collections') && method === 'DELETE') return 'delete_collection';
  if (path.includes('/rename')) return 'rename_collection';
  return 'unknown';
}

/**
 * Logging middleware
 */
function loggingMiddleware(req, res, next) {
  const startTime = Date.now();

  // Store original res.json and res.send
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  // Override res.json to capture response
  res.json = function(body) {
    logResponse(req, res, startTime, body);
    return originalJson(body);
  };

  // Override res.send to capture response
  res.send = function(body) {
    logResponse(req, res, startTime, body);
    return originalSend(body);
  };

  // Handle errors
  res.on('error', (error) => {
    const latency = Date.now() - startTime;
    loggingService.error(`${req.method} ${req.path} - ${error.message}`, {
      action: extractAction(req.method, req.path),
      collection: extractCollectionName(req.path),
      method: req.method,
      path: req.path,
      status: res.statusCode || 500,
      latency,
      error: error.message,
      stack: error.stack
    });
  });

  next();
}

/**
 * Log response after it's sent
 */
function logResponse(req, res, startTime, body) {
  const latency = Date.now() - startTime;
  const collection = extractCollectionName(req.path);
  const action = extractAction(req.method, req.path);

  const logData = {
    action,
    collection,
    method: req.method,
    path: req.path,
    status: res.statusCode,
    latency,
    ip: req.ip || req.connection.remoteAddress,
  };

  // Add query params if present
  if (Object.keys(req.query).length > 0) {
    logData.query = req.query;
  }

  // Add body summary for POST/PUT/PATCH (limit size)
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    const bodySummary = JSON.stringify(req.body).substring(0, 200);
    logData.bodySummary = bodySummary;
  }

  // Parse response body if possible
  try {
    const responseBody = typeof body === 'string' ? JSON.parse(body) : body;
    if (responseBody && !responseBody.success) {
      logData.error = responseBody.error || 'Unknown error';
    }
  } catch (e) {
    // Ignore parsing errors
  }

  // Determine log level based on status code
  const level = res.statusCode >= 500 ? 'error' :
                res.statusCode >= 400 ? 'warn' :
                'info';

  const message = `${req.method} ${req.path} - ${res.statusCode} (${latency}ms)`;
  loggingService.log(level, message, logData);
}

module.exports = loggingMiddleware;
