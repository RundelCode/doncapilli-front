'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { ClipLoader } from 'react-spinners';
import styles from './activepoll.module.css';
import Logo from '../../../public/images/Logo.png';
import { fetchJson } from '../../../lib/fetchJson';
import { ActiveRoundPayload } from '../../../types/poll';

const POLL_MS = 2000;

function pct(votes: number, total: number) {
    return total > 0 ? Math.round((votes / total) * 100) : 0;
}

export default function VerVotacionActivaPage() {
    const [bootLoading, setBootLoading] = useState(true);
    const [data, setData] = useState<ActiveRoundPayload>({ poll: null, round: null });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let alive = true;

        async function tick() {
            try {
                const r = await fetchJson<ActiveRoundPayload>('/api/polls/active-round');
                if (!alive) return;
                setData(r ?? { poll: null, round: null });
                setError(null);
            } catch (e: any) {
                if (alive) setError(e?.message || 'Error obteniendo la votación activa');
            } finally {
                if (alive) setBootLoading(false);
            }
        }

        tick();
        const t = setInterval(tick, POLL_MS);
        return () => {
            alive = false;
            clearInterval(t);
        };
    }, []);

    if (bootLoading) return <div className={styles.center}><ClipLoader /></div>;
    if (error && !data.round) return <div className={styles.error}>⚠️ {error}</div>;

    const { poll, round } = data;

    return (
        <div className={styles.page}>
            {!round ? (
                <div className={styles.centerCard}>
                    <h2 className={styles.emptyTitle}>No hay una votación abierta</h2>
                    <p className={styles.muted}>
                        Cuando el admin abra una votación, aparecerá aquí automáticamente.
                    </p>
                </div>
            ) : (
                <section className={styles.stage}>
                    <h1 className={styles.brand}>DONCAPILLI</h1>
                    <Image src={Logo} width={100} height={100} alt="Doncapilli" />
                    <div className={styles.panel}>
                        <div className={styles.headerRow}>
                            <h2 className={styles.qTitle}>VOTA</h2>
                            <div className={styles.pollName}>{poll?.title}</div>
                        </div>

                        <div className={styles.options}>
                            {round.options.map((o) => (
                                <div key={o.candidateId} className={styles.option}>
                                    <span className={styles.badge}>{o.position}</span>
                                    <div className={styles.optionBody}>
                                        <div className={styles.optionTop}>
                                            <span className={styles.optionName}>{o.name}</span>
                                            <span className={styles.optionVotes}>
                                                {o.votes} · {pct(o.votes, round.totalVotes)}%
                                            </span>
                                        </div>
                                        <div className={styles.bar}>
                                            <div
                                                className={styles.barFill}
                                                style={{ width: `${pct(o.votes, round.totalVotes)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <p className={styles.hint}>
                            Escribe <code>!vote</code> y el número en el chat · {round.totalVotes}{' '}
                            {round.totalVotes === 1 ? 'voto' : 'votos'}
                        </p>
                    </div>
                </section>
            )}
        </div>
    );
}
