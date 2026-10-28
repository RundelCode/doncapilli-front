'use client';

import React from 'react';
import styles from './polldashboard.module.css';
import Navbar from '../../../components/Navbar/navbar';
import { fetchJson } from '../../../lib/fetchJson';
import { ClipLoader } from 'react-spinners';
import { PollDetail, PollRound, PollSummary } from '../../../types/poll';

const MAX_ACTIVE = 10;

function pct(votes: number, total: number) {
  return total > 0 ? Math.round((votes / total) * 100) : 0;
}

function RoundResults({ round }: { round: PollRound }) {
  return (
    <ul className={styles.results}>
      {round.options.map((o) => (
        <li key={o.candidateId} className={styles.resultRow}>
          <span className={styles.badge}>{o.position}</span>
          <div className={styles.resultBody}>
            <div className={styles.resultTop}>
              <span>{o.name}</span>
              <span className={styles.muted}>
                {o.votes} · {pct(o.votes, round.totalVotes)}%
              </span>
            </div>
            <div className={styles.bar}>
              <div className={styles.barFill} style={{ width: `${pct(o.votes, round.totalVotes)}%` }} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function GestionVotacionesPage() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const [polls, setPolls] = React.useState<PollSummary[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<PollDetail | null>(null);

  // IDs elegidos para la próxima ronda; el orden de selección = número en el chat
  const [picked, setPicked] = React.useState<string[]>([]);

  const openRound = detail?.rounds.find((r) => r.status === 'open') ?? null;

  async function loadPolls() {
    const r = await fetchJson<{ polls: PollSummary[] }>('/api/polls');
    setPolls(r?.polls ?? []);
    return r?.polls ?? [];
  }

  async function loadDetail(id: string) {
    const d = await fetchJson<PollDetail>(`/api/polls/${id}`);
    setDetail(d);
  }

  async function refreshAll(id: string | null = selectedId) {
    setError(null);
    try {
      await loadPolls();
      if (id) await loadDetail(id);
    } catch (e: any) {
      setError(e?.message || 'Error cargando las votaciones');
    }
  }

  React.useEffect(() => {
    (async () => {
      try {
        const list = await loadPolls();
        if (list[0]) {
          setSelectedId(list[0].id);
          await loadDetail(list[0].id);
        }
      } catch (e: any) {
        setError(e?.message || 'Error cargando las votaciones');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mientras hay una ronda abierta, refresca los resultados cada 3 s
  React.useEffect(() => {
    if (!selectedId || !openRound) return;
    const t = setInterval(() => {
      loadDetail(selectedId).catch(() => { });
    }, 3000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, openRound?.id]);

  async function selectPoll(id: string) {
    setSelectedId(id);
    setPicked([]);
    setDetail(null);
    setError(null);
    try {
      await loadDetail(id);
    } catch (e: any) {
      setError(e?.message || 'No se pudo cargar la votación');
    }
  }

  function togglePick(candidateId: string) {
    setPicked((prev) => {
      if (prev.includes(candidateId)) return prev.filter((id) => id !== candidateId);
      if (prev.length >= MAX_ACTIVE) return prev;
      return [...prev, candidateId];
    });
  }

  async function startRound() {
    if (!selectedId || picked.length < 2) return;
    setBusy(true);
    setError(null);
    try {
      await fetchJson(`/api/polls/${selectedId}/rounds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateIds: picked }),
      });
      setPicked([]);
      await refreshAll();
    } catch (e: any) {
      setError(e?.message || 'No se pudo abrir la votación');
    } finally {
      setBusy(false);
    }
  }

  async function closeRound(roundId: string) {
    setBusy(true);
    setError(null);
    try {
      await fetchJson(`/api/polls/rounds/${roundId}/close`, { method: 'PATCH' });
      await refreshAll();
    } catch (e: any) {
      setError(e?.message || 'No se pudo cerrar la votación');
    } finally {
      setBusy(false);
    }
  }

  async function deletePoll(id: string, title: string) {
    if (!window.confirm(`¿Eliminar "${title}" con todos sus votos? Esta acción no se puede deshacer.`)) return;
    setBusy(true);
    setError(null);
    try {
      await fetchJson(`/api/polls/${id}`, { method: 'DELETE' });
      setSelectedId(null);
      setDetail(null);
      const list = await loadPolls();
      if (list[0]) await selectPoll(list[0].id);
    } catch (e: any) {
      setError(e?.message || 'No se pudo eliminar la votación');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className={styles.center}><ClipLoader /></div>;

  const anyOpenElsewhere = polls.some((p) => p.hasOpenRound && p.id !== selectedId);

  return (
    <div className={styles.page}>
      <Navbar />

      <section className={styles.listCard}>
        <h2 className={styles.title}>VOTACIONES</h2>
        {polls.length === 0 ? (
          <p className={styles.muted}>Todavía no hay votaciones. Crea la primera desde “Nueva Votación”.</p>
        ) : (
          <ul className={styles.pollList}>
            {polls.map((p) => (
              <li key={p.id}>
                <button
                  className={`${styles.pollBtn} ${p.id === selectedId ? styles.pollBtnActive : ''}`}
                  onClick={() => selectPoll(p.id)}
                >
                  <span className={styles.pollName}>{p.title}</span>
                  <span className={styles.muted}>
                    {p.candidateCount} participantes · {p.roundCount} {p.roundCount === 1 ? 'ronda' : 'rondas'}
                  </span>
                  {p.hasOpenRound && <span className={styles.live}>En vivo</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.detailCard}>
        {error && <p className={styles.error}>{error}</p>}

        {!detail ? (
          <p className={styles.muted}>{selectedId ? 'Cargando…' : 'Selecciona una votación.'}</p>
        ) : (
          <>
            <div className={styles.detailHeader}>
              <h2 className={styles.title}>{detail.title}</h2>
              <button className={styles.danger} disabled={busy} onClick={() => deletePoll(detail.id, detail.title)}>
                Eliminar
              </button>
            </div>

            {openRound ? (
              <div className={styles.block}>
                <h3 className={styles.subtitle}>Ronda {openRound.number} abierta</h3>
                <p className={styles.muted}>
                  La gente vota en el chat con <code>!vote &lt;número&gt;</code> · {openRound.totalVotes}{' '}
                  {openRound.totalVotes === 1 ? 'voto' : 'votos'}
                </p>
                <RoundResults round={openRound} />
                <button className={styles.primary} disabled={busy} onClick={() => closeRound(openRound.id)}>
                  Cerrar votación
                </button>
              </div>
            ) : (
              <div className={styles.block}>
                <h3 className={styles.subtitle}>Nueva ronda</h3>
                <p className={styles.muted}>
                  Elige entre 2 y {MAX_ACTIVE} participantes. El orden en que los marques define su número en el chat.
                </p>
                {anyOpenElsewhere && (
                  <p className={styles.notice}>
                    Hay una ronda abierta en otra votación; al abrir esta se cerrará.
                  </p>
                )}
                <ul className={styles.pickList}>
                  {detail.candidates.map((c) => {
                    const idx = picked.indexOf(c.id);
                    const on = idx >= 0;
                    return (
                      <li key={c.id}>
                        <button
                          className={`${styles.pickBtn} ${on ? styles.pickBtnOn : ''}`}
                          onClick={() => togglePick(c.id)}
                          aria-pressed={on}
                        >
                          <span className={styles.badge}>{on ? idx + 1 : ''}</span>
                          <span>{c.name}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <button className={styles.primary} disabled={busy || picked.length < 2} onClick={startRound}>
                  Abrir votación ({picked.length})
                </button>
              </div>
            )}

            <div className={styles.block}>
              <h3 className={styles.subtitle}>Total acumulado</h3>
              {detail.totals.every((t) => t.votes === 0) ? (
                <p className={styles.muted}>Aún no hay votos registrados.</p>
              ) : (
                <ol className={styles.totals}>
                  {detail.totals.map((t) => (
                    <li key={t.candidateId}>
                      <span>{t.name}</span>
                      <strong>{t.votes}</strong>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {detail.rounds.filter((r) => r.status === 'closed').length > 0 && (
              <div className={styles.block}>
                <h3 className={styles.subtitle}>Rondas cerradas</h3>
                {detail.rounds
                  .filter((r) => r.status === 'closed')
                  .map((r) => (
                    <div key={r.id} className={styles.history}>
                      <p className={styles.historyTitle}>
                        Ronda {r.number} · {r.totalVotes} {r.totalVotes === 1 ? 'voto' : 'votos'}
                      </p>
                      <RoundResults round={r} />
                    </div>
                  ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
