using System;
using UnityEngine;

namespace FactoryVisitorSafety
{
    /// <summary>Ajustes de comodidad y accesibilidad guardados localmente con PlayerPrefs.</summary>
    public static class ComfortSettings
    {
        const string KeyTurn = "fvs.snapTurn";
        const string KeySeated = "fvs.seated";
        const string KeyFlash = "fvs.reduceFlashing";
        const string KeySensitivity = "fvs.mouseSensitivity";
        const string KeyVolume = "fvs.volume";

        static readonly int[] TurnOptions = { 30, 45, 60 };

        public static event Action Changed;

        public static int SnapTurnAngle { get; private set; } = 45;
        public static bool Seated { get; private set; }
        public static bool ReduceFlashing { get; private set; }
        public static float MouseSensitivity { get; private set; } = 1f;
        public static float Volume { get; private set; } = 0.8f;

        static bool s_Loaded;

        public static void Load()
        {
            if (s_Loaded)
                return;
            s_Loaded = true;
            try
            {
                SnapTurnAngle = PlayerPrefs.GetInt(KeyTurn, 45);
                if (Array.IndexOf(TurnOptions, SnapTurnAngle) < 0)
                    SnapTurnAngle = 45;
                Seated = PlayerPrefs.GetInt(KeySeated, 0) == 1;
                ReduceFlashing = PlayerPrefs.GetInt(KeyFlash, 0) == 1;
                MouseSensitivity = Mathf.Clamp(PlayerPrefs.GetFloat(KeySensitivity, 1f), 0.25f, 3f);
                Volume = Mathf.Clamp01(PlayerPrefs.GetFloat(KeyVolume, 0.8f));
            }
            catch (Exception e)
            {
                Debug.LogWarning("No se pudieron leer los ajustes guardados; se usan valores predeterminados. " + e.Message);
            }
            AudioListener.volume = Volume;
        }

        public static void CycleSnapTurn()
        {
            var index = Array.IndexOf(TurnOptions, SnapTurnAngle);
            SnapTurnAngle = TurnOptions[(index + 1) % TurnOptions.Length];
            Save();
        }

        public static void ToggleSeated()
        {
            Seated = !Seated;
            Save();
        }

        public static void ToggleReduceFlashing()
        {
            ReduceFlashing = !ReduceFlashing;
            Save();
        }

        public static void ChangeSensitivity(float delta)
        {
            MouseSensitivity = Mathf.Clamp(Mathf.Round((MouseSensitivity + delta) * 100f) / 100f, 0.25f, 3f);
            Save();
        }

        public static void ChangeVolume(float delta)
        {
            Volume = Mathf.Clamp01(Mathf.Round((Volume + delta) * 10f) / 10f);
            AudioListener.volume = Volume;
            Save();
        }

        static void Save()
        {
            try
            {
                PlayerPrefs.SetInt(KeyTurn, SnapTurnAngle);
                PlayerPrefs.SetInt(KeySeated, Seated ? 1 : 0);
                PlayerPrefs.SetInt(KeyFlash, ReduceFlashing ? 1 : 0);
                PlayerPrefs.SetFloat(KeySensitivity, MouseSensitivity);
                PlayerPrefs.SetFloat(KeyVolume, Volume);
                PlayerPrefs.Save();
            }
            catch (Exception e)
            {
                Debug.LogWarning("No se pudieron guardar los ajustes: " + e.Message);
            }
            Changed?.Invoke();
        }

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]
        static void ResetStatics()
        {
            s_Loaded = false;
            Changed = null;
        }
    }
}
