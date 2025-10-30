import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function apiBase() {
    return (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
}

async function fetchJson(url: string, headers: Record<string, string>) {
    const r = await fetch(url, { headers, cache: "no-store" });
    const text = await r.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch { }
    return { ok: r.ok, status: r.status, data };
}

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const base = apiBase();

    const hdrs: Record<string, string> = { Accept: "application/json" };
    if (token) hdrs.Authorization = `Bearer ${token}`;

    let trivia: any = null;
    {
        const c1 = await fetchJson(`${base}/quizzes/active`, hdrs);
        if (c1.ok) {
            const payload = c1.data || {};
            trivia = payload?.trivia ?? (payload?.id ? payload : null);
        }
    }

    if (!trivia?.id) {
        const c2 = await fetchJson(`${base}/quizzes?status=active`, hdrs);
        if (c2.ok) {
            const arr: any[] = Array.isArray(c2.data) ? c2.data : [];
            trivia = arr.find(q => (q?.status || q?.state) === "active") || null;
        }
    }

    if (!trivia?.id) {
        const c3 = await fetchJson(`${base}/quizzes`, hdrs);
        if (c3.ok) {
            const arr: any[] = Array.isArray(c3.data) ? c3.data : [];
            trivia = arr.find(q => (q?.status || q?.state) === "active") || null;
        }
    }

    if (!trivia?.id) {
        return NextResponse.json({ trivia: null, participants: [] }, { status: 200 });
    }

    const p = await fetchJson(`${base}/participants/by-quiz?quizId=${encodeURIComponent(trivia.id)}`, hdrs);
    const participants: any[] = p.ok && Array.isArray(p.data) ? p.data : [];

    return NextResponse.json({ trivia, participants, error: p.ok ? undefined : `HTTP ${p.status}` }, { status: 200 });
}
