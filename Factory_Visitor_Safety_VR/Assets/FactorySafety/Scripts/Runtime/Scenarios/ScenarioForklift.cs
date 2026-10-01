using System.Collections;
using UnityEngine;

namespace FactoryVisitorSafety
{
    /// <summary>
    /// B. Cruce con montacargas. La decisión adecuada es usar el cruce peatonal y esperar la luz verde.
    /// Invadir la ruta o cruzar en rojo representa un casi accidente: el montacargas se detiene,
    /// suena el claxon, se marca la trayectoria y la escena se pausa para explicar (sin mover la cámara).
    /// </summary>
    public class ScenarioForklift : ScenarioBase
    {
        public ForkliftController forklift;
        public ZoneVolume crosswalk;
        public ZoneVolume laneWest;
        public ZoneVolume laneEast;
        public ZoneVolume northArrival;

        bool m_CrossedSafely;

        protected override void OnInitialize()
        {
            if (crosswalk != null) crosswalk.Entered += _ => OnCrosswalk();
            if (laneWest != null) laneWest.Entered += _ => OnLane();
            if (laneEast != null) laneEast.Entered += _ => OnLane();
            if (northArrival != null) northArrival.Entered += _ => OnArrival();
        }

        protected override void OnReset()
        {
            m_CrossedSafely = false;
            if (forklift != null)
                forklift.ResetCycle();
        }

        void OnCrosswalk()
        {
            if (Phase != ScenarioPhase.Active || m_CrossedSafely)
                return;
            if (forklift != null && forklift.IsSignalGreen)
            {
                m_CrossedSafely = true;
                game.recorder.HazardIdentified(scenarioId, "Reconoció el cruce de montacargas y esperó la indicación segura");
                game.recorder.Decision(scenarioId, "esperar_senal", "Esperó la luz verde y usó el cruce peatonal", true);
                game.ui.ShowToast("Cruce con indicación segura: el montacargas espera");
            }
            else
            {
                RaiseError("cruce_sin_senal", "Entró al cruce con la señal en rojo", NearMissRoutine());
            }
        }

        void OnLane()
        {
            if (Phase != ScenarioPhase.Active)
                return;
            RaiseError("invadir_ruta", "Invadió la ruta del montacargas fuera del cruce peatonal", NearMissRoutine());
        }

        void OnArrival()
        {
            if (Phase != ScenarioPhase.Active || !m_CrossedSafely)
                return;
            Succeed("cruce_seguro", "Cruzó por el paso peatonal con la indicación en verde", ArrivalRoutine());
        }

        IEnumerator ArrivalRoutine()
        {
            GuideSayResolution();
            yield return new WaitForSeconds(1.5f);
        }

        IEnumerator NearMissRoutine()
        {
            if (forklift != null)
                forklift.TriggerNearMiss(game.rigs.FootPosition);
            game.ui.ShowBanner("CASI ACCIDENTE — la escena se pausa para explicar", 4f);
            game.guide.SayLines(ContentDatabase.Lines(Content.intervencionGuia));
            yield return new WaitForSeconds(2.5f);
        }

        protected override void ContinueAfterError()
        {
            if (forklift != null)
                forklift.ClearIncident();
            base.ContinueAfterError();
        }

        protected override IEnumerator SafeResolution()
        {
            // El montacargas permanece detenido mientras haya alguien en la ruta.
            GuideSayResolution();
            game.ui.ShowToast("El montacargas espera hasta que la ruta quede libre");
            yield return new WaitForSeconds(2f);
        }
    }
}
