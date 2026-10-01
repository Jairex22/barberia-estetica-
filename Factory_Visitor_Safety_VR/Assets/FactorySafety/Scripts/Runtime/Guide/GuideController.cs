using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace FactoryVisitorSafety
{
    /// <summary>
    /// Guía virtual: camina entre áreas por el pasillo central, muestra mensajes de texto
    /// (burbuja sobre la cabeza y panel en la interfaz) y respeta el cruce de montacargas.
    /// </summary>
    public class GuideController : MonoBehaviour
    {
        public NpcWalker walker;
        public GameObject bubble;
        public Text bubbleText;
        public Interactable talkInteractable;
        public ForkliftController forklift;
        public GameFlow game;

        [Header("Banda del pasillo de montacargas (eje Z)")]
        public float laneSouthZ = 12.0f;
        public float laneNorthZ = 16.0f;

        public string LastLine { get; private set; } = "";

        Coroutine m_Speech;
        bool m_HoldingForklift;
        List<Vector3> m_CurrentPath = new List<Vector3>();

        void Update()
        {
            if (walker == null || game == null || game.rigs == null)
                return;
            if (!walker.IsWalking)
                walker.LookAt(game.rigs.FootPosition);
        }

        public void Say(string line)
        {
            if (string.IsNullOrEmpty(line))
                return;
            LastLine = line;
            if (bubble != null)
                bubble.SetActive(true);
            if (bubbleText != null)
                bubbleText.text = line;
            if (game != null && game.ui != null)
                game.ui.SetGuideMessage(line);
        }

        /// <summary>Muestra varias líneas, una tras otra, con tiempo de lectura proporcional al texto.</summary>
        public void SayLines(IList<string> lines, Action done = null)
        {
            StopSpeech();
            if (lines == null || lines.Count == 0)
            {
                done?.Invoke();
                return;
            }
            m_Speech = StartCoroutine(SpeechRoutine(lines, done));
        }

        public void StopSpeech()
        {
            if (m_Speech != null)
                StopCoroutine(m_Speech);
            m_Speech = null;
        }

        IEnumerator SpeechRoutine(IList<string> lines, Action done)
        {
            for (var i = 0; i < lines.Count; i++)
            {
                Say(lines[i]);
                var seconds = Mathf.Clamp(lines[i].Length / 15f, 3.5f, 9f);
                yield return new WaitForSeconds(seconds);
            }
            m_Speech = null;
            done?.Invoke();
        }

        public void PlaceAt(Vector3 position, float yaw)
        {
            ReleaseForklift();
            if (walker != null)
                walker.Place(position, yaw);
        }

        /// <summary>Camina hasta un punto usando el pasillo central (x = 0) que conecta todas las áreas.</summary>
        public void WalkTo(Vector3 target, Action arrived = null)
        {
            if (walker == null)
            {
                arrived?.Invoke();
                return;
            }
            WalkRoute(BuildPath(walker.transform.position, target), arrived);
        }

        /// <summary>Recorre una ruta explícita (por ejemplo, la ruta de evacuación).</summary>
        public void WalkRoute(IList<Vector3> route, Action arrived = null)
        {
            ReleaseForklift();
            m_CurrentPath = new List<Vector3>(route);
            walker.WalkPath(m_CurrentPath, () =>
            {
                ReleaseForklift();
                arrived?.Invoke();
            }, CanLeavePoint, OnPointReached);
        }

        List<Vector3> BuildPath(Vector3 from, Vector3 to)
        {
            var path = new List<Vector3>();
            if (Mathf.Abs(from.x) > 0.3f)
                path.Add(new Vector3(0f, from.y, from.z));
            var crosses = (from.z < laneSouthZ && to.z > laneNorthZ) || (from.z > laneNorthZ && to.z < laneSouthZ);
            if (crosses)
            {
                var first = from.z < to.z ? laneSouthZ : laneNorthZ;
                var second = from.z < to.z ? laneNorthZ : laneSouthZ;
                path.Add(new Vector3(0f, from.y, first));
                path.Add(new Vector3(0f, from.y, second));
            }
            path.Add(new Vector3(0f, from.y, to.z));
            path.Add(to);

            // Elimina puntos casi duplicados.
            var clean = new List<Vector3>();
            var last = from;
            foreach (var p in path)
            {
                if ((p - last).sqrMagnitude > 0.01f)
                    clean.Add(p);
                last = p;
            }
            return clean;
        }

        bool SegmentCrossesLane(int index)
        {
            if (index < 0 || index + 1 >= m_CurrentPath.Count)
                return false;
            var a = m_CurrentPath[index].z;
            var b = m_CurrentPath[index + 1].z;
            return (a <= laneSouthZ + 0.05f && b >= laneNorthZ - 0.05f) || (a >= laneNorthZ - 0.05f && b <= laneSouthZ + 0.05f);
        }

        bool CanLeavePoint(int index)
        {
            if (!SegmentCrossesLane(index) || forklift == null)
                return true;
            if (m_HoldingForklift)
                return true;
            if (forklift.IsSafeForCrossing)
            {
                forklift.AddHold(this);
                m_HoldingForklift = true;
                return true;
            }
            return false;
        }

        void OnPointReached(int index)
        {
            if (!m_HoldingForklift || index < 0 || index >= m_CurrentPath.Count)
                return;
            var z = m_CurrentPath[index].z;
            if (z <= laneSouthZ + 0.05f || z >= laneNorthZ - 0.05f)
            {
                // Solo libera al terminar de cruzar (no en el punto de espera inicial).
                if (index > 0 && SegmentCrossesLane(index - 1))
                    ReleaseForklift();
            }
        }

        void ReleaseForklift()
        {
            if (m_HoldingForklift && forklift != null)
                forklift.RemoveHold(this);
            m_HoldingForklift = false;
        }

        void OnDisable()
        {
            ReleaseForklift();
        }
    }
}
