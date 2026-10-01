using System;
using System.Collections.Generic;

namespace FactoryVisitorSafety
{
    // Estructura exportada a JSON. Los nombres de campo en español aparecen tal cual en el archivo.

    [Serializable]
    public class LogEntry
    {
        public float segundo;
        public string situacion;
        public string tipo;
        public string codigo;
        public string descripcion;
        public bool adecuada;
    }

    [Serializable]
    public class ScenarioRecord
    {
        public string id;
        public string titulo;
        public string categoria;
        public string estado;
        public int errores;
        public int reintentos;
        public int decisiones;
        public bool peligroIdentificado;
        public bool reportado;
        public float segundosEnSituacion;
        public int puntuacion;
        public List<string> decisionesTomadas = new List<string>();

        [NonSerialized] public ScenarioStatus status;
        [NonSerialized] public HazardCategory category;
        [NonSerialized] public float startedAt = -1f;
    }

    [Serializable]
    public class SessionReport
    {
        public string aplicacion = "Factory Visitor Safety VR";
        public string versionAplicacion = "1.0.0";
        public string aviso;
        public string idSesion;
        public string modoVisita;
        public string plataforma;
        public string inicioLocal;
        public string finLocal;
        public float duracionSegundos;
        public bool recorridoCompleto;
        public int situacionesCompletadas;
        public int situacionesResueltasAdecuadamente;
        public int peligrosSeguridadIdentificados;
        public int problemasCalidadIdentificados;
        public int reportesRealizados;
        public int decisionesTomadas;
        public int errores;
        public int reintentos;
        public int puntuacionEducativa;
        public string comoSeCalculaLaPuntuacion;
        public List<ScenarioRecord> situaciones = new List<ScenarioRecord>();
        public List<LogEntry> eventos = new List<LogEntry>();

        [NonSerialized] public VisitMode mode;
        [NonSerialized] public InputPlatform platform;
    }
}
