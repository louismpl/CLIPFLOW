function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function scoreSegmentText(text) {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/).filter(w => w.length > 1);
  if (words.length < 5) return 0;
  let score = 50;

  const sponsorWords = [
    'sponsor','sponsorisé','sponsored by','vidéo sponsorisée','en collaboration avec','présenté par','soutenu par','partenaire','partenariat','code promo','code réduction','lien affilié','lien en description','découvrez dans la description','achetez','boutique officielle','merch','merchandise','tipeee','patreon','paypal','utip','buy me a coffee','hellofresh','nordvpn','expressvpn','protonvpn','surfshark','raid shadow legends'
  ];
  for (const sw of sponsorWords) {
    if (lower.includes(sw)) score -= 50;
  }

  const metaWords = ['abonne-toi','abonnez-vous','abonne','active la cloche','notification','likez','laissez un like','like and subscribe','hit the bell','check out my','check the link','suis-moi sur','follow me','soutenez-moi','merci à','remercie','remercier','un grand merci','description','lien en bio','shop','instagram','twitter','tiktok'];
  let metaHits = 0;
  metaWords.forEach(mw => { if (lower.includes(mw)) metaHits++; });
  if (metaHits >= 2) return 0;
  score -= metaHits * 40;

  const questionCount = (text.match(/\?/g) || []).length;
  score += questionCount * 18;

  const exclCount = (text.match(/\!/g) || []).length;
  score += exclCount * 14;

  const numberCount = (text.match(/\d+/g) || []).length;
  score += numberCount * 12;

  const powerWords = ['meilleur','pire','incroyable','impossible','génial','horrible','parfait','dingue','fou','énorme','massif','absurde','ridicule','spectaculaire','choquant','surprenant','jamais','toujours','jamais vu','inouï','exceptionnel','ultra','mega','hyper','super','terrible','magnifique','déteste','adore','aime','veux','besoin','sais','pense','crois','imagine','résultat','secret','vérité','mensonge','problème','solution','astuce','conseil','erreur','victoire','défaite','succès','échec','wow','résultats','regardez','attention','découvrez','révélation','choc','époustouflant','mind blowing','crazy','insane','legendary','best','worst','fail','win','clutch','terrifying','hilarious','emotional','touching','never','always','love','hate','need','want','know','feel','think','believe','amazing','unbelievable','beautiful'];
  powerWords.forEach(pw => { if (lower.includes(pw)) score += 12; });

  const narrativeWords = ['mais','pourtant','alors que','sauf que','finalement','en fait','surtout','notamment','étonnamment','curieusement','bizarrement','heureusement','malheureusement'];
  narrativeWords.forEach(nw => { if (lower.includes(nw)) score += 8; });

  const hookPatterns = [
    /tu sais ce qui/i, /imaginez/i, /imagines?/i, /attends? de voir/i, /tu vas halluciner/i,
    /je parie que/i, /défi accepté/i, /le pire/i, /le meilleur/i, /avant\/après/i,
    /avant et après/i, /personne ne/i, /tout le monde/i, /personne n'\w+/i
  ];
  hookPatterns.forEach(rx => { if (rx.test(text)) score += 20; });

  const wordCounts = {};
  words.forEach(w => { wordCounts[w] = (wordCounts[w] || 0) + 1; });
  const maxRepeat = Math.max(0, ...Object.values(wordCounts));
  if (maxRepeat > 5) score -= (maxRepeat - 5) * 8;

  return score;
}

function extractBestSentence(text) {
  const cleaned = text.replace(/\[(Music|Applause|Laughter)\]/gi, '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 8);
  if (sentences.length === 0) {
    const words = cleaned.split(/\s+/);
    return words.slice(0, 10).join(' ') + (words.length > 10 ? '...' : '');
  }

  const ranked = sentences.map(s => {
    let prio = 0;
    if (s.includes('?')) prio += 3;
    if (s.includes('!')) prio += 2;
    if (/\d/.test(s)) prio += 1;
    const lower = s.toLowerCase();
    const powerWords = ['incroyable','impossible','génial','dingue','fou','énorme','spectaculaire','choquant','surprenant','jamais','exceptionnel','terrible','magnifique','déteste','adore','aime','secret','vérité','mensonge','problème','solution','astuce','erreur','victoire','succès','wow','révélation','choc','crazy','insane','love','hate','need','want','amazing','unbelievable'];
    powerWords.forEach(pw => { if (lower.includes(pw)) prio += 1; });
    return { s: s.trim(), prio };
  });

  ranked.sort((a, b) => b.prio - a.prio);
  return ranked[0].s;
}

function generateHookFromText(text) {
  const sentence = extractBestSentence(text);
  if (!sentence || sentence.length < 3) {
    return 'Extrait viral';
  }
  if (sentence.length > 100) {
    const words = sentence.split(/\s+/);
    return words.slice(0, 12).join(' ') + '...';
  }
  return sentence;
}

function generateFrenchDescription(text) {
  const cleaned = text.replace(/\[(Music|Applause|Laughter)\]/gi, '').replace(/\s+/g, ' ').trim();
  if (cleaned.length < 15) return cleaned || 'Segment intéressant extrait de la vidéo.';
  const excerpt = cleaned.slice(0, 280);
  return `${excerpt}${excerpt.length >= 280 ? '...' : ''}`;
}

function buildWhyViral({ heatmapCount, audioCount, textScore, emotionBoost, phraseEnd, peakTime, segmentText }) {
  const reasons = [];
  if (heatmapCount >= 3) reasons.push('forte concentration de pics d\'engagement');
  else if (heatmapCount > 0) reasons.push('pic d\'engagement détecté');

  if (audioCount >= 3) reasons.push('dynamique audio très marquée');
  else if (audioCount > 0) reasons.push('changement dynamique audio');

  if (textScore > 70) reasons.push('discours particulièrement accrocheur');
  else if (textScore > 50) reasons.push('contenu textuel engageant');

  if (emotionBoost > 0) reasons.push('pic émotionnel');
  if (phraseEnd && /\?/.test(phraseEnd.text)) reasons.push('question rhétorique captivante');
  if (phraseEnd && /\!/.test(phraseEnd.text)) reasons.push('exclamation impactante');

  if (reasons.length === 0) {
    return `Ce moment à ${Math.round(peakTime)}s concentre l'attention du spectateur.`;
  }

  const last = reasons.pop();
  if (reasons.length === 0) return `Ce segment se distingue par ${last}.`;
  return `Ce segment se distingue par ${reasons.join(', ')} et ${last}.`;
}

function selectClips({
  videoDuration,
  clipDuration,
  minDuration,
  heatmapPeaks,
  audioPeaks,
  silenceMoments,
  rhythmChanges,
  windows,
  userQuery
}) {
  const emotionalWords = ['incroyable', 'impossible', 'regardez', 'wow', 'non', 'what', 'ouah', 'dingue', 'fou', 'génial', 'choquant', 'spectaculaire', 'jamais', 'toujours', 'best', 'amazing', 'crazy', 'insane', 'love', 'hate', 'need', 'want'];

  const interestPoints = [];
  for (const p of heatmapPeaks) interestPoints.push({ time: p, source: 'heatmap', weight: 1.0 });
  for (const p of audioPeaks) interestPoints.push({ time: p, source: 'audio', weight: 0.75 });
  for (const r of rhythmChanges) interestPoints.push({ time: r.time, source: 'rhythm', weight: 0.6 });
  for (const w of windows) {
    const mid = (w.start + w.end) / 2;
    const textScore = scoreSegmentText(w.text);
    if (textScore > 55) {
      interestPoints.push({ time: mid, source: 'transcript', weight: textScore / 200 });
    }
  }

  interestPoints.sort((a, b) => a.time - b.time);
  const mergedPoints = [];
  for (const p of interestPoints) {
    const last = mergedPoints[mergedPoints.length - 1];
    if (last && Math.abs(last.time - p.time) < 4) {
      last.score += p.weight;
      last.sources = Array.from(new Set([...(last.sources || []), p.source]));
    } else {
      mergedPoints.push({ time: p.time, score: p.weight, sources: [p.source] });
    }
  }

  // HARD FILTER: drop intro interest points unless they are truly exceptional
  const filteredPoints = mergedPoints.filter(p => {
    if (p.time >= 15) return true;
    const localHeatmap = heatmapPeaks.filter(h => Math.abs(h - p.time) < 8).length;
    const localAudio = audioPeaks.filter(a => Math.abs(a - p.time) < 8).length;
    const localText = windows.filter(w => Math.abs(((w.start + w.end) / 2) - p.time) < 8 && scoreSegmentText(w.text) > 75).length;
    return localHeatmap >= 2 || localAudio >= 3 || localText >= 1;
  });

  function buildClipAroundPeak(peakTime) {
    const localHeatmap = heatmapPeaks.filter(p => Math.abs(p - peakTime) < 15).length;
    const localAudio = audioPeaks.filter(p => Math.abs(p - peakTime) < 15).length;
    const density = localHeatmap + localAudio;
    let targetDuration = clipDuration;
    if (density >= 3) targetDuration = Math.max(minDuration, clipDuration - 15);
    else if (density === 0) targetDuration = Math.min(60, clipDuration + 10);

    let start = Math.max(0, peakTime - targetDuration / 2);
    let end = Math.min(videoDuration, start + targetDuration);
    if (end - start < targetDuration && start > 0) {
      start = Math.max(0, end - targetDuration);
    }

    const phraseCandidates = windows.filter(w => w.end >= end - 5 && w.end <= end + 5 && w.text.length > 10 && /[.!?]$/i.test(w.text));
    if (phraseCandidates.length > 0) {
      end = phraseCandidates.sort((a, b) => Math.abs(a.end - end) - Math.abs(b.end - end))[0].end;
    }
    if (end <= start) end = start + targetDuration;

    const segmentWindows = windows.filter(w => w.start >= start && w.end <= end);
    const segmentText = segmentWindows.map(w => w.text).join(' ');
    const textScore = scoreSegmentText(segmentText);

    const heatmapCount = heatmapPeaks.filter(p => p >= start && p <= end).length;
    const audioCount = audioPeaks.filter(p => p >= start && p <= end).length;
    const phraseEnd = windows.find(w => w.end >= start && w.end <= end && w.text.length > 10 && /[.!?]$/i.test(w.text));
    const emotionBoost = emotionalWords.filter(w => segmentText.toLowerCase().includes(w)).length * 15;
    const silencesInSegment = silenceMoments.filter(t => t >= start && t <= end).length;
    const silencePenalty = silencesInSegment * 15;

    const center = (start + end) / 2;
    const allDists = [
      ...heatmapPeaks.filter(p => p >= start && p <= end).map(p => Math.abs(p - center)),
      ...audioPeaks.filter(p => p >= start && p <= end).map(p => Math.abs(p - center))
    ];
    const centerQuality = allDists.length > 0 ? 30 * (1 - Math.min(...allDists) / (targetDuration / 2)) : 0;
    const dur = end - start;
    const totalPics = heatmapCount + audioCount;
    const densityBonus = Math.min((totalPics / dur) * 100, 25);

    const rawScore = (heatmapCount * 40) + (audioCount * 30) + (textScore * 0.8) + densityBonus + centerQuality + emotionBoost + (phraseEnd ? 20 : 0) - silencePenalty;
    let score = rawScore;
    if (!phraseEnd && heatmapCount === 0 && audioCount === 0) score -= 25;

    // additional intro penalty for anything still landing early
    let introPenalty = 0;
    if (start < 5) introPenalty = 200;
    else if (start < 15) introPenalty = 80;
    else if (start < 30) introPenalty = 30;
    else if (start < 45) introPenalty = 10;
    score -= introPenalty;

    const hook = phraseEnd ? generateHookFromText(phraseEnd.text) : generateHookFromText(segmentText);
    const description = generateFrenchDescription(segmentText);
    const peakLabel = [];
    if (heatmapCount > 0) peakLabel.push(`${heatmapCount} pic${heatmapCount > 1 ? 's' : ''} heatmap`);
    if (audioCount > 0) peakLabel.push(`${audioCount} pic${audioCount > 1 ? 's' : ''} audio`);

    const whyViral = buildWhyViral({ heatmapCount, audioCount, textScore, emotionBoost, phraseEnd, peakTime, segmentText });

    // Real breakdown derived from actual metrics
    const hookStrength = clamp(Math.round(50 + (textScore * 0.35) + (emotionBoost * 0.4) + (phraseEnd ? 8 : 0)), 20, 98);
    const emotionalPeak = clamp(Math.round(45 + (emotionBoost * 1.2) + (exclCount(segmentText) * 6) + (questionCount(segmentText) * 5)), 20, 98);
    const audioCue = clamp(Math.round(40 + (audioCount * 10) + (heatmapCount * 8) + (rhythmChanges.filter(r => r.time >= start && r.time <= end).length * 12)), 20, 98);
    const keywordDensity = clamp(Math.round(40 + (textScore * 0.45)), 20, 98);
    const pacing = clamp(Math.round(50 + (totalPics / Math.max(dur, 1)) * 40 - silencesInSegment * 12), 20, 98);

    return {
      start: Math.floor(start),
      end: Math.ceil(end),
      score: Math.max(0, Math.round(score)),
      hook,
      description,
      reasoning: `Pic détecté à ${Math.round(peakTime)}s${peakLabel.length > 0 ? ` (${peakLabel.join(' + ')})` : ''}. ${hook}`,
      breakdown: {
        hook_strength: hookStrength,
        emotional_peak: emotionalPeak,
        audio_cue: audioCue,
        keyword_density: keywordDensity,
        pacing: pacing
      },
      why_viral: whyViral,
      suggested_title: hook,
      suggested_hashtags: ['#viral','#shorts','#pourtoi','#clip'],
      reasons: { heatmap: heatmapCount > 0, audio: audioCount > 0, phraseEnd: !!phraseEnd, emotion: emotionBoost > 0 }
    };
  }

  const candidates = filteredPoints.map(p => buildClipAroundPeak(p.time));
  candidates.sort((a, b) => b.score - a.score);

  const selected = [];
  const minGap = 15;
  const maxDuration = 90;
  const tiers = 3;
  const tierSize = videoDuration / tiers;

  for (let tier = 0; tier < tiers; tier++) {
    if (selected.length >= 5) break;
    const tierStart = tier * tierSize;
    const tierEnd = (tier + 1) * tierSize;
    const tierBest = candidates.find(c => c.start >= tierStart && c.start <= tierEnd && !selected.some(s => {
      const overlap = Math.max(0, Math.min(c.end, s.end) - Math.max(c.start, s.start));
      const gap = Math.max(c.start - s.end, s.start - c.end);
      return overlap > 0 || gap < minGap;
    }));
    if (tierBest) {
      if (tierBest.end - tierBest.start > maxDuration) tierBest.end = tierBest.start + maxDuration;
      selected.push(tierBest);
    }
  }

  for (const cand of candidates) {
    if (selected.length >= 5) break;
    const conflicts = selected.some(s => {
      const overlap = Math.max(0, Math.min(cand.end, s.end) - Math.max(cand.start, s.start));
      const gap = Math.max(cand.start - s.end, s.start - cand.end);
      return overlap > 0 || gap < minGap;
    });
    if (!conflicts) {
      if (cand.end - cand.start > maxDuration) cand.end = cand.start + maxDuration;
      selected.push(cand);
    }
  }

  if (userQuery) {
    const q = userQuery.toLowerCase();
    selected.forEach(seg => {
      if (seg.hook.toLowerCase().includes(q) || seg.description.toLowerCase().includes(q)) {
        seg.score = seg.score + 5;
      }
    });
  }

  // BEST CLIPS FIRST — sort by quality score descending
  selected.sort((a, b) => b.score - a.score);
  return selected;
}

function exclCount(text) {
  return (text.match(/\!/g) || []).length;
}
function questionCount(text) {
  return (text.match(/\?/g) || []).length;
}

module.exports = {
  clamp,
  scoreSegmentText,
  generateHookFromText,
  generateFrenchDescription,
  selectClips
};
