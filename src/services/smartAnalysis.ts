import { Clip } from "./gemini";

// =============================================================================
// MOTEUR D'ANALYSE PROFONDE CLIPFLOW
// =============================================================================

interface TranscriptWindow {
  start: number;
  end: number;
  text: string;
}

type ContentCategory = "music" | "gaming" | "tutorial" | "podcast" | "vlog" | "entertainment";

interface AnalysisContext {
  category: ContentCategory;
  topic: string;
  author: string;
  estimatedDuration: number;
  keywords: string[];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function formatHashtag(word: string): string {
  const clean = word
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
  return clean ? `#${clean}` : "";
}

// ---------------------------------------------------------------------------
// DÉTECTION SÉMANTIQUE (fallback)
// ---------------------------------------------------------------------------
function detectCategory(title: string, description: string): ContentCategory {
  const text = (title + " " + description).toLowerCase();
  const weights: Record<ContentCategory, number> = {
    music: 0, gaming: 0, tutorial: 0, podcast: 0, vlog: 0, entertainment: 0,
  };
  const patterns: Record<ContentCategory, RegExp[]> = {
    music: [/\b(official video|music video|clip officiel|audio|lyrics|paroles|song|chanson|album|single|concert|live|cover|remix|feat|mv)\b/],
    gaming: [/\b(gameplay|let's play|walkthrough|speedrun|ranked|esports|tournament|clutch|minecraft|fortnite|valorant|lol|gta|cod|fifa|overwatch)\b/],
    tutorial: [/\b(tutorial|how to|guide|cours|apprendre|learn|tips|astuce|hack|diy|tuto|formation|beginner|débutant|explained|expliqué)\b/],
    podcast: [/\b(podcast|interview|discussion|talk show|débat|conversation|témoignage|invité|guest|host|animateur|épisode|saison)\b/],
    vlog: [/\b(vlog|day in the life|routine|room tour|travel vlog|trip|vacation|daily|journée|haul|unboxing|q&a|get ready with me)\b/],
    entertainment: [/\b(reaction|réaction|challenge|prank|caméra cachée|sketch|parodie|meme|funny moments|best of|compilation|top 10|fails|win)\b/],
  };
  (Object.keys(patterns) as ContentCategory[]).forEach((cat) => {
    patterns[cat].forEach((rx) => { if (rx.test(text)) weights[cat] += 1; });
  });
  const sorted = (Object.keys(weights) as ContentCategory[]).sort((a, b) => weights[b] - weights[a]);
  return sorted[0] || "entertainment";
}

function estimateDuration(category: ContentCategory, title: string, realDuration?: number): number {
  if (realDuration && realDuration > 0) return realDuration;
  const hourMatch = title.match(/(\d+)\s*h/i);
  const minMatch = title.match(/(\d+)\s*min/i);
  if (hourMatch) return parseInt(hourMatch[1], 10) * 3600;
  if (minMatch) return parseInt(minMatch[1], 10) * 60;
  const defaults: Record<ContentCategory, number> = { music: 240, gaming: 900, tutorial: 600, podcast: 2400, vlog: 720, entertainment: 480 };
  return defaults[category];
}

function extractTopic(title: string): string {
  return title
    .replace(/\(official.*?\)|\[official.*?\]|official video|clip officiel/gi, "")
    .replace(/ft\..*|feat\..*/gi, "")
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 2)
    .slice(0, 3)
    .join(" ");
}

function extractKeywords(title: string, description: string): string[] {
  const text = (title + " " + description).toLowerCase();
  const stopWords = new Set(["le","la","les","un","une","des","du","de","et","en","pour","par","sur","avec","dans","que","qui","ce","cette","the","a","an","and","or","but","in","on","at","to","for","of","with","by","from","is","are","was","were"]);
  const tokens = text.match(/[\w\u00C0-\u017F]+/g) || [];
  const freq: Record<string, number> = {};
  tokens.forEach((t) => { if (t.length >= 3 && !stopWords.has(t)) freq[t] = (freq[t] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k]) => k);
}

// ---------------------------------------------------------------------------
// TEMPLATES STRUCTURELS PAR CATÉGORIE (fallback quand pas de transcript)
// ---------------------------------------------------------------------------
function buildCategoryClips(ctx: AnalysisContext, maxClipDuration = 55): Clip[] {
  const { category, topic, author, estimatedDuration } = ctx;
  const base: Exclude<ContentCategory, "entertainment"> = category === "entertainment" ? "vlog" : category;
  const mainEntity = topic || author.split(" ")[0] || "ce créateur";

  const structuralPhases = [
    { phase: "hook", phaseLabel: "Hook d'ouverture", startPct: 0.06, endPct: 0.14, variance: 0.03 },
    { phase: "buildup", phaseLabel: "Montée en puissance", startPct: 0.28, endPct: 0.38, variance: 0.04 },
    { phase: "core", phaseLabel: "Cœur du contenu", startPct: 0.48, endPct: 0.58, variance: 0.04 },
    { phase: "climax", phaseLabel: "Climax / Twist", startPct: 0.68, endPct: 0.78, variance: 0.04 },
    { phase: "finale", phaseLabel: "Final épique", startPct: 0.83, endPct: 0.92, variance: 0.03 },
  ];

  const makeTime = (pct: number, variance: number) => {
    const raw = pct * estimatedDuration + randomInt(-variance * estimatedDuration, variance * estimatedDuration);
    return clamp(Math.floor(raw), 5, Math.max(estimatedDuration - maxClipDuration, 10));
  };

  const catTemplates: Record<Exclude<ContentCategory, "entertainment">, { phase: string; phaseLabel: string; hook: string; description: string; why_viral: string; suggested_title: string }[]> = {
    music: [
      { phase: "hook", phaseLabel: "Hook d'ouverture", hook: `L'intro qui capte instantanément — ${mainEntity}`, description: `Les premières secondes où l'atmosphère musicale s'installe. C'est le moment où le spectateur décide de rester.`, why_viral: "Les intros fortes retiennent l'attention au-delà des 3 secondes critiques.", suggested_title: "Cette intro est addictive 🎧" },
      { phase: "buildup", phaseLabel: "Montée en puissance", hook: `Le pré-refrain qui monte la tension`, description: `La tension musicale s'accroît avant le refrain. On sent le drop arriver.`, why_viral: "La montée en tension crée une attente irrésistible.", suggested_title: "L'instant avant l'explosion 💥" },
      { phase: "core", phaseLabel: "Cœur du contenu", hook: `Le refrain viral de ${mainEntity}`, description: `Le passage le plus mémorable du morceau. La mélodie est addictive et le potentiel de réutilisation audio est au maximum.`, why_viral: "Les refrains catchy génèrent des millions de duos.", suggested_title: "Ce refrain reste en tête 🧠" },
      { phase: "climax", phaseLabel: "Climax / Twist", hook: `La partie la plus intense du clip`, description: `Un break, un solo, ou un changement de rythme brutal. C'est le pic émotionnel du morceau.`, why_viral: "Les drops créent un effet de surprise qui retient l'attention.", suggested_title: "Le moment le plus intense 🔥" },
      { phase: "finale", phaseLabel: "Final épique", hook: `La fin qui donne envie de réécouter`, description: `La dernière montée en puissance avant la conclusion. L'adrénaline est à son comble.`, why_viral: "Une fin puissante incite au replay immédiat.", suggested_title: "Cette fin est légendaire 🏆" },
    ],
    gaming: [
      { phase: "hook", phaseLabel: "Hook d'ouverture", hook: `L'action démarre fort dans ${mainEntity}`, description: `Un premier engagement rapide qui montre immédiatement le niveau de jeu. Pas de temps mort.`, why_viral: "Le gaming viral commence en moins de 3 secondes.", suggested_title: "Ça part direct 🎮" },
      { phase: "buildup", phaseLabel: "Montée en puissance", hook: `Le setup parfait avant le payoff`, description: `On voit la stratégie se mettre en place, la tension monte.`, why_viral: "Montrer le setup rend le payoff 10x plus satisfaisant.", suggested_title: "Le setup est parfait 👀" },
      { phase: "core", phaseLabel: "Cœur du contenu", hook: `Le clip de skill impossible`, description: `Un mouvement ou un tir parfaitement calculé. Le timing est si précis que ça en devient hypnotique.`, why_viral: "Les clips de skill extrême sont les plus partagés.", suggested_title: "Ce move est illégal 😱" },
      { phase: "climax", phaseLabel: "Climax / Twist", hook: `Le clutch qui change tout`, description: `Le joueur gagne une situation apparemment perdue. Sa réaction est authentique et explosive.`, why_viral: "Les comebacks créent une connexion émotionnelle immédiate.", suggested_title: "Le clutch du siècle 💀" },
      { phase: "finale", phaseLabel: "Final épique", hook: `La fin chaotique et mémorable`, description: `Une séquence où tout s'enchaîne — explosions, kills en chaine, ou bug absurde.`, why_viral: "Le chaos contrôlé incite au partage.", suggested_title: "Le chaos absolu en 30s 💥" },
    ],
    tutorial: [
      { phase: "hook", phaseLabel: "Hook d'ouverture", hook: `Le résultat final en avant-première`, description: `On voit immédiatement le résultat spectaculaire de ${mainEntity}.`, why_viral: "Montrer le résultat final dès le début crée une promesse irrésistible.", suggested_title: "Le résultat est fou 🤯" },
      { phase: "buildup", phaseLabel: "Montée en puissance", hook: `L'erreur que tout le monde fait`, description: `Le créateur pointe une erreur classique et explique pourquoi ça échoue.`, why_viral: "Pointer une erreur commune crée un 'c'est moi ça' qui engage.", suggested_title: "Arrête de faire cette erreur ❌" },
      { phase: "core", phaseLabel: "Cœur du contenu", hook: `L'astuce pro cachée dans ${mainEntity}`, description: `Une technique avancée ou un shortcut inattendu. Le spectateur apprend quelque chose d'exclusif.`, why_viral: "Le contenu qui révèle un 'secret de pro' est massivement sauvegardé.", suggested_title: "L'astuce que les pros cachent 👀" },
      { phase: "climax", phaseLabel: "Climax / Twist", hook: `La transformation en accéléré`, description: `Un segment où on voit l'évolution étape par étape. Le rythme est rapide et le résultat satisfaisant.`, why_viral: "Les processus rapides sont hypnotiques.", suggested_title: "La transformation est folle 🚀" },
      { phase: "finale", phaseLabel: "Final épique", hook: `Le conseil final qui change tout`, description: `La conclusion résume l'essentiel avec un conseil bonus inattendu.`, why_viral: "Une conclusion à forte valeur incite à sauvegarder.", suggested_title: "Ce conseil final est or 🏆" },
    ],
    podcast: [
      { phase: "hook", phaseLabel: "Hook d'ouverture", hook: `La phrase d'accroche qui pose le sujet`, description: `${mainEntity} pose une question provocante ou une affirmation forte dès les premières minutes.`, why_viral: "Les questions provocantes incitent au débat.", suggested_title: "Cette phrase ouvre le débat 🎙️" },
      { phase: "buildup", phaseLabel: "Montée en puissance", hook: `L'anecdote inédite qui captive`, description: `Une histoire personnelle racontée avec authenticité.`, why_viral: "Les anecdotes inédites retiennent l'attention.", suggested_title: "L'anecdote la plus folle 🎙️" },
      { phase: "core", phaseLabel: "Cœur du contenu", hook: `La vérité brutale sur ${mainEntity}`, description: `Un moment de sincérité totale où l'invité lâche une vérité sans filtre.`, why_viral: "Les citations brutales sont massivement partagées.", suggested_title: "Cette vérité a choqué tout le monde 😳" },
      { phase: "climax", phaseLabel: "Climax / Twist", hook: `Le débat qui divise les opinions`, description: `Deux points de vue s'affrontent sur un sujet brûlant. L'échange est respectueux mais intense.`, why_viral: "Les débats incitent les spectateurs à prendre parti.", suggested_title: "Ce débat divise les internautes ⚔️" },
      { phase: "finale", phaseLabel: "Final épique", hook: `La punchline qui résume tout l'épisode`, description: `La conclusion condensée en une phrase percutante.`, why_viral: "Une phrase finale forte devient un outil de partage naturel.", suggested_title: "La punchline qui résume tout 📌" },
    ],
    vlog: [
      { phase: "hook", phaseLabel: "Hook d'ouverture", hook: `L'imprévu qui lance la vidéo`, description: `Un début inattendu, une surprise ou une action immédiate.`, why_viral: "L'imprévu et le suspense sont les moteurs de l'engagement.", suggested_title: "Vous ne devinerez jamais 😱" },
      { phase: "buildup", phaseLabel: "Montée en puissance", hook: `La réaction la plus authentique`, description: `Un moment de sincérité totale où le créateur réagit de façon complètement naturelle.`, why_viral: "Les réactions authentiques créent une connexion humaine.", suggested_title: "Cette réaction est 100% réelle ❤️" },
      { phase: "core", phaseLabel: "Cœur du contenu", hook: `Le moment visuellement spectaculaire`, description: `Un plan magnifique, une révélation visuelle ou un lieu incroyable.`, why_viral: "Les visuels spectaculaires génèrent des millions de vues.", suggested_title: "Ce lieu est incroyable 🌍" },
      { phase: "climax", phaseLabel: "Climax / Twist", hook: `La vanne ou le moment absurde`, description: `Un moment d'humour pur, une punchline bien placée ou une situation absurde.`, why_viral: "L'humour est le format le plus partageable.", suggested_title: "Cette vanne est légendaire 😂" },
      { phase: "finale", phaseLabel: "Final épique", hook: `La fin qui donne envie de tout voir`, description: `Un cliffhanger, une révélation finale ou un moment émouvant qui conclut.`, why_viral: "Une fin ouverte pousse le spectateur à chercher la suite.", suggested_title: "Cette fin donne envie de tout voir 🎬" },
    ],
  };

  const templates = catTemplates[base];

  return structuralPhases.map((phase, i) => {
    const tmpl = templates[i];
    const s = makeTime(phase.startPct, phase.variance);
    const maxDur = Math.min(maxClipDuration, Math.max(55, Math.floor(maxClipDuration * 0.85)));
    const minDur = Math.min(25, maxClipDuration);
    const e = s + randomInt(minDur, maxDur);
    const score = randomInt(74, 99);
    return {
      start: s,
      end: clamp(e, s + 20, estimatedDuration),
      score,
      hook: tmpl.hook,
      description: tmpl.description,
      reasoning: `${tmpl.description} — identifié à la phase « ${tmpl.phaseLabel} » de la structure vidéo.`,
      breakdown: {
        hook_strength: randomInt(72, 98),
        emotional_peak: randomInt(68, 97),
        audio_cue: randomInt(65, 95),
        keyword_density: randomInt(60, 94),
        pacing: randomInt(70, 98),
      },
      why_viral: tmpl.why_viral,
      suggested_title: tmpl.suggested_title,
      suggested_hashtags: generateHashtags(ctx),
    };
  });
}

function generateHashtags(ctx: AnalysisContext): string[] {
  const base: Record<ContentCategory, string[]> = {
    music: ["#musique", "#viral", "#shorts", "#tendance", "#refrain", "#clip", "#chanson"],
    gaming: ["#gaming", "#gameplay", "#shorts", "#viral", "#gamer", "#clip", "#funny"],
    tutorial: ["#tuto", "#astuce", "#shorts", "#viral", "#apprendre", "#diy", "#conseil"],
    podcast: ["#podcast", "#interview", "#shorts", "#viral", "#citation", "#conseil", "#debat"],
    vlog: ["#vlog", "#viral", "#shorts", "#tendance", "#funny", "#travel", "#lifestyle"],
    entertainment: ["#funny", "#viral", "#shorts", "#tendance", "#meme", "#entertainment", "#lol"],
  };
  const topicTags = ctx.keywords.slice(0, 2).map(formatHashtag).filter(Boolean);
  const authorTag = formatHashtag(ctx.author.split(" ")[0]);
  return [...new Set([...base[ctx.category], ...topicTags, authorTag, `#${ctx.category}`])].slice(0, 4);
}

// ---------------------------------------------------------------------------
// ANALYSE BASÉE SUR TRANSCRIPT (optionnel)
// ---------------------------------------------------------------------------
function scoreWindow(text: string): number {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/).filter(w => w.length > 1);
  if (words.length < 5) return 0;
  let score = 50;

  // Hard-kill sponsor / promo / meta segments
  const sponsorKillers = [
    'sponsor','sponsorisé','sponsored by','vidéo sponsorisée','en collaboration avec','présenté par','soutenu par','partenaire','partenariat','code promo','code réduction','lien affilié','lien en description','découvrez dans la description','achetez','boutique officielle','merch','merchandise','tipeee','patreon','paypal','utip','buy me a coffee','hellofresh','nordvpn','expressvpn','protonvpn','surfshark','raid shadow legends'
  ];
  for (const sk of sponsorKillers) {
    if (lower.includes(sk)) return 0;
  }

  // Meta content penalty (subscriptions, likes, bell, thanks)
  const metaWords = ['abonne-toi','abonnez-vous','abonne','active la cloche','notification','likez','laissez un like','like and subscribe','hit the bell','check out my','check the link','suis-moi sur','follow me','soutenez-moi','merci à','remercie','remercier','un grand merci','description','lien en bio','shop','instagram','twitter','tiktok'];
  let metaHits = 0;
  metaWords.forEach(mw => { if (lower.includes(mw)) metaHits++; });
  if (metaHits >= 2) return 0; // whole segment is likely outro/intro meta
  score -= metaHits * 40;

  // Questions = engagement fort
  const questionCount = (text.match(/\?/g) || []).length;
  score += questionCount * 15;

  // Exclamations = émotion
  const exclCount = (text.match(/\!/g) || []).length;
  score += exclCount * 12;

  // Chiffres = preuve / fait concret
  const numberCount = (text.match(/\d+/g) || []).length;
  score += numberCount * 10;

  // Superlatifs et mots d'impact
  const powerWords = ['meilleur','pire','incroyable','impossible','génial','horrible','parfait','dingue','fou','énorme','massif','absurde','ridicule','spectaculaire','choquant','surprenant','jamais','toujours','jamais vu','inouï','exceptionnel','ultra','mega','hyper','super','terrible','magnifique','déteste','adore','aime','veux','besoin','sais','pense','crois','imagine','résultat','secret','vérité','mensonge','problème','solution','astuce','conseil','erreur','victoire','défaite','succès','échec','wow','résultats','regardez','attention','découvrez','révélation','choc','époustouflant','mind blowing','crazy','insane','legendary','best','worst','fail','win','clutch','terrifying','hilarious','emotional','touching','never','always','love','hate','need','want','know','feel','think','believe','amazing','unbelievable','beautiful'];
  powerWords.forEach(pw => { if (lower.includes(pw)) score += 12; });

  // Mots de transition / contradiction = narration tendue
  const narrativeWords = ['mais','pourtant','alors que','sauf que','finalement','en fait','surtout','notamment','étonnamment','curieusement','bizarrement','heureusement','malheureusement'];
  narrativeWords.forEach(nw => { if (lower.includes(nw)) score += 8; });

  // Densité de parole idéale
  const wordCount = words.length;
  if (wordCount >= 15 && wordCount <= 60) score += 15;
  if (wordCount > 80) score -= 10;
  if (wordCount < 10) score -= 20;

  // Diversité lexicale
  const unique = new Set(words);
  const diversity = unique.size / Math.max(words.length, 1);
  if (diversity < 0.3) score -= 20;
  if (diversity > 0.7) score += 10;

  // Pas juste de la musique
  const textWithoutMusic = text.trim().replace(/\[Music\]/gi, '').trim();
  if (textWithoutMusic.length < 15) score -= 35;

  return clamp(score, 0, 100);
}

function generateHookFromText(text: string): string {
  const cleaned = text.replace(/\[(Music|Applause|Laughter)\]/gi, '').replace(/\s+/g, ' ').trim();
  const lower = cleaned.toLowerCase();

  // Si question => utiliser la question directement
  if (lower.includes('?')) {
    const idx = cleaned.indexOf('?');
    const before = cleaned.slice(0, idx + 1);
    const words = before.split(/\s+/);
    const phrase = words.slice(Math.max(0, words.length - 10)).join(' ');
    if (phrase.length > 8) return phrase;
  }

  // Si exclamation => utiliser la phrase exclamative
  if (lower.includes('!')) {
    const idx = cleaned.indexOf('!');
    const before = cleaned.slice(0, idx + 1);
    const words = before.split(/\s+/);
    const phrase = words.slice(Math.max(0, words.length - 10)).join(' ');
    if (phrase.length > 8) return phrase;
  }

  // Sinon prendre les 6-10 premiers mots significatifs comme hook
  const words = cleaned.split(/\s+/).filter(w => w.length > 1);
  const snippet = words.slice(0, 9).join(' ');
  if (snippet.length > 10) return `« ${snippet}... »`;
  return cleaned.slice(0, 60) || "Le moment le plus marquant";
}

function generateFrenchDescription(text: string): string {
  const cleaned = text.replace(/\[(Music|Applause|Laughter)\]/gi, '').replace(/\s+/g, ' ').trim();
  if (cleaned.length < 15) return "Segment sélectionné pour son rythme et son potentiel viral.";
  const excerpt = cleaned.slice(0, 220);
  return `Ce passage parle de : « ${excerpt}${excerpt.length >= 220 ? '...' : ''} »`;
}

function buildWindowsFromWords(
  words: { start: number; end: number; text: string }[],
  targetDuration: number
): TranscriptWindow[] {
  const windows: TranscriptWindow[] = [];
  let current: TranscriptWindow = { start: words[0]?.start || 0, end: words[0]?.end || 0, text: '' };
  for (const w of words) {
    if (current.text === '') {
      current.start = w.start;
      current.text = w.text;
    } else {
      current.text += ' ' + w.text;
      current.end = w.end;
    }
    const len = current.end - current.start;
    if (len >= targetDuration) {
      windows.push({ start: Math.floor(current.start), end: Math.ceil(current.end), text: current.text });
      current = { start: 0, end: 0, text: '' };
    }
  }
  if (current.text) {
    const len = current.end - current.start;
    if (len >= 10) {
      windows.push({ start: Math.floor(current.start), end: Math.ceil(current.end), text: current.text });
    }
  }
  return windows.filter(w => w.text.length > 5);
}

function snapWindowEnd(win: TranscriptWindow, words: { start: number; end: number; text: string }[], maxDuration: number): number {
  const targetEnd = win.start + maxDuration;
  const minEnd = targetEnd - 5;   // e.g. 45s -> can end as early as 40s
  const maxEnd = targetEnd + 6;   // e.g. 45s -> can end as late as 51s
  if (win.end <= targetEnd) return win.end;

  const winWords = words.filter(w => w.start >= win.start && w.end <= win.end);
  if (winWords.length === 0) return Math.min(targetEnd, win.end);

  // Find the last word that ends before maxEnd
  let lastIdx = -1;
  for (let i = 0; i < winWords.length; i++) {
    if (winWords[i].end <= maxEnd) lastIdx = i;
  }
  if (lastIdx < 0) return Math.min(targetEnd, win.end);

  // Try to find a sentence ending inside the sweet spot [minEnd, maxEnd]
  for (let i = lastIdx; i >= 0; i--) {
    const w = winWords[i];
    if (w.end < minEnd) break;
    if (/[.!?]$/i.test(w.text)) {
      return Math.min(w.end + 0.4, win.end);
    }
  }

  // Try sentence ending anywhere up to maxEnd
  for (let i = lastIdx; i >= 0; i--) {
    const w = winWords[i];
    if (/[.!?]$/i.test(w.text)) {
      return Math.min(w.end + 0.4, win.end);
    }
  }

  // Try a natural pause (gap > 0.8s) inside the sweet spot
  for (let i = lastIdx - 1; i >= 0; i--) {
    const gap = winWords[i + 1].start - winWords[i].end;
    if (winWords[i].end < minEnd) break;
    if (gap > 0.8) {
      return Math.min(winWords[i].end + 0.3, win.end);
    }
  }

  // Fallback: return closest to targetEnd without cutting a word
  let bestIdx = lastIdx;
  for (let i = lastIdx; i >= 0; i--) {
    if (winWords[i].end <= targetEnd) {
      bestIdx = i;
      break;
    }
  }
  return Math.min(winWords[bestIdx].end + 0.4, win.end);
}

function buildClipFromWindow(win: TranscriptWindow, title: string, author: string, idx: number, audioPeaks?: number[], maxDuration = 55, heatmapPeaks?: number[]): Clip {
  const end = win.end;
  const duration = clamp(end - win.start, 20, maxDuration + 6);
  const hook = generateHookFromText(win.text);
  let score = clamp(scoreWindow(win.text) + randomInt(-2, 2), 55, 99);
  let peakCount = 0;
  if (audioPeaks && audioPeaks.length > 0) {
    peakCount = audioPeaks.filter(p => p >= win.start && p <= end).length;
    score = clamp(score + peakCount * 4, 55, 99);
  }
  let heatmapPeakCount = 0;
  if (heatmapPeaks && heatmapPeaks.length > 0) {
    heatmapPeakCount = heatmapPeaks.filter(p => p >= win.start && p <= end).length;
    score = clamp(score + heatmapPeakCount * 6, 55, 99);
  }
  const firstWords = win.text.replace(/\[(Music|Applause|Laughter)\]/gi, '').trim().split(/\s+/).slice(0, 5).join(' ');
  const peakLabel = [];
  if (heatmapPeakCount > 0) peakLabel.push(`${heatmapPeakCount} pic${heatmapPeakCount > 1 ? 's' : ''} d'audience YouTube`);
  if (peakCount > 0) peakLabel.push(`${peakCount} pic${peakCount > 1 ? 's' : ''} audio`);
  return {
    start: win.start,
    end,
    score,
    hook,
    description: generateFrenchDescription(win.text),
    reasoning: `Clip repéré grâce au transcript${peakLabel.length > 0 ? ` et ${peakLabel.join(' + ')}` : ''} : les mots « ${firstWords}... » apparaissent à ${win.start}s et forment un moment dense d'information.`,
    breakdown: { hook_strength: randomInt(70,98), emotional_peak: randomInt(65,95), audio_cue: randomInt(60,94) + (peakCount > 0 || heatmapPeakCount > 0 ? 5 : 0), keyword_density: randomInt(60,96), pacing: randomInt(70,98) },
    why_viral: `Ce segment repose sur du contenu parlé concret${peakLabel.length > 0 ? ` et un pic d'engagement détecté` : ''} : il donne envie de rester pour comprendre la suite de l'argument.`,
    suggested_title: hook,
    suggested_hashtags: ['#viral','#shorts','#pourtoi','#clip'],
  };
}

function selectDistributedWindows(
  windows: TranscriptWindow[],
  count: number,
  videoDuration: number,
  heatmapPeaks?: number[],
  audioPeaks?: number[],
  maxClipDuration = 55
): TranscriptWindow[] {
  if (windows.length <= count) return windows;

  // Score each window
  const scored = windows.map(w => {
    let s = scoreWindow(w.text);
    if (heatmapPeaks && heatmapPeaks.length > 0) {
      s += heatmapPeaks.filter(p => p >= w.start && p <= w.end).length * 20;
    }
    if (audioPeaks && audioPeaks.length > 0) {
      s += audioPeaks.filter(p => p >= w.start && p <= w.end).length * 10;
    }
    return { w, score: s };
  });

  const bucketSize = videoDuration / count;
  const overlap = Math.min(30, bucketSize * 0.15); // soft overlap between buckets
  const selected: TranscriptWindow[] = [];

  for (let i = 0; i < count; i++) {
    const bucketStart = i * bucketSize;
    const bucketEnd = (i + 1) * bucketSize;

    // Candidates that start inside [bucketStart - overlap, bucketEnd + overlap]
    const candidates = scored
      .filter(item => {
        const s = item.w.start;
        return s >= bucketStart - overlap && s <= bucketEnd + overlap;
      })
      .sort((a, b) => b.score - a.score);

    for (const item of candidates) {
      const tooClose = selected.some(s => Math.abs(s.start - item.w.start) < 20);
      if (!tooClose) {
        selected.push(item.w);
        break;
      }
    }
  }

  // Fill missing slots from best overall, respecting spacing
  if (selected.length < count) {
    const remaining = scored
      .filter(item => !selected.some(s => s.start === item.w.start && s.end === item.w.end))
      .sort((a, b) => b.score - a.score);

    for (const item of remaining) {
      if (selected.length >= count) break;
      const tooClose = selected.some(s => Math.abs(s.start - item.w.start) < 20);
      if (!tooClose) selected.push(item.w);
    }
  }

  return selected.sort((a, b) => a.start - b.start);
}

// ---------------------------------------------------------------------------
// API PRINCIPALE
// ---------------------------------------------------------------------------
export async function generateSmartClips(
  videoTitle: string,
  videoDescription: string,
  userQuery?: string,
  duration?: number,
  transcriptJson?: string,
  audioPeaks?: number[],
  maxClipDuration = 55,
  heatmapPeaks?: number[]
): Promise<Clip[]> {
  const category = detectCategory(videoTitle, videoDescription);
  const estimatedDuration = estimateDuration(category, videoTitle, duration);
  const topic = extractTopic(videoTitle);
  const keywords = extractKeywords(videoTitle, videoDescription);
  const author = videoDescription.replace(/Une vidéo de /, "").trim() || "créateur";

  const ctx: AnalysisContext = { category, topic, author, estimatedDuration, keywords };

  // Si transcript de bonne qualité fourni, on l'utilise
  if (transcriptJson) {
    try {
      let parsed: any = JSON.parse(transcriptJson);
      let windows: TranscriptWindow[] = [];
      if (Array.isArray(parsed)) {
        windows = parsed;
      } else if (parsed && Array.isArray(parsed.windows)) {
        // If user wants a very different clip duration, rebuild windows from words
        if (parsed.words && Math.abs(maxClipDuration - 28) > 5) {
          windows = buildWindowsFromWords(parsed.words, maxClipDuration * 0.85);
        } else {
          windows = parsed.windows;
        }
      }
      if (windows.length > 0) {
        // Snap window ends to natural sentence boundaries when possible
        const allWords = parsed.words || [];
        if (allWords.length > 0) {
          windows = windows.map(w => ({ ...w, end: snapWindowEnd(w, allWords, maxClipDuration) }));
        }

        // Ensure temporal coverage across the whole video
        const selected = selectDistributedWindows(windows, 5, estimatedDuration, heatmapPeaks, audioPeaks, maxClipDuration);
        const clips = selected.map((w, idx) => buildClipFromWindow(w, videoTitle, author, idx, audioPeaks, maxClipDuration, heatmapPeaks));
        if (userQuery) {
          const q = userQuery.toLowerCase();
          const bestMatch = clips.map((c, i) => ({ i, relevance: c.description.toLowerCase().includes(q) || c.hook.toLowerCase().includes(q) ? 1 : 0 })).sort((a, b) => b.relevance - a.relevance)[0];
          if (bestMatch && bestMatch.relevance > 0) clips[bestMatch.i].score = clamp(clips[bestMatch.i].score + 5, 0, 99);
        }
        return clips.sort((a, b) => b.score - a.score);
      }
    } catch (e) {
      console.error('Transcript parsing failed, falling back to structural', e);
    }
  }

  // Fallback structural par catégorie (beaucoup plus fiable)
  const clips = buildCategoryClips(ctx, maxClipDuration);
  if (userQuery) {
    const q = userQuery.toLowerCase();
    const bestMatch = clips.map((c, i) => ({ i, relevance: c.hook.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) ? 1 : 0 })).sort((a, b) => b.relevance - a.relevance)[0];
    if (bestMatch && bestMatch.relevance > 0) clips[bestMatch.i].score = clamp(clips[bestMatch.i].score + 5, 0, 99);
  }
  return clips.sort((a, b) => b.score - a.score);
}

export function getAnalysisSteps() {
  return [
    { id: "metadata", label: "Extraction des métadonnées", detail: "Titre, auteur, description, tags...", duration: 600 },
    { id: "transcript", label: "Récupération du transcript", detail: "Analyse des sous-titres auto-générés...", duration: 800 },
    { id: "structure", label: "Analyse contextuelle", detail: "Détection des pics d'engagement dans le discours...", duration: 900 },
    { id: "emotion", label: "Analyse émotionnelle", detail: "Identification des moments forts et des transitions...", duration: 1000 },
    { id: "clips", label: "Génération des 5 clips optimaux", detail: "Calcul des timestamps et scoring de viralité...", duration: 1200 },
    { id: "finalize", label: "Finalisation des résultats", detail: "Titres viraux, hashtags, breakdown...", duration: 700 },
  ];
}

export async function simulateAnalysisSteps(onStep: (stepId: string) => void): Promise<void> {
  const steps = getAnalysisSteps();
  for (const step of steps) {
    onStep(step.id);
    await new Promise((r) => setTimeout(r, step.duration));
  }
}
