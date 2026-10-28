import { proxyToBackend } from '../../../../../../../lib/backendProxy';

export async function PATCH(_req: Request, { params }: { params: Promise<{ roundId: string }> }) {
  const { roundId } = await params;
  return proxyToBackend(`/polls/rounds/${encodeURIComponent(roundId)}/close`, { method: 'PATCH' });
}
