import { useMemo } from 'react';
import Plot from 'react-plotly.js';

interface SimilarityHeatmapProps {
  matrix: number[][];
  labels: string[];
  maxPoints?: number;
}

export default function SimilarityHeatmap({ matrix, labels, maxPoints = 50 }: SimilarityHeatmapProps) {
  const { displayMatrix, displayLabels } = useMemo(() => {
    // Limit the number of points for performance
    if (labels.length <= maxPoints) {
      return { displayMatrix: matrix, displayLabels: labels };
    }

    // Sample evenly across the dataset
    const step = Math.floor(labels.length / maxPoints);
    const sampledIndices: number[] = [];

    for (let i = 0; i < labels.length; i += step) {
      if (sampledIndices.length < maxPoints) {
        sampledIndices.push(i);
      }
    }

    const sampledMatrix = sampledIndices.map(i =>
      sampledIndices.map(j => matrix[i][j])
    );
    const sampledLabels = sampledIndices.map(i => labels[i]);

    return { displayMatrix: sampledMatrix, displayLabels: sampledLabels };
  }, [matrix, labels, maxPoints]);

  const plotData = useMemo(() => {
    return [{
      z: displayMatrix,
      x: displayLabels,
      y: displayLabels,
      type: 'heatmap' as const,
      colorscale: [
        [0, '#18181b'],      // dark for low similarity
        [0.5, '#3b82f6'],    // blue for medium
        [1, '#06b6d4'],      // cyan for high similarity
      ],
      hovertemplate: '<b>%{y}</b><br>' +
        '<b>%{x}</b><br>' +
        'Similarity: %{z:.3f}<br>' +
        '<extra></extra>',
      colorbar: {
        title: 'Similarity',
        titlefont: { color: '#ffffff' },
        tickfont: { color: '#ffffff' },
        bgcolor: '#27272a',
        bordercolor: '#52525b',
        borderwidth: 1,
      },
    }];
  }, [displayMatrix, displayLabels]);

  return (
    <div className="w-full h-full">
      <Plot
        data={plotData}
        layout={{
          title: {
            text: `Document Similarity Heatmap${labels.length > maxPoints ? ` (showing ${maxPoints} of ${labels.length})` : ''}`,
            font: { color: '#ffffff', size: 18 },
          },
          paper_bgcolor: '#27272a',
          plot_bgcolor: '#18181b',
          xaxis: {
            tickangle: -45,
            tickfont: { size: 10, color: '#a1a1aa' },
            gridcolor: '#3f3f46',
          },
          yaxis: {
            tickfont: { size: 10, color: '#a1a1aa' },
            gridcolor: '#3f3f46',
          },
          margin: { l: 150, r: 100, t: 80, b: 150 },
        }}
        config={{
          responsive: true,
          displayModeBar: true,
          displaylogo: false,
        }}
        style={{ width: '100%', height: '700px' }}
        useResizeHandler={true}
      />
      {labels.length > maxPoints && (
        <p className="text-sm text-gray-400 text-center mt-2">
          Showing {maxPoints} documents for performance. Full dataset contains {labels.length} documents.
        </p>
      )}
    </div>
  );
}
