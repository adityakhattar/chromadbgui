# ChromaGUI Implementation Plan

This document outlines the comprehensive implementation plan for all requested features.

## ✅ Phase 1: Theme System (COMPLETED)

### 1.1 Environment Variables
**Status**: ✅ Complete

- [x] Added color configuration to `.env` file
- [x] Created centralized theme configuration in `src/styles/theme.ts`
- [x] Documented all color usage in STYLING_GUIDE.md

### 1.2 CSS Variables
**Status**: ✅ Complete

- [x] Created `src/styles/colors.css` with all CSS custom properties
- [x] Defined background, text, border, status, and shadow colors
- [x] Added spacing, typography, and animation variables
- [x] Imported in `src/index.css`

### 1.3 Documentation
**Status**: ✅ Complete

- [x] Created `STYLING_GUIDE.md` with comprehensive color reference
- [x] Documented all component patterns and usage examples
- [x] Added quick reference guide for common combinations

---

## 🔄 Phase 2: Logs Page with Export & Date Range

### 2.1 Backend: Logging System
**Status**: ⚪ Not Started

#### Create Logging Service
```javascript
// backend/services/logging.service.js
class LoggingService {
  constructor() {
    this.logs = [];
    this.maxLogs = 10000; // Keep last 10k logs
  }

  log(level, message, metadata = {}) {
    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      level, // 'info', 'warn', 'error', 'debug'
      message,
      metadata,
    };

    this.logs.unshift(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // Also console.log for debugging
    console.log(`[${level.toUpperCase()}] ${message}`, metadata);

    return logEntry;
  }

  getLogs(filters = {}) {
    let filtered = [...this.logs];

    // Filter by date range
    if (filters.startDate) {
      filtered = filtered.filter(log =>
        new Date(log.timestamp) >= new Date(filters.startDate)
      );
    }
    if (filters.endDate) {
      filtered = filtered.filter(log =>
        new Date(log.timestamp) <= new Date(filters.endDate)
      );
    }

    // Filter by level
    if (filters.level) {
      filtered = filtered.filter(log => log.level === filters.level);
    }

    // Filter by search query
    if (filters.query) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(query) ||
        JSON.stringify(log.metadata).toLowerCase().includes(query)
      );
    }

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      logs: filtered.slice(start, end),
      total: filtered.length,
      page,
      limit,
      pages: Math.ceil(filtered.length / limit),
    };
  }

  exportLogs(filters = {}) {
    const { logs } = this.getLogs({ ...filters, page: 1, limit: 999999 });
    return logs;
  }

  clearLogs() {
    this.logs = [];
  }
}

module.exports = new LoggingService();
```

#### Update Express Routes
```javascript
// backend/index.simple.js
const loggingService = require('./services/logging.service');

// Add logging to all existing routes
app.use((req, res, next) => {
  loggingService.log('info', `${req.method} ${req.path}`, {
    query: req.query,
    ip: req.ip,
  });
  next();
});

// New logging endpoints
app.get('/api/logs', async (req, res) => {
  const filters = {
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    level: req.query.level,
    query: req.query.query,
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 50,
  };

  const result = loggingService.getLogs(filters);
  res.json({ success: true, data: result });
});

app.get('/api/logs/export', async (req, res) => {
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
});

app.delete('/api/logs', async (req, res) => {
  loggingService.clearLogs();
  res.json({ success: true, message: 'Logs cleared' });
});
```

### 2.2 Frontend: Logs Page
**Status**: ⚪ Not Started

#### Create Logs Page Component
```tsx
// frontend/src/pages/Logs/index.tsx
import { useState, useEffect } from 'react';
import DefaultLayout from '@/layout/DefaultLayout';
import { API_BASE } from '@/utils/constants';
import { toast } from '@/utils/toast';

interface Log {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  metadata?: any;
}

export default function Logs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    level: '',
    query: '',
    page: 1,
    limit: 50,
  });
  const [totalPages, setTotalPages] = useState(1);

  // Fetch logs
  async function fetchLogs() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.level) params.append('level', filters.level);
      if (filters.query) params.append('query', filters.query);
      params.append('page', filters.page.toString());
      params.append('limit', filters.limit.toString());

      const response = await fetch(`${API_BASE}/api/logs?${params}`);
      const result = await response.json();

      if (result.success) {
        setLogs(result.data.logs);
        setTotalPages(result.data.pages);
      }
    } catch (error) {
      toast.error('Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  }

  // Export logs
  async function handleExport() {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.level) params.append('level', filters.level);
      if (filters.query) params.append('query', filters.query);

      window.open(`${API_BASE}/api/logs/export?${params}`, '_blank');
      toast.success('Logs exported successfully');
    } catch (error) {
      toast.error('Failed to export logs');
    }
  }

  // Clear logs
  async function handleClear() {
    if (!confirm('Are you sure you want to clear all logs?')) return;

    try {
      const response = await fetch(`${API_BASE}/api/logs`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Logs cleared');
        fetchLogs();
      }
    } catch (error) {
      toast.error('Failed to clear logs');
    }
  }

  useEffect(() => {
    fetchLogs();
  }, [filters.page, filters.level]);

  return (
    <DefaultLayout>
      {/* Header with filters and actions */}
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-white">System Logs</h1>

        {/* Filters */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Date range picker */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Start Date</label>
            <input
              type="datetime-local"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}
              className="w-full rounded-lg border border-white/10 bg-zinc-800 px-4 py-2 text-white focus:border-cyan-500/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">End Date</label>
            <input
              type="datetime-local"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1 })}
              className="w-full rounded-lg border border-white/10 bg-zinc-800 px-4 py-2 text-white focus:border-cyan-500/50 focus:outline-none"
            />
          </div>

          {/* Level filter */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Level</label>
            <select
              value={filters.level}
              onChange={(e) => setFilters({ ...filters, level: e.target.value, page: 1 })}
              className="w-full rounded-lg border border-white/10 bg-zinc-800 px-4 py-2 text-white focus:border-cyan-500/50 focus:outline-none"
            >
              <option value="">All Levels</option>
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search logs..."
              value={filters.query}
              onChange={(e) => setFilters({ ...filters, query: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
              className="w-full rounded-lg border border-white/10 bg-zinc-800 px-4 py-2 text-white placeholder-gray-400 focus:border-cyan-500/50 focus:outline-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-3">
          <button
            onClick={fetchLogs}
            className="rounded-lg bg-cyan-500 px-4 py-2 text-white transition-all hover:bg-cyan-600"
          >
            Apply Filters
          </button>
          <button
            onClick={handleExport}
            className="rounded-lg border border-white/10 bg-zinc-800 px-4 py-2 text-white transition-all hover:border-white/20"
          >
            Export Logs
          </button>
          <button
            onClick={handleClear}
            className="rounded-lg bg-red-500 px-4 py-2 text-white transition-all hover:bg-red-600"
          >
            Clear Logs
          </button>
        </div>
      </div>

      {/* Logs table */}
      <div className="rounded-lg border border-white/10 bg-zinc-900 p-6">
        {loading ? (
          <div className="text-center text-gray-400 py-8">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="text-center text-gray-400 py-8">No logs found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Timestamp</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Level</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Message</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-white/5 hover:bg-zinc-800/50">
                    <td className="py-3 px-4 text-sm text-gray-300 font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        log.level === 'error' ? 'bg-red-500/20 text-red-400' :
                        log.level === 'warn' ? 'bg-amber-500/20 text-amber-400' :
                        log.level === 'debug' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {log.level.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-white">{log.message}</td>
                    <td className="py-3 px-4 text-sm text-gray-400 font-mono">
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <details>
                          <summary className="cursor-pointer text-cyan-400 hover:text-cyan-300">
                            View
                          </summary>
                          <pre className="mt-2 text-xs bg-black/30 p-2 rounded">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-gray-400">
              Page {filters.page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={filters.page === 1}
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                className="rounded-lg border border-white/10 bg-zinc-800 px-4 py-2 text-white transition-all hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                disabled={filters.page === totalPages}
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                className="rounded-lg border border-white/10 bg-zinc-800 px-4 py-2 text-white transition-all hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </DefaultLayout>
  );
}
```

#### Add Route
```tsx
// frontend/src/App.tsx or router configuration
import Logs from '@/pages/Logs';

// Add route
<Route path="/logs" element={<Logs />} />
```

#### Update Navigation
```tsx
// Add to navigation menu
<Link to="/logs">System Logs</Link>
```

---

## 🔄 Phase 3: Caching System with Manual Refresh

### 3.1 Create Caching Utility
**Status**: ⚪ Not Started

```typescript
// frontend/src/utils/cache.ts
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    const timestamp = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp,
      expiresAt: timestamp + ttl,
    };
    this.cache.set(key, entry);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidateAll(): void {
    this.cache.clear();
  }

  // Get all keys matching a pattern
  invalidatePattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}

export const cache = new CacheService();
```

### 3.2 Create API Hook with Caching
**Status**: ⚪ Not Started

```typescript
// frontend/src/hooks/useApiWithCache.ts
import { useState, useEffect, useCallback } from 'react';
import { cache } from '@/utils/cache';

interface UseApiOptions {
  cacheKey: string;
  cacheTTL?: number;
  skip?: boolean;
}

export function useApiWithCache<T>(
  fetcher: () => Promise<T>,
  options: UseApiOptions
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async (bypassCache: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      // Check cache first (unless bypassing)
      if (!bypassCache) {
        const cached = cache.get<T>(options.cacheKey);
        if (cached) {
          setData(cached);
          setLoading(false);
          return cached;
        }
      }

      // Fetch fresh data
      const result = await fetcher();
      setData(result);

      // Update cache
      cache.set(options.cacheKey, result, options.cacheTTL);

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [fetcher, options.cacheKey, options.cacheTTL]);

  // Manual refresh (bypasses cache)
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchData(true);
  }, [fetchData]);

  // Auto-fetch on mount
  useEffect(() => {
    if (!options.skip) {
      fetchData();
    }
  }, [fetchData, options.skip]);

  return {
    data,
    loading,
    error,
    refresh,
    isRefreshing,
  };
}
```

### 3.3 Update Components to Use Caching
**Status**: ⚪ Not Started

```tsx
// Example: Update CollectionsHome to use caching
import { useApiWithCache } from '@/hooks/useApiWithCache';

export default function CollectionsHome() {
  const { data: collections, loading, error, refresh, isRefreshing } = useApiWithCache(
    async () => {
      const response = await fetch(`${API_BASE}/api/chroma/collections`);
      const data = await response.json();
      return data.success ? data.data : [];
    },
    {
      cacheKey: 'collections-list',
      cacheTTL: 4 * 60 * 60 * 1000, // 4 hours
    }
  );

  return (
    <div>
      <button
        onClick={refresh}
        disabled={isRefreshing}
        className="rounded-lg border border-white/10 bg-zinc-800 px-4 py-2 text-white"
      >
        {isRefreshing ? 'Refreshing...' : 'Refresh'}
      </button>

      {/* Rest of component */}
    </div>
  );
}
```

---

## 🔄 Phase 4: Analytics Dashboard (Items 1-24)

This phase is HUGE and requires significant work. Given the context limit, I'll provide the structure and you can implement iteratively.

### 4.1 Backend: Analytics Endpoints
**Status**: ⚪ Not Started

Create `backend/services/analytics.service.js` with methods for:
1. getCollectionGrowth()
2. getStorageUsage()
3. getCollectionActivity()
4. getTopCollections()
5. getEmptyCollections()
6. getDocumentSizeDistribution()
7. getAverageDocumentSize()
8. getMetadataFieldUsage()
9. getRecentDocuments()
10. getLargestDocuments()
... (continue for all 24 analytics)

### 4.2 Frontend: Analytics Page
**Status**: ⚪ Not Started

Create `frontend/src/pages/Analytics/index.tsx` with:
- Grid layout for analytics cards
- Chart.js or Recharts for visualizations
- Filter controls (date range, collections)
- Export analytics data

---

## Summary

**Completed**:
- ✅ Phase 1: Theme system with CSS variables and documentation

**In Progress**:
- This implementation plan document

**To Do**:
- Phase 2: Logs page with export and date range
- Phase 3: 4-hour caching system
- Phase 4: Analytics dashboard (24 metrics)
- Phase 3.3: UI/UX Polish (from your requirements)

This plan is too large to implement in a single session. I recommend:
1. Review this plan
2. Prioritize which phases to tackle first
3. Implement one phase at a time
4. Test thoroughly before moving to next phase
