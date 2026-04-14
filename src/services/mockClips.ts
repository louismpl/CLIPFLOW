import { Clip } from "./gemini";

function detectCategory(title: string, description: string): "music" | "gaming" | "tutorial" | "podcast" | "vlog" {
  const text = (title + " " + description).toLowerCase();
  if (/\b(official video|music video|clip|song|lyrics|audio|ft\.|feat|album|concert|live)\b/.test(text)) return "music";
  if (/\b(gameplay|game|gaming|walkthrough|lets play|fortnite|minecraft|gta|call of duty|valorant|lol|league of legends)\b/.test(text)) return "gaming";
  if (/\b(tutorial|how to|comment|apprendre|cours|guide|astuce|tips|diy|tuto|formation|expliquer)\b/.test(text)) return "tutorial";
  if (/\b(podcast|interview|discussion|debat|talk|conversation|table ronde|invite)\b/.test(text)) return "podcast";
  return "vlog";
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatHashtag(word: string): string {
  return "#" + word.replace(/[^a-zA-Z0-9\u00C0-\u017F]/g, "").toLowerCase();
}

function extractTopic(title: string): string {
  // Essaie d'extraire un sujet principal propre
  const cleaned = title
    .replace(/\(official.*?\)|\(lyrics.*?\)|\[official.*?\]|\[music video\]|ft\..*|feat\..*/gi, "")
    .replace(/[^\w\s\u00C0-\u017F'-]/g, "")
    .trim();
  const words = cleaned.split(/\s+/).filter(w => w.length > 2);
  if (words.length === 0) return "contenu";
  // Prend les 2-3 premiers mots significatifs ou le dernier mot artiste
  return words.slice(0, 3).join(" ");
}

interface ClipTemplate {
  start: number;
  duration: number;
  hook: string;
  description: string;
  reasoning: string;
  why_viral: string;
  suggested_title: string;
}

function buildClipFromTemplate(
  template: ClipTemplate,
  hashtags: string[],
  category: string,
  idx: number
): Clip {
  const score = randomInt(72, 98);
  const hookStrength = randomInt(70, 98);
  const emotionalPeak = randomInt(65, 96);
  const audioCue = randomInt(60, 94);
  const keywordDensity = randomInt(55, 92);
  const pacing = randomInt(68, 97);

  return {
    start: template.start,
    end: template.start + template.duration,
    score,
    hook: template.hook,
    description: template.description,
    reasoning: template.reasoning,
    breakdown: {
      hook_strength: hookStrength,
      emotional_peak: emotionalPeak,
      audio_cue: audioCue,
      keyword_density: keywordDensity,
      pacing,
    },
    why_viral: template.why_viral,
    suggested_title: template.suggested_title,
    suggested_hashtags: hashtags,
  };
}

export async function generateMockClips(
  videoTitle: string,
  videoDescription: string,
  userQuery?: string
): Promise<Clip[]> {
  const category = detectCategory(videoTitle, videoDescription);
  const topic = extractTopic(videoTitle);
  const author = videoDescription.replace(/Une vidéo de /, "").trim() || "créateur";

  let templates: ClipTemplate[] = [];
  let hashtagsPool: string[] = [];

  if (category === "music") {
    const artist = topic.split(" ").slice(0, 2).join(" ") || "l'artiste";
    templates = [
      {
        start: randomInt(25, 55),
        duration: randomInt(28, 38),
        hook: `Le refrain qui te reste en tête toute la journée`,
        description: `Le moment où ${artist} lâche le refrain iconique. L'énergie monte, la mélodie est addictive et ce passage est fait pour boucler en boucle.`,
        reasoning: "Refrain viral et addictif",
        why_viral: "Les refrains catchy génèrent des millions de duos et réutilisations audio. C'est LE segment à extraire.",
        suggested_title: `Ce refrain est impossible à oublier 🎵🔥`,
      },
      {
        start: randomInt(70, 100),
        duration: randomInt(22, 32),
        hook: `La transition qui donne des frissons`,
        description: `Un passage instrumental ou vocal où le beat drop et tout bascule. Visuellement et musicalement, c'est le pic émotionnel du morceau.`,
        reasoning: "Drop émotionnel fort",
        why_viral: "Les transitions brutales (beat drop) créent un effet de surprise qui retient l'attention jusqu'au bout.",
        suggested_title: `L'instant où tout explose 🎧💥`,
      },
      {
        start: randomInt(130, 170),
        duration: randomInt(25, 35),
        hook: `Le couplet le plus sincère du morceau`,
        description: `Un moment plus intime où les paroles touchent directement. Parfait pour les shorts à texte émotionnel et les réactions.`,
        reasoning: "Authenticité émotionnelle",
        why_viral: "La vulnérabilité et l'authenticité attirent les commentaires et les partages sur TikTok/Reels.",
        suggested_title: `Ce couplet m'a donné des frissons 😳🎶`,
      },
      {
        start: randomInt(200, 240),
        duration: randomInt(20, 30),
        hook: `La meilleure punchline du clip`,
        description: `Une ligne de lyrics percutante qui résume tout le message. Idéal pour un short avec les paroles qui s'affiche en gros.`,
        reasoning: "Punchline mémorable",
        why_viral: "Une punchline forte devient citation et tendance. C'est le type de contenu qui circule massivement.",
        suggested_title: `Cette punchline est trop réelle 📌🔥`,
      },
      {
        start: randomInt(280, 320),
        duration: randomInt(28, 38),
        hook: `Le final épique qui claque`,
        description: `La dernière montée en puissance avant la fin. L'adrénaline est à son maximum et ça donne envie de réécouter immédiatement.`,
        reasoning: "Climax final intense",
        why_viral: "Les fins épiques incitent au replay et au partage car elles laissent le spectateur sur une émotion forte.",
        suggested_title: `Cette fin est légendaire 🏆🎵`,
      },
    ];
    hashtagsPool = ["#musique", "#viral", "#shorts", "#tendance", "#refrain", "#clip", "#chanson", "#music"];
  } else if (category === "gaming") {
    const game = topic.split(" ")[0] || "le jeu";
    templates = [
      {
        start: randomInt(30, 60),
        duration: randomInt(25, 35),
        hook: `Le kill impossible qui défie la physique`,
        description: `Un mouvement ou un tir parfaitement calculé dans ${game}. Le timing est si précis que ça en devient hypnotique.`,
        reasoning: "Skill exceptionnel visible",
        why_viral: "Les clips de skill extrême sont les plus partagés dans la communauté gaming. Tout le monde veut voir le 'impossible'.",
        suggested_title: `Ce kill est tout simplement illégal 🎯😱`,
      },
      {
        start: randomInt(80, 120),
        duration: randomInt(28, 38),
        hook: `La réaction de fou après ce clutch`,
        description: `Le joueur gagne un 1v3 impossible et sa réaction vocale est authentique et explosive. Le contraste tension/délivrance est parfait.`,
        reasoning: "Réaction authentique forte",
        why_viral: "Les réactions authentiques et les comebacks créent une connexion émotionnelle immédiate avec le spectateur.",
        suggested_title: `Le clutch du siècle + réaction de malade 🎮💀`,
      },
      {
        start: randomInt(150, 190),
        duration: randomInt(22, 32),
        hook: `Le bug le plus drôle jamais vu`,
        description: `Un glitch totalement inattendu dans ${game} qui tourne la scène en délire absurde. Parfait pour les compilations humoristiques.`,
        reasoning: "Humour et surprise",
        why_viral: "Les bugs et moments absurdes sont des formats hyper viraux car inattendus et très drôles.",
        suggested_title: `Ce bug n'a aucun sens 😂🐛`,
      },
      {
        start: randomInt(220, 260),
        duration: randomInt(25, 35),
        hook: `La stratégie secrète que personne ne connaît`,
        description: `Le joueur révèle une mécanique cachée ou une position abusive. C'est exactement le genre de contenu que les joueurs veulent apprendre.`,
        reasoning: "Valeur éducative + surprise",
        why_viral: "Le contenu qui révèle un secret ou une astuce génère des sauvegardes et des partages car il a de la valeur utilitaire.",
        suggested_title: `Cette strat est complètement cassée ⚡🎮`,
      },
      {
        start: randomInt(300, 360),
        duration: randomInt(28, 38),
        hook: `Le moment où tout part en vrille`,
        description: `Une séquence chaotique où tout le monde panique, les explosions s'enchaînent et rien ne se passe comme prévu. Pur entertainment.`,
        reasoning: "Chaos divertissant",
        why_viral: "Le chaos contrôlé et le montage rapide sur des moments chaotiques captent l'attention dès la première seconde.",
        suggested_title: `Le chaos absolu en 30 secondes 💥🎮`,
      },
    ];
    hashtagsPool = ["#gaming", "#gameplay", "#shorts", "#viral", "#gamer", "#clip", "#funny", "#win"];
  } else if (category === "tutorial") {
    const skill = topic.split(" ").slice(0, 2).join(" ") || "cette astuce";
    templates = [
      {
        start: randomInt(20, 50),
        duration: randomInt(25, 35),
        hook: `Le résultat final qui va te choquer`,
        description: `On voit le before/after ou le résultat final de ${skill} en quelques secondes. C'est le hook parfait : promesse tenue immédiatement.`,
        reasoning: "Résultat visuel immédiat",
        why_viral: "Montrer le résultat final dès le début crée une promesse forte qui incite à regarder jusqu'au bout pour comprendre comment faire.",
        suggested_title: `Le résultat est fou 😱🔥`,
      },
      {
        start: randomInt(70, 110),
        duration: randomInt(28, 38),
        hook: `L'erreur que tout le monde fait`,
        description: `Le créateur pointe une erreur classique dans ${skill} et explique pourquoi ça rate. C'est relatable et très utile.`,
        reasoning: "Contenu relatable + utile",
        why_viral: "Pointer une erreur commune crée un 'c'est moi ça' qui engage immédiatement et incite à partager aux amis.",
        suggested_title: `Arrête de faire cette erreur 💡❌`,
      },
      {
        start: randomInt(140, 180),
        duration: randomInt(25, 35),
        hook: `L'astuce pro que personne ne partage`,
        description: `Une technique avancée ou un shortcut inattendu pour ${skill}. La valeur est dense et le spectateur ressent qu'il apprend quelque chose d'exclusif.`,
        reasoning: "Valeur exclusive",
        why_viral: "Le contenu qui révèle un 'secret de pro' est massivement sauvegardé et partagé car il a une valeur perçue très haute.",
        suggested_title: `L'astuce que les pros cachent 👀✨`,
      },
      {
        start: randomInt(210, 250),
        duration: randomInt(22, 32),
        hook: `La transformation en temps réel`,
        description: `Un segment où on voit l'évolution étape par étape. Le rythme est rapide, les étapes sont claires et le résultat est satisfaisant.`,
        reasoning: "Satisfaction visuelle",
        why_viral: "Les processus rapides et les transformations sont hypnotiques. Le cerveau aime voir le 'avant/après' condensé.",
        suggested_title: `La transformation est folle 🚀✨`,
      },
      {
        start: randomInt(290, 340),
        duration: randomInt(28, 38),
        hook: `Le conseil final qui change tout`,
        description: `La conclusion résume l'essentiel avec un conseil bonus inattendu. C'est le moment où le spectateur se dit 'je dois sauvegarder ça'.`,
        reasoning: "Conclusion à forte valeur",
        why_viral: "Une conclusion qui résume et ajoute une valeur bonus incite à sauvegarder et à relayer pour ne pas oublier.",
        suggested_title: `Ce conseil final est or 🏆💡`,
      },
    ];
    hashtagsPool = ["#tuto", "#astuce", "#shorts", "#viral", "#apprendre", "#diy", "#conseil", "#hack"];
  } else if (category === "podcast") {
    const guest = topic.split(" ").slice(0, 2).join(" ") || "l'invité";
    templates = [
      {
        start: randomInt(40, 80),
        duration: randomInt(30, 42),
        hook: `La phrase qui a tout fait basculer`,
        description: `${guest} lâche une vérité brutale ou une opinion controversée. Le silence qui suit est éloquent. C'est le moment que tout le monde va citer.`,
        reasoning: "Citation choc et mémorable",
        why_viral: "Les citations brutales et controversées sont massivement citées, commentées et partagées sous forme de clips courts.",
        suggested_title: `Cette phrase a choqué tout le monde 😳🎙️`,
      },
      {
        start: randomInt(110, 150),
        duration: randomInt(28, 38),
        hook: `L'anecdote folle que personne ne connaissait`,
        description: `Une histoire personnelle inédite racontée avec authenticité. Le storytelling est naturel et capte l'attention du début à la fin.`,
        reasoning: "Storytelling fort et inédit",
        why_viral: "Les anecdotes inédites et bien racontées créent une curiosité narrative qui retient l'attention jusqu'au dénouement.",
        suggested_title: `L'anecdote la plus folle du podcast 🎙️🔥`,
      },
      {
        start: randomInt(180, 230),
        duration: randomInt(32, 42),
        hook: `Le débat qui divise tout le monde`,
        description: `Deux points de vue s'affrontent sur un sujet brûlant. L'échange est respectueux mais intense. Parfait pour générer des commentaires.`,
        reasoning: "Débat engageant",
        why_viral: "Les débats équilibrés sur des sujets tendance incitent les spectateurs à prendre parti en commentaire, boostant l'engagement.",
        suggested_title: `Ce débat divise les internautes ⚔️🎙️`,
      },
      {
        start: randomInt(260, 310),
        duration: randomInt(25, 35),
        hook: `Le conseil de carrière le plus honnête`,
        description: `Un moment de sincérité totale où ${guest} partage un conseil brut de décoffrage. Très inspirant et partageable.`,
        reasoning: "Conseil inspirant et honnête",
        why_viral: "Les conseils de vie authentiques et sans filtre deviennent viraux car ils résonnent profondément avec un large public.",
        suggested_title: `Le meilleur conseil que j'ai jamais entendu 💎🎙️`,
      },
      {
        start: randomInt(350, 400),
        duration: randomInt(28, 38),
        hook: `La punchline finale qui résume tout`,
        description: `La conclusion du podcast condensée en une phrase percutante. C'est le type de clip que les gens envoient à leurs amis pour résumer l'épisode.`,
        reasoning: "Conclusion percutante",
        why_viral: "Une phrase finale forte résume parfaitement le contenu et devient un outil de partage naturel pour les fans.",
        suggested_title: `La punchline qui résume tout 📌🔥`,
      },
    ];
    hashtagsPool = ["#podcast", "#interview", "#shorts", "#viral", "#citation", "#conseil", "#debat", "#inspiration"];
  } else {
    // Vlog / Entertainment par défaut
    templates = [
      {
        start: randomInt(15, 45),
        duration: randomInt(25, 35),
        hook: `Le moment où tout part en live`,
        description: `Un imprévu, une surprise ou un début d'action inattendu. C'est le hook parfait car le spectateur ne sait pas ce qui va se passer ensuite.`,
        reasoning: "Suspense et imprévu",
        why_viral: "L'imprévu et le suspense sont les moteurs principaux de l'engagement sur les shorts. Le cerveau veut savoir la suite.",
        suggested_title: `Vous ne devinerez jamais ce qui se passe 😱🔥`,
      },
      {
        start: randomInt(70, 110),
        duration: randomInt(28, 38),
        hook: `La réaction la plus authentique de la vidéo`,
        description: `Un moment de sincérité totale où le créateur réagit à quelque chose de façon complètement naturelle. Aucun script ne peut créer ça.`,
        reasoning: "Authenticité brutale",
        why_viral: "Les réactions authentiques et non scriptées créent une connexion humaine immédiate qui pousse au like et au partage.",
        suggested_title: `Cette réaction est 100% réelle 😂❤️`,
      },
      {
        start: randomInt(140, 180),
        duration: randomInt(25, 35),
        hook: `Le paysage/lieu qui coupe le souffle`,
        description: `Un plan magnifique ou une révélation visuelle spectaculaire. Le contraste lumière/cadrage est parfait pour un short immersif.`,
        reasoning: "Impact visuel fort",
        why_viral: "Les visuels spectaculaires et les révélations de lieux/paysages génèrent des millions de vues par pur effet 'waouh'.",
        suggested_title: `Ce lieu est incroyable 🌍✨`,
      },
      {
        start: randomInt(210, 260),
        duration: randomInt(22, 32),
        hook: `La vanne qui fait mal à la tête`,
        description: `Un moment d'humour pur, une punchline bien placée ou une situation absurde. Parfait pour les compilations funny moments.`,
        reasoning: "Humour et légèreté",
        why_viral: "L'humour est le format le plus partageable. Une bonne vanne devient un meme et circule indéfiniment.",
        suggested_title: `Cette vanne est légendaire 😂🏆`,
      },
      {
        start: randomInt(300, 360),
        duration: randomInt(28, 38),
        hook: `La fin qui donne envie de tout voir`,
        description: `Un cliffhanger, une révélation finale ou un moment émouvant qui conclut la vidéo. Ça donne envie de regarder l'intégralité.`,
        reasoning: "Cliffhanger final",
        why_viral: "Une fin ouverte ou émotionnelle pousse le spectateur à chercher la suite ou à commenter, créant une boucle d'engagement.",
        suggested_title: `Cette fin m'a donné envie de tout voir 🎬🔥`,
      },
    ];
    hashtagsPool = ["#vlog", "#viral", "#shorts", "#tendance", "#funny", "#travel", "#lifestyle", "#mustwatch"];
  }

  // Personnalisation si userQuery
  if (userQuery && userQuery.trim().length > 0) {
    const q = userQuery.trim().toLowerCase();
    let customHook = `Le moment exact que tu cherches : "${userQuery.trim()}"`;
    let customDesc = `Un extrait parfaitement aligné avec ta recherche "${userQuery.trim()}". C'est le segment le plus pertinent de toute la vidéo.`;
    let customWhy = `Ce clip répond précisément à "${userQuery.trim()}", ce qui le rend hyper ciblé et partageable pour les personnes intéressées.`;

    if (q.includes("drôle") || q.includes("funny") || q.includes("rire")) {
      customHook = "Le moment le plus drôle de la vidéo";
      customDesc = "Le créateur lâche une vanne parfaite ou se retrouve dans une situation absurde. Le timing comique est impeccable.";
      customWhy = "L'humour est le format le plus viral. Ce moment drôle sera relayé et commenté massivement.";
    } else if (q.includes("émouvant") || q.includes("triste") || q.includes("touchant")) {
      customHook = "Le moment qui te met la larme à l'œil";
      customDesc = "Une scène d'une sincérité bouleversante où l'émotion est palpable. Parfait pour les réactions et les shorts émotionnels.";
      customWhy = "Les contenus émotionnels créent une connexion profonde et génèrent des engagements authentiques très forts.";
    } else if (q.includes("shock") || q.includes("choquant") || q.includes("surprise")) {
      customHook = "La révélation qui va te choquer";
      customDesc = "Un twist inattendu ou une information explosive qui change complètement la perspective sur la vidéo.";
      customWhy = "La surprise et le choc créent un effet de bouche-à-oreille immédiat. Tout le monde veut partager ce 'wow'.";
    } else if (q.includes("apprendre") || q.includes("astuce") || q.includes("tip")) {
      customHook = "L'astuce ultime cachée dans cette vidéo";
      customDesc = "Le créateur révèle une technique ou un conseil précieux que tu n'aurais jamais deviné seul.";
      customWhy = "Le contenu éducatif de valeur est massivement sauvegardé et partagé car il résout un problème concret.";
    }

    templates[2] = {
      ...templates[2],
      start: randomInt(100, 160),
      duration: randomInt(28, 38),
      hook: customHook,
      description: customDesc,
      reasoning: "Correspond exactement à la recherche utilisateur",
      why_viral: customWhy,
      suggested_title: `${userQuery.trim()} — le moment parfait ⏱️✨`,
    };
  }

  // Génération des hashtags uniques (3-4)
  const baseTags = hashtagsPool.slice(0, 4);
  const extraTags = [
    formatHashtag(topic.split(" ")[0] || "viral"),
    formatHashtag(author.split(" ")[0] || "creator"),
    "#fyp",
    "#pourtoi",
  ].filter(t => t.length > 1);

  const allTags = [...new Set([...baseTags, ...extraTags])];

  const clips = templates.map((t, idx) => {
    const shuffled = [...allTags].sort(() => 0.5 - Math.random());
    return buildClipFromTemplate(t, shuffled.slice(0, 4), category, idx);
  });

  return clips.sort((a, b) => b.score - a.score);
}
