using System;
using System.Collections.Generic;
using System.Text;
using UnityEditor;
using UnityEditor.XR.Management;
using UnityEditor.XR.Management.Metadata;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
using UnityEngine.XR.Management;
using UnityEngine.XR.OpenXR;
using UnityEngine.XR.OpenXR.Features.Interactions;

namespace FactoryVisitorSafety.EditorTools
{
    /// <summary>
    /// Configura el proyecto: Input System, URP, OpenXR (sin iniciar XR al arrancar),
    /// ajustes del reproductor y escenas de compilación. Puede ejecutarse varias veces.
    /// </summary>
    internal static class ProjectConfigurator
    {
        public const string SettingsFolder = "Assets/FactorySafety/Settings";
        public const string UrpAssetPath = SettingsFolder + "/URP_Asset.asset";
        public const string UrpRendererPath = SettingsFolder + "/URP_Renderer.asset";
        const string OpenXRLoaderType = "UnityEngine.XR.OpenXR.OpenXRLoader";

        public class Report
        {
            public readonly List<string> done = new List<string>();
            public readonly List<string> warnings = new List<string>();
            public bool restartRequired;

            public override string ToString()
            {
                var sb = new StringBuilder();
                foreach (var d in done) sb.Append("OK: ").Append(d).Append('\n');
                foreach (var w in warnings) sb.Append("AVISO: ").Append(w).Append('\n');
                return sb.ToString();
            }
        }

        public static Report ConfigureAll()
        {
            var report = new Report();
            Step(report, "Input System", () => ConfigureInputHandling(report));
            Step(report, "Ajustes del reproductor", () => ConfigurePlayer(report));
            Step(report, "URP", () => ConfigureUrp(report));
            Step(report, "OpenXR", () => ConfigureXr(report));
            AssetDatabase.SaveAssets();
            return report;
        }

        static void Step(Report report, string name, Action action)
        {
            try
            {
                action();
            }
            catch (Exception e)
            {
                report.warnings.Add(name + ": " + e.Message);
                Debug.LogException(e);
            }
        }

        /// <summary>Activa el Input System ("Input System Package (New)"). Requiere reiniciar el editor si cambia.</summary>
        static void ConfigureInputHandling(Report report)
        {
            var assets = AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/ProjectSettings.asset");
            if (assets == null || assets.Length == 0)
            {
                report.warnings.Add("No se pudo leer ProjectSettings.asset para revisar 'Active Input Handling'.");
                return;
            }
            var so = new SerializedObject(assets[0]);
            var prop = so.FindProperty("activeInputHandler");
            if (prop == null)
            {
                report.warnings.Add("No se encontró 'activeInputHandler'. Revisa Project Settings > Player > Active Input Handling.");
                return;
            }
            if (prop.intValue == 1 || prop.intValue == 2)
            {
                report.done.Add("Active Input Handling ya usa el Input System (valor " + prop.intValue + ").");
                return;
            }
            prop.intValue = 1;
            so.ApplyModifiedPropertiesWithoutUndo();
            report.restartRequired = true;
            report.done.Add("Active Input Handling cambiado a 'Input System Package (New)'.");
        }

        static void ConfigurePlayer(Report report)
        {
            PlayerSettings.companyName = "Demostracion Educativa";
            PlayerSettings.productName = "Factory Visitor Safety VR";
            PlayerSettings.bundleVersion = "1.0.0";
            PlayerSettings.colorSpace = ColorSpace.Linear;
            PlayerSettings.runInBackground = true;
            PlayerSettings.fullScreenMode = FullScreenMode.FullScreenWindow;
            PlayerSettings.resizableWindow = true;
            PlayerSettings.defaultScreenWidth = 1920;
            PlayerSettings.defaultScreenHeight = 1080;
            report.done.Add("Ajustes del reproductor (nombre, versión 1.0.0, espacio de color lineal).");
        }

        static void ConfigureUrp(Report report)
        {
            MaterialLibrary.EnsureFolder(SettingsFolder);
            var asset = AssetDatabase.LoadAssetAtPath<UniversalRenderPipelineAsset>(UrpAssetPath);
            if (asset == null)
            {
                var rendererData = AssetDatabase.LoadAssetAtPath<UniversalRendererData>(UrpRendererPath);
                if (rendererData == null)
                {
                    rendererData = ScriptableObject.CreateInstance<UniversalRendererData>();
                    AssetDatabase.CreateAsset(rendererData, UrpRendererPath);
                }
                asset = UniversalRenderPipelineAsset.Create(rendererData);
                AssetDatabase.CreateAsset(asset, UrpAssetPath);
                report.done.Add("Creado el recurso URP (" + UrpAssetPath + ").");
            }
            asset.msaaSampleCount = 4;
            asset.shadowDistance = 45f;
            asset.renderScale = 1f;
            EditorUtility.SetDirty(asset);

            GraphicsSettings.defaultRenderPipeline = asset;
            var current = QualitySettings.GetQualityLevel();
            var names = QualitySettings.names;
            for (var i = 0; i < names.Length; i++)
            {
                QualitySettings.SetQualityLevel(i, false);
                QualitySettings.renderPipeline = asset;
            }
            QualitySettings.SetQualityLevel(current, false);
            report.done.Add("URP asignado en Graphics y en " + names.Length + " niveles de calidad.");
        }

        static void ConfigureXr(Report report)
        {
            var perTarget = FindOrCreateXrSettings();
            if (!perTarget.HasManagerSettingsForBuildTarget(BuildTargetGroup.Standalone))
                perTarget.CreateDefaultManagerSettingsForBuildTarget(BuildTargetGroup.Standalone);
            var general = perTarget.SettingsForBuildTarget(BuildTargetGroup.Standalone);
            if (general == null || general.Manager == null)
            {
                report.warnings.Add("No se pudieron crear los ajustes de XR Plug-in Management. Ábrelos en Project Settings > XR Plug-in Management y vuelve a ejecutar la configuración.");
                return;
            }

            // XR se inicia manualmente al elegir "Realidad virtual" en el menú.
            general.InitManagerOnStart = false;
            EditorUtility.SetDirty(general);

            var hasOpenXR = false;
            foreach (var loader in general.Manager.activeLoaders)
            {
                if (loader != null && loader.GetType().FullName == OpenXRLoaderType)
                    hasOpenXR = true;
            }
            if (!hasOpenXR)
                hasOpenXR = XRPackageMetadataStore.AssignLoader(general.Manager, OpenXRLoaderType, BuildTargetGroup.Standalone);
            if (hasOpenXR)
                report.done.Add("OpenXR asignado para Windows (Standalone) con 'Initialize XR on Startup' desactivado.");
            else
                report.warnings.Add("No se pudo asignar el cargador OpenXR. Actívalo en Project Settings > XR Plug-in Management > pestaña Windows > OpenXR.");

            var openXrSettings = OpenXRSettings.GetSettingsForBuildTargetGroup(BuildTargetGroup.Standalone);
            if (openXrSettings == null)
            {
                report.warnings.Add("No se encontraron los ajustes de OpenXR. Abre Project Settings > XR Plug-in Management > OpenXR una vez y repite la configuración.");
                return;
            }
            var enabled = new List<string>();
            EnableProfile<OculusTouchControllerProfile>(openXrSettings, "Oculus Touch Controller Profile", enabled);
            EnableProfile<ValveIndexControllerProfile>(openXrSettings, "Valve Index Controller Profile", enabled);
            EnableProfile<HTCViveControllerProfile>(openXrSettings, "HTC Vive Controller Profile", enabled);
            EnableProfile<KHRSimpleControllerProfile>(openXrSettings, "Khronos Simple Controller Profile", enabled);
            EditorUtility.SetDirty(openXrSettings);
            if (enabled.Count > 0)
                report.done.Add("Perfiles de interacción OpenXR habilitados: " + string.Join(", ", enabled) + ".");
            else
                report.warnings.Add("No se habilitó ningún perfil de interacción OpenXR. Agrégalos en Project Settings > XR Plug-in Management > OpenXR > Interaction Profiles.");
        }

        static void EnableProfile<T>(OpenXRSettings settings, string label, List<string> enabled) where T : UnityEngine.XR.OpenXR.Features.OpenXRFeature
        {
            var feature = settings.GetFeature<T>();
            if (feature == null)
                return;
            feature.enabled = true;
            EditorUtility.SetDirty(feature);
            enabled.Add(label);
        }

        static XRGeneralSettingsPerBuildTarget FindOrCreateXrSettings()
        {
            EditorBuildSettings.TryGetConfigObject(XRGeneralSettings.k_SettingsKey, out XRGeneralSettingsPerBuildTarget perTarget);
            if (perTarget != null)
                return perTarget;
            var guids = AssetDatabase.FindAssets("t:XRGeneralSettingsPerBuildTarget");
            if (guids.Length > 0)
                perTarget = AssetDatabase.LoadAssetAtPath<XRGeneralSettingsPerBuildTarget>(AssetDatabase.GUIDToAssetPath(guids[0]));
            if (perTarget == null)
            {
                MaterialLibrary.EnsureFolder("Assets/XR");
                perTarget = ScriptableObject.CreateInstance<XRGeneralSettingsPerBuildTarget>();
                AssetDatabase.CreateAsset(perTarget, "Assets/XR/XRGeneralSettingsPerBuildTarget.asset");
            }
            EditorBuildSettings.AddConfigObject(XRGeneralSettings.k_SettingsKey, perTarget, true);
            return perTarget;
        }

        public static void SetBuildScenes(string scenePath)
        {
            var scenes = new List<EditorBuildSettingsScene> { new EditorBuildSettingsScene(scenePath, true) };
            foreach (var s in EditorBuildSettings.scenes)
            {
                if (s.path != scenePath)
                    scenes.Add(s);
            }
            EditorBuildSettings.scenes = scenes.ToArray();
        }
    }
}
