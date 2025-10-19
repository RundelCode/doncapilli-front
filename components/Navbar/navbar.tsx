'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import styles from './navbar.module.css';

export default function Navbar() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/logout', {
        method: 'POST',
      });

      const data = await res.json();
      console.log('[LOGOUT] Respuesta del servidor:', data);

      if (res.ok) {
        router.replace('/login'); // redirige al login
      } else {
        alert(data?.message || 'Error al cerrar sesión');
      }
    } catch (err) {
      console.error('[LOGOUT] Error:', err);
      alert('Error de conexión al cerrar sesión');
    }
  };

  return (
    <div className={styles.navbar}>
      <h2>DONCAPILLI</h2>
      <div className={styles.options}>
        <div className={styles.section}>
          <p>Trivias</p>
          <a href="/quizzDashboard">Gestionar Trivias</a>
          <a href="">Nueva Trivia</a>
        </div>
        <div className={styles.section}>
          <p>Interacciones</p>
          <a href="">Ver Trivia Activa</a>
          <a href="">Resultados</a>
        </div>
      </div>
      <button className={styles.logout} onClick={handleLogout}>
        Cerrar Sesión
      </button>
    </div>
  );
}
