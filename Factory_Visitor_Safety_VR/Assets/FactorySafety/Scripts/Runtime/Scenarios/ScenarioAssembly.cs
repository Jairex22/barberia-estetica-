using System.Collections;
using UnityEngine;

namespace FactoryVisitorSafety
{
    /// <summary>
    /// E. Capacitación deficiente en ensamble (problema de CALIDAD, no de lesión).
    /// La hoja de instrucción no indica qué conector usar; el operador usa uno parecido de otro modelo.
    /// El visitante puede advertir al guía; nunca debe tocar piezas ni la línea.
    /// </summary>
    public class ScenarioAssembly : ScenarioBase
    {
        public AssemblyLine line;
        public Interactable stationInteractable;
        public NpcWalker supervisor;
        public Transform supervisorStart;
        public Transform supervisorStation;
        public ZoneVolume passZone;
        public int rejectionLimit = 3;

        static readonly string[] Options = { "reportar", "corregir", "ignorar" };

        protected override void OnInitialize()
        {
            category = HazardCategory.Quality;
            if (stationInteractable != null) stationInteractable.Interacted += _ => Ask();
            if (passZone != null) passZone.Entered += _ => OnPass();
            if (line != null) line.Rejected += OnRejected;
        }

        protected override void OnReset()
        {
            if (line != null)
                line.ResetLine();
            if (supervisor != null && supervisorStart != null)
                supervisor.Place(supervisorStart.position, supervisorStart.eulerAngles.y);
            if (stationInteractable != null)
                stationInteractable.SetAvailable(false);
        }

        protected override void OnActivated()
        {
            if (line != null)
                line.Begin(true);
            if (stationInteractable != null)
                stationInteractable.SetAvailable(true);
        }

        void Ask()
        {
            AskDecision(Options, choice =>
            {
                switch (choice)
                {
                    case "reportar":
                        game.recorder.HazardIdentified(scenarioId, "Identificó una posible diferencia entre la instrucción y la pieza (calidad)");
                        game.recorder.ReportMade(scenarioId, "instruccion_incompleta", "Comentó al guía que la instrucción no indica qué conector usar");
                        Succeed("reportar", "Advirtió al guía sobre la instrucción incompleta sin tocar la línea", ClarifyRoutine());
                        break;
                    case "corregir":
                        RaiseError("manipular_piezas", "Intentó corregir la pieza por su cuenta", StopRoutine("LÍNEA DETENIDA — persona no autorizada en la estación"));
                        break;
                    default:
                        RaiseError("no_advertir", "Decidió no comentar la diferencia observada", StopRoutine("LÍNEA DETENIDA — interrupción simulada por piezas rechazadas"));
                        break;
                }
            });
        }

        void OnRejected(int count)
        {
            if (Phase != ScenarioPhase.Active || count < rejectionLimit)
                return;
            RaiseError("no_advertir", "Se acumularon " + count + " piezas rechazadas sin que se advirtiera la diferencia",
                StopRoutine("LÍNEA DETENIDA — interrupción simulada: " + count + " piezas en retrabajo"));
        }

        void OnPass()
        {
            if (Phase != ScenarioPhase.Active)
                return;
            RaiseError("no_advertir", "Salió del área de ensamble sin advertir la diferencia", StopRoutine("LÍNEA DETENIDA — interrupción simulada por piezas rechazadas"));
        }

        IEnumerator StopRoutine(string reason)
        {
            if (line != null)
                line.StopLine(reason);
            game.ui.ShowBanner("CALIDAD: " + reason, 4f);
            yield return new WaitForSeconds(2.5f);
        }

        IEnumerator ClarifyRoutine()
        {
            if (stationInteractable != null)
                stationInteractable.SetAvailable(false);
            GuideSayResolution();
            if (supervisor != null && supervisorStation != null)
            {
                var arrived = false;
                supervisor.WalkPath(new[] { supervisorStation.position }, () => arrived = true);
                var timeout = 8f;
                while (!arrived && timeout > 0f)
                {
                    timeout -= Time.deltaTime;
                    yield return null;
                }
            }
            if (line != null)
            {
                line.PauseFor(5f, "INTERRUPCIÓN BREVE — verificación de la instrucción");
                line.ApplyCompleteInstructions();
            }
            game.ui.ShowToast("Instrucción aclarada: conector C-12 (azul). Las piezas ya hechas pasan a retrabajo.", 5f);
            yield return new WaitForSeconds(4f);
        }

        protected override IEnumerator SafeResolution()
        {
            yield return ClarifyRoutine();
        }
    }
}
