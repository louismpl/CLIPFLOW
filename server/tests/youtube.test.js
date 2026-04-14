const { extractHeatmapPeaks } = require('../services/youtube');

describe('youtube service', () => {
  describe('extractHeatmapPeaks', () => {
    test('returns empty array when no heatmap data', () => {
      expect(extractHeatmapPeaks({})).toEqual([]);
      expect(extractHeatmapPeaks({ heatmap: [] })).toEqual([]);
    });

    test('returns peaks above mean + std threshold', () => {
      const info = {
        heatmap: [
          { start_time: 0, end_time: 10, value: 10 },
          { start_time: 10, end_time: 20, value: 10 },
          { start_time: 20, end_time: 30, value: 10 },
          { start_time: 30, end_time: 40, value: 100 }, // clear outlier
          { start_time: 40, end_time: 50, value: 10 },
        ]
      };
      const peaks = extractHeatmapPeaks(info);
      expect(peaks).toContain(35); // midpoint of the 30-40 segment
      expect(peaks.length).toBe(1);
    });

    test('returns midpoints of peak segments', () => {
      const info = {
        heatmap: [
          { start_time: 0, end_time: 5, value: 1 },
          { start_time: 5, end_time: 15, value: 50 },
          { start_time: 15, end_time: 20, value: 1 },
        ]
      };
      const peaks = extractHeatmapPeaks(info);
      expect(peaks[0]).toBe(10);
    });
  });
});
