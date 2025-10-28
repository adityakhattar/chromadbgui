import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DefaultLayout from '@/layout/DefaultLayout';
import { API_BASE } from '@/utils/constants';
import { toast } from '@/utils/toast';
import {
  EmbeddingPoint,
  ReducedPoint,
  reduceToUMAP2D,
  reduceToUMAP3D,
  createSimilarityMatrix,
  getColorMapping,
} from '@/utils/dimensionalityReduction';
import ScatterPlot2D from '@/components/Visualizations/ScatterPlot2D';
import ScatterPlot3D from '@/components/Visualizations/ScatterPlot3D';
import SimilarityHeatmap from '@/components/Visualizations/SimilarityHeatmap';
import MetadataCharts from '@/components/Visualizations/MetadataCharts';

type VisualizationType = '2d' | '3d' | 'heatmap' | 'metadata';

export default function Visualizations() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();

  // Data states
  const [embeddingPoints, setEmbeddingPoints] = useState<EmbeddingPoint[]>([]);
  const [reducedPoints2D, setReducedPoints2D] = useState<ReducedPoint[]>([]);
  const [reducedPoints3D, setReducedPoints3D] = useState<ReducedPoint[]>([]);
  const [similarityMatrix, setSimilarityMatrix] = useState<{ matrix: number[][]; labels: string[] } | null>(null);

  // UI states
  const [loading, setLoading] = useState(true);
  const [reducing, setReducing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<VisualizationType>('2d');
  const [selectedMetadataKey, setSelectedMetadataKey] = useState<string>('');
  const [metadataKeys, setMetadataKeys] = useState<string[]>([]);

  // Load embeddings
  useEffect(() => {
    if (name) {
      fetchEmbeddings();
    }
  }, [name]);

  // Auto-compute UMAP when embeddings load
  useEffect(() => {
    if (embeddingPoints.length > 0 && reducedPoints2D.length === 0) {
      computeReductions();
    }
  }, [embeddingPoints]);

  async function fetchEmbeddings() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE}/api/chroma/collections/${encodeURIComponent(name!)}/embeddings`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch embeddings');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch embeddings');
      }

      if (!result.data.hasEmbeddings) {
        setError('No embeddings found. Documents need to have embeddings for visualization.');
        setLoading(false);
        return;
      }

      const points = result.data.points;
      setEmbeddingPoints(points);

      // Extract metadata keys
      const keys = new Set<string>();
      points.forEach((point: EmbeddingPoint) => {
        if (point.metadata && typeof point.metadata === 'object') {
          Object.keys(point.metadata).forEach(key => keys.add(key));
        }
      });
      setMetadataKeys(Array.from(keys));

      toast.success(`Loaded ${points.length} documents with ${result.data.dimensions}D embeddings`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load embeddings');
      toast.error('Failed to load embeddings');
    } finally {
      setLoading(false);
    }
  }

  async function computeReductions() {
    if (embeddingPoints.length < 2) {
      setError('Need at least 2 documents for visualization');
      return;
    }

    setReducing(true);

    try {
      // Compute 2D reduction
      toast.info('Computing 2D projection...');
      const points2D = await reduceToUMAP2D(embeddingPoints);
      setReducedPoints2D(points2D);

      // Compute 3D reduction
      toast.info('Computing 3D projection...');
      const points3D = await reduceToUMAP3D(embeddingPoints);
      setReducedPoints3D(points3D);

      // Compute similarity matrix (limit to first 100 for performance)
      const matrixPoints = embeddingPoints.slice(0, 100);
      const matrix = createSimilarityMatrix(matrixPoints);
      setSimilarityMatrix(matrix);

      toast.success('Visualizations ready!');
    } catch (err) {
      console.error('UMAP reduction failed:', err);
      toast.error('Failed to compute dimensionality reduction');
      setError('Failed to reduce dimensions. Try with fewer documents.');
    } finally {
      setReducing(false);
    }
  }

  // Get color mapping based on selected metadata key
  const { colors: colors2D, legend } = selectedMetadataKey && reducedPoints2D.length > 0
    ? getColorMapping(reducedPoints2D, selectedMetadataKey)
    : getColorMapping(reducedPoints2D);

  const { colors: colors3D } = selectedMetadataKey && reducedPoints3D.length > 0
    ? getColorMapping(reducedPoints3D, selectedMetadataKey)
    : getColorMapping(reducedPoints3D);

  function handlePointClick(point: ReducedPoint) {
    navigate(`/collection/${encodeURIComponent(name!)}`, {
      state: { highlightId: point.id },
    });
  }

  return (
    <DefaultLayout>
      <div className="flex w-full flex-col gap-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/collection/${encodeURIComponent(name!)}`)}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-dark-background px-4 py-2 text-white transition-all hover:border-cyan-500/50 hover:bg-dark-background/70"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
            <div>
              <h1 className="text-3xl font-semibold text-white">Vector Visualizations</h1>
              <p className="mt-1 text-sm text-gray-300">
                Collection: <span className="font-mono text-cyan-400">{name}</span>
              </p>
            </div>
          </div>

          <button
            onClick={fetchEmbeddings}
            disabled={loading || reducing}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-dark-background px-4 py-2 text-white transition-all hover:border-cyan-500/50 hover:bg-dark-background/70 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reload
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12 text-gray-400">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
            <p className="mt-4">Loading embeddings...</p>
          </div>
        )}

        {/* Reducing State */}
        {reducing && (
          <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
            <p className="mt-4 text-cyan-400">Computing dimensionality reduction...</p>
            <p className="mt-2 text-sm text-gray-400">This may take a moment for large datasets</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="rounded border border-red-500/50 bg-red-500/10 p-6 text-red-400">
            <p className="font-semibold">Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Visualizations */}
        {!loading && !error && reducedPoints2D.length > 0 && (
          <>
            {/* View Selector */}
            <div className="flex items-center gap-4 p-4 rounded-lg border border-white/10 bg-dark-background">
              <span className="text-sm text-gray-400">View:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveView('2d')}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    activeView === '2d'
                      ? 'bg-cyan-500 text-white'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  2D Scatter
                </button>
                <button
                  onClick={() => setActiveView('3d')}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    activeView === '3d'
                      ? 'bg-cyan-500 text-white'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  3D Interactive
                </button>
                <button
                  onClick={() => setActiveView('heatmap')}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    activeView === 'heatmap'
                      ? 'bg-cyan-500 text-white'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  Similarity Heatmap
                </button>
                <button
                  onClick={() => setActiveView('metadata')}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    activeView === 'metadata'
                      ? 'bg-cyan-500 text-white'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  Metadata Distribution
                </button>
              </div>

              {/* Metadata Key Selector (for scatter plots) */}
              {(activeView === '2d' || activeView === '3d') && metadataKeys.length > 0 && (
                <div className="ml-auto flex items-center gap-2">
                  <label className="text-sm text-gray-400">Color by:</label>
                  <select
                    value={selectedMetadataKey}
                    onChange={(e) => setSelectedMetadataKey(e.target.value)}
                    className="rounded-lg border border-white/10 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:border-cyan-500/50 focus:outline-none"
                  >
                    <option value="">Default</option>
                    {metadataKeys.map(key => (
                      <option key={key} value={key}>{key}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Visualization Content */}
            <div className="rounded-lg border border-white/10 bg-dark-background p-6">
              {activeView === '2d' && (
                <ScatterPlot2D
                  points={reducedPoints2D}
                  colors={colors2D}
                  legend={legend}
                  onPointClick={handlePointClick}
                />
              )}

              {activeView === '3d' && (
                <ScatterPlot3D
                  points={reducedPoints3D}
                  colors={colors3D}
                  legend={legend}
                  onPointClick={handlePointClick}
                />
              )}

              {activeView === 'heatmap' && similarityMatrix && (
                <SimilarityHeatmap
                  matrix={similarityMatrix.matrix}
                  labels={similarityMatrix.labels}
                />
              )}

              {activeView === 'metadata' && (
                <MetadataCharts points={embeddingPoints} />
              )}
            </div>

            {/* Info Panel */}
            <div className="rounded-lg border border-white/10 bg-dark-background p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Dataset Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Total Documents</p>
                  <p className="text-white font-semibold">{embeddingPoints.length}</p>
                </div>
                <div>
                  <p className="text-gray-400">Embedding Dimensions</p>
                  <p className="text-white font-semibold">{embeddingPoints[0]?.embedding.length || 0}</p>
                </div>
                <div>
                  <p className="text-gray-400">Metadata Fields</p>
                  <p className="text-white font-semibold">{metadataKeys.length}</p>
                </div>
                <div>
                  <p className="text-gray-400">Reduction Method</p>
                  <p className="text-white font-semibold">UMAP</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DefaultLayout>
  );
}
