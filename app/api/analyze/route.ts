import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(req: Request) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "GROQ_API_KEY not set" }, { status: 500 });
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  try {
    const { name, skills, goal, categories } = await req.json();

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an expert career coach and skill gap analyst. 
You MUST respond with valid JSON only. No markdown, no explanation, no code blocks. 
Just raw JSON that can be parsed directly.`,
        },
        {
          role: "user",
          content: `Analyze skill gaps for ${name}.
Current skills: ${skills}
Target goal: ${goal}
Skill categories to evaluate: ${categories || "Programming, Tools, Soft Skills, Domain Knowledge, AI/ML"}

Return this exact JSON structure (fill in realistic data based on the input):
{
  "summary": "2-3 sentence overview of the person's profile and main gaps",
  "overallReadiness": 42,
  "skillScores": [
    { "skill": "Skill Name", "current": 6, "required": 9, "category": "Category Name", "gap": 3 }
  ],
  "roadmap": [
    { "step": 1, "title": "Step title", "description": "What to do and why", "duration": "2 weeks", "priority": "high" }
  ],
  "resources": [
    { "title": "Resource name", "url": "https://...", "type": "course", "free": true }
  ],
  "strengths": ["strength 1", "strength 2"],
  "quickWins": ["Quick actionable tip 1", "Quick actionable tip 2"]
}

Rules:
- skillScores: 5-8 skills covering the different categories, current/required on scale 0-10, gap = required - current
- overallReadiness: 0-100 percentage based on average of current/required ratios
- roadmap: 4-6 steps in logical learning order
- resources: 4-6 real, accurate URLs (Coursera, fast.ai, docs, YouTube channels etc)
- priority: "high", "medium", or "low"
- resource type: "course", "docs", "book", "video", or "community"`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { error: "Failed to parse AI response" };
    }

    return NextResponse.json({ data: parsed });
  } catch (error: any) {
    console.error("Groq error:", error);
    return NextResponse.json({ error: error.message ?? "Something went wrong" }, { status: 500 });
  }
}
