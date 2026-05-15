import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { OceanScores, QuestionResponse } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const confidenceScores: OceanScores = body.confidence_scores;

    if (!confidenceScores) {
      return NextResponse.json(
        { error: "Missing confidence_scores in request body" },
        { status: 400 }
      );
    }

    const traits = Object.entries(confidenceScores) as [string, number][];
    const lowestTrait = traits.reduce((min, current) =>
      current[1] < min[1] ? current : min
    );
    const targetTrait = lowestTrait[0];

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      tools: [{ googleSearch: {} }] as any,
    });

    const systemPrompt = `You are a psychometric assessment engine for Cogni, a biometric authentication system. Generate a single complex moral or pragmatic dilemma. The PRIMARY trait to stress-test is "${targetTrait}", but each option should also reveal signal on other OCEAN traits where genuinely relevant.

CRITICAL RULES:
1. INDIAN FOCUS: Prioritize scenarios based on Indian news, culture, trends, and events (e.g., Indian startups, Bollywood, Cricket/IPL, local legal ethics, Indian professional dynamics, urban vs rural shifts). 
2. 60-DAY WINDOW: Use your search tool to identify a specific event or trend from India from the PAST 2 MONTHS. Only use International/USA news if it is a truly massive global phenomenon.
3. HIGH NUANCE: The dilemma must be a complex "gray area" scenario with no obvious correct answer. It must force a difficult cognitive trade-off with personal stakes.
4. CONCISE QUESTION: A concise 1-2 lines describing the scenario.
5. ULTRA-SHORT OPTIONS: Exactly 4 options. Option text must be 1-3 words (MAX 5). They must be answerable AT A GLANCE (milliseconds) to capture pure cognitive instinct.
6. FLEXIBLE MULTI-TRAIT WEIGHTING: Each option has "trait_weights" — an object containing ONLY the OCEAN traits that are genuinely relevant to that specific option. Include between 2 and 5 traits per option. The PRIMARY trait ("${targetTrait}") MUST always be present. Only include other traits (openness, conscientiousness, extraversion, agreeableness, neuroticism) if they are authentically expressed by that option. Values between -1.0 and 1.0. Do NOT pad with irrelevant zeros or near-zeros.
7. DISTINCTNESS: Options must be conceptually different. Avoid similar phrasing.
8. SAFETY: Strictly avoid political, religious, or identity-based triggers.

The 5 OCEAN traits are: openness, conscientiousness, extraversion, agreeableness, neuroticism.

Respond with ONLY valid JSON:
{
  "question": "<string>",
  "primary_trait": "${targetTrait}",
  "options": [
    { "text": "<string>", "trait_weights": { "${targetTrait}": <number>, "<other_relevant_trait>": <number> } },
    { "text": "<string>", "trait_weights": { "${targetTrait}": <number>, "<other_relevant_trait>": <number>, "<another>": <number> } },
    { "text": "<string>", "trait_weights": { "${targetTrait}": <number>, "<other_relevant_trait>": <number> } },
    { "text": "<string>", "trait_weights": { "${targetTrait}": <number>, "<other_relevant_trait>": <number>, "<another>": <number> } }
  ]
}`;

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text().trim();

    const cleaned = responseText
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/gi, "")
      .trim();

    let parsed: QuestionResponse;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Gemini returned invalid JSON:", responseText);
      return NextResponse.json(
        { error: "LLM returned malformed JSON", raw: responseText },
        { status: 502 }
      );
    }

    if (
      !parsed.question ||
      !parsed.primary_trait ||
      !Array.isArray(parsed.options) ||
      parsed.options.length < 4 ||
      !parsed.options[0]?.trait_weights
    ) {
      return NextResponse.json(
        { error: "LLM returned incomplete question schema", data: parsed },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("generate-question error:", error);
    return NextResponse.json(
      { error: "Internal server error generating question" },
      { status: 500 }
    );
  }
}
