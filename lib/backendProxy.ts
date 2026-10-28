import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

type ProxyOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /** false = endpoint público del backend (no exige sesión). */
  auth?: boolean;
};

/**
 * Reenvía una petición al backend de Nest usando el access_token de la cookie,
 * y devuelve siempre un NextResponse con el mismo formato de error { message }.
 */
export async function proxyToBackend(path: string, { method = 'GET', body, auth = true }: ProxyOptions = {}) {
  const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/+$/, '');
  if (!baseUrl) {
    return NextResponse.json({ message: 'Falta NEXT_PUBLIC_API_BASE_URL' }, { status: 500 });
  }

  const token = (await cookies()).get('access_token')?.value;
  if (auth && !token) {
    return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  }

  try {
    const r = await fetch(`${baseUrl}${path}`, {
      method,
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const raw = await r.text();
    let data: any = null;
    try { data = raw ? JSON.parse(raw) : null; } catch { }

    if (!r.ok) {
      const msg = data?.message
        ? Array.isArray(data.message) ? data.message.join(' | ') : String(data.message)
        : `HTTP ${r.status}`;
      return NextResponse.json({ message: msg }, { status: r.status });
    }
    return NextResponse.json(data ?? { ok: true });
  } catch (e) {
    console.error('[proxyToBackend]', path, e);
    return NextResponse.json({ message: 'Error de conexión con el backend' }, { status: 502 });
  }
}
