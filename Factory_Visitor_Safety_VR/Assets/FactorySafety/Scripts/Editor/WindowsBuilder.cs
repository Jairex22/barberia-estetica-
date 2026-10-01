using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEngine;

namespace FactoryVisitorSafety.EditorTools
{
    /// <summary>Compilación de Windows 64 bits. También puede ejecutarse por línea de comandos con -executeMethod.</summary>
    public static class WindowsBuilder
    {
        public const string DefaultOutput = "Builds/Windows/FactoryVisitorSafetyVR.exe";

        public static void BuildInteractive()
        {
            if (!File.Exists(FactorySceneGenerator.ScenePath))
            {
                EditorUtility.DisplayDialog("Compilar", "Primero ejecuta \"Factory Safety > Generar todo\".", "Aceptar");
                return;
            }
            var result = Build(DefaultOutput);
            EditorUtility.DisplayDialog("Compilar para Windows", result, "Aceptar");
        }

        /// <summary>Punto de entrada para línea de comandos: -executeMethod FactoryVisitorSafety.EditorTools.WindowsBuilder.BuildFromCommandLine</summary>
        public static void BuildFromCommandLine()
        {
            var message = Build(DefaultOutput);
            Debug.Log("[Factory Safety] " + message);
            if (!message.StartsWith("Compilación correcta"))
                EditorApplication.Exit(1);
        }

        static string Build(string output)
        {
            ProjectConfigurator.SetBuildScenes(FactorySceneGenerator.ScenePath);
            Directory.CreateDirectory(Path.GetDirectoryName(output));
            var options = new BuildPlayerOptions
            {
                scenes = new[] { FactorySceneGenerator.ScenePath },
                locationPathName = output,
                target = BuildTarget.StandaloneWindows64,
                options = BuildOptions.None
            };
            var report = BuildPipeline.BuildPlayer(options);
            var summary = report.summary;
            if (summary.result == BuildResult.Succeeded)
                return "Compilación correcta: " + Path.GetFullPath(output) + " (" + (summary.totalSize / (1024 * 1024)) + " MB)";
            return "La compilación terminó con estado " + summary.result + ". Errores: " + summary.totalErrors + ". Revisa la consola.";
        }
    }
}
