'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './active.module.css';
import { fetchJson } from '../../../lib/fetchJson';
import Logo from '../../../public/images/Logo.png' 
import { ClipLoader } from "react-spinners";
import Image from 'next/image';

type ActiveTriviaPayload = {
    trivia: { id: string; title: string; status: 'active' | 'inactive' } | null;
    activeQuestionId: string | null;
};

type RawQuestion = {
    id: string;
    question?: string;
    statement?: string;
    text?: string;
    title?: string;
    answers: string[];
    correctAnswer?: 'A' | 'B' | 'C' | 'D';
    status: 'active' | 'inactive';
    quizId: string;
};

type ParsedAnswer = { label: 'A' | 'B' | 'C' | 'D'; text: string };

function parseAnswers(list: string[] = []): ParsedAnswer[] {
    return (list || []).map((s) => {
        const m = s.match(/^\s*([ABCD])[\)\.]\s*(.*)$/i);
        const label = (m?.[1] || '').toUpperCase() as ParsedAnswer['label'];
        const text = (m?.[2] || s).trim();
        return { label, text };
    });
}

export default function VerTriviaActivaPage() {
    const [bootLoading, setBootLoading] = useState(true);
    const [qLoading, setQLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [active, setActive] = useState<ActiveTriviaPayload>({ trivia: null, activeQuestionId: null });
    const [questions, setQuestions] = useState<RawQuestion[]>([]);

    const prevTriviaId = useRef<string | null>(null);
    const prevActiveQId = useRef<string | null>(null);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    async function fetchActive(): Promise<ActiveTriviaPayload | null> {
        try {
            const a = await fetchJson<ActiveTriviaPayload>('/api/quizzes/active');
            return a ?? { trivia: null, activeQuestionId: null };
        } catch (e: any) {
            setError(e?.message || 'Error obteniendo la trivia activa');
            return null;
        }
    }

    async function fetchQuestions(triviaId: string) {
        try {
            const r = await fetchJson<{ questions: RawQuestion[]; activeQuestionId?: string | null }>(
                `/api/quizzes/${triviaId}/questions`
            );
            setQuestions(r?.questions ?? []);
            setActive((prev) => ({
                trivia: prev.trivia,
                activeQuestionId: r?.activeQuestionId ?? prev.activeQuestionId ?? null,
            }));
        } catch (e: any) {
            setError(e?.message || 'Error cargando preguntas');
        }
    }

    useEffect(() => {
        (async () => {
            setBootLoading(true);
            const a = await fetchActive();
            if (a) {
                setActive((prev) => {
                    if (prev.trivia?.id === a.trivia?.id && prev.activeQuestionId === a.activeQuestionId) return prev;
                    return a;
                });
                if (a?.trivia?.id) {
                    setQLoading(true);
                    await fetchQuestions(a.trivia.id);
                    setQLoading(false);
                } else {
                    setQuestions([]);
                }
                prevTriviaId.current = a?.trivia?.id ?? null;
                prevActiveQId.current = a?.activeQuestionId ?? null;
            }
            setBootLoading(false);
        })();
    }, []);

    useEffect(() => {
        function start() {
            if (pollingRef.current) return;
            pollingRef.current = setInterval(async () => {
                const a = await fetchActive();
                if (!a) return;

                const triviaChanged = prevTriviaId.current !== (a.trivia?.id ?? null);
                const activeQChanged = prevActiveQId.current !== (a.activeQuestionId ?? null);

                if (triviaChanged) {
                    setActive(a);
                    prevTriviaId.current = a.trivia?.id ?? null;
                    prevActiveQId.current = a.activeQuestionId ?? null;

                    if (a.trivia?.id) {
                        setQLoading(true);
                        await fetchQuestions(a.trivia.id);
                        setQLoading(false);
                    } else {
                        setQuestions([]);
                    }
                    return;
                }

                if (activeQChanged) {
                    setActive((prev) => ({ trivia: prev.trivia, activeQuestionId: a.activeQuestionId }));
                    prevActiveQId.current = a.activeQuestionId ?? null;

                    if (a.trivia?.id && !questions.some(q => q.id === a.activeQuestionId)) {
                        await fetchQuestions(a.trivia.id);
                    }
                }
            }, 3000);
        }

        function stop() {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
        }

        const onVis = () => (document.hidden ? stop() : start());
        start();
        document.addEventListener('visibilitychange', onVis);
        return () => {
            stop();
            document.removeEventListener('visibilitychange', onVis);
        };
    }, [questions]);

    const activeQuestion = useMemo(() => {
        if (!questions.length) return null;
        const byId = questions.find(q => q.id === active.activeQuestionId);
        return byId ?? questions[0];
    }, [questions, active.activeQuestionId]);

    const qIndex = useMemo(() => {
        if (!activeQuestion) return 0;
        const idx = questions.findIndex(q => q.id === activeQuestion.id);
        return idx >= 0 ? idx : 0;
    }, [questions, activeQuestion]);

    if (bootLoading) return <div className={styles.center}><ClipLoader></ClipLoader></div>;
    if (error) return <div className={styles.error}>⚠️ {error}</div>;

    const hasTrivia = !!active.trivia?.id;

    return (
        <div className={styles.page}>

            {!hasTrivia ? (
                <div className={styles.centerCard}>
                    <h2 className={styles.emptyTitle}>No hay una trivia activa</h2>
                    <p className={styles.muted}>
                        Cuando el admin active una trivia, aparecerá aquí automáticamente.
                    </p>
                </div>
            ) : (
                <section className={styles.stage}>
                    <h1 className={styles.brand}>DONCAPILLI</h1>
                    <Image src={Logo} width={100} height={100} alt='Doncapilli'></Image>
                    <div className={styles.panel}>
                        <div className={styles.headerRow}>
                            <h2 className={styles.qTitle}>PREGUNTA</h2>
                            <div className={styles.triviaName}>{active.trivia?.title}</div>
                        </div>

                        {qLoading || !activeQuestion ? (
                            <div className={styles.center}><ClipLoader></ClipLoader></div>
                        ) : (
                            <>
                                <p className={styles.statement}>
                                    {activeQuestion.statement ??
                                        activeQuestion.text ??
                                        activeQuestion.question ??
                                        activeQuestion.title}
                                </p>

                                <div className={styles.answersGrid}>
                                    {parseAnswers(activeQuestion.answers).map((a) => (
                                        <button key={a.label} className={styles.answerBtn} disabled>
                                            <span className={styles.badge}>{a.label}</span>
                                            <span className={styles.answerText}>{a.text}</span>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </section>
            )}
        </div>
    );
}
