import { NextResponse } from 'next/server';

function getApiBase() {
    return process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') || 'http://localhost:4000';
}

async function fetchJsonSafe(url: string) {
    const res = await fetch(url, { cache: 'no-store' });
    const text = await res.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch { /* noop */ }
    return { ok: res.ok, status: res.status, data };
}

function candidates(base: string) {
    const b = base.replace(/\/+$/, '');
    return [b, `${b}/api`];
}

type ActiveTriviaPayload = {
    trivia: { id: string; title: string; status: 'active' | 'inactive' | 'done' } | null;
    activeQuestionId: string | null;
};

export async function GET() {
    const base = getApiBase();
    const roots = candidates(base);

    let trivia: ActiveTriviaPayload['trivia'] | null = null;
    let activeRoot: string | null = null;

    for (const root of roots) {
        const { ok, data } = await fetchJsonSafe(`${root}/quizzes/active`);
        const maybe: ActiveTriviaPayload | null = ok ? data : null;
        const t = maybe?.trivia ?? null;
        if (t?.id) {
            trivia = t;
            activeRoot = root;
            break;
        }
    }

    if (!trivia?.id || !activeRoot) {
        return NextResponse.json({ trivia: null, participants: [] }, { status: 200 });
    }

    const { ok, status, data } = await fetchJsonSafe(
        `${activeRoot}/participants/by-quiz?quizId=${encodeURIComponent(trivia.id)}`
    );

    if (!ok) {
        return NextResponse.json({ trivia, participants: [], error: `HTTP ${status}` }, { status: 200 });
    }

    const participants: any[] = Array.isArray(data) ? data : [];
    return NextResponse.json({ trivia, participants }, { status: 200 });
}
