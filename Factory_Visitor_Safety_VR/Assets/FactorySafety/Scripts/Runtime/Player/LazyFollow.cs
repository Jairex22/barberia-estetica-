using UnityEngine;

namespace FactoryVisitorSafety
{
    /// <summary>
    /// Mantiene un panel de interfaz frente al usuario de VR sin fijarlo a la cabeza:
    /// solo se reacomoda cuando el usuario gira más de cierto ángulo (más cómodo).
    /// </summary>
    public class LazyFollow : MonoBehaviour
    {
        public Transform target;
        public float distance = 1.5f;
        public float heightOffset = -0.1f;
        public float angleThreshold = 30f;
        public float followSpeed = 4f;

        bool m_Moving;

        public void Recenter()
        {
            if (target == null)
                return;
            transform.position = DesiredPosition();
            FaceTarget();
            m_Moving = false;
        }

        Vector3 DesiredPosition()
        {
            var forward = target.forward;
            forward.y = 0f;
            if (forward.sqrMagnitude < 0.001f)
                forward = Vector3.forward;
            forward.Normalize();
            return target.position + forward * distance + Vector3.up * heightOffset;
        }

        void LateUpdate()
        {
            if (target == null)
                return;
            var desired = DesiredPosition();
            var toPanel = transform.position - target.position;
            toPanel.y = 0f;
            var toDesired = desired - target.position;
            toDesired.y = 0f;
            var angle = Vector3.Angle(toPanel, toDesired);
            var distanceError = Mathf.Abs(toPanel.magnitude - distance);
            if (angle > angleThreshold || distanceError > 0.5f)
                m_Moving = true;
            if (m_Moving)
            {
                transform.position = Vector3.Lerp(transform.position, desired, 1f - Mathf.Exp(-followSpeed * Time.unscaledDeltaTime));
                if ((transform.position - desired).sqrMagnitude < 0.0025f)
                    m_Moving = false;
            }
            FaceTarget();
        }

        void FaceTarget()
        {
            var dir = transform.position - target.position;
            dir.y = 0f;
            if (dir.sqrMagnitude > 0.0001f)
                transform.rotation = Quaternion.LookRotation(dir.normalized, Vector3.up);
        }
    }
}
