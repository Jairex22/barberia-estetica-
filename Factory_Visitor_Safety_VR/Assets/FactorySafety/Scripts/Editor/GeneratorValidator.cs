using System.Collections.Generic;
using System.IO;
using System.Text;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEditor.XR.Management;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.XR.Management;

namespace FactoryVisitorSafety.EditorTools
{
    /// <summary>Comprobaciones automáticas tras generar: referencias, contenido, URP, XR y escenas de compilación.</summary>
    internal static class GeneratorValidator
    {
        public class Result
        {
            public int Errors;
            public readonly StringBuilder Log = new StringBuilder();
            public string Text => Log.ToString();

            public void Ok(string m) { Log.Append("OK: ").Append(m).Append('\n'); }
            public void Fail(string m) { Errors++; Log.Append("PROBLEMA: ").Append(m).Append('\n'); }
            public void Warn(string m) { Log.Append("AVISO: ").Append(m).Append('\n'); }
        }

        // Campos que pueden quedar vacíos por diseño (se asignan en tiempo de ejecución o son opcionales).
        static readonly HashSet<string> AllowedNull = new HashSet<string>
        {
            "ScenarioAccess.activationZone",
            "ScreenFader.vrGroup",
            "LazyFollow.target",
            "BlinkingLamp.lampLight",
            "BlinkingLamp.onMaterial",
            "UIManager.font",
            "SnapTurnLocomotionProvider.m_System"
        };

        public static Result Validate()
        {
            var r = new Result();
            ValidateContent(r);
            ValidateProject(r);
            ValidateScene(r);
            return r;
        }

        static void ValidateContent(Result r)
        {
            var asset = Resources.Load<TextAsset>(ContentDatabase.ResourcePath);
            if (asset == null)
            {
                r.Fail("No existe Resources/" + ContentDatabase.ResourcePath + ".json");
                return;
            }
            ContentDatabase.ParseJson(asset.text, out var error);
            if (string.IsNullOrEmpty(error))
                r.Ok("Contenido educativo (JSON) válido con todos los identificadores requeridos.");
            else
                r.Fail(error);
        }

        static void ValidateProject(Result r)
        {
            if (GraphicsSettings.defaultRenderPipeline != null)
                r.Ok("URP asignado en Graphics Settings.");
            else
                r.Fail("URP no está asignado. Ejecuta 'Factory Safety > 1. Configurar proyecto'.");

            EditorBuildSettings.TryGetConfigObject(XRGeneralSettings.k_SettingsKey, out XRGeneralSettingsPerBuildTarget perTarget);
            var general = perTarget != null ? perTarget.SettingsForBuildTarget(BuildTargetGroup.Standalone) : null;
            if (general == null || general.Manager == null)
            {
                r.Warn("XR Plug-in Management no está configurado: el modo VR mostrará un aviso y el modo escritorio funcionará.");
            }
            else
            {
                if (general.InitManagerOnStart)
                    r.Fail("'Initialize XR on Startup' está activado; debe estar desactivado para que el modo escritorio no requiera visor.");
                else
                    r.Ok("XR se inicia solo al elegir Realidad virtual.");
                var hasOpenXR = false;
                foreach (var l in general.Manager.activeLoaders)
                    hasOpenXR |= l != null && l.GetType().Name == "OpenXRLoader";
                if (hasOpenXR) r.Ok("Cargador OpenXR asignado (Windows).");
                else r.Warn("OpenXR no está asignado como cargador para Windows.");
            }

            var inScenes = false;
            foreach (var s in EditorBuildSettings.scenes)
                inScenes |= s.path == FactorySceneGenerator.ScenePath && s.enabled;
            if (inScenes) r.Ok("La escena está en Build Settings.");
            else r.Fail("La escena no está en Build Settings.");
        }

        static void ValidateScene(Result r)
        {
            if (!File.Exists(FactorySceneGenerator.ScenePath))
            {
                r.Fail("No existe la escena " + FactorySceneGenerator.ScenePath);
                return;
            }
            var scene = EditorSceneManager.GetActiveScene();
            if (scene.path != FactorySceneGenerator.ScenePath)
            {
                if (!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo())
                {
                    r.Warn("Validación de escena omitida (no se abrió la escena).");
                    return;
                }
                scene = EditorSceneManager.OpenScene(FactorySceneGenerator.ScenePath);
            }

            var behaviours = new List<MonoBehaviour>();
            var cameras = 0;
            var activeCameras = 0;
            foreach (var root in scene.GetRootGameObjects())
            {
                behaviours.AddRange(root.GetComponentsInChildren<MonoBehaviour>(true));
                foreach (var cam in root.GetComponentsInChildren<Camera>(true))
                {
                    cameras++;
                    if (cam.gameObject.activeInHierarchy && cam.enabled)
                        activeCameras++;
                }
            }

            var missing = 0;
            var scenarios = 0;
            foreach (var b in behaviours)
            {
                if (b == null)
                {
                    r.Fail("Hay un componente con script faltante en la escena.");
                    continue;
                }
                var type = b.GetType();
                if (type.Namespace == null || !type.Namespace.StartsWith("FactoryVisitorSafety"))
                    continue;
                if (b is ScenarioBase)
                    scenarios++;
                var so = new SerializedObject(b);
                var it = so.GetIterator();
                while (it.NextVisible(true))
                {
                    if (it.propertyType != SerializedPropertyType.ObjectReference || it.objectReferenceValue != null)
                        continue;
                    if (it.name == "m_Script")
                        continue;
                    var field = it.propertyPath.Split('.')[0];
                    if (AllowedNull.Contains(type.Name + "." + field))
                        continue;
                    missing++;
                    if (missing <= 25)
                        r.Fail("Referencia vacía: " + Path(b.transform) + " → " + type.Name + "." + it.propertyPath);
                }
            }
            if (missing == 0)
                r.Ok("Todas las referencias de los componentes del simulador están asignadas.");
            if (scenarios == 6) r.Ok("Seis situaciones (A-F) presentes.");
            else r.Fail("Se esperaban 6 situaciones y hay " + scenarios + ".");
            if (activeCameras == 1) r.Ok("Una sola cámara activa al iniciar (" + cameras + " en total; la de VR permanece desactivada).");
            else r.Fail("Cámaras activas al iniciar: " + activeCameras + " (debe haber exactamente 1).");
        }

        static string Path(Transform t)
        {
            var sb = new StringBuilder(t.name);
            while (t.parent != null)
            {
                t = t.parent;
                sb.Insert(0, t.name + "/");
            }
            return sb.ToString();
        }
    }

    /// <summary>Comandos para ejecutar el generador sin interfaz (Unity -batchmode -executeMethod ...).</summary>
    public static class BatchCommands
    {
        public static void GenerateAll()
        {
            var config = ProjectConfigurator.ConfigureAll();
            Debug.Log("[Factory Safety] Configuración:\n" + config);
            if (config.restartRequired)
                Debug.LogWarning("[Factory Safety] Se cambió Active Input Handling; vuelve a ejecutar este comando para generar la escena con el editor reiniciado.");
            var ok = FactorySceneGenerator.Generate(out var summary);
            Debug.Log("[Factory Safety] " + summary);
            var result = GeneratorValidator.Validate();
            Debug.Log("[Factory Safety] Validación:\n" + result.Text);
            if (!ok || result.Errors > 0)
                EditorApplication.Exit(1);
        }
    }
}
