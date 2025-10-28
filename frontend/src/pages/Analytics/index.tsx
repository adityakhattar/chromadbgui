import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import DefaultLayout from '@/layout/DefaultLayout';
import { API_BASE } from '@/utils/constants';
import { getChartColors, animationDurations, animationDelays, animationStagger, hoverEffects } from '@/utils/theme';

interface CollectionStat {
  name: string;
  documentCount: number;
  dimensions?: number;
  error?: boolean;
}

interface OverviewData {
  // Basic stats
  totalCollections: number;
  totalDocuments: number;
  averageDocumentsPerCollection: number;
  medianDocumentsPerCollection: number;

  // Collection lists
  topCollections: CollectionStat[];
  bottomCollections: CollectionStat[];
  allCollections: CollectionStat[];

  // Storage & Performance
  emptyCollections: number;
  errorCollections: number;

  // Vector & Embedding Analytics
  averageVectorDimensions: number;
  embeddingModels: string[];
  metadataFields: string[];
  distanceFunctions: string[];
  vectorDimensionDistribution: Record<string, number>;

  // Distribution
  distributionBuckets: Record<string, number>;
}

export default function Analytics() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cacheInfo, setCacheInfo] = useState<{ cached: boolean; expiresAt?: number } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOverview();

    // Auto-refresh every 5 hours
    const autoRefreshInterval = setInterval(() => {
      fetchOverview(true); // Force refresh after 5 hours
    }, 5 * 60 * 60 * 1000); // 5 hours in milliseconds

    return () => clearInterval(autoRefreshInterval);
  }, []);

  async function fetchOverview(forceRefresh = false) {
    setLoading(true);
    setError(null);

    try {
      // If forcing refresh, clear cache first
      if (forceRefresh) {
        await fetch(`${API_BASE}/api/analytics/cache/clear`, {
          method: 'POST',
        });
      }

      const response = await fetch(`${API_BASE}/api/analytics/overview`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const result = await response.json();
      if (result.success) {
        setOverview(result.data);
        setCacheInfo({
          cached: result.cached || false,
          expiresAt: result.cacheExpiresAt,
        });
      } else {
        setError(result.error || 'Failed to load analytics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }

  async function handleManualRefresh() {
    setRefreshing(true);
    await fetchOverview(true); // Force refresh and clear cache
    setRefreshing(false);
  }

  // Helper function to render donut chart with CSS
  const renderDonutChart = (data: Record<string, number>) => {
    const total = Object.values(data).reduce((sum, val) => sum + val, 0);
    if (total === 0) return null;

    const colors = getChartColors();
    let cumulativePercent = 0;

    return (
      <div className="relative w-48 h-48 mx-auto">
        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
          {Object.entries(data).map(([key, value], index) => {
            const percent = (value / total) * 100;
            const offset = cumulativePercent;
            cumulativePercent += percent;

            return (
              <circle
                key={key}
                cx="18"
                cy="18"
                r="15.915"
                fill="none"
                stroke={colors[index % colors.length]}
                strokeWidth="4"
                strokeDasharray={`${percent} ${100 - percent}`}
                strokeDashoffset={`-${offset}`}
                className="transition-all duration-300"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{total}</p>
            <p className="text-xs text-gray-400">Total</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DefaultLayout>
      <div className="flex w-full flex-col gap-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">Analytics</h1>
            <p className="mt-2 text-sm text-gray-300">
              Comprehensive system-wide statistics and insights
            </p>
            {cacheInfo?.cached && cacheInfo.expiresAt && (
              <p className="mt-1 text-xs text-gray-500">
                Cached data • Expires in {Math.round((cacheInfo.expiresAt - Date.now()) / (1000 * 60))} minutes
              </p>
            )}
          </div>
          <motion.button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-dark-background px-4 py-2 text-white transition-all hover:border-cyan-500/50 hover:bg-dark-background/70 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={refreshing ? {} : { scale: 1.02 }}
            whileTap={refreshing ? {} : { scale: 0.98 }}
            aria-label="Refresh analytics"
          >
            <svg
              className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </motion.button>
        </div>

        {loading && (
          <div className="text-center text-gray-400 py-8">
            Loading analytics...
          </div>
        )}

        {error && (
          <div className="rounded border border-red-500/50 bg-red-500/10 p-4 text-red-400">
            <p className="font-semibold">Error loading analytics</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {!loading && !error && overview && (
          <>
            {/* Overview Stats Row 1 */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Total Collections */}
              <motion.div
                className="rounded-lg border border-white/10 bg-dark-background p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: animationDelays.small() }}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-cyan-500/10 p-3">
                    <svg className="h-8 w-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total Collections</p>
                    <p className="text-3xl font-bold text-white">{overview.totalCollections}</p>
                  </div>
                </div>
              </motion.div>

              {/* Total Documents */}
              <motion.div
                className="rounded-lg border border-white/10 bg-dark-background p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: animationDelays.small() + animationStagger.cards() }}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-500/10 p-3">
                    <svg className="h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total Documents</p>
                    <p className="text-3xl font-bold text-white">{overview.totalDocuments.toLocaleString()}</p>
                  </div>
                </div>
              </motion.div>

              {/* Average Documents */}
              <motion.div
                className="rounded-lg border border-white/10 bg-dark-background p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: animationDelays.medium() }}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-purple-500/10 p-3">
                    <svg className="h-8 w-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Avg Docs/Collection</p>
                    <p className="text-3xl font-bold text-white">{overview.averageDocumentsPerCollection}</p>
                  </div>
                </div>
              </motion.div>

              {/* Median Documents */}
              <motion.div
                className="rounded-lg border border-white/10 bg-dark-background p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: animationDelays.medium() + animationStagger.items() }}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-orange-500/10 p-3">
                    <svg className="h-8 w-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Median Docs/Collection</p>
                    <p className="text-3xl font-bold text-white">{overview.medianDocumentsPerCollection}</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Overview Stats Row 2 */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Empty Collections */}
              <motion.div
                className="rounded-lg border border-white/10 bg-dark-background p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: animationDelays.large() }}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-yellow-500/10 p-3">
                    <svg className="h-8 w-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Empty Collections</p>
                    <p className="text-3xl font-bold text-white">{overview.emptyCollections}</p>
                  </div>
                </div>
              </motion.div>

              {/* Error Collections */}
              <motion.div
                className="rounded-lg border border-white/10 bg-dark-background p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: animationDelays.large() + animationStagger.items() }}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-red-500/10 p-3">
                    <svg className="h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Collections with Errors</p>
                    <p className="text-3xl font-bold text-white">{overview.errorCollections}</p>
                  </div>
                </div>
              </motion.div>

              {/* Average Vector Dimensions */}
              <motion.div
                className="rounded-lg border border-white/10 bg-dark-background p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: animationDelays.large() + animationStagger.cards() }}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-500/10 p-3">
                    <svg className="h-8 w-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Avg Vector Dimensions</p>
                    <p className="text-3xl font-bold text-white">{overview.averageVectorDimensions}</p>
                  </div>
                </div>
              </motion.div>

              {/* Metadata Fields */}
              <motion.div
                className="rounded-lg border border-white/10 bg-dark-background p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: animationDelays.large() + animationStagger.cards() + animationStagger.items() }}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-pink-500/10 p-3">
                    <svg className="h-8 w-8 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Unique Metadata Fields</p>
                    <p className="text-3xl font-bold text-white">{overview.metadataFields.length}</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Distribution Buckets Chart */}
            <motion.div
              className="rounded-lg border border-white/10 bg-dark-background p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: animationDurations.slow() }}
            >
              <h2 className="text-xl font-semibold text-white mb-6">Document Distribution</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Donut Chart */}
                <div>
                  {renderDonutChart(overview.distributionBuckets)}
                </div>

                {/* Legend */}
                <div className="flex flex-col justify-center space-y-3">
                  {Object.entries(overview.distributionBuckets).map(([key, value], index) => {
                    const colors = getChartColors();
                    const color = colors[index % colors.length];
                    return (
                      <div key={key} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: color }}></div>
                          <span className="text-gray-300">{key} documents</span>
                        </div>
                        <span className="text-white font-semibold">{value} collections</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Metadata Fields */}
            {overview.metadataFields.length > 0 && (
              <motion.div
                className="rounded-lg border border-white/10 bg-dark-background p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: animationDurations.slow() + animationDelays.medium() }}
              >
                <h2 className="text-xl font-semibold text-white mb-4">Common Metadata Fields</h2>
                <div className="flex flex-wrap gap-2">
                  {overview.metadataFields.map((field) => (
                    <span
                      key={field}
                      className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-sm font-mono"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Top Collections */}
            <motion.div
              className="rounded-lg border border-white/10 bg-dark-background p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: animationDurations.slow() + animationDelays.medium() + animationStagger.items() }}
            >
              <h2 className="text-xl font-semibold text-white mb-4">Top 5 Collections by Document Count</h2>

              {overview.topCollections.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No collections found</p>
              ) : (
                <div className="space-y-3">
                  {overview.topCollections.map((collection, index) => (
                    <motion.div
                      key={collection.name}
                      onClick={() => navigate(`/collection/${encodeURIComponent(collection.name)}`)}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-dark-background/50 p-4 hover:border-cyan-500/50 hover:bg-dark-background/70 transition-all cursor-pointer"
                      whileHover={{ x: 4 }}
                      tabIndex={0}
                      role="button"
                      aria-label={`View collection ${collection.name}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-white">{collection.name}</p>
                          <p className="text-sm text-gray-400">
                            {collection.documentCount.toLocaleString()} document{collection.documentCount !== 1 ? 's' : ''}
                            {collection.dimensions ? ` • ${collection.dimensions}D vectors` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {/* Progress Bar */}
                        <div className="w-48 bg-white/5 rounded-full h-2">
                          <div
                            className="bg-cyan-500 h-2 rounded-full transition-all"
                            style={{
                              width: `${overview.totalDocuments > 0 ? (collection.documentCount / overview.totalDocuments) * 100 : 0}%`
                            }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-400 w-16 text-right">
                          {overview.totalDocuments > 0 ? ((collection.documentCount / overview.totalDocuments) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Bottom Collections */}
            {overview.bottomCollections.length > 0 && overview.bottomCollections.some(c => !c.error && c.documentCount > 0) && (
              <motion.div
                className="rounded-lg border border-white/10 bg-dark-background p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: animationDurations.slow() + animationDelays.large() }}
              >
                <h2 className="text-xl font-semibold text-white mb-4">Smallest Collections</h2>
                <div className="space-y-3">
                  {overview.bottomCollections.filter(c => !c.error && c.documentCount > 0).map((collection) => (
                    <motion.div
                      key={collection.name}
                      onClick={() => navigate(`/collection/${encodeURIComponent(collection.name)}`)}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-dark-background/50 p-4 hover:border-cyan-500/50 hover:bg-dark-background/70 transition-all cursor-pointer"
                      whileHover={{ x: 4 }}
                      tabIndex={0}
                      role="button"
                      aria-label={`View collection ${collection.name}`}
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium text-white">{collection.name}</p>
                          <p className="text-sm text-gray-400">
                            {collection.documentCount.toLocaleString()} document{collection.documentCount !== 1 ? 's' : ''}
                            {collection.dimensions ? ` • ${collection.dimensions}D vectors` : ''}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* All Collections Table */}
            <motion.div
              className="rounded-lg border border-white/10 bg-dark-background p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: animationDurations.slow() + animationDelays.large() + animationStagger.items() }}
            >
              <h2 className="text-xl font-semibold text-white mb-4">All Collections</h2>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Collection Name</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Documents</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Dimensions</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Percentage</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.allCollections.map((collection) => (
                      <tr
                        key={collection.name}
                        onClick={() => navigate(`/collection/${encodeURIComponent(collection.name)}`)}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4 text-white font-mono">{collection.name}</td>
                        <td className="py-3 px-4 text-right text-gray-300">{collection.documentCount.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-gray-300">{collection.dimensions || '—'}</td>
                        <td className="py-3 px-4 text-right text-gray-400">
                          {overview.totalDocuments > 0 ? ((collection.documentCount / overview.totalDocuments) * 100).toFixed(2) : 0}%
                        </td>
                        <td className="py-3 px-4 text-center">
                          {collection.error ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-red-500/10 text-red-400">
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Error
                            </span>
                          ) : collection.documentCount === 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-yellow-500/10 text-yellow-400">
                              Empty
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-500/10 text-green-400">
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              OK
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </DefaultLayout>
  );
}
