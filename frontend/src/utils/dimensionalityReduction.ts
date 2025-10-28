import { UMAP } from 'umap-js';

export interface EmbeddingPoint {
  id: string;
  embedding: number[];
  document: string;
  metadata: any;
}

export interface ReducedPoint {
  id: string;
  x: number;
  y: number;
  z?: number;
  document: string;
  metadata: any;
}

/**
 * Reduce high-dimensional embeddings to 2D using UMAP
 */
export async function reduceToUMAP2D(
  points: EmbeddingPoint[],
  options: {
    nNeighbors?: number;
    minDist?: number;
    spread?: number;
  } = {}
): Promise<ReducedPoint[]> {
  if (points.length === 0) {
    return [];
  }

  const {
    nNeighbors = Math.min(15, points.length - 1),
    minDist = 0.1,
    spread = 1.0,
  } = options;

  try {
    // Extract embeddings as matrix
    const embeddings = points.map(p => p.embedding);

    // Initialize UMAP
    const umap = new UMAP({
      nComponents: 2,
      nNeighbors,
      minDist,
      spread,
    });

    // Fit and transform
    const reduced = await umap.fitAsync(embeddings);

    // Format results
    return points.map((point, index) => ({
      id: point.id,
      x: reduced[index][0],
      y: reduced[index][1],
      document: point.document,
      metadata: point.metadata,
    }));
  } catch (error) {
    console.error('UMAP 2D reduction failed:', error);
    throw new Error('Failed to reduce embeddings to 2D');
  }
}

/**
 * Reduce high-dimensional embeddings to 3D using UMAP
 */
export async function reduceToUMAP3D(
  points: EmbeddingPoint[],
  options: {
    nNeighbors?: number;
    minDist?: number;
    spread?: number;
  } = {}
): Promise<ReducedPoint[]> {
  if (points.length === 0) {
    return [];
  }

  const {
    nNeighbors = Math.min(15, points.length - 1),
    minDist = 0.1,
    spread = 1.0,
  } = options;

  try {
    // Extract embeddings as matrix
    const embeddings = points.map(p => p.embedding);

    // Initialize UMAP
    const umap = new UMAP({
      nComponents: 3,
      nNeighbors,
      minDist,
      spread,
    });

    // Fit and transform
    const reduced = await umap.fitAsync(embeddings);

    // Format results
    return points.map((point, index) => ({
      id: point.id,
      x: reduced[index][0],
      y: reduced[index][1],
      z: reduced[index][2],
      document: point.document,
      metadata: point.metadata,
    }));
  } catch (error) {
    console.error('UMAP 3D reduction failed:', error);
    throw new Error('Failed to reduce embeddings to 3D');
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Create similarity matrix for all points
 */
export function createSimilarityMatrix(
  points: EmbeddingPoint[]
): { matrix: number[][]; labels: string[] } {
  const n = points.length;
  const matrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
  const labels = points.map(p => p.id);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 1.0;
      } else {
        matrix[i][j] = cosineSimilarity(points[i].embedding, points[j].embedding);
      }
    }
  }

  return { matrix, labels };
}

/**
 * Extract color mapping from metadata
 */
export function getColorMapping(
  points: ReducedPoint[],
  metadataKey?: string
): { colors: string[]; colorMap: Map<string, string>; legend: { value: string; color: string }[] } {
  const colorPalette = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // yellow
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
    '#84cc16', // lime
    '#6366f1', // indigo
  ];

  if (!metadataKey) {
    // Default to single color
    return {
      colors: points.map(() => colorPalette[0]),
      colorMap: new Map([['default', colorPalette[0]]]),
      legend: [{ value: 'All Documents', color: colorPalette[0] }],
    };
  }

  // Extract unique values for the metadata key
  const uniqueValues = new Set<string>();
  points.forEach(point => {
    const value = point.metadata?.[metadataKey];
    if (value !== undefined && value !== null) {
      uniqueValues.add(String(value));
    } else {
      uniqueValues.add('(no value)');
    }
  });

  // Create color mapping
  const colorMap = new Map<string, string>();
  const uniqueArray = Array.from(uniqueValues);
  uniqueArray.forEach((value, index) => {
    colorMap.set(value, colorPalette[index % colorPalette.length]);
  });

  // Assign colors to points
  const colors = points.map(point => {
    const value = point.metadata?.[metadataKey];
    const key = value !== undefined && value !== null ? String(value) : '(no value)';
    return colorMap.get(key) || colorPalette[0];
  });

  // Create legend
  const legend = uniqueArray.map(value => ({
    value,
    color: colorMap.get(value) || colorPalette[0],
  }));

  return { colors, colorMap, legend };
}
