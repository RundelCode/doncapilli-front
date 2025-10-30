import { NextResponse } from 'next/server';

function getApiBase() {
    return process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') || 'http://localhost:4000';
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get('quizId') || '';
    if (!quizId) {
        return NextResponse.json({ error: 'quizId requerido' }, { status: 400 });
    }

    const base = getApiBase();
    const url = `${base}/participants/by-quiz?quizId=${encodeURIComponent(quizId)}`;

    const r = await fetch(url, { method: 'GET', headers: { 'content-type': 'application/json' }, cache: 'no-store' });
    const text = await r.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch { return NextResponse.json({ error: 'Respuesta no JSON' }, { status: 502 }); }

    if (!r.ok) {
        return NextResponse.json({ error: data?.message || `HTTP ${r.status}` }, { status: r.status });
    }
    return NextResponse.json(data, { status: 200 });
}
