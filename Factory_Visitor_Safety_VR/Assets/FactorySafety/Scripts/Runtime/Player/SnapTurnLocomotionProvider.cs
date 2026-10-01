using UnityEngine.XR.Interaction.Toolkit.Locomotion;

namespace FactoryVisitorSafety
{
    /// <summary>
    /// Giro por incrementos basado en el sistema de locomoción de XR Interaction Toolkit 3
    /// (LocomotionMediator + XRBodyTransformer). La lectura del stick la hace VRLocomotionInput.
    /// </summary>
    public class SnapTurnLocomotionProvider : LocomotionProvider
    {
        readonly XRBodyYawRotation m_Rotation = new XRBodyYawRotation();
        float m_PendingAngle;

        public void RequestTurn(float angle)
        {
            m_PendingAngle = angle;
        }

        protected void Update()
        {
            if (m_PendingAngle == 0f)
            {
                if (locomotionState == LocomotionState.Moving)
                    TryEndLocomotion();
                return;
            }

            if (locomotionState == LocomotionState.Idle)
                TryStartLocomotionImmediately();

            if (locomotionState == LocomotionState.Moving)
            {
                m_Rotation.angleDelta = m_PendingAngle;
                TryQueueTransformation(m_Rotation);
                m_PendingAngle = 0f;
                TryEndLocomotion();
            }
        }
    }
}
