using System;
using System.Collections.Generic;
using UnityEngine;

namespace FactoryVisitorSafety
{
    /// <summary>
    /// Movimiento simple de personajes por puntos (sin NavMesh) con balanceo de brazos y piernas.
    /// Se usa para el guía y para los trabajadores virtuales.
    /// </summary>
    public class NpcWalker : MonoBehaviour
    {
        public Transform leftArm;
        public Transform rightArm;
        public Transform leftLeg;
        public Transform rightLeg;
        public float speed = 1.4f;
        public float turnDegreesPerSecond = 300f;

        readonly List<Vector3> m_Route = new List<Vector3>();
        int m_Target = -1;
        Action m_OnArrived;
        Func<int, bool> m_CanLeavePoint;
        Action<int> m_OnPointReached;
        float m_Phase;
        bool m_Waiting;
        Vector3? m_LookTarget;

        public bool IsWalking => m_Target >= 0;

        /// <summary>
        /// Recorre los puntos en orden. canLeavePoint(i) permite esperar en el punto i (por ejemplo,
        /// hasta que un semáforo esté en verde). onPointReached(i) avisa al llegar a cada punto.
        /// </summary>
        public void WalkPath(IList<Vector3> points, Action onArrived = null, Func<int, bool> canLeavePoint = null, Action<int> onPointReached = null)
        {
            m_Route.Clear();
            var y = transform.position.y;
            foreach (var p in points)
                m_Route.Add(new Vector3(p.x, y, p.z));
            m_OnArrived = onArrived;
            m_CanLeavePoint = canLeavePoint;
            m_OnPointReached = onPointReached;
            m_Waiting = false;
            m_LookTarget = null;
            m_Target = m_Route.Count > 0 ? 0 : -1;
            if (m_Target < 0)
                onArrived?.Invoke();
        }

        public void Stop()
        {
            m_Target = -1;
            m_Route.Clear();
            m_OnArrived = null;
            m_CanLeavePoint = null;
            m_OnPointReached = null;
            m_Waiting = false;
            PoseLimbs(0f);
        }

        public void Place(Vector3 position, float yaw)
        {
            Stop();
            transform.position = position;
            transform.rotation = Quaternion.Euler(0f, yaw, 0f);
        }

        /// <summary>Gira suavemente hacia un punto mientras está detenido.</summary>
        public void LookAt(Vector3? point)
        {
            m_LookTarget = point;
        }

        void Update()
        {
            var dt = Time.deltaTime;
            if (m_Target < 0)
            {
                if (m_LookTarget.HasValue)
                    TurnTowards(m_LookTarget.Value - transform.position, dt);
                PoseLimbs(Mathf.Lerp(m_LastSwing, 0f, 0.2f));
                return;
            }

            if (m_Waiting)
            {
                var leaving = m_Target - 1;
                if (m_CanLeavePoint == null || m_CanLeavePoint(leaving))
                    m_Waiting = false;
                else
                {
                    PoseLimbs(0f);
                    return;
                }
            }

            var target = m_Route[m_Target];
            var pos = transform.position;
            var delta = target - pos;
            delta.y = 0f;
            var dist = delta.magnitude;
            var step = speed * dt;
            if (dist <= step || dist < 0.01f)
            {
                transform.position = new Vector3(target.x, pos.y, target.z);
                var reached = m_Target;
                m_OnPointReached?.Invoke(reached);
                m_Target++;
                if (m_Target >= m_Route.Count)
                {
                    var done = m_OnArrived;
                    m_Target = -1;
                    m_OnArrived = null;
                    m_CanLeavePoint = null;
                    m_OnPointReached = null;
                    PoseLimbs(0f);
                    done?.Invoke();
                    return;
                }
                if (m_CanLeavePoint != null && !m_CanLeavePoint(reached))
                    m_Waiting = true;
                return;
            }

            transform.position = pos + delta / dist * step;
            TurnTowards(delta, dt);
            m_Phase += dt * speed * 4.5f;
            PoseLimbs(Mathf.Sin(m_Phase) * 28f);
        }

        void TurnTowards(Vector3 direction, float dt)
        {
            direction.y = 0f;
            if (direction.sqrMagnitude < 0.0001f)
                return;
            var goal = Quaternion.LookRotation(direction.normalized, Vector3.up);
            transform.rotation = Quaternion.RotateTowards(transform.rotation, goal, turnDegreesPerSecond * dt);
        }

        float m_LastSwing;

        void PoseLimbs(float swing)
        {
            m_LastSwing = swing;
            if (leftArm != null) leftArm.localRotation = Quaternion.Euler(swing, 0f, 0f);
            if (rightArm != null) rightArm.localRotation = Quaternion.Euler(-swing, 0f, 0f);
            if (leftLeg != null) leftLeg.localRotation = Quaternion.Euler(-swing * 0.8f, 0f, 0f);
            if (rightLeg != null) rightLeg.localRotation = Quaternion.Euler(swing * 0.8f, 0f, 0f);
        }
    }
}
