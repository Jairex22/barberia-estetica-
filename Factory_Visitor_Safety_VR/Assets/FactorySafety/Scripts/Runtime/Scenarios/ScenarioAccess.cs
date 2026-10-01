using System.Collections;
using System.Collections.Generic;
using System.Text;
using UnityEngine;
using UnityEngine.UI;

namespace FactoryVisitorSafety
{
    /// <summary>
    /// A. Acceso sin inducción o protección requerida.
    /// Requisitos para ingresar: revisar las reglas, pedir orientación al guía y colocarse el EPP.
    /// Si el visitante llega a la puerta sin cumplirlos, el acceso permanece cerrado y el guía interviene.
    /// </summary>
    public class ScenarioAccess : ScenarioBase
    {
        public Interactable rulesBoard;
        public Interactable[] ppeItems;
        public string[] ppeNames = { "Chaleco de alta visibilidad", "Lentes de seguridad", "Protección auditiva" };
        public ZoneVolume gateZone;
        public Transform gatePanel;
        public Vector3 gateClosedLocal;
        public Vector3 gateOpenLocal;
        public BlinkingLamp gateLamp;
        public Text gateSignText;

        bool m_RulesReviewed;
        bool m_OrientationRequested;
        bool[] m_Ppe;
        Coroutine m_GateMove;

        protected override void OnInitialize()
        {
            if (rulesBoard != null)
                rulesBoard.Interacted += _ => OnRulesBoard();
            if (ppeItems != null)
            {
                for (var i = 0; i < ppeItems.Length; i++)
                {
                    var index = i;
                    if (ppeItems[i] != null)
                        ppeItems[i].Interacted += _ => OnPpe(index);
                }
            }
            if (gateZone != null)
                gateZone.Entered += _ => OnGate();
        }

        protected override void OnReset()
        {
            m_RulesReviewed = false;
            m_OrientationRequested = false;
            m_Ppe = new bool[ppeItems != null ? ppeItems.Length : 0];
            if (ppeItems != null)
            {
                foreach (var item in ppeItems)
                {
                    if (item == null) continue;
                    item.gameObject.SetActive(true);
                    item.SetAvailable(true);
                }
            }
            if (rulesBoard != null)
                rulesBoard.SetAvailable(true);
            SetGate(false, true);
            if (gateLamp != null && game != null && game.palette != null)
                gateLamp.SetState(game.palette.lampRed, false);
            if (gateSignText != null)
                gateSignText.text = "ACCESO A PLANTA\nSolo visitantes con inducción y EPP";
        }

        protected override void OnActivated()
        {
            UpdateStatus();
        }

        void OnRulesBoard()
        {
            var body = new StringBuilder();
            foreach (var rule in ContentDatabase.Lines(ContentDatabase.Data.reglasVisitantes))
                body.Append(rule).Append('\n');
            game.ShowInfo("Reglas para visitantes (fábrica ficticia)", body.ToString(), null);
            if (Phase == ScenarioPhase.Active && !m_RulesReviewed)
            {
                m_RulesReviewed = true;
                game.recorder.Decision(scenarioId, "revisar_reglas", "Revisó el tablero de reglas para visitantes", true);
                UpdateStatus();
            }
        }

        public override void OnAskGuide()
        {
            if (Phase == ScenarioPhase.Active && !m_OrientationRequested)
            {
                m_OrientationRequested = true;
                game.recorder.Decision(scenarioId, "pedir_orientacion", "Pidió orientación al guía antes de ingresar", true);
                game.guide.SayLines(ContentDatabase.Lines(Content.ayudaGuia));
                UpdateStatus();
                return;
            }
            base.OnAskGuide();
        }

        void OnPpe(int index)
        {
            if (Phase != ScenarioPhase.Active || m_Ppe == null || index >= m_Ppe.Length || m_Ppe[index])
                return;
            m_Ppe[index] = true;
            ppeItems[index].SetAvailable(false);
            ppeItems[index].gameObject.SetActive(false);
            var name = index < ppeNames.Length ? ppeNames[index] : "EPP";
            game.recorder.Decision(scenarioId, "epp_" + index, "Se colocó: " + name, true);
            game.ui.ShowToast("Te colocaste: " + name);
            UpdateStatus();
        }

        List<string> Missing()
        {
            var missing = new List<string>();
            if (!m_RulesReviewed)
                missing.Add("revisar las reglas");
            if (!m_OrientationRequested)
                missing.Add("pedir orientación al guía");
            for (var i = 0; m_Ppe != null && i < m_Ppe.Length; i++)
            {
                if (!m_Ppe[i])
                    missing.Add(i < ppeNames.Length ? ppeNames[i].ToLowerInvariant() : "EPP");
            }
            return missing;
        }

        void OnGate()
        {
            if (Phase != ScenarioPhase.Active)
                return;
            var missing = Missing();
            if (missing.Count == 0)
            {
                Succeed("ingreso_con_requisitos", "Ingresó tras revisar las reglas, pedir orientación y colocarse el EPP", OpenGateRoutine());
            }
            else
            {
                var list = string.Join(", ", missing);
                RaiseError("acceso_sin_requisitos", "Intentó ingresar sin cumplir: " + list, InterventionRoutine(),
                    "Requisitos pendientes: " + list + ".");
            }
        }

        IEnumerator InterventionRoutine()
        {
            if (gateLamp != null && game.palette != null)
                gateLamp.SetState(game.palette.lampRed, true);
            if (gateSignText != null)
                gateSignText.text = "ACCESO DETENIDO\nComplete inducción y EPP";
            game.ui.ShowBanner("El guía detiene el acceso", 3f);
            if (gateZone != null)
                game.guide.WalkTo(gateZone.transform.position + new Vector3(-1.2f, 0f, -0.8f));
            game.guide.SayLines(ContentDatabase.Lines(Content.intervencionGuia));
            yield return new WaitForSeconds(3.5f);
        }

        IEnumerator OpenGateRoutine()
        {
            if (gateLamp != null && game.palette != null)
                gateLamp.SetState(game.palette.lampGreen, false);
            if (gateSignText != null)
                gateSignText.text = "ACCESO AUTORIZADO\nMantente en los pasillos peatonales";
            SetGate(true, false);
            GuideSayResolution();
            yield return new WaitForSeconds(2f);
        }

        protected override IEnumerator SafeResolution()
        {
            // El guía completa la inducción mínima y entrega el EPP.
            GuideSayResolution();
            m_RulesReviewed = true;
            m_OrientationRequested = true;
            for (var i = 0; m_Ppe != null && i < m_Ppe.Length; i++)
            {
                if (m_Ppe[i]) continue;
                m_Ppe[i] = true;
                ppeItems[i].SetAvailable(false);
                ppeItems[i].gameObject.SetActive(false);
            }
            game.ui.ShowToast("El guía te entregó el EPP y resumió las reglas");
            UpdateStatus();
            yield return new WaitForSeconds(2.5f);
            yield return OpenGateRoutine();
        }

        protected override void OnCompleted()
        {
            if (rulesBoard != null)
                rulesBoard.SetAvailable(true);
        }

        void SetGate(bool open, bool instant)
        {
            if (gatePanel == null)
                return;
            if (m_GateMove != null)
                StopCoroutine(m_GateMove);
            m_GateMove = null;
            var target = open ? gateOpenLocal : gateClosedLocal;
            if (instant || !isActiveAndEnabled)
                gatePanel.localPosition = target;
            else
                m_GateMove = StartCoroutine(MoveGate(target));
        }

        IEnumerator MoveGate(Vector3 target)
        {
            var start = gatePanel.localPosition;
            var t = 0f;
            while (t < 1f)
            {
                t += Time.deltaTime / 1.5f;
                gatePanel.localPosition = Vector3.Lerp(start, target, Mathf.SmoothStep(0f, 1f, t));
                yield return null;
            }
            m_GateMove = null;
        }

        void UpdateStatus()
        {
            if (Phase == ScenarioPhase.Done)
                return;
            var sb = new StringBuilder();
            sb.Append("Reglas: ").Append(m_RulesReviewed ? "[OK]" : "[pendiente]");
            sb.Append("   Orientación: ").Append(m_OrientationRequested ? "[OK]" : "[pendiente]");
            sb.Append("\nEPP: ");
            for (var i = 0; m_Ppe != null && i < m_Ppe.Length; i++)
            {
                if (i > 0) sb.Append(", ");
                sb.Append(i < ppeNames.Length ? ppeNames[i] : "EPP").Append(m_Ppe[i] ? " [OK]" : " [ ]");
            }
            game.ui.SetStatusLine(sb.ToString());
        }
    }
}
