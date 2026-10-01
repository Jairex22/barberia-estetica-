using System;
using System.Collections;
using Unity.XR.CoreUtils;
using UnityEngine;

namespace FactoryVisitorSafety
{
    /// <summary>
    /// Selecciona entre el rig de escritorio y el rig de VR. Nunca hay dos rigs (ni dos cámaras)
    /// activos a la vez: se desactiva uno antes de activar el otro.
    /// </summary>
    public class PlayerRigManager : MonoBehaviour
    {
        [Header("Escritorio")]
        public GameObject desktopRig;
        public DesktopPlayerController desktopController;
        public Camera desktopCamera;

        [Header("Realidad virtual")]
        public GameObject vrRig;
        public XROrigin xrOrigin;
        public Camera vrCamera;
        public Transform vrComfortOffset;
        public VRLocomotionInput vrLocomotion;

        [Header("Servicios")]
        public XRSessionController xrSession;
        public Transform startPoint;

        public InputPlatform Platform { get; private set; } = InputPlatform.Desktop;
        public Camera ActiveCamera => Platform == InputPlatform.VirtualReality ? vrCamera : desktopCamera;
        public Transform Head => ActiveCamera != null ? ActiveCamera.transform : transform;

        const float SeatedOffset = 0.45f;

        void OnEnable()
        {
            ComfortSettings.Changed += ApplyComfort;
        }

        void OnDisable()
        {
            ComfortSettings.Changed -= ApplyComfort;
        }

        /// <summary>Posición de los pies del visitante (sobre el piso).</summary>
        public Vector3 FootPosition
        {
            get
            {
                if (Platform == InputPlatform.VirtualReality && vrCamera != null && xrOrigin != null)
                {
                    var head = vrCamera.transform.position;
                    return new Vector3(head.x, xrOrigin.transform.position.y, head.z);
                }
                return desktopRig != null ? desktopRig.transform.position : transform.position;
            }
        }

        public float Yaw => Head.eulerAngles.y;

        public void ActivateDesktop()
        {
            var pos = FootPosition;
            var yaw = Yaw;
            var wasVr = Platform == InputPlatform.VirtualReality;
            if (vrRig != null)
                vrRig.SetActive(false);
            if (desktopRig != null)
                desktopRig.SetActive(true);
            Platform = InputPlatform.Desktop;
            if (wasVr && desktopController != null)
                desktopController.Teleport(pos, yaw);
        }

        public IEnumerator ActivateVR(Action<bool, string> done)
        {
            if (vrRig == null || xrOrigin == null || xrSession == null)
            {
                done?.Invoke(false, UIText.XrNotConfigured);
                yield break;
            }
            var ok = false;
            string message = null;
            yield return xrSession.StartXR((success, msg) =>
            {
                ok = success;
                message = msg;
            });
            if (!ok)
            {
                done?.Invoke(false, message);
                yield break;
            }

            var pos = FootPosition;
            var yaw = desktopRig != null ? desktopRig.transform.eulerAngles.y : 0f;
            if (desktopRig != null)
                desktopRig.SetActive(false);
            xrOrigin.transform.SetPositionAndRotation(pos, Quaternion.Euler(0f, yaw, 0f));
            vrRig.SetActive(true);
            Platform = InputPlatform.VirtualReality;
            ApplyComfort();
            done?.Invoke(true, null);
        }

        /// <summary>Detiene OpenXR (si estaba activo) y vuelve al rig de escritorio.</summary>
        public void StopVRAndUseDesktop()
        {
            ActivateDesktop();
            if (xrSession != null)
                xrSession.StopXR();
        }

        public void TeleportTo(Vector3 position, float yaw)
        {
            if (Platform == InputPlatform.VirtualReality && xrOrigin != null && vrCamera != null)
            {
                var forward = Quaternion.Euler(0f, yaw, 0f) * Vector3.forward;
                xrOrigin.MatchOriginUpCameraForward(Vector3.up, forward);
                MoveVrTo(position);
            }
            else if (desktopController != null)
            {
                desktopController.Teleport(position, yaw);
            }
        }

        /// <summary>Mueve el origen XR para que los pies del usuario queden en el destino.</summary>
        public void MoveVrTo(Vector3 position)
        {
            if (xrOrigin == null)
                return;
            var foot = FootPosition;
            var origin = xrOrigin.transform;
            origin.position += new Vector3(position.x - foot.x, 0f, position.z - foot.z);
            origin.position = new Vector3(origin.position.x, position.y, origin.position.z);
        }

        public void RotateVr(float degrees)
        {
            if (xrOrigin != null)
                xrOrigin.RotateAroundCameraUsingOriginUp(degrees);
        }

        public void SetDesktopControl(bool move, bool look)
        {
            if (desktopController == null)
                return;
            desktopController.MovementEnabled = move;
            desktopController.LookEnabled = look;
        }

        public bool MenuPressedVR()
        {
            return Platform == InputPlatform.VirtualReality && vrLocomotion != null && vrLocomotion.MenuPressedThisFrame();
        }

        void ApplyComfort()
        {
            if (vrComfortOffset != null)
                vrComfortOffset.localPosition = new Vector3(0f, ComfortSettings.Seated ? SeatedOffset : 0f, 0f);
        }
    }
}
