import { proxyToBackend } from '../../../../../lib/backendProxy';

// Público: lo usa el overlay del stream (/activePoll), no necesita sesión.
export async function GET() {
  return proxyToBackend('/polls/active-round', { auth: false });
}
