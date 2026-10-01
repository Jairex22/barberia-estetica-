using UnityEngine;

namespace FactoryVisitorSafety
{
    /// <summary>
    /// Puntuación educativa sencilla (documentada en README_ES.md):
    ///   Por situación:
    ///     - Resuelta con la decisión adecuada del visitante: max(25, 100 - 25 * errores).
    ///     - Continuada tras error (el guía aplicó la resolución segura): 0.
    ///     - No iniciada o en curso: 0.
    ///   Total = promedio de las 6 situaciones (0-100).
    /// Reintentos, reportes y peligros identificados se informan por separado y no alteran la cifra.
    /// No representa una probabilidad real de accidente.
    /// </summary>
    public static class ScoreCalculator
    {
        public const int PointsPerScenario = 100;
        public const int PenaltyPerError = 25;
        public const int MinimumWhenResolved = 25;

        public static int ScenarioScore(ScenarioRecord record)
        {
            if (record == null || record.status != ScenarioStatus.Resolved)
                return 0;
            return Mathf.Max(MinimumWhenResolved, PointsPerScenario - PenaltyPerError * record.errores);
        }

        public static int TotalScore(SessionReport report)
        {
            if (report == null || report.situaciones.Count == 0)
                return 0;
            var sum = 0;
            foreach (var s in report.situaciones)
                sum += ScenarioScore(s);
            // Redondeo convencional: .5 sube al siguiente entero.
            return Mathf.FloorToInt(sum / (float)report.situaciones.Count + 0.5f);
        }
    }
}
