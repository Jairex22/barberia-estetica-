using System;
using System.Collections;
using UnityEngine;
using UnityEngine.XR.Management;

namespace FactoryVisitorSafety
{
    /// <summary>
    /// Inicia y detiene OpenXR manualmente (XR Plug-in Management con "Initialize XR on Startup"
    /// desactivado). Así el modo de escritorio nunca necesita un visor.
    /// </summary>
    public class XRSessionController : MonoBehaviour
    {
        public static bool IsRunning
        {
            get
            {
                var settings = XRGeneralSettings.Instance;
                return settings != null && settings.Manager != null && settings.Manager.activeLoader != null;
            }
        }

        public bool IsStarting { get; private set; }

        public IEnumerator StartXR(Action<bool, string> done)
        {
            if (IsRunning)
            {
                done?.Invoke(true, null);
                yield break;
            }
            var settings = XRGeneralSettings.Instance;
            if (settings == null || settings.Manager == null)
            {
                done?.Invoke(false, UIText.XrNotConfigured);
                yield break;
            }
            if (settings.Manager.activeLoaders == null || settings.Manager.activeLoaders.Count == 0)
            {
                done?.Invoke(false, UIText.XrNotConfigured);
                yield break;
            }

            IsStarting = true;
            yield return settings.Manager.InitializeLoader();
            IsStarting = false;

            if (settings.Manager.activeLoader == null)
            {
                Debug.LogWarning("[Factory Safety] OpenXR no pudo inicializarse (no hay visor o runtime activo).");
                done?.Invoke(false, UIText.XrNoHeadset);
                yield break;
            }

            settings.Manager.StartSubsystems();
            done?.Invoke(true, null);
        }

        public void StopXR()
        {
            var settings = XRGeneralSettings.Instance;
            if (settings == null || settings.Manager == null || settings.Manager.activeLoader == null)
                return;
            settings.Manager.StopSubsystems();
            settings.Manager.DeinitializeLoader();
        }

        void OnApplicationQuit()
        {
            StopXR();
        }
    }
}
