using UnityEngine;

namespace FactoryVisitorSafety
{
    /// <summary>
    /// Alterna materiales de una luz de estado. Respeta el ajuste "Reducir destellos":
    /// en ese caso la luz queda fija encendida en lugar de parpadear.
    /// </summary>
    public class BlinkingLamp : MonoBehaviour
    {
        public Renderer lampRenderer;
        public Light lampLight;
        public Material onMaterial;
        public Material offMaterial;
        public float interval = 0.4f;
        public bool blinking;

        float m_Timer;
        bool m_On = true;

        public void SetState(Material on, bool blink)
        {
            onMaterial = on;
            blinking = blink;
            m_On = true;
            m_Timer = 0f;
            Apply();
        }

        public void TurnOff()
        {
            blinking = false;
            m_On = false;
            Apply();
        }

        void Update()
        {
            if (!blinking || ComfortSettings.ReduceFlashing)
            {
                if (blinking && !m_On)
                {
                    m_On = true;
                    Apply();
                }
                return;
            }
            m_Timer += Time.deltaTime;
            if (m_Timer >= interval)
            {
                m_Timer = 0f;
                m_On = !m_On;
                Apply();
            }
        }

        void Apply()
        {
            if (lampRenderer != null)
                lampRenderer.sharedMaterial = m_On && onMaterial != null ? onMaterial : offMaterial;
            if (lampLight != null)
                lampLight.enabled = m_On && onMaterial != null;
        }
    }
}
