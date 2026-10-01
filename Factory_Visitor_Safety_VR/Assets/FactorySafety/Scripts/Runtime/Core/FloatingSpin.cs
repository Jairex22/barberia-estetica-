using UnityEngine;

namespace FactoryVisitorSafety
{
    /// <summary>Movimiento vertical suave y rotación para marcadores de objetos interactivos.</summary>
    public class FloatingSpin : MonoBehaviour
    {
        public float amplitude = 0.06f;
        public float speed = 2f;
        public float spinDegreesPerSecond = 60f;
        Vector3 m_Base;
        bool m_HasBase;

        void OnEnable()
        {
            if (!m_HasBase)
            {
                m_Base = transform.localPosition;
                m_HasBase = true;
            }
        }

        void Update()
        {
            var t = Time.unscaledTime;
            transform.localPosition = m_Base + Vector3.up * (Mathf.Sin(t * speed) * amplitude);
            transform.Rotate(Vector3.up, spinDegreesPerSecond * Time.unscaledDeltaTime, Space.World);
        }
    }
}
