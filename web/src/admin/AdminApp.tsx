import { useEffect, useState } from "react";
import { api } from "../api";
import { Login } from "./Login";
import { Dashboard } from "./Dashboard";

export function AdminApp() {
  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    api
      .get<{ authenticated: boolean; email?: string }>("/api/auth/me")
      .then((data) => setEmail(data.authenticated ? data.email || null : null))
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return <div className="state-loading">Cargando panel…</div>;
  }

  if (!email) {
    return <Login onSuccess={setEmail} />;
  }

  return <Dashboard email={email} onLogout={() => setEmail(null)} />;
}
