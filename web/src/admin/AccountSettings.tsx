import { useState, type FormEvent } from "react";
import { api, ApiError } from "../api";

export function AccountSettings({ email }: { email: string }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "La confirmación no coincide con la nueva contraseña." });
      return;
    }
    setSaving(true);
    try {
      await api.post("/api/auth/change-password", { currentPassword, newPassword });
      setMessage({ type: "success", text: "Contraseña actualizada correctamente." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setMessage({ type: "error", text: err instanceof ApiError ? err.message : "No se pudo cambiar la contraseña." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-panel__body">
      <p>Sesión activa: {email}</p>
      <form onSubmit={handleSubmit} className="account-form">
        <div className="field">
          <label htmlFor="current-password">Contraseña actual</label>
          <input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="new-password">Nueva contraseña (mínimo 10 caracteres)</label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={10}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="confirm-password">Confirmar nueva contraseña</label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={10}
            required
          />
        </div>
        <button className="btn btn--primary" type="submit" disabled={saving}>
          {saving ? "Guardando…" : "Cambiar contraseña"}
        </button>
        {message && (
          <p className={message.type === "success" ? "contact__feedback--success" : "contact__feedback--error"}>
            {message.text}
          </p>
        )}
      </form>
    </div>
  );
}
