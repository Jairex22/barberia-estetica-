using UnityEngine;
using UnityEngine.InputSystem;

namespace FactoryVisitorSafety
{
    /// <summary>Control en primera persona para escritorio: WASD para moverse y ratón para mirar.</summary>
    [RequireComponent(typeof(CharacterController))]
    public class DesktopPlayerController : MonoBehaviour
    {
        public Transform cameraPivot;
        public float walkSpeed = 2.4f;
        public float lookSensitivity = 0.12f;
        public float gravity = -9.81f;

        CharacterController m_Controller;
        float m_Pitch;
        float m_VerticalVelocity;

        public bool MovementEnabled { get; set; }
        public bool LookEnabled { get; set; }

        void Awake()
        {
            m_Controller = GetComponent<CharacterController>();
        }

        void Update()
        {
            var kb = Keyboard.current;
            var mouse = Mouse.current;

            if (LookEnabled && mouse != null)
            {
                var delta = mouse.delta.ReadValue() * lookSensitivity * ComfortSettings.MouseSensitivity;
                transform.Rotate(Vector3.up, delta.x, Space.World);
                m_Pitch = Mathf.Clamp(m_Pitch - delta.y, -80f, 80f);
                if (cameraPivot != null)
                    cameraPivot.localRotation = Quaternion.Euler(m_Pitch, 0f, 0f);
            }

            var move = Vector3.zero;
            if (MovementEnabled && kb != null)
            {
                var input = Vector2.zero;
                if (kb.wKey.isPressed) input.y += 1f;
                if (kb.sKey.isPressed) input.y -= 1f;
                if (kb.dKey.isPressed) input.x += 1f;
                if (kb.aKey.isPressed) input.x -= 1f;
                if (input.sqrMagnitude > 1f)
                    input.Normalize();
                move = (transform.forward * input.y + transform.right * input.x) * walkSpeed;
            }

            if (m_Controller.isGrounded && m_VerticalVelocity < 0f)
                m_VerticalVelocity = -1f;
            m_VerticalVelocity += gravity * Time.deltaTime;
            move.y = m_VerticalVelocity;
            if (m_Controller.enabled)
                m_Controller.Move(move * Time.deltaTime);
        }

        public void Teleport(Vector3 position, float yaw)
        {
            m_Controller.enabled = false;
            transform.position = position;
            transform.rotation = Quaternion.Euler(0f, yaw, 0f);
            m_Pitch = 0f;
            if (cameraPivot != null)
                cameraPivot.localRotation = Quaternion.identity;
            m_VerticalVelocity = 0f;
            m_Controller.enabled = true;
        }
    }
}
