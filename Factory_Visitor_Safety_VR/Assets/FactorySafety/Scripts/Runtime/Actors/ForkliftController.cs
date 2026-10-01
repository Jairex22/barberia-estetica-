using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace FactoryVisitorSafety
{
    /// <summary>
    /// Montacargas que recorre una ruta delimitada (eje X) y controla el semáforo peatonal.
    /// Ciclo: avanza → espera en un extremo (semáforo en verde) → semáforo en rojo → regresa.
    /// Si alguien está en el cruce o en la ruta, el montacargas no arranca; si está en movimiento
    /// y alguien invade su camino cercano, se detiene (paro preventivo).
    /// </summary>
    public class ForkliftController : MonoBehaviour
    {
        public Transform body;
        public float westX = -13f;
        public float eastX = 13f;
        public float speed = 2.2f;
        public float waitSeconds = 8f;
        public float redBeforeMove = 2f;

        [Header("Señales")]
        public BlinkingLamp beacon;
        public Renderer[] greenLamps;
        public Renderer[] redLamps;
        public Text[] signalTexts;
        public GameObject nearMissSign;
        public LineRenderer nearMissLine;
        public MaterialPalette palette;
        public AudioCues audioCues;

        [Header("Zonas peatonales")]
        public ZoneVolume crosswalk;
        public ZoneVolume laneWest;
        public ZoneVolume laneEast;
        public PlayerRigManager rigs;

        enum Phase { Moving, Waiting, Incident }

        Phase m_Phase = Phase.Moving;
        int m_Direction = 1;
        float m_WaitTimer;
        bool m_PreventiveStop;
        readonly HashSet<object> m_Holds = new HashSet<object>();

        public bool PlayerInRoute =>
            (crosswalk != null && crosswalk.PlayerInside) ||
            (laneWest != null && laneWest.PlayerInside) ||
            (laneEast != null && laneEast.PlayerInside);

        bool Occupied => m_Holds.Count > 0 || PlayerInRoute;

        public bool IsMoving => m_Phase == Phase.Moving && !m_PreventiveStop;

        /// <summary>Indicación peatonal: verde solo cuando el montacargas está detenido en un extremo.</summary>
        public bool IsSignalGreen => m_Phase == Phase.Waiting && (m_WaitTimer > redBeforeMove || Occupied);

        /// <summary>Margen extra para que el guía cruce sin prisa.</summary>
        public bool IsSafeForCrossing => m_Phase == Phase.Waiting && m_WaitTimer > redBeforeMove + 1.5f;

        public Vector3 Position => body != null ? body.position : transform.position;

        void Start()
        {
            ResetCycle();
        }

        public void ResetCycle()
        {
            m_Holds.Clear();
            m_Direction = 1;
            m_Phase = Phase.Moving;
            m_PreventiveStop = false;
            SetX(westX);
            SetFacing();
            ShowIncident(false, Vector3.zero);
            UpdateSignals();
            if (beacon != null && palette != null)
                beacon.SetState(palette.lampAmber, true);
        }

        public void AddHold(object owner)
        {
            if (owner != null)
                m_Holds.Add(owner);
        }

        public void RemoveHold(object owner)
        {
            if (owner != null)
                m_Holds.Remove(owner);
        }

        void Update()
        {
            var dt = Time.deltaTime;
            switch (m_Phase)
            {
                case Phase.Moving:
                    UpdateMoving(dt);
                    break;
                case Phase.Waiting:
                    if (Occupied)
                        m_WaitTimer = Mathf.Max(m_WaitTimer, redBeforeMove + 0.5f);
                    m_WaitTimer -= dt;
                    if (m_WaitTimer <= 0f)
                    {
                        m_Direction = -m_Direction;
                        SetFacing();
                        m_Phase = Phase.Moving;
                        if (beacon != null && palette != null)
                            beacon.SetState(palette.lampAmber, true);
                    }
                    break;
            }
            UpdateSignals();
        }

        void UpdateMoving(float dt)
        {
            var x = body.position.x;
            m_PreventiveStop = PersonAhead(x);
            if (m_PreventiveStop)
                return;
            x += m_Direction * speed * dt;
            var end = m_Direction > 0 ? eastX : westX;
            if ((m_Direction > 0 && x >= end) || (m_Direction < 0 && x <= end))
            {
                x = end;
                m_Phase = Phase.Waiting;
                m_WaitTimer = waitSeconds;
                if (beacon != null && palette != null)
                    beacon.SetState(palette.lampAmber, false);
            }
            SetX(x);
        }

        bool PersonAhead(float x)
        {
            if (m_Holds.Count > 0)
                return true;
            if (!PlayerInRoute || rigs == null)
                return false;
            var px = rigs.FootPosition.x;
            var ahead = (px - x) * m_Direction;
            return ahead > -1.5f && ahead < 7f;
        }

        /// <summary>Representa un casi accidente: el montacargas se detiene, suena el claxon y se marca la trayectoria.</summary>
        public void TriggerNearMiss(Vector3 personPosition)
        {
            m_Phase = Phase.Incident;
            if (audioCues != null)
                audioCues.Play(Cue.Horn);
            if (beacon != null && palette != null)
                beacon.SetState(palette.lampRed, true);
            ShowIncident(true, personPosition);
            UpdateSignals();
        }

        /// <summary>Termina la representación del incidente y deja el montacargas detenido con semáforo en verde.</summary>
        public void ClearIncident()
        {
            ShowIncident(false, Vector3.zero);
            m_Phase = Phase.Waiting;
            m_WaitTimer = waitSeconds;
            if (beacon != null && palette != null)
                beacon.SetState(palette.lampAmber, false);
            UpdateSignals();
        }

        void ShowIncident(bool show, Vector3 personPosition)
        {
            if (nearMissSign != null)
                nearMissSign.SetActive(show);
            if (nearMissLine != null)
            {
                nearMissLine.enabled = show;
                if (show && body != null)
                {
                    nearMissLine.positionCount = 2;
                    nearMissLine.SetPosition(0, body.position + Vector3.up * 0.15f);
                    nearMissLine.SetPosition(1, new Vector3(personPosition.x, 0.15f, personPosition.z));
                }
            }
        }

        void SetX(float x)
        {
            if (body == null)
                return;
            var p = body.position;
            body.position = new Vector3(x, p.y, p.z);
        }

        void SetFacing()
        {
            if (body != null)
                body.rotation = Quaternion.Euler(0f, m_Direction > 0 ? 90f : -90f, 0f);
        }

        void UpdateSignals()
        {
            if (palette == null)
                return;
            var green = IsSignalGreen;
            if (greenLamps != null)
            {
                foreach (var r in greenLamps)
                    if (r != null) r.sharedMaterial = green ? palette.lampGreen : palette.lampOff;
            }
            if (redLamps != null)
            {
                foreach (var r in redLamps)
                    if (r != null) r.sharedMaterial = green ? palette.lampOff : palette.lampRed;
            }
            if (signalTexts != null)
            {
                foreach (var t in signalTexts)
                {
                    if (t == null) continue;
                    t.text = green ? "CRUCE PERMITIDO\n(verde)" : "ESPERE\n(rojo)";
                }
            }
        }
    }
}
