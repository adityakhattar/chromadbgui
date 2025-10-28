import { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { ReducedPoint } from '@/utils/dimensionalityReduction';

interface ScatterPlot3DProps {
  points: ReducedPoint[];
  colors: string[];
  legend: { value: string; color: string }[];
  onPointClick?: (point: ReducedPoint) => void;
}

export default function ScatterPlot3D({ points, colors, legend, onPointClick }: ScatterPlot3DProps) {
  const plotData = useMemo(() => {
    // Group points by color for better legend
    const colorGroups = new Map<string, ReducedPoint[]>();

    points.forEach((point, index) => {
      const color = colors[index];
      if (!colorGroups.has(color)) {
        colorGroups.set(color, []);
      }
      colorGroups.get(color)!.push(point);
    });

    // Create traces for each color group
    return Array.from(colorGroups.entries()).map(([color, groupPoints]) => {
      const legendItem = legend.find(l => l.color === color);

      return {
        x: groupPoints.map(p => p.x),
        y: groupPoints.map(p => p.y),
        z: groupPoints.map(p => p.z || 0),
        mode: 'markers' as const,
        type: 'scatter3d' as const,
        name: legendItem?.value || 'Unknown',
        marker: {
          size: 5,
          color: color,
          opacity: 0.8,
          line: {
            color: 'white',
            width: 0.5,
          },
        },
        text: groupPoints.map(p => p.id),
        hovertemplate: '<b>%{text}</b><br>' +
          'X: %{x:.3f}<br>' +
          'Y: %{y:.3f}<br>' +
          'Z: %{z:.3f}<br>' +
          '<extra></extra>',
        customdata: groupPoints,
      };
    });
  }, [points, colors, legend]);

  const handleClick = (event: any) => {
    if (event.points && event.points.length > 0 && onPointClick) {
      const point = event.points[0].customdata;
      onPointClick(point);
    }
  };

  return (
    <div className="w-full h-full">
      <Plot
        data={plotData}
        layout={{
          title: {
            text: '3D Vector Space (UMAP Projection)',
            font: { color: '#ffffff', size: 18 },
          },
          paper_bgcolor: '#27272a',
          scene: {
            bgcolor: '#18181b',
            xaxis: {
              title: 'Dimension 1',
              gridcolor: '#3f3f46',
              zerolinecolor: '#52525b',
              color: '#a1a1aa',
              backgroundcolor: '#18181b',
            },
            yaxis: {
              title: 'Dimension 2',
              gridcolor: '#3f3f46',
              zerolinecolor: '#52525b',
              color: '#a1a1aa',
              backgroundcolor: '#18181b',
            },
            zaxis: {
              title: 'Dimension 3',
              gridcolor: '#3f3f46',
              zerolinecolor: '#52525b',
              color: '#a1a1aa',
              backgroundcolor: '#18181b',
            },
            camera: {
              eye: { x: 1.5, y: 1.5, z: 1.5 },
            },
          },
          hovermode: 'closest',
          showlegend: true,
          legend: {
            font: { color: '#ffffff' },
            bgcolor: 'rgba(39, 39, 42, 0.9)',
            bordercolor: '#52525b',
            borderwidth: 1,
          },
          margin: { l: 0, r: 0, t: 60, b: 0 },
        }}
        config={{
          responsive: true,
          displayModeBar: true,
          displaylogo: false,
          modeBarButtonsToRemove: ['lasso2d', 'select2d'],
        }}
        onClick={handleClick}
        style={{ width: '100%', height: '700px' }}
        useResizeHandler={true}
      />
    </div>
  );
}
