import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!baseUrl) {
        return NextResponse.json({ message: 'Falta NEXT_PUBLIC_API_BASE_URL' }, { status: 500 });
    }

    let body: any = null;
    try { body = await req.json(); } catch { }
    const triviaId: string | undefined = body?.triviaId; // ← tu parámetro

    if (!triviaId) {
        return NextResponse.json({ message: 'triviaId es requerido' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;

    try {
        // Traducimos al endpoint real del backend:
        const r = await fetch(`${baseUrl}/quizzes/${encodeURIComponent(triviaId)}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ status: 'active' }),
        });

        const raw = await r.text();
        let data: any = null;
        try { data = raw ? JSON.parse(raw) : null; } catch { }

        if (!r.ok) {
            const msg = data?.message
                ? (Array.isArray(data.message) ? data.message.join(' | ') : String(data.message))
                : `HTTP ${r.status}`;
            return NextResponse.json({ message: msg }, { status: r.status });
        }

        return NextResponse.json(data ?? { ok: true });
    } catch (err) {
        console.error('[api/quizzes/activate] error:', err);
        return NextResponse.json({ message: 'Error de conexión con el backend' }, { status: 502 });
    }
}
