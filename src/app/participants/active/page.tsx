'use client';

import React, { useEffect, useMemo, useState } from 'react';
import styles from './leaderboard.module.css';
import { ClipLoader } from 'react-spinners';
import Image from 'next/image';
import Logo from '../../../../public/images/Logo.png';
import { fetchJson } from '../../../../lib/fetchJson';

type Trivia = { id: string; title: string; status: 'active' | 'inactive' | 'done' };
type Participant = {
    id: string;
    username: string;
    score: number;
    quiz_id?: string;
    created_at?: string;
    updated_at?: string;
};
type ApiResponse = { trivia: Trivia | null; participants: Participant[]; error?: string; };

export default function ParticipantsOfActiveTriviaPage() {
    const [bootLoading, setBootLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [trivia, setTrivia] = useState<Trivia | null>(null);
    const [items, setItems] = useState<Participant[]>([]);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchJson<ApiResponse>('/api/participants/active');
            setTrivia(res?.trivia ?? null);
            const list = Array.isArray(res?.participants) ? res.participants : [];
            // Ordenar por score DESC
            list.sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0));
            setItems(list);
            if (res?.error) setError(res.error);
        } catch (e: any) {
            setError(e?.message || 'Error cargando participantes de la trivia activa');
            setTrivia(null);
            setItems([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        (async () => {
            setBootLoading(true);
            await load();
            setBootLoading(false);
        })();
    }, []);

    const hasTrivia = !!trivia?.id;
    const title = useMemo(() => (hasTrivia ? 'Participantes' : 'No hay una trivia activa'), [hasTrivia]);

    if (bootLoading) return <div className={styles.center}><ClipLoader /></div>;
    if (error) return <div className={styles.error}>⚠️ {error}</div>;

    return (
        <div className={styles.page}>
            {!hasTrivia ? (
                <section className={styles.stage}>
                    <h1 className={styles.brand}>DONCAPILLI</h1>
                    <Image src={Logo} width={100} height={100} alt="Doncapilli" />
                    <div className={styles.centerCard}>
                        <h2 className={styles.emptyTitle}>No hay una trivia activa</h2>
                        <p className={styles.muted}>
                            Cuando el admin active una trivia, aparecerá aquí automáticamente.
                        </p>
                    </div>
                </section>
            ) : (
                <section className={styles.stage}>
                    <h1 className={styles.brand}>DONCAPILLI</h1>
                    <Image src={Logo} width={100} height={100} alt="Doncapilli" />
                    <div className={styles.panel}>
                        <div className={styles.headerRow}>
                            <h2 className={styles.qTitle}>{title}</h2>
                            <div className={styles.triviaName}>{trivia?.title}</div>
                            <div className={styles.actionsRow}>
                                <button className={styles.cta} onClick={load} disabled={loading}>
                                    {loading ? 'Cargando…' : 'Actualizar'}
                                </button>
                            </div>
                        </div>

                        {loading && items.length === 0 ? (
                            <div className={styles.center}><ClipLoader /></div>
                        ) : items.length === 0 ? (
                            <div className={styles.centerCard}>
                                <h3 className={styles.emptyTitle}>Sin participantes</h3>
                                <p className={styles.muted}>Aún no hay registros para esta trivia.</p>
                            </div>
                        ) : (
                            <div className={styles.tableWrap}>
                                <div className={styles.tableHeader}>
                                    <div>#</div>
                                    <div>Usuario</div>
                                    <div>Puntaje</div>
                                </div>
                                <div className={styles.tableBody}>
                                    {items.map((p, i) => (
                                        <div
                                            key={p.id}
                                            className={`${styles.row} ${i === 0 ? styles.rowTop : ''}`}
                                        >
                                            <div className={styles.cellIndex}>{i + 1}</div>
                                            <div className={styles.cellUser}>{p.username}</div>
                                            <div className={styles.cellScore}>{p.score}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            )}
        </div>
    );
}
