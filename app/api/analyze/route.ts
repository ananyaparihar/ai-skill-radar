import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(req: Request) {
  // 🔒 Check API key
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: "GROQ_API_KEY not set" },
      { status: 500 }
    );
  }

  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  try {
    const { name, skills, goal, categories } = await req.json();

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",

      messages: [
        {
          role: "system",
          content: `
You are a highly strict, expert AI career coach.

CRITICAL RULES:
- Always generate UNIQUE, PERSONALIZED responses
- NEVER give generic answers
- Analyze based on user input deeply
- Adapt output based on skill level (beginner/intermediate/advanced)

OUTPUT RULES:
- Return ONLY valid JSON
- No markdown, no explanation, no extra text
          `,
        },
        {
          role: "user",
          content: `
User Profile:
Name: ${name}
Current Skills: ${skills}
Target Goal: ${goal}
Categories: ${categories || "Programming, Tools, Soft Skills, Domain Knowledge, AI/ML"}

TASK:
Analyze skill gaps VERY SPECIFICALLY.

IMPORTANT:
- Skills MUST depend on goal (AI Engineer ≠ Frontend Developer)
- Roadmap must match user's level
- Avoid repeating same skills for different inputs

Return EXACT JSON:

{
  "summary": "2-3 line personalized analysis",
  "overallReadiness": number,
  "skillScores": [
    {
      "skill": "Specific skill",
      "current": number,
      "required": number,
      "category": "Category",
      "gap": number
    }
  ],
  "roadmap": [
    {
      "step": number,
      "title": "Step title",
      "description": "Actionable explanation",
      "duration": "time",
      "priority": "high | medium | low"
    }
  ],
  "resources": [
    {
      "title": "Real resource",
      "url": "https://...",
      "type": "course | docs | video | book | community",
      "free": true
    }
  ],
  "strengths": ["based on user skills"],
  "quickWins": ["immediate actions"]
}

STRICT:
- skillScores: 5–8 real skills
- roadmap: 4–6 steps
- resources: real links
          `,
        },
      ],

      temperature: 0.9,
      top_p: 0.9,
      max_tokens: 2000,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";

    let parsed;

    try {
      // Try direct parse
      parsed = JSON.parse(raw);
    } catch {
      try {
        // Extract JSON if model adds extra text
        const match = raw.match(/\{[\s\S]*\}/);
        parsed = match ? JSON.parse(match[0]) : null;
      } catch {
        parsed = null;
      }
    }

    // 🧠 Fallback (VERY IMPORTANT)
    if (!parsed) {
      return NextResponse.json({
        data: {
          summary: "AI response parsing failed. Try again.",
          overallReadiness: 0,
          skillScores: [],
          roadmap: [],
          resources: [],
          strengths: [],
          quickWins: [],
        },
      });
    }

    return NextResponse.json({ data: parsed });

  } catch (error: any) {
    console.error("🔥 Groq error:", error);

    return NextResponse.json(
      {
        error: error.message || "Something went wrong",
      },
      { status: 500 }
    );
  }
}