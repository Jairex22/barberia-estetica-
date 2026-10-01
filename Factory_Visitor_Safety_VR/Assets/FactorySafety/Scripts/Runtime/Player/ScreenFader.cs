using System.Collections;
using UnityEngine;

namespace FactoryVisitorSafety
{
    /// <summary>Fundido a negro para reposicionar al visitante sin movimientos bruscos de cámara.</summary>
    public class ScreenFader : MonoBehaviour
    {
        public CanvasGroup desktopGroup;
        public CanvasGroup vrGroup;

        float m_Alpha;

        void Awake()
        {
            SetAlpha(0f);
        }

        public IEnumerator FadeTo(float alpha, float seconds)
        {
            var start = m_Alpha;
            var t = 0f;
            while (t < seconds)
            {
                t += Time.unscaledDeltaTime;
                SetAlpha(Mathf.Lerp(start, alpha, seconds <= 0f ? 1f : t / seconds));
                yield return null;
            }
            SetAlpha(alpha);
        }

        void SetAlpha(float a)
        {
            m_Alpha = a;
            if (desktopGroup != null)
            {
                desktopGroup.alpha = a;
                desktopGroup.blocksRaycasts = a > 0.01f;
            }
            if (vrGroup != null)
                vrGroup.alpha = a;
        }
    }
}
