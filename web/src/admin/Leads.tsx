import { useEffect, useState } from "react";
import { api } from "../api";

interface Lead {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  service: string | null;
  message: string;
  status: "nuevo" | "seguimiento" | "atendido";
  source: string;
  created_at: string;
}

const STATUS_LABEL: Record<Lead["status"], string> = {
  nuevo: "Nuevo",
  seguimiento: "En seguimiento",
  atendido: "Atendido",
};

export function Leads() {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [filter, setFilter] = useState<"" | Lead["status"]>("");

  function load() {
    const qs = filter ? `?status=${filter}` : "";
    api.get<Lead[]>(`/api/admin/leads${qs}`).then(setLeads);
  }

  useEffect(load, [filter]);

  async function updateStatus(id: number, status: Lead["status"]) {
    await api.patch(`/api/admin/leads/${id}`, { status });
    load();
  }

  return (
    <div>
      <div className="content-editor__toolbar">
        <label>
          Filtrar por estado:{" "}
          <select value={filter} onChange={(e) => setFilter(e.target.value as any)}>
            <option value="">Todos</option>
            <option value="nuevo">Nuevo</option>
            <option value="seguimiento">En seguimiento</option>
            <option value="atendido">Atendido</option>
          </select>
        </label>
      </div>

      {leads === null && <p className="state-loading">Cargando…</p>}
      {leads !== null && leads.length === 0 && <p className="state-empty">No hay solicitudes.</p>}

      <div className="table-wrap">
        {leads !== null && leads.length > 0 && (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Nombre</th>
                <th>Contacto</th>
                <th>Servicio</th>
                <th>Mensaje</th>
                <th>Origen</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id}>
                  <td>{new Date(l.created_at + "Z").toLocaleString("es-MX")}</td>
                  <td>{l.name}</td>
                  <td>
                    {l.phone}
                    {l.email ? ` / ${l.email}` : ""}
                  </td>
                  <td>{l.service || "—"}</td>
                  <td className="admin-table__message">{l.message}</td>
                  <td>{l.source}</td>
                  <td>
                    <select value={l.status} onChange={(e) => updateStatus(l.id, e.target.value as Lead["status"])}>
                      {Object.entries(STATUS_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
