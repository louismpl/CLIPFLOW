const { parseVttWords, parseCueWords, correctWordsWithTitle, scoreSegmentText } = require('../services/transcript');

describe('transcript parser', () => {
  describe('parseCueWords', () => {
    test('distributes words evenly across cue duration', () => {
      const words = parseCueWords('hello world', 0, 2);
      expect(words).toHaveLength(2);
      expect(words[0].start).toBeCloseTo(0, 1);
      expect(words[0].end).toBeCloseTo(1, 1);
      expect(words[1].start).toBeCloseTo(1, 1);
      expect(words[1].end).toBeCloseTo(2, 1);
    });

    test('handles karaoke-style timestamps', () => {
      const text = '<00:00:01.000>hello <00:00:02.000>world';
      const words = parseCueWords(text, 0, 3);
      expect(words).toHaveLength(2);
      expect(words[0].text).toBe('hello');
      expect(words[0].start).toBeCloseTo(1, 1);
      expect(words[0].end).toBeCloseTo(2, 1);
      expect(words[1].start).toBeCloseTo(2, 1);
      expect(words[1].end).toBeCloseTo(3, 1);
    });
  });

  describe('parseVttWords', () => {
    test('parses basic WEBVTT content', () => {
      const vtt = `WEBVTT

00:00:00.000 --> 00:00:02.000
Hello world

00:00:02.000 --> 00:00:04.000
How are you
`;
      const words = parseVttWords(vtt);
      expect(words.length).toBeGreaterThanOrEqual(5);
      expect(words.map(w => w.text)).toContain('Hello');
      expect(words.map(w => w.text)).toContain('you');
    });

    test('deduplicates overlapping cues', () => {
      const vtt = `WEBVTT

00:00:00.000 --> 00:00:02.000
Hello world

00:00:01.500 --> 00:00:03.500
world today
`;
      const words = parseVttWords(vtt);
      const tokens = words.map(w => w.text.toLowerCase());
      expect(tokens.filter(t => t === 'world').length).toBe(1);
    });

    test('skips micro transition cues', () => {
      const vtt = `WEBVTT

00:00:00.000 --> 00:00:02.000
Hello world

00:00:02.010 --> 00:00:02.050
-

00:00:03.000 --> 00:00:05.000
Next line
`;
      const words = parseVttWords(vtt);
      expect(words.map(w => w.text)).not.toContain('-');
    });
  });

  describe('correctWordsWithTitle', () => {
    test('corrects near-match to title token', () => {
      const words = [{ text: 'Rickh', start: 1, end: 2 }];
      const corrected = correctWordsWithTitle(words, 'Rick Astley');
      expect(corrected[0].text).toBe('Rick');
    });

    test('leaves unrelated words unchanged', () => {
      const words = [{ text: 'banana', start: 1, end: 2 }];
      const corrected = correctWordsWithTitle(words, 'Rick Astley');
      expect(corrected[0].text).toBe('banana');
    });
  });
});
