using System.Collections;
using UnityEngine;

namespace FactoryVisitorSafety
{
    /// <summary>
    /// D. Zona de maquinaria restringida. Un objeto quedó junto a una máquina protegida.
    /// Lo adecuado es avisar al guía y permanecer fuera de la franja. El resguardo no es interactivo;
    /// solo un técnico autorizado (personaje virtual) detiene la máquina y retira el objeto.
    /// </summary>
    public class ScenarioMachine : ScenarioBase
    {
        public MachineController machine;
        public Interactable objectInteractable;
        public Transform fallenObject;
        public ZoneVolume restrictedZone;
        public ZoneVolume passZone;
        public NpcWalker technician;
        public Transform technicianStart;
        public Transform technicianVia;
        public Transform technicianPickup;
        public Transform technicianHand;

        static readonly string[] Options = { "reportar", "entrar", "ignorar" };

        Transform m_ObjectParent;
        Vector3 m_ObjectLocalPos;
        Quaternion m_ObjectLocalRot;
        bool m_ResumeWhenClear;
        bool m_IdleSafetyStop;

        protected override void OnInitialize()
        {
            if (fallenObject != null)
            {
                m_ObjectParent = fallenObject.parent;
                m_ObjectLocalPos = fallenObject.localPosition;
                m_ObjectLocalRot = fallenObject.localRotation;
            }
            if (objectInteractable != null) objectInteractable.Interacted += _ => Ask();
            if (restrictedZone != null) restrictedZone.Entered += _ => OnRestricted();
            if (passZone != null) passZone.Entered += _ => OnPass();
        }

        protected override void OnReset()
        {
            m_ResumeWhenClear = false;
            m_IdleSafetyStop = false;
            if (fallenObject != null)
            {
                fallenObject.SetParent(m_ObjectParent, false);
                fallenObject.localPosition = m_ObjectLocalPos;
                fallenObject.localRotation = m_ObjectLocalRot;
                fallenObject.gameObject.SetActive(true);
            }
            if (technician != null && technicianStart != null)
                technician.Place(technicianStart.position, technicianStart.eulerAngles.y);
            if (machine != null)
                machine.Run();
            if (objectInteractable != null)
                objectInteractable.SetAvailable(false);
        }

        protected override void OnActivated()
        {
            if (objectInteractable != null)
                objectInteractable.SetAvailable(true);
        }

        void Update()
        {
            if (machine == null || restrictedZone == null)
                return;
            // Tras resolver la situación, la máquina reanuda solo con la zona despejada.
            if (m_ResumeWhenClear && !restrictedZone.PlayerInside && (technician == null || !technician.IsWalking))
            {
                m_ResumeWhenClear = false;
                machine.Run();
            }
            // Fuera de la situación activa, entrar a la zona también provoca un paro (sin registrar error).
            if (Phase == ScenarioPhase.Done || Phase == ScenarioPhase.Idle || Phase == ScenarioPhase.Armed)
            {
                if (restrictedZone.PlayerInside && machine.State == MachineController.MachineState.Running)
                {
                    machine.SafetyStop();
                    m_IdleSafetyStop = true;
                }
                else if (!restrictedZone.PlayerInside && m_IdleSafetyStop)
                {
                    m_IdleSafetyStop = false;
                    machine.Run();
                }
            }
        }

        void Ask()
        {
            AskDecision(Options, choice =>
            {
                switch (choice)
                {
                    case "reportar":
                        game.recorder.HazardIdentified(scenarioId, "Identificó un objeto junto a una máquina en zona restringida");
                        game.recorder.ReportMade(scenarioId, "objeto_maquina", "Avisó al guía del objeto junto a la máquina y permaneció fuera");
                        Succeed("reportar", "Avisó al guía y permaneció fuera de la zona restringida", TechnicianRoutine());
                        break;
                    case "entrar":
                        RaiseError("entrar_zona", "Decidió entrar a la zona restringida para recoger el objeto", SafetyStopRoutine());
                        break;
                    default:
                        RaiseError("ignorar", "Decidió ignorar el objeto junto a la máquina", JamRoutine());
                        break;
                }
            });
        }

        void OnRestricted()
        {
            if (Phase != ScenarioPhase.Active)
                return;
            RaiseError("entrar_zona", "Entró a la zona restringida de la máquina", SafetyStopRoutine());
        }

        void OnPass()
        {
            if (Phase != ScenarioPhase.Active)
                return;
            RaiseError("ignorar", "Siguió de largo sin avisar del objeto junto a la máquina", JamRoutine());
        }

        IEnumerator SafetyStopRoutine()
        {
            if (machine != null)
                machine.SafetyStop();
            game.ui.ShowBanner("PARO DE SEGURIDAD — persona en zona restringida", 4f);
            game.guide.SayLines(ContentDatabase.Lines(Content.intervencionGuia));
            yield return new WaitForSeconds(2.5f);
        }

        IEnumerator JamRoutine()
        {
            if (fallenObject != null)
            {
                var basePos = fallenObject.localPosition;
                for (var t = 0f; t < 1f; t += Time.deltaTime)
                {
                    fallenObject.localPosition = basePos + new Vector3(Mathf.Sin(t * 60f) * 0.01f, 0f, 0f);
                    yield return null;
                }
                fallenObject.localPosition = basePos;
            }
            if (machine != null)
                machine.Jam();
            game.ui.ShowBanner("Paro no programado: el objeto quedó cerca del mecanismo", 4f);
            yield return new WaitForSeconds(2f);
        }

        IEnumerator TechnicianRoutine()
        {
            if (objectInteractable != null)
                objectInteractable.SetAvailable(false);
            GuideSayResolution();
            if (technician != null && technicianPickup != null && technicianStart != null)
            {
                var arrived = false;
                technician.WalkPath(technicianVia != null
                    ? new[] { technicianVia.position, technicianPickup.position }
                    : new[] { technicianPickup.position }, () => arrived = true);
                while (!arrived)
                    yield return null;
                if (machine != null)
                    machine.AuthorizedStop();
                yield return new WaitForSeconds(1f);
                if (fallenObject != null && technicianHand != null)
                {
                    fallenObject.SetParent(technicianHand, false);
                    fallenObject.localPosition = Vector3.zero;
                    fallenObject.localRotation = Quaternion.identity;
                }
                arrived = false;
                technician.WalkPath(technicianVia != null
                    ? new[] { technicianVia.position, technicianStart.position }
                    : new[] { technicianStart.position }, () => arrived = true);
                while (!arrived)
                    yield return null;
                if (fallenObject != null)
                    fallenObject.gameObject.SetActive(false);
            }
            m_ResumeWhenClear = true;
            game.ui.ShowToast("Objeto retirado por personal autorizado");
            yield return new WaitForSeconds(1f);
        }

        protected override IEnumerator SafeResolution()
        {
            yield return TechnicianRoutine();
        }
    }
}
