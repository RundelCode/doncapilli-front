// src/app/api/quizzes/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

function decodeJwtPayload(token: string): any | null {
    try {
        const parts = token.split('.');
        if (parts.length < 2) return null;
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const json = Buffer.from(base64, 'base64').toString('utf8');
        return JSON.parse(json);
    } catch {
        return null;
    }
}

export async function POST(req: Request) {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!baseUrl) {
        return NextResponse.json({ message: 'Falta NEXT_PUBLIC_API_BASE_URL' }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const title = (body?.title || '').trim();
    const status = (body?.status || 'inactive') as 'inactive' | 'active';
    let adminId: string | undefined = body?.adminId; // si por alguna razón ya viene, lo respetamos

    if (!title) {
        return NextResponse.json({ message: 'Falta título' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) {
        return NextResponse.json({ message: 'Falta token de sesión' }, { status: 401 });
    }

    // Intentamos derivar adminId del token/quizzes existentes
    if (!adminId) {
        const payload = decodeJwtPayload(token);
        const sub = payload?.sub as string | undefined;
        const email = payload?.email as string | undefined;

        try {
            // Pedimos quizzes para encontrar un Admin ya existente del usuario
            const rq = await fetch(`${baseUrl}/quizzes`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            const rawQ = await rq.text();
            const dataQ: any = rawQ ? JSON.parse(rawQ) : null;

            if (rq.ok && Array.isArray(dataQ)) {
                const mine =
                    dataQ.find((q: any) => q?.admin?.authUserId && sub && q.admin.authUserId === sub) ||
                    dataQ.find((q: any) => q?.admin?.email && email && q.admin.email === email);

                if (mine?.admin?.id) {
                    adminId = String(mine.admin.id);
                }
            }
        } catch (e) {
            // Si falla este fetch, seguimos sin adminId y daremos error más abajo
        }
    }

    if (!adminId) {
        return NextResponse.json(
            { message: 'Admin no encontrado: no pude resolver adminId a partir de tus quizzes existentes. Crea/ten al menos un quiz previo asociado a tu usuario o añade adminId explícito.' },
            { status: 400 }
        );
    }

    try {
        const r = await fetch(`${baseUrl}/quizzes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ title, status, adminId }),
        });

        const raw = await r.text();
        const data = raw ? JSON.parse(raw) : null;

        if (!r.ok) {
            const msg = data?.message
                ? (Array.isArray(data.message) ? data.message.join(' | ') : String(data.message))
                : `HTTP ${r.status}`;
            return NextResponse.json({ message: msg }, { status: r.status });
        }

        return NextResponse.json(data ?? { ok: true });
    } catch (err) {
        console.error('[api/quizzes POST]', err);
        return NextResponse.json({ message: 'Error de conexión con el backend' }, { status: 502 });
    }
}
