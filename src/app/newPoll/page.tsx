'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './newpoll.module.css';
import { fetchJson } from '../../../lib/fetchJson';
import Navbar from '../../../components/Navbar/navbar';

const MAX_PARTICIPANTS = 100;

export default function NuevaVotacionPage() {
    const router = useRouter();

    const [title, setTitle] = useState('');
    const [name, setName] = useState('');
    const [participants, setParticipants] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function addParticipant() {
        const clean = name.trim();
        if (!clean) return;
        if (participants.some((p) => p.toLowerCase() === clean.toLowerCase())) {
            setError(`"${clean}" ya está en la lista.`);
            return;
        }
        if (participants.length >= MAX_PARTICIPANTS) {
            setError(`El máximo es ${MAX_PARTICIPANTS} participantes.`);
            return;
        }
        setError(null);
        setParticipants((prev) => [...prev, clean]);
        setName('');
    }

    function removeParticipant(index: number) {
        setParticipants((prev) => prev.filter((_, i) => i !== index));
    }

    async function handleSubmit() {
        setError(null);
        if (!title.trim()) { setError('Ponle un título a la votación.'); return; }
        if (participants.length < 2) { setError('Agrega al menos 2 participantes.'); return; }

        setSubmitting(true);
        try {
            await fetchJson('/api/polls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: title.trim(), participants }),
            });
            router.push('/pollDashboard');
        } catch (e: any) {
            setError(e?.message || 'No se pudo crear la votación.');
            setSubmitting(false);
        }
    }

    return (
        <div className={styles.page}>
            <Navbar />
            <section className={styles.card}>
                <h2 className={styles.title}>NUEVA VOTACIÓN</h2>

                <label className={styles.label}>Título</label>
                <input
                    className={styles.input}
                    placeholder="Ej. Premios Doncapilli"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />

                <label className={styles.label}>Participantes ({participants.length})</label>
                <div className={styles.addRow}>
                    <input
                        className={styles.input}
                        placeholder="Nombre del participante"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                addParticipant();
                            }
                        }}
                    />
                    <button type="button" className={styles.primary} onClick={addParticipant}>
                        Agregar
                    </button>
                </div>

                {participants.length > 0 && (
                    <ul className={styles.list}>
                        {participants.map((p, i) => (
                            <li key={`${p}-${i}`} className={styles.item}>
                                <span>{p}</span>
                                <button
                                    type="button"
                                    className={styles.remove}
                                    onClick={() => removeParticipant(i)}
                                    aria-label={`Quitar a ${p}`}
                                >
                                    Quitar
                                </button>
                            </li>
                        ))}
                    </ul>
                )}

                {error && <p className={styles.error}>{error}</p>}

                <button className={styles.primaryXL} onClick={handleSubmit} disabled={submitting}>
                    {submitting ? 'Creando…' : 'Crear votación'}
                </button>
            </section>
        </div>
    );
}
