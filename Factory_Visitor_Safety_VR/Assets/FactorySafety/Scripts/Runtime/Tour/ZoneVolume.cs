using System;
using System.Collections.Generic;
using UnityEngine;

namespace FactoryVisitorSafety
{
    /// <summary>
    /// Volumen rectangular que detecta la posición de los pies del visitante.
    /// No usa física: ZoneMonitor compara la posición cada cuadro, lo que funciona igual en
    /// escritorio y en VR. Los eventos solo se disparan al ENTRAR o SALIR, nunca por permanecer dentro.
    /// </summary>
    public class ZoneVolume : MonoBehaviour
    {
        public string zoneId = "zona";
        public Vector3 size = new Vector3(2f, 3f, 2f);
        public Color gizmoColor = new Color(1f, 0.6f, 0f, 0.25f);

        public static readonly List<ZoneVolume> Active = new List<ZoneVolume>();

        public event Action<ZoneVolume> Entered;
        public event Action<ZoneVolume> Exited;

        public bool PlayerInside { get; private set; }

        void OnEnable()
        {
            if (!Active.Contains(this))
                Active.Add(this);
        }

        void OnDisable()
        {
            Active.Remove(this);
            if (PlayerInside)
            {
                PlayerInside = false;
                Exited?.Invoke(this);
            }
        }

        public bool Contains(Vector3 worldPoint)
        {
            var local = transform.InverseTransformPoint(worldPoint);
            var half = size * 0.5f;
            return Mathf.Abs(local.x) <= half.x && Mathf.Abs(local.y) <= half.y && Mathf.Abs(local.z) <= half.z;
        }

        /// <summary>Actualiza el estado; dispara un único evento por transición.</summary>
        public void SetInside(bool inside)
        {
            if (inside == PlayerInside)
                return;
            PlayerInside = inside;
            if (inside)
                Entered?.Invoke(this);
            else
                Exited?.Invoke(this);
        }

        void OnDrawGizmos()
        {
            Gizmos.matrix = transform.localToWorldMatrix;
            Gizmos.color = gizmoColor;
            Gizmos.DrawCube(Vector3.zero, size);
            Gizmos.color = new Color(gizmoColor.r, gizmoColor.g, gizmoColor.b, 1f);
            Gizmos.DrawWireCube(Vector3.zero, size);
        }

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]
        static void ResetStatics()
        {
            Active.Clear();
        }
    }
}
