'use client';
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    console.log("[LOGIN] Enviando credenciales:", { email, password });

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      console.log("[LOGIN] Status:", res.status);

      const data = await res.json().catch(() => null);
      console.log("[LOGIN] Respuesta del servidor:", data);

      if (!res.ok) {
        let errorMsg = "Error al iniciar sesión";
        if (res.status === 400) errorMsg = "Faltan campos requeridos.";
        else if (res.status === 401) errorMsg = "Credenciales inválidas.";
        else if (res.status === 403) errorMsg = "No tienes permisos para acceder.";
        else if (res.status >= 500) errorMsg = "Error en el servidor. Intenta más tarde.";
        if (data?.message) errorMsg = data.message;
        setError(errorMsg);
        return;
      }

      router.replace("/quizzDashboard");
    } catch (err) {
      console.error("[LOGIN] Error en fetch:", err);
      setError("Error de conexión. Verifica tu servidor o tu red.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <h1>DONCAPILLI</h1>
      <div className={styles.card}>
        <h3>INICIO DE SESIÓN</h3>
        <p>Administración</p>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputContainer}>
            <p>Correo Electrónico</p>
            <input
              type="email"
              placeholder="Correo Electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className={styles.inputContainer}>
            <p>Contraseña</p>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p style={{ color: "red" }}>{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? "Cargando..." : "INICIA SESIÓN"}
          </button>
        </form>
      </div>
    </div>
  );
}
