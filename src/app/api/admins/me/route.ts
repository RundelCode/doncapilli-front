import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    return NextResponse.json({ message: 'Falta NEXT_PUBLIC_API_BASE_URL' }, { status: 500 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) {
    return NextResponse.json({ message: 'Falta token de sesión' }, { status: 401 });
  }

  try {
    const r = await fetch(`${baseUrl}/admins/me`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
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

    return NextResponse.json(data ?? {});
  } catch (err) {
    console.error('[api/admins/me GET]', err);
    return NextResponse.json({ message: 'Error de conexión con el backend' }, { status: 502 });
  }
}
