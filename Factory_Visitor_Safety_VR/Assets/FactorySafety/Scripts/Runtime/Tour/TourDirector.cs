using UnityEngine;

namespace FactoryVisitorSafety
{
    /// <summary>Orden del recorrido (A → F), situación actual e indicador de progreso.</summary>
    public class TourDirector : MonoBehaviour
    {
        public ScenarioBase[] scenarios;

        GameFlow m_Game;

        public int CurrentIndex { get; private set; } = -1;

        public ScenarioBase Current =>
            scenarios != null && CurrentIndex >= 0 && CurrentIndex < scenarios.Length ? scenarios[CurrentIndex] : null;

        public void Initialize(GameFlow game)
        {
            m_Game = game;
            foreach (var s in scenarios)
            {
                if (s != null)
                    s.Initialize(game);
            }
        }

        /// <summary>Restablece todas las situaciones (sin iniciar el recorrido).</summary>
        public void ResetAll()
        {
            CurrentIndex = -1;
            foreach (var s in scenarios)
            {
                if (s != null)
                    s.ResetScenario();
            }
        }

        public void Begin()
        {
            ResetAll();
            CurrentIndex = 0;
            RefreshProgress();
            if (Current != null)
                Current.Arm();
        }

        public void OnScenarioFinished(ScenarioBase scenario)
        {
            if (scenario != Current)
                return;
            CurrentIndex++;
            RefreshProgress();
            if (Current == null)
            {
                m_Game.EndTour(true);
                return;
            }
            Current.Arm();
        }

        public void RefreshProgress()
        {
            if (m_Game == null || m_Game.ui == null)
                return;
            m_Game.ui.SetProgress(CurrentIndex, scenarios, id =>
            {
                var record = m_Game.recorder != null ? m_Game.recorder.Record(id) : null;
                return record != null ? record.status : ScenarioStatus.NotStarted;
            });
        }
    }
}
