using System.Collections.Generic;
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.XR.Interaction.Toolkit.Locomotion.Teleportation;

namespace FactoryVisitorSafety
{
    /// <summary>
    /// Lee los sticks de los mandos: hacia adelante muestra un arco de teletransporte (se ejecuta al soltar),
    /// izquierda/derecha aplica un giro por incrementos. El desplazamiento se delega en los proveedores
    /// de locomoción de XR Interaction Toolkit (TeleportationProvider y SnapTurnLocomotionProvider).
    /// </summary>
    public class VRLocomotionInput : MonoBehaviour
    {
        public Transform leftHand;
        public Transform rightHand;
        public Transform head;
        public LineRenderer arcLine;
        public Transform reticle;
        public Renderer reticleRenderer;
        public MaterialPalette palette;
        public TeleportationProvider teleportProvider;
        public SnapTurnLocomotionProvider turnProvider;
        public PlayerRigManager rigs;
        public GameFlow game;
        public float arcVelocity = 7f;
        public float maxDistance = 8f;

        InputAction m_LeftStick;
        InputAction m_RightStick;
        InputAction m_Menu;
        Transform m_AimingHand;
        bool m_TurnArmedLeft = true;
        bool m_TurnArmedRight = true;
        bool m_HasTarget;
        Vector3 m_Target;
        readonly List<Vector3> m_Points = new List<Vector3>();

        public bool IsAimingWith(Transform hand) => m_AimingHand != null && m_AimingHand == hand;

        void OnEnable()
        {
            m_LeftStick = VRBindings.Thumbstick(false);
            m_RightStick = VRBindings.Thumbstick(true);
            m_Menu = VRBindings.Menu();
            m_LeftStick.Enable();
            m_RightStick.Enable();
            m_Menu.Enable();
            CancelAim();
        }

        void OnDisable()
        {
            DisposeAction(ref m_LeftStick);
            DisposeAction(ref m_RightStick);
            DisposeAction(ref m_Menu);
            CancelAim();
        }

        static void DisposeAction(ref InputAction action)
        {
            if (action == null)
                return;
            action.Disable();
            action.Dispose();
            action = null;
        }

        public bool MenuPressedThisFrame()
        {
            return m_Menu != null && m_Menu.WasPressedThisFrame();
        }

        void Update()
        {
            if (game == null || !game.CanMove)
            {
                CancelAim();
                return;
            }
            Handle(m_RightStick != null ? m_RightStick.ReadValue<Vector2>() : Vector2.zero, rightHand, ref m_TurnArmedRight);
            Handle(m_LeftStick != null ? m_LeftStick.ReadValue<Vector2>() : Vector2.zero, leftHand, ref m_TurnArmedLeft);
        }

        void Handle(Vector2 stick, Transform hand, ref bool turnArmed)
        {
            if (hand == null)
                return;
            if (m_AimingHand == hand)
            {
                if (stick.magnitude < 0.3f)
                {
                    if (m_HasTarget)
                        Teleport(m_Target);
                    CancelAim();
                }
                else
                {
                    UpdateArc(hand);
                }
                return;
            }
            if (m_AimingHand != null)
                return;

            if (stick.y > 0.7f && Mathf.Abs(stick.x) < 0.6f)
            {
                m_AimingHand = hand;
                UpdateArc(hand);
                return;
            }

            if (turnArmed && Mathf.Abs(stick.x) > 0.75f && Mathf.Abs(stick.y) < 0.6f)
            {
                var angle = Mathf.Sign(stick.x) * ComfortSettings.SnapTurnAngle;
                if (turnProvider != null && turnProvider.isActiveAndEnabled)
                    turnProvider.RequestTurn(angle);
                else if (rigs != null)
                    rigs.RotateVr(angle);
                turnArmed = false;
            }
            if (Mathf.Abs(stick.x) < 0.3f)
                turnArmed = true;
        }

        void UpdateArc(Transform hand)
        {
            m_Points.Clear();
            m_HasTarget = false;
            var position = hand.position;
            var velocity = hand.forward * arcVelocity;
            var gravity = Physics.gravity;
            m_Points.Add(position);
            const float step = 0.04f;
            var hitFound = false;
            RaycastHit hit = default;
            for (var i = 0; i < 60; i++)
            {
                var next = position + velocity * step + 0.5f * gravity * step * step;
                velocity += gravity * step;
                var seg = next - position;
                if (Physics.Raycast(position, seg.normalized, out hit, seg.magnitude, ~0, QueryTriggerInteraction.Ignore))
                {
                    m_Points.Add(hit.point);
                    hitFound = true;
                    break;
                }
                m_Points.Add(next);
                position = next;
                if (position.y < -5f)
                    break;
            }

            var valid = false;
            if (hitFound && hit.normal.y > 0.8f && hit.collider.GetComponentInParent<TeleportSurface>() != null)
            {
                var from = head != null ? head.position : hand.position;
                var flat = hit.point - from;
                flat.y = 0f;
                valid = flat.magnitude <= maxDistance;
            }

            m_HasTarget = valid;
            m_Target = hit.point;

            if (arcLine != null)
            {
                arcLine.enabled = true;
                arcLine.positionCount = m_Points.Count;
                for (var i = 0; i < m_Points.Count; i++)
                    arcLine.SetPosition(i, m_Points[i]);
                if (palette != null)
                    arcLine.sharedMaterial = valid ? palette.rayValid : palette.rayInvalid;
            }
            if (reticle != null)
            {
                reticle.gameObject.SetActive(hitFound);
                if (hitFound)
                    reticle.position = hit.point + Vector3.up * 0.02f;
                if (reticleRenderer != null && palette != null)
                    reticleRenderer.sharedMaterial = valid ? palette.rayValid : palette.rayInvalid;
            }
        }

        void Teleport(Vector3 target)
        {
            if (teleportProvider != null && teleportProvider.isActiveAndEnabled)
            {
                teleportProvider.QueueTeleportRequest(new TeleportRequest
                {
                    destinationPosition = target,
                    destinationRotation = Quaternion.identity,
                    matchOrientation = MatchOrientation.None,
                    requestTime = Time.time
                });
            }
            else if (rigs != null)
            {
                rigs.MoveVrTo(target);
            }
        }

        void CancelAim()
        {
            m_AimingHand = null;
            m_HasTarget = false;
            if (arcLine != null)
                arcLine.enabled = false;
            if (reticle != null)
                reticle.gameObject.SetActive(false);
        }
    }
}
