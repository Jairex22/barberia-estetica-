using System;
using UnityEngine;
using UnityEngine.UI;

namespace FactoryVisitorSafety
{
    /// <summary>
    /// Objeto con el que el visitante puede interactuar (E en escritorio, gatillo en VR).
    /// Muestra un marcador flotante con texto para identificarlo sin depender del color.
    /// </summary>
    public class Interactable : MonoBehaviour
    {
        [Tooltip("Acción mostrada al apuntar, por ejemplo \"Revisar reglas\".")]
        public string prompt = "Interactuar";
        public GameObject marker;
        public Renderer markerRenderer;
        public Text markerLabel;
        public MaterialPalette palette;
        public bool available = true;

        public event Action<Interactable> Interacted;

        bool m_Hovered;

        public bool IsAvailable => available && isActiveAndEnabled;

        void OnEnable()
        {
            RefreshMarker();
        }

        public void SetAvailable(bool value)
        {
            available = value;
            if (!value)
                m_Hovered = false;
            RefreshMarker();
        }

        public void SetPrompt(string text)
        {
            prompt = text;
            if (markerLabel != null)
                markerLabel.text = text;
        }

        public void SetHovered(bool hovered)
        {
            if (m_Hovered == hovered)
                return;
            m_Hovered = hovered;
            RefreshMarker();
        }

        public void Interact()
        {
            if (!IsAvailable)
                return;
            Interacted?.Invoke(this);
        }

        void RefreshMarker()
        {
            if (marker != null)
                marker.SetActive(available);
            if (markerRenderer != null && palette != null)
                markerRenderer.sharedMaterial = m_Hovered ? palette.markerHover : palette.markerIdle;
            if (marker != null)
                marker.transform.localScale = Vector3.one * (m_Hovered ? 1.3f : 1f);
        }
    }
}
