'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './leaderboard.module.css';
import { useRouter, useSearchParams } from 'next/navigation';
import { ClipLoader } from 'react-spinners';
import Image from 'next/image';
import Logo from '../../../public/images/Logo.png';
import { fetchJson } from '../../../lib/fetchJson';

type Participant = {
    id: string;
    username: string;
    score: number;
    quiz_id?: string;
    created_at?: string;
    updated_at?: string;
};

export default function ParticipantsByQuizPage() {
    const router = useRouter();
    const search = useSearchParams();
    const [quizId, setQuizId] = useState<string>(search.get('quizId') || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [items, setItems] = useState<Participant[]>([]);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    async function load(qid: string) {
        setError(null);
        setLoading(true);
        try {
            const res = await fetchJson<Participant[]>(`/api/participants/by-quiz?quizId=${encodeURIComponent(qid)}`);
            setItems(Array.isArray(res) ? res : []);
        } catch (e: any) {
            setError(e?.message || 'Error cargando participantes');
            setItems([]);
        } finally {
            setLoading(false);
        }
    }

    function startPolling(qid: string) {
        if (pollingRef.current) return;
        pollingRef.current = setInterval(() => load(qid), 4000);
    }

    function stopPolling() {
        if (!pollingRef.current) return;
        clearInterval(pollingRef.current);
        pollingRef.current = null;
    }

    useEffect(() => {
        const current = search.get('quizId') || '';
        setQuizId(current);
        if (current) load(current);
    }, [search]);

    useEffect(() => {
        const vis = () => (document.hidden ? stopPolling() : (quizId && startPolling(quizId)));
        if (quizId) startPolling(quizId);
        document.addEventListener('visibilitychange', vis);
        return () => {
            stopPolling();
            document.removeEventListener('visibilitychange', vis);
        };
    }, [quizId]);

    const title = useMemo(() => (quizId ? `Participantes de la trivia` : 'Busca una trivia'), [quizId]);

    function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        const q = quizId.trim();
        if (!q) return;
        router.replace(`/participants/by-quiz?quizId=${encodeURIComponent(q)}`);
    }

    return (
        <div className={styles.page}>
            <section className={styles.stage}>
                <h1 className={styles.brand}>DONCAPILLI</h1>
                <Image src={Logo} width={100} height={100} alt="Doncapilli" />
                <div className={styles.panel}>
                    <div className={styles.headerRow}>
                        <h2 className={styles.qTitle}>{title}</h2>
                        <form onSubmit={onSubmit} className={styles.searchRow}>
                            <input
                                className={styles.input}
                                placeholder="Ingresa el Quiz ID (UUID)"
                                value={quizId}
                                onChange={(e) => setQuizId(e.target.value)}
                            />
                            <button className={styles.cta} type="submit">Cargar</button>
                        </form>
                    </div>

                    {!quizId ? (
                        <div className={styles.centerCard}>
                            <h3 className={styles.emptyTitle}>Ingresa un Quiz ID</h3>
                            <p className={styles.muted}>Usa el campo de arriba para ver todos los participantes de esa trivia.</p>
                        </div>
                    ) : loading ? (
                        <div className={styles.center}><ClipLoader /></div>
                    ) : error ? (
                        <div className={styles.error}>⚠️ {error}</div>
                    ) : items.length === 0 ? (
                        <div className={styles.centerCard}>
                            <h3 className={styles.emptyTitle}>Sin participantes</h3>
                            <p className={styles.muted}>Aún no hay registros para este quiz.</p>
                        </div>
                    ) : (
                        <div className={styles.tableWrap}>
                            <div className={styles.tableHeader}>
                                <div>#</div>
                                <div>Usuario</div>
                                <div>Puntaje</div>
                                <div>Registrado</div>
                            </div>
                            <div className={styles.tableBody}>
                                {items.map((p, i) => (
                                    <div key={p.id} className={styles.row}>
                                        <div className={styles.cellIndex}>{i + 1}</div>
                                        <div className={styles.cellUser}>{p.username}</div>
                                        <div className={styles.cellScore}>{p.score}</div>
                                        <div className={styles.cellDate}>
                                            {p.created_at ? new Date(p.created_at).toLocaleString() : '—'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
