import { proxyToBackend } from '../../../../../lib/backendProxy';

type Ctx = { params: Promise<{ pollId: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { pollId } = await params;
  return proxyToBackend(`/polls/${encodeURIComponent(pollId)}`);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { pollId } = await params;
  return proxyToBackend(`/polls/${encodeURIComponent(pollId)}`, { method: 'DELETE' });
}
