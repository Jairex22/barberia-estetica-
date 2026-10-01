using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.UI;

namespace FactoryVisitorSafety
{
    /// <summary>
    /// Rayo de interacción del mando: apunta a menús (botones del lienzo modal en el espacio)
    /// y a objetos interactivos. El gatillo confirma.
    /// </summary>
    public class VRHandPointer : MonoBehaviour
    {
        public bool rightHand = true;
        public LineRenderer line;
        public MaterialPalette palette;
        public GameFlow game;
        public VRLocomotionInput locomotion;
        public float maxDistance = 8f;

        InputAction m_Trigger;
        Interactable m_Hovered;
        Button m_HoveredButton;

        void OnEnable()
        {
            m_Trigger = VRBindings.Trigger(rightHand);
            m_Trigger.Enable();
        }

        void OnDisable()
        {
            if (m_Trigger != null)
            {
                m_Trigger.Disable();
                m_Trigger.Dispose();
                m_Trigger = null;
            }
            SetHovered(null);
            SetHoveredButton(null);
            if (game != null && game.ui != null)
                game.ui.SetPrompt(this, null);
            if (line != null)
                line.enabled = false;
        }

        void Update()
        {
            if (game == null || game.ui == null)
                return;
            if (locomotion != null && locomotion.IsAimingWith(transform))
            {
                ClearAll();
                return;
            }

            var pressed = m_Trigger != null && m_Trigger.WasPressedThisFrame();
            var ray = new Ray(transform.position, transform.forward);
            var end = ray.origin + ray.direction * maxDistance;
            var lineMaterial = palette != null ? palette.rayNeutral : null;

            // 1) Menús en el espacio (tienen prioridad).
            if (game.ui.TryRaycastModal(ray, maxDistance, out var button, out var uiPoint))
            {
                SetHovered(null);
                game.ui.SetPrompt(this, null);
                end = uiPoint;
                if (button != null)
                {
                    SetHoveredButton(button);
                    lineMaterial = palette != null ? palette.rayValid : null;
                    if (pressed)
                        game.ui.ClickButton(button);
                }
                else
                {
                    SetHoveredButton(null);
                }
                DrawLine(ray.origin, end, lineMaterial);
                return;
            }
            SetHoveredButton(null);

            // 2) Objetos interactivos del recorrido.
            Interactable target = null;
            if (game.CanInteract && Physics.Raycast(ray, out var hit, maxDistance, ~0, QueryTriggerInteraction.Ignore))
            {
                end = hit.point;
                var candidate = hit.collider.GetComponentInParent<Interactable>();
                if (candidate != null && candidate.IsAvailable)
                    target = candidate;
            }
            SetHovered(target);
            if (target != null)
            {
                lineMaterial = palette != null ? palette.rayValid : null;
                game.ui.SetPrompt(this, UIText.Interact(true, target.prompt));
                if (pressed)
                    target.Interact();
            }
            else
            {
                game.ui.SetPrompt(this, null);
            }
            DrawLine(ray.origin, end, lineMaterial);
        }

        void DrawLine(Vector3 from, Vector3 to, Material material)
        {
            if (line == null)
                return;
            line.enabled = true;
            line.positionCount = 2;
            line.SetPosition(0, from);
            line.SetPosition(1, to);
            if (material != null)
                line.sharedMaterial = material;
        }

        void ClearAll()
        {
            SetHovered(null);
            SetHoveredButton(null);
            game.ui.SetPrompt(this, null);
            if (line != null)
                line.enabled = false;
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

        void SetHoveredButton(Button button)
        {
            if (m_HoveredButton == button)
                return;
            if (m_HoveredButton != null && game != null && game.ui != null)
                game.ui.SetButtonHover(m_HoveredButton, false);
            m_HoveredButton = button;
            if (m_HoveredButton != null && game != null && game.ui != null)
                game.ui.SetButtonHover(m_HoveredButton, true);
        }
    }
}
