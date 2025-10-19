import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// GET /api/quizzes/:triviaId/questions
export async function GET(
  _req: Request,
  context: { params: Promise<{ triviaId: string }> }
) {
  const { triviaId } = await context.params; // Next 15: params es Promise
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  try {
    // 1) Lista de preguntas de ese quiz
    const r1 = await fetch(`${baseUrl}/questions/quiz/${triviaId}`, {
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const raw1 = await r1.text();
    let questions: any[] = [];
    try { questions = raw1 ? JSON.parse(raw1) : []; } catch {}

    if (!r1.ok) {
      const msg = (() => { try { return JSON.parse(raw1)?.message } catch { return null } })() || `HTTP ${r1.status}`;
      return NextResponse.json({ message: msg }, { status: r1.status });
    }

    // 2) Pregunta activa (puede no existir)
    const r2 = await fetch(`${baseUrl}/questions/quiz/${triviaId}/active`, {
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const raw2 = await r2.text();
    let active: any = null;
    try { active = raw2 ? JSON.parse(raw2) : null; } catch {}

    // Normaliza al shape esperado por el frontend
    return NextResponse.json({
      questions: Array.isArray(questions) ? questions : [],
      activeQuestionId: active?.id ?? null,
    });
  } catch (e) {
    console.error("[API QUIZ Q] Error:", e);
    return NextResponse.json(
      { message: "Error de conexión con backend" },
      { status: 502 }
    );
  }
}
