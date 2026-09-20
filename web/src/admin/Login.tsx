import { useState, type FormEvent } from "react";
import { api, ApiError, setCsrfToken } from "../api";

export function Login({ onSuccess }: { onSuccess: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<{ email: string; csrfToken: string }>(
        "/api/auth/login",
        { email, password },
        false
      );
      setCsrfToken(res.csrfToken);
      onSuccess(res.email);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login">
      <form className="card admin-login__card" onSubmit={handleSubmit}>
        <h1>ClickFlow Digital</h1>
        <p>Panel de administración</p>
        <div className="field">
          <label htmlFor="login-email">Correo</label>
          <input
            id="login-email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="login-password">Contraseña</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button className="btn btn--primary" type="submit" disabled={loading}>
          {loading ? "Ingresando…" : "Iniciar sesión"}
        </button>
        {error && <p className="contact__feedback--error" role="alert">{error}</p>}
      </form>
    </div>
  );
}
