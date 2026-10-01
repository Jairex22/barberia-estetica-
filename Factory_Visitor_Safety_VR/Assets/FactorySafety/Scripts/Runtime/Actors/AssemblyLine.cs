using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace FactoryVisitorSafety
{
    /// <summary>
    /// Línea de ensamble simplificada: el operador coloca un conector en cada tarjeta, la tarjeta
    /// avanza por la banda hasta control de calidad y termina en "aprobadas" o "retrabajo".
    /// Representa un problema de CALIDAD (no de lesión) causado por una instrucción incompleta.
    /// </summary>
    public class AssemblyLine : MonoBehaviour
    {
        public Transform[] boards;
        public Renderer[] connectors;
        public Transform spawnPoint;
        public Transform qcPoint;
        public Transform reworkPoint;
        public Transform approvedPoint;
        public Transform workerArm;
        public Text instructionText;
        public Text statusText;
        public Text qcText;
        public Text counterText;
        public BlinkingLamp lineLamp;
        public MaterialPalette palette;
        public AudioCues audioCues;

        public float interval = 8f;
        public float beltSpeed = 0.9f;
        public float inspectSeconds = 1.3f;

        [TextArea] public string incompleteInstruction =
            "HOJA DE INSTRUCCIÓN — Tarjeta TX-40\nPaso 3: Instalar conector en J1.\nPaso 4: Enviar a inspección.";
        [TextArea] public string completeInstruction =
            "HOJA DE INSTRUCCIÓN — Tarjeta TX-40 (rev. B)\nPaso 3: Instalar conector C-12 (AZUL) en J1.\nVerificar la etiqueta C-12 antes de insertar.\nNo usar C-21 (naranja): es de otro modelo.\nPaso 4: Enviar a inspección.";

        public event Action<int> Rejected;

        enum LineState { Idle, Running, Paused, Stopped }

        class BoardState
        {
            public int index;
            public int phase;
            public float t;
            public bool wrong;
            public Vector3 from;
            public Vector3 to;
        }

        readonly List<BoardState> m_Active = new List<BoardState>();
        readonly Queue<int> m_Free = new Queue<int>();
        readonly Queue<int> m_Done = new Queue<int>();
        LineState m_State = LineState.Idle;
        float m_SpawnTimer;
        float m_PauseTimer;
        float m_ArmTimer;
        bool m_WrongParts = true;
        int m_Approved;
        int m_ReworkStack;
        int m_ApprovedStack;

        public int RejectedCount { get; private set; }
        public bool IsRunning => m_State == LineState.Running;

        void Awake()
        {
            ResetLine();
        }

        public void ResetLine()
        {
            m_Active.Clear();
            m_Free.Clear();
            m_Done.Clear();
            if (boards != null)
            {
                for (var i = 0; i < boards.Length; i++)
                {
                    if (boards[i] == null) continue;
                    boards[i].gameObject.SetActive(false);
                    m_Free.Enqueue(i);
                }
            }
            m_State = LineState.Idle;
            m_WrongParts = true;
            RejectedCount = 0;
            m_Approved = 0;
            m_ReworkStack = 0;
            m_ApprovedStack = 0;
            SetText(instructionText, incompleteInstruction);
            SetText(qcText, "CONTROL DE CALIDAD\nEn espera");
            SetStatus("LÍNEA EN ESPERA", null, false);
            UpdateCounter();
        }

        public void Begin(bool wrongParts)
        {
            m_WrongParts = wrongParts;
            m_State = LineState.Running;
            m_SpawnTimer = 0.5f;
            SetStatus("LÍNEA EN OPERACIÓN", palette != null ? palette.lampGreen : null, false);
        }

        /// <summary>El supervisor aclara la instrucción: las siguientes piezas usan el conector correcto.</summary>
        public void ApplyCompleteInstructions()
        {
            m_WrongParts = false;
            SetText(instructionText, completeInstruction);
        }

        public void PauseFor(float seconds, string reason)
        {
            m_State = LineState.Paused;
            m_PauseTimer = seconds;
            SetStatus(reason, palette != null ? palette.lampAmber : null, true);
        }

        public void StopLine(string reason)
        {
            m_State = LineState.Stopped;
            SetStatus(reason, palette != null ? palette.lampRed : null, true);
            if (audioCues != null)
                audioCues.Play(Cue.Beep);
        }

        void Update()
        {
            var dt = Time.deltaTime;
            if (workerArm != null)
            {
                m_ArmTimer = Mathf.Max(0f, m_ArmTimer - dt);
                var swing = m_ArmTimer > 0f ? Mathf.Sin((0.8f - m_ArmTimer) * 8f) * 35f : 0f;
                workerArm.localRotation = Quaternion.Euler(-40f + swing, 0f, 0f);
            }

            if (m_State == LineState.Paused)
            {
                m_PauseTimer -= dt;
                if (m_PauseTimer <= 0f)
                {
                    m_State = LineState.Running;
                    SetStatus("LÍNEA EN OPERACIÓN", palette != null ? palette.lampGreen : null, false);
                }
                return;
            }
            if (m_State != LineState.Running)
                return;

            m_SpawnTimer -= dt;
            if (m_SpawnTimer <= 0f)
            {
                m_SpawnTimer = interval;
                Spawn();
            }

            for (var i = m_Active.Count - 1; i >= 0; i--)
                Advance(m_Active[i], dt);
        }

        void Spawn()
        {
            if (m_Free.Count == 0)
            {
                if (m_Done.Count == 0)
                    return;
                var recycled = m_Done.Dequeue();
                boards[recycled].gameObject.SetActive(false);
                m_Free.Enqueue(recycled);
            }
            var index = m_Free.Dequeue();
            var b = new BoardState
            {
                index = index,
                phase = 0,
                t = 0f,
                wrong = m_WrongParts,
                from = spawnPoint.position,
                to = qcPoint.position
            };
            boards[index].position = b.from;
            boards[index].rotation = spawnPoint.rotation;
            boards[index].gameObject.SetActive(true);
            if (connectors != null && index < connectors.Length && connectors[index] != null && palette != null)
                connectors[index].sharedMaterial = b.wrong ? palette.connectorWrong : palette.connectorCorrect;
            m_Active.Add(b);
            m_ArmTimer = 0.8f;
        }

        void Advance(BoardState b, float dt)
        {
            var tr = boards[b.index];
            switch (b.phase)
            {
                case 0:
                {
                    var length = Mathf.Max(0.01f, Vector3.Distance(b.from, b.to));
                    b.t += dt * beltSpeed / length;
                    tr.position = Vector3.Lerp(b.from, b.to, Mathf.Clamp01(b.t));
                    if (b.t >= 1f)
                    {
                        b.phase = 1;
                        b.t = 0f;
                        SetText(qcText, "CONTROL DE CALIDAD\nInspeccionando tarjeta...");
                    }
                    break;
                }
                case 1:
                    b.t += dt;
                    if (b.t >= inspectSeconds)
                    {
                        b.phase = 2;
                        b.t = 0f;
                        b.from = tr.position;
                        if (b.wrong)
                        {
                            RejectedCount++;
                            b.to = reworkPoint.position + Vector3.up * (0.03f * (m_ReworkStack++ % 8));
                            SetText(qcText, "CONTROL DE CALIDAD\n[X] RECHAZADA: conector C-21 en lugar de C-12\nPieza enviada a RETRABAJO");
                            if (audioCues != null)
                                audioCues.Play(Cue.Beep);
                        }
                        else
                        {
                            m_Approved++;
                            b.to = approvedPoint.position + Vector3.up * (0.03f * (m_ApprovedStack++ % 8));
                            SetText(qcText, "CONTROL DE CALIDAD\n[OK] APROBADA: conector C-12 correcto");
                        }
                        UpdateCounter();
                        if (b.wrong)
                            Rejected?.Invoke(RejectedCount);
                    }
                    break;
                case 2:
                    b.t += dt / 0.8f;
                    var p = Vector3.Lerp(b.from, b.to, Mathf.Clamp01(b.t));
                    p.y += Mathf.Sin(Mathf.Clamp01(b.t) * Mathf.PI) * 0.25f;
                    tr.position = p;
                    if (b.t >= 1f)
                    {
                        b.phase = 3;
                        m_Active.Remove(b);
                        m_Done.Enqueue(b.index);
                    }
                    break;
            }
        }

        void UpdateCounter()
        {
            SetText(counterText, "Aprobadas: " + m_Approved + "   ·   Rechazadas (retrabajo): " + RejectedCount);
        }

        void SetStatus(string text, Material lamp, bool blink)
        {
            SetText(statusText, text);
            if (lineLamp == null)
                return;
            if (lamp == null)
                lineLamp.TurnOff();
            else
                lineLamp.SetState(lamp, blink);
        }

        static void SetText(Text t, string value)
        {
            if (t != null)
                t.text = value;
        }
    }
}
