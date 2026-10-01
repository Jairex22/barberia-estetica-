using System;
using System.Collections.Generic;
using UnityEngine;

namespace FactoryVisitorSafety
{
    /// <summary>
    /// Registra decisiones, errores, reportes, peligros, reintentos y tiempos de una sesión.
    /// Los métodos que cuentan "peligros" y "reportes" son idempotentes por situación para que
    /// permanecer o volver a una zona no sume dos veces el mismo hallazgo.
    /// </summary>
    public class SessionRecorder : MonoBehaviour
    {
        public SessionReport Report { get; private set; }
        public bool HasSession => Report != null;

        float m_StartRealtime;
        readonly HashSet<string> m_ReportKeys = new HashSet<string>();

        public float Elapsed => Report == null ? 0f : Time.realtimeSinceStartup - m_StartRealtime;

        public void BeginSession(VisitMode mode, InputPlatform platform, IList<ScenarioBase> scenarios)
        {
            m_ReportKeys.Clear();
            m_StartRealtime = Time.realtimeSinceStartup;
            Report = new SessionReport
            {
                aviso = UIText.Disclaimer,
                idSesion = DateTime.Now.ToString("yyyyMMdd-HHmmss") + "-" + UnityEngine.Random.Range(1000, 9999),
                modoVisita = EnumText.ModeName(mode),
                plataforma = EnumText.PlatformName(platform),
                inicioLocal = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                comoSeCalculaLaPuntuacion = UIText.ScoreExplanation,
                mode = mode,
                platform = platform
            };
            foreach (var sc in scenarios)
            {
                Report.situaciones.Add(new ScenarioRecord
                {
                    id = sc.ScenarioId,
                    titulo = sc.Content.titulo,
                    categoria = EnumText.CategoryName(sc.Category),
                    category = sc.Category,
                    status = ScenarioStatus.NotStarted,
                    estado = EnumText.StatusName(ScenarioStatus.NotStarted)
                });
            }
            Log("-", "Sesion", "inicio", "Inicio del recorrido: " + EnumText.ModeName(mode) + " / " + EnumText.PlatformName(platform), true);
        }

        public ScenarioRecord Record(string scenarioId)
        {
            if (Report == null)
                return null;
            foreach (var r in Report.situaciones)
            {
                if (r.id == scenarioId)
                    return r;
            }
            return null;
        }

        void Log(string scenarioId, string type, string code, string description, bool adequate)
        {
            if (Report == null)
                return;
            Report.eventos.Add(new LogEntry
            {
                segundo = Mathf.Round(Elapsed * 10f) / 10f,
                situacion = scenarioId,
                tipo = type,
                codigo = code,
                descripcion = description,
                adecuada = adequate
            });
        }

        public void ScenarioStarted(string scenarioId)
        {
            var r = Record(scenarioId);
            if (r == null || r.status != ScenarioStatus.NotStarted)
                return;
            r.status = ScenarioStatus.InProgress;
            r.estado = EnumText.StatusName(r.status);
            r.startedAt = Elapsed;
            Log(scenarioId, "Inicio", "inicio", "Comienza la situación: " + r.titulo, true);
        }

        public void Decision(string scenarioId, string code, string description, bool adequate)
        {
            var r = Record(scenarioId);
            if (r == null)
                return;
            r.decisiones++;
            r.decisionesTomadas.Add((adequate ? "[Adecuada] " : "[Inadecuada] ") + description);
            Log(scenarioId, "Decision", code, description, adequate);
        }

        public void Error(string scenarioId, string code, string description)
        {
            var r = Record(scenarioId);
            if (r == null)
                return;
            r.errores++;
            Log(scenarioId, "Error", code, description, false);
        }

        /// <summary>Marca un peligro (o problema de calidad) como identificado. Solo cuenta una vez por situación.</summary>
        public void HazardIdentified(string scenarioId, string description)
        {
            var r = Record(scenarioId);
            if (r == null || r.peligroIdentificado)
                return;
            r.peligroIdentificado = true;
            Log(scenarioId, r.category == HazardCategory.Quality ? "ProblemaCalidad" : "Peligro", "identificado", description, true);
        }

        /// <summary>Registra un reporte. El mismo código en la misma situación cuenta una sola vez.</summary>
        public void ReportMade(string scenarioId, string code, string description)
        {
            var r = Record(scenarioId);
            if (r == null)
                return;
            if (!m_ReportKeys.Add(scenarioId + "/" + code))
                return;
            r.reportado = true;
            Log(scenarioId, "Reporte", code, description, true);
        }

        public void Retry(string scenarioId)
        {
            var r = Record(scenarioId);
            if (r == null)
                return;
            r.reintentos++;
            Log(scenarioId, "Reintento", "repetir", "El visitante repite la situación.", true);
        }

        public void Info(string scenarioId, string code, string description)
        {
            Log(scenarioId, "Info", code, description, true);
        }

        public void ScenarioCompleted(string scenarioId, ScenarioStatus status)
        {
            var r = Record(scenarioId);
            if (r == null)
                return;
            if (r.status == ScenarioStatus.Resolved || r.status == ScenarioStatus.ContinuedAfterError)
                return;
            r.status = status;
            r.estado = EnumText.StatusName(status);
            if (r.startedAt >= 0f)
                r.segundosEnSituacion = Mathf.Round((Elapsed - r.startedAt) * 10f) / 10f;
            r.puntuacion = ScoreCalculator.ScenarioScore(r);
            Log(scenarioId, "Fin", status == ScenarioStatus.Resolved ? "resuelta" : "continuada", r.estado, status == ScenarioStatus.Resolved);
        }

        public void EndSession(bool completed)
        {
            if (Report == null)
                return;
            var rep = Report;
            rep.recorridoCompleto = completed;
            rep.finLocal = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
            rep.duracionSegundos = Mathf.Round(Elapsed * 10f) / 10f;
            rep.situacionesCompletadas = 0;
            rep.situacionesResueltasAdecuadamente = 0;
            rep.peligrosSeguridadIdentificados = 0;
            rep.problemasCalidadIdentificados = 0;
            rep.reportesRealizados = 0;
            rep.decisionesTomadas = 0;
            rep.errores = 0;
            rep.reintentos = 0;
            foreach (var r in rep.situaciones)
            {
                if (r.status == ScenarioStatus.Resolved || r.status == ScenarioStatus.ContinuedAfterError)
                    rep.situacionesCompletadas++;
                if (r.status == ScenarioStatus.Resolved)
                    rep.situacionesResueltasAdecuadamente++;
                if (r.peligroIdentificado)
                {
                    if (r.category == HazardCategory.Quality)
                        rep.problemasCalidadIdentificados++;
                    else
                        rep.peligrosSeguridadIdentificados++;
                }
                rep.decisionesTomadas += r.decisiones;
                rep.errores += r.errores;
                rep.reintentos += r.reintentos;
                r.puntuacion = ScoreCalculator.ScenarioScore(r);
            }
            rep.reportesRealizados = m_ReportKeys.Count;
            rep.puntuacionEducativa = ScoreCalculator.TotalScore(rep);
            Log("-", "Sesion", "fin", completed ? "Recorrido completo." : "Recorrido finalizado antes de completar todas las situaciones.", completed);
        }

        public SessionSummary Summary()
        {
            if (Report == null)
                return null;
            return new SessionSummary
            {
                sessionId = Report.idSesion,
                mode = Report.mode,
                platform = Report.platform,
                completed = Report.recorridoCompleto,
                score = Report.puntuacionEducativa,
                errors = Report.errores,
                retries = Report.reintentos,
                reports = Report.reportesRealizados,
                safetyHazards = Report.peligrosSeguridadIdentificados,
                qualityIssues = Report.problemasCalidadIdentificados,
                resolved = Report.situacionesResueltasAdecuadamente,
                durationSeconds = Report.duracionSegundos
            };
        }
    }
}
