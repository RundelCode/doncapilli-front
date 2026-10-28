import { NextResponse } from 'next/server';
import { proxyToBackend } from '../../../../lib/backendProxy';

export async function GET() {
  return proxyToBackend('/polls');
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.title?.trim()) {
    return NextResponse.json({ message: 'Falta el título' }, { status: 400 });
  }
  return proxyToBackend('/polls', {
    method: 'POST',
    body: { title: body.title, participants: body.participants ?? [] },
  });
}
