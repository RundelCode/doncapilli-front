import { NextResponse } from "next/server";
import { cookies } from "next/headers";


export async function PUT(
    req: Request,
    context: { params: Promise<{ triviaId: string }> }
) {
    const { triviaId } = await context.params;
    const { questionId } = await req.json() as { questionId: string };

    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    if (!token) {
        return NextResponse.json({ message: "No autenticado" }, { status: 401 });
    }

    if (!questionId) {
        return NextResponse.json({ message: "questionId es requerido" }, { status: 400 });
    }

    try {
        const r = await fetch(
            `${baseUrl}/quizzes/${triviaId}/questions/${questionId}/status`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: "active" }),
            }
        );

        const raw = await r.text();
        let data: any = null;
        try { data = raw ? JSON.parse(raw) : null; } catch { }

        if (!r.ok) {
            const msg = data?.message ?? `HTTP ${r.status}`;
            return NextResponse.json({ message: msg }, { status: r.status });
        }

        return NextResponse.json({
            ok: true,
            activeQuestionId: questionId,
        });
    } catch (e) {
        console.error("[API ACTIVE Q] Error:", e);
        return NextResponse.json(
            { message: "Error de conexión con backend" },
            { status: 502 }
        );
    }
}
