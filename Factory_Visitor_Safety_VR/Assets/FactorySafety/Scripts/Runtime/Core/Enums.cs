namespace FactoryVisitorSafety
{
    /// <summary>Modo educativo de la visita. Ambos usan las mismas situaciones y la misma evaluación.</summary>
    public enum VisitMode
    {
        NoInduction = 0,
        Trained = 1
    }

    /// <summary>Plataforma de control seleccionada en el menú.</summary>
    public enum InputPlatform
    {
        Desktop = 0,
        VirtualReality = 1
    }

    /// <summary>Estado de una situación dentro de la sesión.</summary>
    public enum ScenarioStatus
    {
        NotStarted = 0,
        InProgress = 1,
        Resolved = 2,
        ContinuedAfterError = 3
    }

    /// <summary>Distingue un riesgo de lesión de un problema de calidad.</summary>
    public enum HazardCategory
    {
        Safety = 0,
        Quality = 1
    }

    public enum FeedbackKind
    {
        Error = 0,
        Success = 1
    }

    /// <summary>Estado global del flujo de la aplicación.</summary>
    public enum GameState
    {
        Menu = 0,
        Induction = 1,
        Touring = 2,
        Consequence = 3,
        Modal = 4,
        Paused = 5,
        Results = 6
    }

    public static class EnumText
    {
        public static string ModeName(VisitMode mode)
        {
            return mode == VisitMode.Trained ? "Visita con capacitación" : "Visita sin inducción";
        }

        public static string PlatformName(InputPlatform platform)
        {
            return platform == InputPlatform.VirtualReality ? "Realidad virtual (OpenXR)" : "Escritorio";
        }

        public static string StatusName(ScenarioStatus status)
        {
            switch (status)
            {
                case ScenarioStatus.InProgress: return "En curso";
                case ScenarioStatus.Resolved: return "Resuelta con decisión adecuada";
                case ScenarioStatus.ContinuedAfterError: return "Continuada tras error (resolvió el guía)";
                default: return "No iniciada";
            }
        }

        public static string CategoryName(HazardCategory category)
        {
            return category == HazardCategory.Quality ? "CALIDAD" : "SEGURIDAD";
        }
    }
}
