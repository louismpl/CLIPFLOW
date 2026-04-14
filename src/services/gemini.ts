import { GoogleGenAI, Type } from "@google/genai";
import { generateSmartClips } from "./smartAnalysis";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export function isMockMode(): boolean {
  const apiKey = process.env.GEMINI_API_KEY;
  return !apiKey || apiKey.trim() === "" || apiKey === "MY_GEMINI_API_KEY";
}

export interface Clip {
  start: number;
  end: number;
  score: number;
  hook: string;
  description: string;
  reasoning: string;
  breakdown: {
    hook_strength: number;
    emotional_peak: number;
    audio_cue: number;
    keyword_density: number;
    pacing: number;
  };
  why_viral: string;
  suggested_title: string;
  suggested_hashtags: string[];
}

export async function analyzeVideo(videoTitle: string, videoDescription: string, userQuery?: string, duration?: number, transcriptJson?: string, audioPeaks?: number[], maxClipDuration = 55, heatmapPeaks?: number[]): Promise<Clip[]> {
  if (isMockMode()) {
    return generateSmartClips(videoTitle, videoDescription, userQuery, duration, transcriptJson, audioPeaks, maxClipDuration, heatmapPeaks);
  }

  // If transcript is the new rich format, only pass windows to Gemini to save tokens
  let transcriptForPrompt = transcriptJson;
  if (transcriptJson) {
    try {
      const parsed = JSON.parse(transcriptJson);
      if (parsed && Array.isArray(parsed.windows)) {
        transcriptForPrompt = JSON.stringify(parsed.windows);
      }
    } catch {}
  }

  const ai = getAI();
  const prompt = `
    Analyze this YouTube video and identify 5 potential viral "Shorts" clips.
    Video Title: ${videoTitle}
    Video Description: ${videoDescription}
    Video Duration (seconds): ${duration ?? 'unknown'}
    ${transcriptForPrompt ? `Transcript segments with timestamps: ${transcriptForPrompt.slice(0, 10000)}` : ''}
    ${userQuery ? `User specific request: "${userQuery}". Prioritize clips matching this intent.` : ''}
    ${duration ? `IMPORTANT: The video is ${duration} seconds long. All clip start and end times MUST be within 0 and ${duration}.` : ''}

    Rules:
    - NEVER select segments about sponsorships, ads, "like and subscribe", "check the description", or generic outros.
    - Focus on moments with strong hooks, surprises, emotions, or dense valuable content.
    - If a transcript is provided, use it to ground the descriptions in the ACTUAL content spoken.

    For each clip, provide:
    1. Start and End time (seconds)
    2. A catchy hook/title
    3. A brief description grounded in what is actually said/done
    4. A viral score (0-100)
    5. A detailed breakdown (0-100 for each): hook_strength, emotional_peak, audio_cue, keyword_density, pacing
    6. "why_viral": A 1-sentence explanation of why it will go viral
    7. "suggested_title": A viral-optimized title
    8. "suggested_hashtags": 3 relevant hashtags

    Return the data as a JSON array of objects.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              start: { type: Type.NUMBER },
              end: { type: Type.NUMBER },
              score: { type: Type.NUMBER },
              hook: { type: Type.STRING },
              description: { type: Type.STRING },
              reasoning: { type: Type.STRING },
              breakdown: {
                type: Type.OBJECT,
                properties: {
                  hook_strength: { type: Type.NUMBER },
                  emotional_peak: { type: Type.NUMBER },
                  audio_cue: { type: Type.NUMBER },
                  keyword_density: { type: Type.NUMBER },
                  pacing: { type: Type.NUMBER },
                },
                required: ["hook_strength", "emotional_peak", "audio_cue", "keyword_density", "pacing"],
              },
              why_viral: { type: Type.STRING },
              suggested_title: { type: Type.STRING },
              suggested_hashtags: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
            },
            required: ["start", "end", "score", "hook", "description", "reasoning", "breakdown", "why_viral", "suggested_title", "suggested_hashtags"],
          },
        },
      },
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error analyzing video:", error);
    return generateSmartClips(videoTitle, videoDescription, userQuery, duration, transcriptJson);
  }
}
