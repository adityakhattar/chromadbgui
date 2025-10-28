/**
 * ChromaGUI Backend Server
 * Simplified version without authentication, organizations, or Prisma
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// ============================================
// MIDDLEWARE
// ============================================

app.use(cors({ origin: true }));
app.use(bodyParser.json({ limit: '10GB' }));
app.use(bodyParser.urlencoded({ limit: '10GB', extended: true }));
app.use(bodyParser.text({ limit: '10GB' }));

// Logging middleware
const loggingMiddleware = require('./middleware/logging.middleware');
app.use(loggingMiddleware);

// ============================================
// API ROUTES
// ============================================

// Import and register ChromaDB routes
const chromaRoutes = require('./routes/chroma.routes');
chromaRoutes(app);

// Import and register Logging routes
const loggingService = require('./services/logging.service');

// Logging endpoints
app.get('/api/logs', (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      level: req.query.level,
      query: req.query.query,
      page: req.query.page,
      limit: req.query.limit,
    };

    const result = loggingService.getLogs(filters);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/logs/export', (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      level: req.query.level,
      query: req.query.query,
    };

    const logs = loggingService.exportLogs(filters);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=chromagui-logs-${Date.now()}.json`);
    res.send(JSON.stringify(logs, null, 2));
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/logs/stats', (req, res) => {
  try {
    const stats = loggingService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/logs', (req, res) => {
  try {
    const result = loggingService.clearLogs();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'ChromaGUI Backend',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// API info endpoint
app.get('/api/info', (req, res) => {
  res.status(200).json({
    name: 'ChromaGUI API',
    version: '1.0.0',
    chromaUrl: process.env.CHROMA_API_URL,
    endpoints: {
      health: 'GET /health',
      collections: {
        list: 'GET /api/chroma/collections',
        create: 'POST /api/chroma/collections',
        get: 'GET /api/chroma/collections/:name',
        delete: 'DELETE /api/chroma/collections/:name',
        rename: 'POST /api/chroma/collections/:oldName/rename',
      },
      documents: {
        list: 'GET /api/chroma/collections/:name/documents',
        create: 'POST /api/chroma/collections/:name/documents',
        delete: 'DELETE /api/chroma/collections/:name/documents/:id',
        batch: 'POST /api/chroma/collections/:name/documents/batch',
      },
      query: {
        search: 'POST /api/chroma/collections/:name/query',
      },
      importExport: {
        export: 'GET /api/chroma/collections/:name/export?format=json|csv',
        import: 'POST /api/chroma/collections/:name/import',
      },
      analytics: {
        overview: 'GET /api/analytics/overview',
        collection: 'GET /api/analytics/collection/:name',
      },
      visualization: {
        embeddings: 'GET /api/chroma/collections/:name/embeddings',
      },
    },
  });
});

// ============================================
// STATIC FILES (Production)
// ============================================

if (process.env.NODE_ENV !== 'development') {
  // Serve static frontend files
  app.use(express.static(path.resolve(__dirname, 'public'), { extensions: ['js'] }));

  // SPA fallback - serve index.html for all other routes
  app.use('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  // Robots.txt
  app.get('/robots.txt', function (req, res) {
    res.type('text/plain');
    res.send('User-agent: *\nDisallow: /').end();
  });
}

// ============================================
// 404 HANDLER
// ============================================

app.all('*', function (req, res) {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.url,
    method: req.method,
  });
});

// ============================================
// ERROR HANDLER
// ============================================

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.SERVER_PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 ChromaGUI Backend Server Started');
  console.log('='.repeat(60));
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Server URL: http://${HOST}:${PORT}`);
  console.log(`ChromaDB URL: ${process.env.CHROMA_API_URL}`);
  console.log(`API Documentation: http://${HOST}:${PORT}/api/info`);
  console.log('='.repeat(60) + '\n');
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});
