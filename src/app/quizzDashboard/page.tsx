'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import styles from './dashboard.module.css';
import Navbar from '../../../components/Navbar/navbar';
import { fetchJson } from '../../../lib/fetchJson';
import { ActiveTriviaPayload, Question, Trivia } from '../../../types/trivia';

type ParsedAnswer = {
  label: string;
  text: string;
  isCorrect: boolean;
};

export default function GestionTriviasPage() {
  const router = useRouter();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [active, setActive] = React.useState<ActiveTriviaPayload | null>(null);
  const [inactive, setInactive] = React.useState<Trivia[]>([]);
  const [activateCode, setActivateCode] = React.useState('');

  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [qLoading, setQLoading] = React.useState(false);

  // ========= Loaders =========
  async function loadState() {
    setLoading(true);
    setError(null);
    try {
      const [a, i] = await Promise.all([
        fetchJson<ActiveTriviaPayload>('/api/quizzes/active'),
        fetchJson<{ trivias: Trivia[] }>('/api/quizzes/inactive'),
      ]);

      const normalizedActive: ActiveTriviaPayload =
        a && typeof a === 'object'
          ? { trivia: a.trivia ?? null, activeQuestionId: a.activeQuestionId ?? null }
          : { trivia: null, activeQuestionId: null };

      setActive(normalizedActive);
      setInactive(i?.trivias ?? []);
    } catch (e: any) {
      setError(e?.message || 'Error cargando estado');
    } finally {
      setLoading(false);
    }
  }

  async function loadQuestions(triviaId: string) {
    setQLoading(true);
    try {
      const r = await fetchJson<{ questions: any[]; activeQuestionId?: string | null }>(
        `/api/quizzes/${triviaId}/questions`
      );
      setQuestions((r?.questions ?? []) as Question[]);
      setActive(prev => (prev ? { ...prev, activeQuestionId: r?.activeQuestionId ?? null } : prev));
    } catch (e: any) {
      setError(e?.message || 'Error cargando preguntas');
    } finally {
      setQLoading(false);
    }
  }

  // ========= Actions =========
  async function activateByCode() {
    setError(null);
    if (!activateCode.trim()) {
      setError('Ingresa un código de trivia');
      return;
    }
    try {
      await fetchJson('/api/quizzes/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: activateCode.trim() }),
      });
      setActivateCode('');
      await loadState();
      const id = active?.trivia?.id;
      if (id) await loadQuestions(id);
    } catch (e: any) {
      setError(e?.message || 'No se pudo activar la trivia');
    }
  }

  async function activateById(triviaId: string) {
    setError(null);
    try {
      await fetchJson('/api/quizzes/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triviaId }),
      });
      await loadState();
      // Si justo quedó activa la que seleccionamos, cargar preguntas
      await loadQuestions(triviaId);
    } catch (e: any) {
      setError(e?.message || 'No se pudo activar la trivia');
    }
  }

  async function setActiveQuestion(questionId: string) {
    if (!active?.trivia?.id) return;
    try {
      const r = await fetchJson<{ ok: boolean; activeQuestionId?: string }>(
        `/api/quizzes/${active.trivia.id}/active-question`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionId }),
        }
      );
      setActive(prev =>
        prev ? { ...prev, activeQuestionId: r?.activeQuestionId ?? questionId } : prev
      );
    } catch (e: any) {
      setError(e?.message || 'No se pudo marcar la pregunta activa');
    }
  }

  async function deactivateTrivia() {
    if (!active?.trivia?.id) {
      setError('ID de trivia inválido (frontend)');
      return;
    }
    try {
      await fetchJson(`/api/quizzes/${active.trivia.id}/deactivate`, { method: 'PATCH' });
      setActive(null);
      setQuestions([]);
      await loadState();
      const newActive = await fetchJson<ActiveTriviaPayload>('/api/quizzes/active');
      setActive(newActive ?? { trivia: null, activeQuestionId: null });
      if (newActive?.trivia?.id) await loadQuestions(newActive.trivia.id);
    } catch (e: any) {
      setError(e?.message || 'No se pudo desactivar la trivia');
    }
  }

  // ========= Effects =========
  React.useEffect(() => {
    loadState();
  }, []);
  React.useEffect(() => {
    if (active?.trivia?.id) loadQuestions(active.trivia.id);
  }, [active?.trivia?.id]);

  const hasActive = !!active?.trivia?.id;

  // ========= Ordenar: activa primero =========
  const sortedQuestions = React.useMemo(() => {
    if (!questions?.length) return [];
    const activeId = active?.activeQuestionId;
    if (!activeId) return questions;
    const idx = questions.findIndex(q => q.id === activeId);
    if (idx <= 0) return questions;
    return [questions[idx], ...questions.slice(0, idx), ...questions.slice(idx + 1)];
  }, [questions, active?.activeQuestionId]);

  // ========= UI =========
  if (loading) return <div className={styles.center}>Cargando…</div>;
  if (error) return <div className={styles.error}>⚠️ {error}</div>;

  return (
    <div className={styles.page}>
      <Navbar />

      {!hasActive ? (
        <section className={styles.card}>
          <h2 className={styles.title}>GESTIONAR TRIVIAS</h2>
          <h3 className={styles.subtitle}>TRIVIA ACTIVA</h3>
          <p className={styles.muted}>
            No hay una trivia activa en este momento,selecciona una:
          </p>

          <div className={styles.listBlock}>
            <h4 className={styles.listTitle}>Trivias disponibles</h4>
            {inactive?.length ? (
              <ul className={styles.list}>
                {inactive.map((t) => (
                  <li key={t.id} className={styles.listItem}>
                    <div>
                      <div className={styles.triviaTitle}>{t.title}</div>
                      { (t as any).code && <div className={styles.triviaMeta}>Código: {(t as any).code}</div> }
                    </div>
                    <button className={styles.secondary} onClick={() => activateById(t.id)}>
                      Activar
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.muted}>No hay trivias inactivas.</p>
            )}
          </div>
        </section>
      ) : (
        <section className={styles.cardWide}>
          <h2 className={styles.title}>GESTIONAR TRIVIAS</h2>
          <h3 className={styles.subtitle}>TRIVIA ACTIVA</h3>
          <h4 className={styles.activeTitle}>{active?.trivia?.title}</h4>

          {qLoading ? (
            <div className={styles.center}>Cargando preguntas…</div>
          ) : (
            <div className={styles.questions}>
              {sortedQuestions.map((q: any, idx: number) => {
                const isActive = active?.activeQuestionId === q.id;
                const statement = q.statement ?? q.text ?? q.question ?? q.title ?? '(Sin enunciado)';

                const parsedAnswers: ParsedAnswer[] = Array.isArray(q.answers)
                  ? (q.answers as string[]).map((s: string) => {
                      // A) Texto  |  A. Texto
                      const m = s.match(/^\s*([A-Za-z])[\)\.]\s*(.*)$/);
                      const label = (m?.[1] || '').toUpperCase();
                      const text  = (m?.[2] || s).trim();
                      const isCorrect = (q.correctAnswer || '').toUpperCase() === label;
                      return { label, text, isCorrect };
                    })
                  : [];

                return (
                  <div key={q.id ?? idx} className={styles.questionCard}>
                    <div className={styles.qHeader}>
                      <span className={styles.qIndex}>Pregunta {idx + 1}:</span>
                      {isActive && <span className={styles.badge}>Activa</span>}
                    </div>

                    <div className={styles.qStatement}>{statement}</div>

                    <div className={styles.answers}>
                      <div className={styles.answersLabel}>Respuestas:</div>
                      <ul className={styles.answersList}>
                        {parsedAnswers.length ? (
                          parsedAnswers.map((a: ParsedAnswer) => (
                            <li key={`${q.id}-${a.label}`}>
                              <span className={`${styles.answerLine} ${a.isCorrect ? styles.correct : styles.incorrect}`}>
                                <strong>{a.label})</strong> {a.text}
                              </span>
                            </li>
                          ))
                        ) : (
                          <li className={styles.muted}>Sin respuestas registradas</li>
                        )}
                      </ul>
                    </div>

                    <button
                      className={styles.primary}
                      disabled={isActive}
                      onClick={() => setActiveQuestion(q.id)}
                    >
                      Pregunta activa
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <button
            className={styles.danger}
            onClick={deactivateTrivia}
            disabled={!active?.trivia?.id}
          >
            Desactivar trivia
          </button>
        </section>
      )}
    </div>
  );
}
