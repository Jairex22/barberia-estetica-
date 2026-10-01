using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;

namespace FactoryVisitorSafety.EditorTools
{
    /// <summary>
    /// Menú "Factory Safety". La acción principal es "Generar todo": configura el proyecto,
    /// crea materiales, construye la escena con interfaz y referencias, la guarda y la valida.
    /// </summary>
    [InitializeOnLoad]
    internal static class FactorySafetyMenu
    {
        const string PromptKey = "FactorySafety.FirstRunPromptShown";

        static FactorySafetyMenu()
        {
            EditorApplication.delayCall += OfferFirstRun;
        }

        static void OfferFirstRun()
        {
            if (Application.isBatchMode || EditorApplication.isPlayingOrWillChangePlaymode)
                return;
            if (File.Exists(FactorySceneGenerator.ScenePath) || SessionState.GetBool(PromptKey, false))
                return;
            SessionState.SetBool(PromptKey, true);
            if (EditorUtility.DisplayDialog("Factory Visitor Safety VR",
                    "La escena del recorrido aún no existe.\n\n¿Quieres ejecutar ahora \"Factory Safety > Generar todo\"? " +
                    "Configura URP, Input System y OpenXR, crea los materiales y genera la escena FactoryTour.",
                    "Generar ahora", "Más tarde"))
            {
                GenerateAll();
            }
        }

        [MenuItem("Factory Safety/Generar todo (configurar + escena)", priority = 1)]
        public static void GenerateAll()
        {
            var config = ProjectConfigurator.ConfigureAll();
            Debug.Log("[Factory Safety] Configuración del proyecto:\n" + config);
            if (config.restartRequired)
            {
                var restart = EditorUtility.DisplayDialog("Reinicio necesario",
                    "Se activó el Input System (Active Input Handling). Unity debe reiniciarse para aplicar el cambio.\n\n" +
                    "Después del reinicio, vuelve a ejecutar \"Factory Safety > Generar todo\".",
                    "Reiniciar ahora", "Reiniciar después");
                if (restart)
                    EditorApplication.OpenProject(Directory.GetCurrentDirectory());
                return;
            }

            var ok = FactorySceneGenerator.Generate(out var summary);
            Debug.Log("[Factory Safety] " + summary);
            var validation = GeneratorValidator.Validate();
            Debug.Log("[Factory Safety] Validación:\n" + validation.Text);
            EditorUtility.DisplayDialog("Factory Visitor Safety VR",
                (ok ? "Listo. " : "No se completó la generación. ") + summary +
                "\n\nAvisos de configuración: " + config.warnings.Count +
                "\nProblemas de validación: " + validation.Errors +
                "\n\nRevisa la consola para el detalle. Pulsa Play para comenzar.",
                "Aceptar");
        }

        [MenuItem("Factory Safety/1. Configurar proyecto (URP, Input System, OpenXR)", priority = 20)]
        public static void ConfigureOnly()
        {
            var config = ProjectConfigurator.ConfigureAll();
            Debug.Log("[Factory Safety] Configuración del proyecto:\n" + config);
            EditorUtility.DisplayDialog("Configuración", config.ToString() +
                (config.restartRequired ? "\nReinicia Unity para aplicar el cambio de Input System." : ""), "Aceptar");
        }

        [MenuItem("Factory Safety/2. Generar o regenerar escena", priority = 21)]
        public static void GenerateSceneOnly()
        {
            var ok = FactorySceneGenerator.Generate(out var summary);
            Debug.Log("[Factory Safety] " + summary);
            if (!ok)
                EditorUtility.DisplayDialog("Factory Safety", summary, "Aceptar");
        }

        [MenuItem("Factory Safety/3. Validar escena y contenido", priority = 22)]
        public static void ValidateOnly()
        {
            var result = GeneratorValidator.Validate();
            Debug.Log("[Factory Safety] Validación:\n" + result.Text);
            EditorUtility.DisplayDialog("Validación", result.Errors == 0
                ? "Sin problemas detectados.\n\n" + result.Text
                : result.Errors + " problema(s). Revisa la consola.\n\n" + result.Text, "Aceptar");
        }

        [MenuItem("Factory Safety/Abrir escena del recorrido", priority = 40)]
        public static void OpenScene()
        {
            if (!File.Exists(FactorySceneGenerator.ScenePath))
            {
                EditorUtility.DisplayDialog("Factory Safety", "La escena aún no existe. Ejecuta \"Generar todo\".", "Aceptar");
                return;
            }
            if (EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo())
                EditorSceneManager.OpenScene(FactorySceneGenerator.ScenePath);
        }

        [MenuItem("Factory Safety/Compilar para Windows (64 bits)", priority = 60)]
        public static void BuildWindows()
        {
            WindowsBuilder.BuildInteractive();
        }

        [MenuItem("Factory Safety/Abrir carpeta de reportes", priority = 80)]
        public static void OpenReports()
        {
            var folder = ReportExporter.DefaultFolder;
            Directory.CreateDirectory(folder);
            EditorUtility.RevealInFinder(folder);
        }
    }
}
