using System.Collections.Generic;
using UnityEngine;

namespace FactoryVisitorSafety
{
    /// <summary>
    /// Evalúa cada cuadro en qué zonas está el visitante. Solo trabaja durante el recorrido activo,
    /// así que pausas, menús y retroalimentación nunca generan eventos.
    /// </summary>
    public class ZoneMonitor : MonoBehaviour
    {
        public GameFlow game;
        public PlayerRigManager rigs;

        readonly List<ZoneVolume> m_Buffer = new List<ZoneVolume>();

        void Update()
        {
            if (game == null || rigs == null || game.State != GameState.Touring)
                return;
            var foot = rigs.FootPosition + Vector3.up * 0.1f;
            m_Buffer.Clear();
            m_Buffer.AddRange(ZoneVolume.Active);
            foreach (var zone in m_Buffer)
            {
                if (zone == null || !zone.isActiveAndEnabled)
                    continue;
                zone.SetInside(zone.Contains(foot));
                // Un evento puede abrir una ventana modal; los siguientes se evalúan en el próximo cuadro.
                if (game.State != GameState.Touring)
                    break;
            }
        }
    }
}
