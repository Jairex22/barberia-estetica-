namespace FactoryVisitorSafety
{
    /// <summary>
    /// Textos fijos de la interfaz. Los mensajes educativos de cada situación están en
    /// Resources/Content/contenido_es.json; aquí solo hay etiquetas de botones y avisos técnicos.
    /// </summary>
    public static class UIText
    {
        public const string AppTitle = "Factory Visitor Safety VR";
        public const string AppSubtitle = "Recorrido educativo para visitantes en una fábrica ficticia de ensamble electrónico";
        public const string Version = "Versión 1.0.0";

        public const string ModeHeader = "Modo educativo";
        public const string PlatformHeader = "Forma de uso";
        public const string ModeNoInductionDesc = "Instrucciones deliberadamente incompletas. Observa tus decisiones y sus consecuencias.";
        public const string ModeTrainedDesc = "Inducción breve, instrucciones claras y orientación del guía antes de cada punto crítico.";
        public const string Start = "Comenzar recorrido";
        public const string Settings = "Ajustes";
        public const string Quit = "Salir";
        public const string Resume = "Reanudar";
        public const string Restart = "Reiniciar recorrido";
        public const string BackToMenu = "Volver al menú";
        public const string Close = "Cerrar";
        public const string Back = "Volver";
        public const string Next = "Siguiente";
        public const string BeginTour = "Iniciar recorrido";
        public const string RepeatScenario = "Repetir situación";
        public const string ContinueTour = "Continuar recorrido";
        public const string Continue = "Continuar";
        public const string DecideLater = "Cerrar y decidir después";
        public const string SaveReport = "Guardar reporte (JSON y CSV)";
        public const string OpenReportFolder = "Abrir carpeta de reportes";
        public const string PlayAgain = "Repetir recorrido";

        public const string PauseTitle = "Pausa";
        public const string SettingsTitle = "Ajustes de comodidad y accesibilidad";
        public const string ResultsTitle = "Resultados del recorrido";
        public const string InductionTitle = "Inducción breve para visitantes";

        public const string DesktopControls =
            "Escritorio: WASD para desplazarte · Ratón para mirar · E para interactuar · Escape para el menú · 1-4 para elegir opciones";
        public const string VrControls =
            "VR: stick hacia adelante y soltar = teletransporte · stick izquierda/derecha = giro por incrementos · gatillo = interactuar/pulsar · botón Menú o B/Y = pausa";

        public const string MenuVrNote =
            "Para VR: conecta el visor, inicia tu runtime OpenXR (por ejemplo, el software del fabricante) y elige \"Realidad virtual\". Si no se detecta un visor, el recorrido continúa en escritorio.";

        public const string XrNotConfigured =
            "OpenXR no está configurado en este proyecto (XR Plug-in Management). Ejecuta \"Factory Safety > 1. Configurar proyecto\" o revisa README_ES.md. Puedes usar el modo de escritorio.";
        public const string XrNoHeadset =
            "No se pudo iniciar OpenXR: no se detectó un visor o runtime activo. Puedes continuar en modo de escritorio.";
        public const string XrStarting = "Iniciando OpenXR... colócate el visor.";

        public const string ScoreExplanation =
            "Puntuación educativa (0-100): promedio de las 6 situaciones. Cada situación resuelta con la decisión adecuada vale 100 menos 25 por cada error registrado (mínimo 25). Si el guía tuvo que resolverla tras \"Continuar\", vale 0. Es una referencia para la discusión educativa: no mide la probabilidad real de un accidente.";

        public const string ComparisonNote =
            "La comparación solo refleja las decisiones registradas en las sesiones de esta ejecución. No representa estadísticas reales de prevención.";

        public const string QualityNotInjury = "CALIDAD — problema de calidad del producto, no un riesgo de lesión";
        public const string SafetyRisk = "SEGURIDAD — riesgo para las personas";

        public const string Disclaimer =
            "Demostración educativa adaptable a los procedimientos de cada planta. No certifica capacitación ni cumplimiento normativo. Fábrica, personas y marcas ficticias.";

        public static string Interact(bool vr, string prompt)
        {
            return (vr ? "[Gatillo] " : "[E] ") + prompt;
        }
    }
}
