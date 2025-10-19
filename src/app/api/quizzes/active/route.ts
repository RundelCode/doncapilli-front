import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// GET /api/quizzes/active
export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    if (!token) return NextResponse.json({ trivia: null }, { status: 200 });

    try {
        // 1) Intento con filtro por query
        let r = await fetch(`${baseUrl}/quizzes?status=active`, {
            headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` },
        });

        let raw = await r.text();
        let data: any = null;
        try { data = raw ? JSON.parse(raw) : null; } catch { }

        // Si el backend no entiende status=active, reintenta sin filtro
        if (!r.ok) {
            // Fallback
            r = await fetch(`${baseUrl}/quizzes`, {
                headers: { "Accept": "application/json", "Authorization": `Bearer ${token}` },
            });
            raw = await r.text();
            data = null;
            try { data = raw ? JSON.parse(raw) : null; } catch { }
            if (!r.ok) {
                const msg = data?.message ?? `HTTP ${r.status}`;
                return NextResponse.json({ message: msg }, { status: r.status });
            }
        }

        // `data` esperado: array de quizzes
        const arr: any[] = Array.isArray(data) ? data : [];
        const active = arr.find(q => (q?.status || q?.state) === 'active') || null;

        // Normaliza a shape esperado por el frontend
        return NextResponse.json({ trivia: active, activeQuestionId: active?.activeQuestionId ?? null });
    } catch (e) {
        return NextResponse.json({ message: "Error de conexión con backend" }, { status: 502 });
    }
}
