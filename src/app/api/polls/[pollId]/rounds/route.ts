import { NextResponse } from 'next/server';
import { proxyToBackend } from '../../../../../../lib/backendProxy';

export async function POST(req: Request, { params }: { params: Promise<{ pollId: string }> }) {
  const { pollId } = await params;
  const body = await req.json().catch(() => null);
  if (!Array.isArray(body?.candidateIds) || body.candidateIds.length < 2) {
    return NextResponse.json({ message: 'Elige al menos 2 participantes' }, { status: 400 });
  }
  return proxyToBackend(`/polls/${encodeURIComponent(pollId)}/rounds`, {
    method: 'POST',
    body: { candidateIds: body.candidateIds },
  });
}
