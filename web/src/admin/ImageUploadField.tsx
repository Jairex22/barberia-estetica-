import { useState } from "react";
import { api, ApiError } from "../api";

export function ImageUploadField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const res = await api.upload("/api/admin/uploads", file);
      onChange(res.url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo subir la imagen.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="field">
      <label>{label}</label>
      <div className="image-field">
        {value && <img src={value} alt="" className="image-field__preview" />}
        <div className="image-field__controls">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="/media/... o URL de imagen"
          />
          <label className="btn btn--secondary btn--sm image-field__upload">
            {uploading ? "Subiendo…" : "Subir imagen"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </label>
        </div>
        {error && <p className="field-error">{error}</p>}
      </div>
    </div>
  );
}
