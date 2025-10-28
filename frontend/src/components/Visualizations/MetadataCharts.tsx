import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { EmbeddingPoint } from '@/utils/dimensionalityReduction';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface MetadataChartsProps {
  points: EmbeddingPoint[];
}

export default function MetadataCharts({ points }: MetadataChartsProps) {
  // Extract all unique metadata keys
  const metadataKeys = useMemo(() => {
    const keys = new Set<string>();
    points.forEach(point => {
      if (point.metadata && typeof point.metadata === 'object') {
        Object.keys(point.metadata).forEach(key => keys.add(key));
      }
    });
    return Array.from(keys);
  }, [points]);

  // Generate distribution data for each metadata key
  const distributions = useMemo(() => {
    return metadataKeys.map(key => {
      const valueCounts = new Map<string, number>();

      points.forEach(point => {
        const value = point.metadata?.[key];
        const valueStr = value !== undefined && value !== null ? String(value) : '(no value)';
        valueCounts.set(valueStr, (valueCounts.get(valueStr) || 0) + 1);
      });

      // Sort by count descending
      const sorted = Array.from(valueCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10); // Top 10 values

      return {
        key,
        labels: sorted.map(([value]) => value),
        counts: sorted.map(([, count]) => count),
      };
    });
  }, [points, metadataKeys]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
        labels: {
          color: '#ffffff',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#52525b',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: { color: '#a1a1aa', maxRotation: 45, minRotation: 45 },
        grid: { color: '#3f3f46' },
      },
      y: {
        ticks: { color: '#a1a1aa' },
        grid: { color: '#3f3f46' },
      },
    },
  };

  const colorPalette = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#6366f1',
  ];

  if (metadataKeys.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>No metadata found in documents</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h3 className="text-xl font-semibold text-white mb-4">Metadata Distribution</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {distributions.map((dist, index) => {
          const barData = {
            labels: dist.labels,
            datasets: [
              {
                label: 'Document Count',
                data: dist.counts,
                backgroundColor: colorPalette[index % colorPalette.length],
                borderColor: 'white',
                borderWidth: 1,
              },
            ],
          };

          const pieData = {
            labels: dist.labels,
            datasets: [
              {
                data: dist.counts,
                backgroundColor: dist.labels.map((_, i) => colorPalette[i % colorPalette.length]),
                borderColor: '#27272a',
                borderWidth: 2,
              },
            ],
          };

          return (
            <div key={dist.key} className="rounded-lg border border-white/10 bg-dark-background p-6">
              <h4 className="text-lg font-medium text-white mb-4 capitalize">
                {dist.key}
              </h4>

              <div className="space-y-6">
                {/* Bar Chart */}
                <div>
                  <p className="text-sm text-gray-400 mb-2">Distribution (Bar Chart)</p>
                  <div style={{ height: '250px' }}>
                    <Bar data={barData} options={chartOptions} />
                  </div>
                </div>

                {/* Pie Chart */}
                <div>
                  <p className="text-sm text-gray-400 mb-2">Distribution (Pie Chart)</p>
                  <div style={{ height: '250px' }} className="flex justify-center">
                    <Pie
                      data={pieData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'right',
                            labels: {
                              color: '#ffffff',
                              padding: 10,
                              font: { size: 11 },
                            },
                          },
                          tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#ffffff',
                            bodyColor: '#ffffff',
                            borderColor: '#52525b',
                            borderWidth: 1,
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Unique Values</p>
                    <p className="text-white font-semibold">{dist.labels.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Most Common</p>
                    <p className="text-white font-semibold truncate" title={dist.labels[0]}>
                      {dist.labels[0]} ({dist.counts[0]})
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
