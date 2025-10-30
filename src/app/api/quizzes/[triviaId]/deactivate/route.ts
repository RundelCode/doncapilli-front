import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function PATCH(
    req: Request,
    ctx: { params?: { triviaId?: string } }
) {
    const url = new URL(req.url);
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    let quizId = ctx?.params?.triviaId;

    if (!quizId) {
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts.length >= 4 && parts[0] === 'api' && parts[1] === 'quizzes') {
            quizId = parts[2];
        }
    }

    console.log('[deactivate][IN]', {
        pathname: url.pathname,
        quizId,
        hasToken: Boolean(token),
        baseUrl,
    });

    if (!quizId || quizId === 'undefined') {
        return NextResponse.json({ message: 'ID de trivia inválido' }, { status: 400 });
    }

    if (!baseUrl) {
        return NextResponse.json({ message: 'Falta NEXT_PUBLIC_API_BASE_URL' }, { status: 500 });
    }

    try {
        const r = await fetch(`${baseUrl}/quizzes/${quizId}/deactivate`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });

        const raw = await r.text();
        let data: any = null;
        try { data = raw ? JSON.parse(raw) : null; } catch { }

        console.log('[deactivate][OUT]', { status: r.status, raw });

        if (!r.ok) {
            const msg =
                data?.message
                    ? Array.isArray(data.message)
                        ? data.message.join(' | ')
                        : String(data.message)
                    : `HTTP ${r.status}`;
            return NextResponse.json({ message: msg }, { status: r.status });
        }

        return NextResponse.json(data ?? { ok: true });
    } catch (err) {
        console.error('[deactivate][EXC]', err);
        return NextResponse.json({ message: 'Error de conexión con el backend' }, { status: 502 });
    }
}
