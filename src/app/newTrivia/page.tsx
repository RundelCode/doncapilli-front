'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './newtrivia.module.css';
import { fetchJson } from '../../../lib/fetchJson';
import Navbar from '../../../components/Navbar/navbar';

type DraftQuestion = {
    id: string;
    statement: string;
    A: string;
    B: string;
    C: string;
    D: string;
    correct: 'A' | 'B' | 'C' | 'D' | '';
};

export default function NuevaTriviaPage() {
    const router = useRouter();

    const [title, setTitle] = useState('');
    const [qStatement, setQStatement] = useState('');
    const [optA, setOptA] = useState('');
    const [optB, setOptB] = useState('');
    const [optC, setOptC] = useState('');
    const [optD, setOptD] = useState('');
    const [correct, setCorrect] = useState<'' | 'A' | 'B' | 'C' | 'D'>('');

    const [questions, setQuestions] = useState<DraftQuestion[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [okMessage, setOkMessage] = useState<string | null>(null);

    const canAddQuestion = useMemo(() => {
        return (
            qStatement.trim() &&
            optA.trim() && optB.trim() && optC.trim() && optD.trim() &&
            !!correct
        );
    }, [qStatement, optA, optB, optC, optD, correct]);

    function addQuestion() {
        if (!canAddQuestion) return;
        setQuestions(prev => [...prev, {
            id: crypto.randomUUID(),
            statement: qStatement.trim(),
            A: optA.trim(), B: optB.trim(), C: optC.trim(), D: optD.trim(),
            correct
        }]);
        setQStatement(''); setOptA(''); setOptB(''); setOptC(''); setOptD(''); setCorrect('');
    }

    function removeQuestion(id: string) {
        setQuestions(prev => prev.filter(q => q.id !== id));
    }

    async function handleSubmit() {
        setError(null);
        setOkMessage(null);

        if (!title.trim()) { setError('Ponle un título a la trivia.'); return; }
        if (!questions.length) { setError('Agrega al menos una pregunta.'); return; }

        setSubmitting(true);
        try {
            // 1) Crear la trivia (el back deduce el admin desde el token)
            const created = await fetchJson<any>('/api/quizzes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: title.trim(), status: 'inactive' }),
            });

            const quizId = created?.id || created?.quiz?.id;
            if (!quizId) throw new Error('No recibí el id de la trivia creada.');

            // 2) Crear preguntas
            for (const q of questions) {
                const answers = [`A) ${q.A}`, `B) ${q.B}`, `C) ${q.C}`, `D) ${q.D}`];
                await fetchJson('/api/questions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        question: q.statement,
                        answers,
                        correctAnswer: q.correct,
                        quizId,
                    }),
                });
            }

            setOkMessage('🎉 Trivia creada correctamente.');
            setTitle(''); setQuestions([]);
            setQStatement(''); setOptA(''); setOptB(''); setOptC(''); setOptD(''); setCorrect('');
            // router.push('/quizzDashboard');
        } catch (e: any) {
            setError(e?.message || 'No se pudo crear la trivia.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className={styles.page}>
            <Navbar />
            <section className={styles.card}>
                <h2 className={styles.title}>NUEVA TRIVIA</h2>

                <label className={styles.label}>Título</label>
                <input
                    className={styles.input}
                    placeholder="Título"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />

                <div className={styles.blockHeader}>
                    <h3 className={styles.subtitle}>PREGUNTAS</h3>
                </div>

                <input
                    className={styles.input}
                    placeholder="Ingresa la pregunta"
                    value={qStatement}
                    onChange={(e) => setQStatement(e.target.value)}
                />

                <div className={styles.answersGrid}>
                    <div className={styles.answerRow}>
                        <div className={styles.answerBadge}>A</div>
                        <input className={styles.input} placeholder="Ingresa una respuesta" value={optA} onChange={(e) => setOptA(e.target.value)} />
                    </div>
                    <div className={styles.answerRow}>
                        <div className={styles.answerBadge}>B</div>
                        <input className={styles.input} placeholder="Ingresa una respuesta" value={optB} onChange={(e) => setOptB(e.target.value)} />
                    </div>
                    <div className={styles.answerRow}>
                        <div className={styles.answerBadge}>C</div>
                        <input className={styles.input} placeholder="Ingresa una respuesta" value={optC} onChange={(e) => setOptC(e.target.value)} />
                    </div>
                    <div className={styles.answerRow}>
                        <div className={styles.answerBadge}>D</div>
                        <input className={styles.input} placeholder="Ingresa una respuesta" value={optD} onChange={(e) => setOptD(e.target.value)} />
                    </div>
                </div>

                <div className={styles.inlineControls}>
                    <div className={styles.selectWrap}>
                        <label className={styles.labelInline}>¿Cuál es la correcta?</label>
                        <select className={styles.select} value={correct} onChange={(e) => setCorrect(e.target.value as any)}>
                            <option value="">Elegir correcta</option>
                            <option value="A">A</option><option value="B">B</option>
                            <option value="C">C</option><option value="D">D</option>
                        </select>
                    </div>
                    <button className={styles.primary} onClick={addQuestion} disabled={!canAddQuestion}>
                        Agregar
                    </button>
                </div>

                <div className={styles.listBlock}>
                    <div className={styles.listHeader}>
                        <h4 className={styles.listTitle}>Preguntas agregadas</h4>
                        {!!questions.length && <span className={styles.badge}>{questions.length}</span>}
                    </div>
                    {!questions.length ? (
                        <p className={styles.muted}>Aún no agregaste preguntas.</p>
                    ) : (
                        <ul className={styles.qList}>
                            {questions.map((q, idx) => (
                                <li key={q.id} className={styles.qItem}>
                                    <div className={styles.qTop}>
                                        <span className={styles.qIndex}>Pregunta {idx + 1}:</span>
                                        <button className={styles.smallDanger} onClick={() => removeQuestion(q.id)} title="Eliminar">✕</button>
                                    </div>
                                    <div className={styles.qStatement}>{q.statement}</div>
                                    <div className={styles.qAnswers}>
                                        <div><strong>A)</strong> {q.A}</div>
                                        <div><strong>B)</strong> {q.B}</div>
                                        <div><strong>C)</strong> {q.C}</div>
                                        <div><strong>D)</strong> {q.D}</div>
                                        <div className={styles.correctLine}>Correcta: <strong>{q.correct}</strong></div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {error && <div className={styles.error}>⚠️ {error}</div>}
                {okMessage && <div className={styles.success}>{okMessage}</div>}

                <button
                    className={styles.primaryXL}
                    onClick={handleSubmit}
                    disabled={submitting || !title.trim() || !questions.length}
                >
                    {submitting ? 'Creando…' : 'Crear trivia'}
                </button>
            </section>
        </div>
    );
}
