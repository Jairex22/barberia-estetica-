using UnityEngine.InputSystem;

namespace FactoryVisitorSafety
{
    /// <summary>
    /// Rutas de Input System para mandos OpenXR. Se usan "usages" genéricos ({TriggerButton},
    /// {Primary2DAxis}, ...) para cubrir los perfiles de interacción habilitados en OpenXR.
    /// </summary>
    public static class VRBindings
    {
        public static string Hand(bool right) => right ? "{RightHand}" : "{LeftHand}";

        public static InputAction Trigger(bool right)
        {
            var action = new InputAction("Gatillo" + Hand(right), InputActionType.Button);
            action.AddBinding("<XRController>" + Hand(right) + "/{TriggerButton}");
            return action;
        }

        public static InputAction Thumbstick(bool right)
        {
            var action = new InputAction("Stick" + Hand(right), InputActionType.Value, expectedControlType: "Vector2");
            action.AddBinding("<XRController>" + Hand(right) + "/{Primary2DAxis}");
            return action;
        }

        public static InputAction Menu()
        {
            var action = new InputAction("Menu", InputActionType.Button);
            action.AddBinding("<XRController>{LeftHand}/{MenuButton}");
            action.AddBinding("<XRController>{RightHand}/{MenuButton}");
            action.AddBinding("<XRController>{LeftHand}/{SecondaryButton}");
            action.AddBinding("<XRController>{RightHand}/{SecondaryButton}");
            return action;
        }
    }
}
