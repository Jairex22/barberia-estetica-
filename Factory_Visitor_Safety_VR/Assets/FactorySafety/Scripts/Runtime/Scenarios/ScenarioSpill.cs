using System.Collections;
using UnityEngine;

namespace FactoryVisitorSafety
{
    /// <summary>
    /// C. Derrame en un pasillo. Lo adecuado es mantenerse alejado y reportarlo; nunca limpiar una
    /// sustancia desconocida. Ignorarlo muestra, de forma simbólica y sin lesiones, cómo podría
    /// afectar a otra persona.
    /// </summary>
    public class ScenarioSpill : ScenarioBase
    {
        public Interactable spillInteractable;
        public ZoneVolume spillZone;
        public ZoneVolume passZone;
        public Transform spillCenter;
        public GameObject[] cones;
        public GameObject wetFloorSign;
        public GameObject unknownLabel;
        public GameObject[] footprints;
        public NpcWalker coworker;
        public Transform coworkerStart;
        public Transform coworkerStop;
        public GameObject coworkerWarning;

        static readonly string[] Options = { "reportar", "limpiar", "ignorar" };

        protected override void OnInitialize()
        {
            if (spillInteractable != null) spillInteractable.Interacted += _ => Ask();
            if (spillZone != null) spillZone.Entered += _ => OnStep();
            if (passZone != null) passZone.Entered += _ => OnPass();
        }

        protected override void OnReset()
        {
            foreach (var kv in m_BaseScales)
            {
                if (kv.Key != null)
                    kv.Key.localScale = kv.Value;
            }
            SetAll(cones, false);
            SetAll(footprints, false);
            if (wetFloorSign != null) wetFloorSign.SetActive(false);
            if (unknownLabel != null) unknownLabel.SetActive(false);
            if (coworkerWarning != null) coworkerWarning.SetActive(false);
            if (coworker != null && coworkerStart != null)
                coworker.Place(coworkerStart.position, coworkerStart.eulerAngles.y);
            if (spillInteractable != null)
                spillInteractable.SetAvailable(false);
        }

        protected override void OnActivated()
        {
            if (spillInteractable != null)
                spillInteractable.SetAvailable(true);
        }

        void Ask()
        {
            AskDecision(Options, choice =>
            {
                switch (choice)
                {
                    case "reportar":
                        game.recorder.HazardIdentified(scenarioId, "Identificó un derrame de sustancia desconocida");
                        game.recorder.ReportMade(scenarioId, "derrame", "Reportó el derrame al guía y se mantuvo alejado");
                        Succeed("reportar", "Se mantuvo alejado y reportó el derrame", CordonRoutine());
                        break;
                    case "limpiar":
                        game.recorder.HazardIdentified(scenarioId, "Identificó el derrame (pero intentó limpiarlo)");
                        RaiseError("limpiar", "Intentó limpiar una sustancia desconocida", UnknownSubstanceRoutine());
                        break;
                    default:
                        RaiseError("ignorar", "Decidió ignorar el derrame", SymbolicSlipRoutine());
                        break;
                }
            });
        }

        void OnStep()
        {
            if (Phase != ScenarioPhase.Active)
                return;
            RaiseError("pisar", "Pisó la zona del derrame", FootprintRoutine());
        }

        void OnPass()
        {
            if (Phase != ScenarioPhase.Active)
                return;
            RaiseError("ignorar", "Siguió de largo sin reportar el derrame", SymbolicSlipRoutine());
        }

        IEnumerator CordonRoutine()
        {
            if (spillInteractable != null)
                spillInteractable.SetAvailable(false);
            if (spillCenter != null)
                game.guide.WalkTo(spillCenter.position + new Vector3(-1.6f, 0f, -1.4f));
            GuideSayResolution();
            yield return new WaitForSeconds(1.2f);
            if (cones != null)
            {
                foreach (var cone in cones)
                {
                    if (cone == null) continue;
                    yield return PopIn(cone.transform);
                }
            }
            if (wetFloorSign != null)
                yield return PopIn(wetFloorSign.transform);
            game.ui.ShowToast("Área acordonada: mantenimiento identificará la sustancia");
            yield return new WaitForSeconds(1.5f);
        }

        IEnumerator UnknownSubstanceRoutine()
        {
            if (unknownLabel != null)
                unknownLabel.SetActive(true);
            game.ui.ShowBanner("(!) SUSTANCIA NO IDENTIFICADA — NO TOCAR", 4f);
            yield return new WaitForSeconds(2.5f);
        }

        IEnumerator FootprintRoutine()
        {
            game.ui.ShowBanner("(!) Piso resbaladizo: la sustancia se esparce con las pisadas", 4f);
            if (footprints != null)
            {
                foreach (var f in footprints)
                {
                    if (f == null) continue;
                    f.SetActive(true);
                    yield return new WaitForSeconds(0.25f);
                }
            }
            yield return new WaitForSeconds(1.5f);
        }

        IEnumerator SymbolicSlipRoutine()
        {
            game.ui.ShowBanner("Representación simbólica: otra persona pasa por el derrame", 5f);
            if (coworker != null && coworkerStop != null)
            {
                var arrived = false;
                coworker.WalkPath(new[] { coworkerStop.position }, () => arrived = true);
                var timeout = 6f;
                while (!arrived && timeout > 0f)
                {
                    timeout -= Time.deltaTime;
                    yield return null;
                }
                if (coworkerWarning != null)
                    coworkerWarning.SetActive(true);
                // Pequeño desbalance simbólico y recuperación (sin caída ni lesión).
                var body = coworker.transform;
                var baseRot = body.rotation;
                for (var t = 0f; t < 1f; t += Time.deltaTime / 0.6f)
                {
                    body.rotation = baseRot * Quaternion.Euler(0f, 0f, Mathf.Sin(t * Mathf.PI) * 12f);
                    yield return null;
                }
                body.rotation = baseRot;
            }
            yield return new WaitForSeconds(1.5f);
        }

        protected override IEnumerator SafeResolution()
        {
            yield return CordonRoutine();
        }

        readonly System.Collections.Generic.Dictionary<Transform, Vector3> m_BaseScales =
            new System.Collections.Generic.Dictionary<Transform, Vector3>();

        IEnumerator PopIn(Transform t)
        {
            if (!m_BaseScales.TryGetValue(t, out var target))
            {
                target = t.localScale;
                m_BaseScales[t] = target;
            }
            t.gameObject.SetActive(true);
            t.localScale = Vector3.zero;
            for (var k = 0f; k < 1f; k += Time.deltaTime / 0.3f)
            {
                t.localScale = target * Mathf.SmoothStep(0f, 1f, k);
                yield return null;
            }
            t.localScale = target;
        }

        static void SetAll(GameObject[] objects, bool active)
        {
            if (objects == null)
                return;
            foreach (var o in objects)
            {
                if (o != null)
                    o.SetActive(active);
            }
        }
    }
}
