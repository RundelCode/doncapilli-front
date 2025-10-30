import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    return NextResponse.json({ message: 'Falta NEXT_PUBLIC_API_BASE_URL' }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const title = (body?.title || '').trim();
  const status = body?.status || 'inactive';

  if (!title) {
    return NextResponse.json({ message: 'Falta título' }, { status: 400 });
  }

  // 👇👇 CORRECTO: cookies() con await
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) {
    return NextResponse.json({ message: 'Falta token de sesión' }, { status: 401 });
  }

  // 🔥 obtener el adminId desde tu backend
  let adminId: string | undefined;
  try {
    const meRes = await fetch(`${baseUrl}/admins/me`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const meRaw = await meRes.text();
    let me: any = null;
    try { me = meRaw ? JSON.parse(meRaw) : null; } catch {}

    if (!meRes.ok) {
      const msg = me?.message
        ? (Array.isArray(me.message) ? me.message.join(' | ') : String(me.message))
        : `HTTP ${meRes.status}`;
      return NextResponse.json({ message: `No se pudo resolver el admin actual: ${msg}` }, { status: meRes.status });
    }

    adminId = me?.id ?? me?.admin?.id;
    if (!adminId) {
      return NextResponse.json({ message: 'El endpoint /admins/me no devolvió un id de admin' }, { status: 500 });
    }
  } catch (err: any) {
    return NextResponse.json({ message: `Fallo resolviendo admin actual: ${err?.message ?? 'Error'}` }, { status: 502 });
  }

  // Crear trivia
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
    let data: any = null;
    try { data = raw ? JSON.parse(raw) : null; } catch {}

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
