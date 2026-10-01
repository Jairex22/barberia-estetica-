using System.Collections.Generic;
using UnityEngine;

namespace FactoryVisitorSafety
{
    /// <summary>Resumen corto de una sesión para comparar visitas dentro de la misma ejecución.</summary>
    public class SessionSummary
    {
        public string sessionId;
        public VisitMode mode;
        public InputPlatform platform;
        public bool completed;
        public int score;
        public int errors;
        public int retries;
        public int reports;
        public int safetyHazards;
        public int qualityIssues;
        public int resolved;
        public float durationSeconds;
    }

    /// <summary>
    /// Estado estático que sobrevive a la recarga de la escena: se usa para reiniciar el recorrido
    /// con la misma configuración y para comparar sesiones de esta ejecución.
    /// No guarda datos de la sesión en curso: cada recarga crea un registro nuevo y vacío.
    /// </summary>
    public static class LaunchState
    {
        public static bool AutoStart;
        public static VisitMode Mode = VisitMode.Trained;
        public static InputPlatform Platform = InputPlatform.Desktop;
        public static readonly List<SessionSummary> History = new List<SessionSummary>();

        // Garantiza un estado limpio aunque el editor tenga desactivada la recarga de dominio.
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]
        static void ResetStatics()
        {
            AutoStart = false;
            Mode = VisitMode.Trained;
            Platform = InputPlatform.Desktop;
            History.Clear();
        }
    }
}
