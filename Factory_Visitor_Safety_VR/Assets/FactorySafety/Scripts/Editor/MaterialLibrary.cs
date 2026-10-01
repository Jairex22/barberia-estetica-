using System.Collections.Generic;
using System.IO;
using UnityEditor;
using UnityEngine;
using UnityEngine.Rendering;

namespace FactoryVisitorSafety.EditorTools
{
    /// <summary>
    /// Crea o actualiza los materiales del proyecto (sin duplicarlos) y la paleta usada en tiempo de ejecución.
    /// Usa los shaders de URP si URP está activo; en caso contrario, Standard/Unlit como respaldo.
    /// </summary>
    internal static class MaterialLibrary
    {
        public const string Folder = "Assets/FactorySafety/Materials";
        public const string PalettePath = Folder + "/MaterialPalette.asset";

        struct Spec
        {
            public string name;
            public Color color;
            public bool unlit;
            public float smoothness;
            public float metallic;

            public Spec(string name, Color color, bool unlit = false, float smoothness = 0.25f, float metallic = 0f)
            {
                this.name = name;
                this.color = color;
                this.unlit = unlit;
                this.smoothness = smoothness;
                this.metallic = metallic;
            }
        }

        static readonly Spec[] Specs =
        {
            new Spec("Piso", new Color(0.56f, 0.57f, 0.59f)),
            new Spec("PisoRecepcion", new Color(0.72f, 0.70f, 0.66f), smoothness: 0.4f),
            new Spec("PisoCarril", new Color(0.36f, 0.37f, 0.40f)),
            new Spec("PasilloVerde", new Color(0.22f, 0.58f, 0.32f)),
            new Spec("ZonaRestringida", new Color(0.92f, 0.82f, 0.45f)),
            new Spec("Amarillo", new Color(0.97f, 0.80f, 0.10f)),
            new Spec("Negro", new Color(0.08f, 0.08f, 0.09f)),
            new Spec("Blanco", new Color(0.95f, 0.95f, 0.95f)),
            new Spec("Pared", new Color(0.84f, 0.86f, 0.88f)),
            new Spec("ParedAcento", new Color(0.26f, 0.45f, 0.68f)),
            new Spec("Techo", new Color(0.70f, 0.71f, 0.73f)),
            new Spec("Acero", new Color(0.62f, 0.64f, 0.67f), smoothness: 0.55f, metallic: 0.6f),
            new Spec("MetalOscuro", new Color(0.22f, 0.23f, 0.26f), smoothness: 0.45f, metallic: 0.5f),
            new Spec("Maquina", new Color(0.30f, 0.50f, 0.62f), smoothness: 0.4f, metallic: 0.3f),
            new Spec("Carton", new Color(0.66f, 0.49f, 0.30f)),
            new Spec("Madera", new Color(0.58f, 0.43f, 0.27f)),
            new Spec("RackNaranja", new Color(0.92f, 0.45f, 0.10f)),
            new Spec("Montacargas", new Color(0.96f, 0.70f, 0.05f), smoothness: 0.45f),
            new Spec("Caucho", new Color(0.10f, 0.10f, 0.11f)),
            new Spec("Vidrio", new Color(0.62f, 0.80f, 0.90f), smoothness: 0.9f),
            new Spec("Derrame", new Color(0.18f, 0.14f, 0.40f), smoothness: 0.95f),
            new Spec("Cono", new Color(1.00f, 0.45f, 0.05f)),
            new Spec("Rojo", new Color(0.80f, 0.13f, 0.10f)),
            new Spec("Verde", new Color(0.12f, 0.58f, 0.26f)),
            new Spec("Azul", new Color(0.16f, 0.36f, 0.80f)),
            new Spec("Piel1", new Color(0.87f, 0.70f, 0.56f)),
            new Spec("Piel2", new Color(0.62f, 0.44f, 0.31f)),
            new Spec("Piel3", new Color(0.42f, 0.29f, 0.20f)),
            new Spec("Pantalon", new Color(0.20f, 0.23f, 0.32f)),
            new Spec("CamisaGuia", new Color(0.12f, 0.30f, 0.62f)),
            new Spec("CamisaGris", new Color(0.55f, 0.57f, 0.60f)),
            new Spec("CamisaVerde", new Color(0.25f, 0.50f, 0.35f)),
            new Spec("CamisaRoja", new Color(0.62f, 0.20f, 0.20f)),
            new Spec("Bata", new Color(0.90f, 0.92f, 0.95f)),
            new Spec("ChalecoAltaVis", new Color(0.78f, 1.00f, 0.12f)),
            new Spec("CascoBlanco", new Color(0.96f, 0.96f, 0.96f)),
            new Spec("CascoAmarillo", new Color(0.98f, 0.82f, 0.10f)),
            new Spec("CascoNaranja", new Color(1.00f, 0.50f, 0.10f)),
            new Spec("PCB", new Color(0.06f, 0.45f, 0.22f), smoothness: 0.5f),
            new Spec("Pasto", new Color(0.36f, 0.55f, 0.30f)),
            new Spec("Asfalto", new Color(0.32f, 0.33f, 0.35f)),
            new Spec("Planta", new Color(0.20f, 0.52f, 0.25f)),
            new Spec("ConectorCorrecto", new Color(0.15f, 0.40f, 0.95f)),
            new Spec("ConectorIncorrecto", new Color(1.00f, 0.50f, 0.05f)),

            new Spec("LuzBlanca", new Color(0.98f, 0.98f, 0.95f), true),
            new Spec("LuzVerde", new Color(0.10f, 0.95f, 0.30f), true),
            new Spec("LuzRoja", new Color(1.00f, 0.12f, 0.08f), true),
            new Spec("LuzAmbar", new Color(1.00f, 0.65f, 0.05f), true),
            new Spec("LuzAzul", new Color(0.20f, 0.50f, 1.00f), true),
            new Spec("LuzApagada", new Color(0.18f, 0.18f, 0.20f), true),
            new Spec("SalidaVerde", new Color(0.05f, 0.62f, 0.25f), true),
            new Spec("RayoNeutral", new Color(0.90f, 0.92f, 0.95f), true),
            new Spec("RayoValido", new Color(0.15f, 0.95f, 0.45f), true),
            new Spec("RayoInvalido", new Color(1.00f, 0.25f, 0.20f), true),
            new Spec("MarcadorReposo", new Color(1.00f, 0.85f, 0.10f), true),
            new Spec("MarcadorActivo", new Color(0.35f, 1.00f, 1.00f), true),
        };

        public static bool UsingUrp => GraphicsSettings.defaultRenderPipeline != null;

        public static Dictionary<string, Material> CreateOrUpdate(out MaterialPalette palette)
        {
            EnsureFolder(Folder);
            var lit = FindShader(UsingUrp ? "Universal Render Pipeline/Lit" : "Standard", "Standard");
            var unlit = FindShader(UsingUrp ? "Universal Render Pipeline/Unlit" : "Unlit/Color", "Unlit/Color");
            var result = new Dictionary<string, Material>();
            foreach (var spec in Specs)
            {
                var path = Folder + "/" + spec.name + ".mat";
                var shader = spec.unlit ? unlit : lit;
                var mat = AssetDatabase.LoadAssetAtPath<Material>(path);
                if (mat == null)
                {
                    mat = new Material(shader) { name = spec.name };
                    AssetDatabase.CreateAsset(mat, path);
                }
                else if (mat.shader != shader)
                {
                    mat.shader = shader;
                }
                Apply(mat, spec);
                EditorUtility.SetDirty(mat);
                result[spec.name] = mat;
            }

            palette = AssetDatabase.LoadAssetAtPath<MaterialPalette>(PalettePath);
            if (palette == null)
            {
                palette = ScriptableObject.CreateInstance<MaterialPalette>();
                AssetDatabase.CreateAsset(palette, PalettePath);
            }
            palette.lampGreen = result["LuzVerde"];
            palette.lampRed = result["LuzRoja"];
            palette.lampAmber = result["LuzAmbar"];
            palette.lampOff = result["LuzApagada"];
            palette.lampBlue = result["LuzAzul"];
            palette.rayNeutral = result["RayoNeutral"];
            palette.rayValid = result["RayoValido"];
            palette.rayInvalid = result["RayoInvalido"];
            palette.connectorCorrect = result["ConectorCorrecto"];
            palette.connectorWrong = result["ConectorIncorrecto"];
            palette.markerIdle = result["MarcadorReposo"];
            palette.markerHover = result["MarcadorActivo"];
            EditorUtility.SetDirty(palette);
            AssetDatabase.SaveAssets();
            return result;
        }

        static Shader FindShader(string preferred, string fallback)
        {
            var s = Shader.Find(preferred);
            if (s == null)
            {
                Debug.LogWarning("[Factory Safety] No se encontró el shader " + preferred + "; se usa " + fallback + ".");
                s = Shader.Find(fallback);
            }
            return s;
        }

        static void Apply(Material mat, Spec spec)
        {
            if (mat.HasProperty("_BaseColor"))
                mat.SetColor("_BaseColor", spec.color);
            if (mat.HasProperty("_Color"))
                mat.SetColor("_Color", spec.color);
            if (spec.unlit)
                return;
            if (mat.HasProperty("_Smoothness"))
                mat.SetFloat("_Smoothness", spec.smoothness);
            if (mat.HasProperty("_Glossiness"))
                mat.SetFloat("_Glossiness", spec.smoothness);
            if (mat.HasProperty("_Metallic"))
                mat.SetFloat("_Metallic", spec.metallic);
        }

        public static void EnsureFolder(string path)
        {
            if (AssetDatabase.IsValidFolder(path))
                return;
            var parent = Path.GetDirectoryName(path)?.Replace('\\', '/');
            var leaf = Path.GetFileName(path);
            if (!string.IsNullOrEmpty(parent) && !AssetDatabase.IsValidFolder(parent))
                EnsureFolder(parent);
            AssetDatabase.CreateFolder(parent, leaf);
        }
    }
}
