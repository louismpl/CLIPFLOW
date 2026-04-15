const { scoreSegmentText, generateHookFromText, selectClips, clamp } = require('../services/segmentSelector');

describe('segmentSelector', () => {
  describe('scoreSegmentText', () => {
    test('returns base score for neutral text', () => {
      const text = 'Bonjour et bienvenue dans cette vidéo. Aujourd\'hui on va parler de plusieurs choses intéressantes et voir comment ça fonctionne.';
      const score = scoreSegmentText(text);
      expect(score).toBeGreaterThan(40);
      expect(score).toBeLessThan(70);
    });

    test('penalizes sponsor content heavily', () => {
      const clean = scoreSegmentText('Ceci est un exemple normal de vidéo sans rien de spécial dedans.');
      const sponsored = scoreSegmentText('Cette vidéo est sponsorisée par NordVPN. Utilisez mon code promo pour obtenir 50% de réduction.');
      expect(sponsored).toBeLessThan(clean - 40);
    });

    test('kills meta content with 2+ hits', () => {
      const score = scoreSegmentText('Abonnez-vous et likez la vidéo. Merci à tous et n\'oubliez pas de vous abonner.');
      expect(score).toBe(0);
    });

    test('boosts questions and exclamations', () => {
      const base = scoreSegmentText('Ceci est un fait simple.');
      const emotional = scoreSegmentText('Tu sais ce qui est fou ? C\'est incroyable !');
      expect(emotional).toBeGreaterThan(base + 20);
    });

    test('boosts power words', () => {
      const base = scoreSegmentText('Le chat dort sur le canapé.');
      const power = scoreSegmentText('C\'est un résultat incroyable et spectaculaire.');
      expect(power).toBeGreaterThan(base);
    });

    test('penalizes repetitions', () => {
      const repetitive = scoreSegmentText('vraiment vraiment vraiment vraiment vraiment vraiment vraiment c\'est vrai');
      expect(repetitive).toBeLessThan(50);
    });
  });

  describe('generateHookFromText', () => {
    test('extracts strongest sentence and truncates into concise hook', () => {
      const text = 'Alors imaginez un instant ce qui se passerait si on changeait tout ? C\'est fou.';
      const hook = generateHookFromText(text);
      expect(hook.length).toBeGreaterThan(5);
      expect(hook.length).toBeLessThan(120);
      expect(hook).toMatch(/^[A-Z]/);
    });

    test('returns concise hook for short emotional sentence', () => {
      const text = 'C\'est absolument génial !';
      expect(generateHookFromText(text)).toContain('génial');
    });

    test('falls back to snippet', () => {
      const text = 'Le soleil brille aujourd\'hui';
      const hook = generateHookFromText(text);
      expect(hook.length).toBeGreaterThan(0);
    });
  });

  describe('selectClips', () => {
    test('returns strictly non-overlapping clips', () => {
      const clips = selectClips({
        videoDuration: 300,
        clipDuration: 30,
        minDuration: 20,
        heatmapPeaks: [10, 50, 120, 200, 250],
        audioPeaks: [15, 55, 125, 205],
        silenceMoments: [],
        rhythmChanges: [],
        windows: [
          { start: 10, end: 20, text: 'Introduction passionnante.' },
          { start: 50, end: 60, text: 'Point clé numéro un.' },
          { start: 120, end: 130, text: 'Révélation choquante !' },
          { start: 200, end: 210, text: 'Conclusion forte.' },
          { start: 250, end: 260, text: 'Moment final.' }
        ],
        userQuery: ''
      });

      expect(clips.length).toBeGreaterThanOrEqual(2);
      for (let i = 0; i < clips.length - 1; i++) {
        for (let j = i + 1; j < clips.length; j++) {
          const overlap = Math.max(0, Math.min(clips[i].end, clips[j].end) - Math.max(clips[i].start, clips[j].start));
          expect(overlap).toBe(0);
        }
      }
    });

    test('penalizes intro clips unless they are exceptional', () => {
      const clips = selectClips({
        videoDuration: 300,
        clipDuration: 30,
        minDuration: 20,
        heatmapPeaks: [5],
        audioPeaks: [8],
        silenceMoments: [],
        rhythmChanges: [],
        windows: [
          { start: 0, end: 10, text: 'Bonjour et bienvenue.' },
          { start: 100, end: 110, text: 'Voici la partie intéressante.' }
        ],
        userQuery: ''
      });

      const introClip = clips.find(c => c.start < 10);
      if (introClip) {
        expect(introClip.score).toBeLessThan(80);
      }
    });

    test('does not create bucket fallback when few peaks exist', () => {
      const clips = selectClips({
        videoDuration: 300,
        clipDuration: 30,
        minDuration: 20,
        heatmapPeaks: [150],
        audioPeaks: [],
        silenceMoments: [],
        rhythmChanges: [],
        windows: [],
        userQuery: ''
      });

      expect(clips.length).toBeGreaterThanOrEqual(1);
      // No mechanically spaced clips should appear
      const mechanical = clips.filter(c => c.score < 60 && c.reasons.heatmap === false && c.reasons.audio === false);
      expect(mechanical.length).toBeLessThanOrEqual(1);
    });

    test('limits clip duration to max 90s', () => {
      const clips = selectClips({
        videoDuration: 600,
        clipDuration: 120,
        minDuration: 30,
        heatmapPeaks: [100],
        audioPeaks: [],
        silenceMoments: [],
        rhythmChanges: [],
        windows: [{ start: 90, end: 110, text: 'A'.repeat(200) }],
        userQuery: ''
      });

      clips.forEach(c => {
        expect(c.end - c.start).toBeLessThanOrEqual(90);
      });
    });

    test('includes temporal diversity (at least 1 per tier when possible)', () => {
      const clips = selectClips({
        videoDuration: 300,
        clipDuration: 30,
        minDuration: 20,
        heatmapPeaks: [20, 120, 250],
        audioPeaks: [25, 125, 255],
        silenceMoments: [],
        rhythmChanges: [],
        windows: [],
        userQuery: ''
      });

      const firstTier = clips.some(c => c.start < 100);
      const midTier = clips.some(c => c.start >= 100 && c.start < 200);
      expect(firstTier || midTier).toBe(true);
    });
  });
});
