using UnityEngine;
using UnityEngine.InputSystem;

namespace FactoryVisitorSafety
{
    /// <summary>Interacción de escritorio: apunta con el centro de la pantalla y pulsa E.</summary>
    public class DesktopInteractor : MonoBehaviour
    {
        public Camera viewCamera;
        public GameFlow game;
        public float maxDistance = 4.5f;

        Interactable m_Hovered;

        void Update()
        {
            if (game == null || game.ui == null || viewCamera == null)
                return;
            Interactable target = null;
            if (game.CanInteract)
            {
                var ray = new Ray(viewCamera.transform.position, viewCamera.transform.forward);
                if (Physics.Raycast(ray, out var hit, maxDistance, ~0, QueryTriggerInteraction.Ignore))
                {
                    var candidate = hit.collider.GetComponentInParent<Interactable>();
                    if (candidate != null && candidate.IsAvailable)
                        target = candidate;
                }
            }
            SetHovered(target);
            game.ui.SetPrompt(this, target != null ? UIText.Interact(false, target.prompt) : null);

            var kb = Keyboard.current;
            if (target != null && kb != null && kb.eKey.wasPressedThisFrame)
                target.Interact();
        }

        void SetHovered(Interactable target)
        {
            if (m_Hovered == target)
                return;
            if (m_Hovered != null)
                m_Hovered.SetHovered(false);
            m_Hovered = target;
            if (m_Hovered != null)
                m_Hovered.SetHovered(true);
        }

        void OnDisable()
        {
            SetHovered(null);
            if (game != null && game.ui != null)
                game.ui.SetPrompt(this, null);
        }
    }
}
