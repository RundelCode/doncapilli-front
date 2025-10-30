import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!baseUrl) {
        return NextResponse.json({ message: 'Falta NEXT_PUBLIC_API_BASE_URL' }, { status: 500 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;

    try {
        const r = await fetch(`${baseUrl}/quizzes`, {
            headers: {
                Accept: 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
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

        const all: any[] = Array.isArray(data) ? data : (data?.trivias ?? data?.items ?? []);
        const trivias = (all || []).filter(t => (t?.status ?? '').toLowerCase() === 'inactive');

        return NextResponse.json({ trivias });
    } catch (err) {
        console.error('[api/quizzes/inactive] error:', err);
        return NextResponse.json({ message: 'Error de conexión con el backend' }, { status: 502 });
    }
}
