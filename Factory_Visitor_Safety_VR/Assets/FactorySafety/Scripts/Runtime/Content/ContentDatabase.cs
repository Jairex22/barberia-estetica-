using System;
using System.Collections.Generic;
using UnityEngine;

namespace FactoryVisitorSafety
{
    /// <summary>
    /// Carga los textos educativos desde Resources/Content/contenido_es.json.
    /// Si el archivo falta o es inválido, la aplicación sigue funcionando y muestra el problema.
    /// </summary>
    public static class ContentDatabase
    {
        public const string ResourcePath = "Content/contenido_es";

        static ContentData s_Data;
        static string s_LoadError;

        public static ContentData Data
        {
            get
            {
                if (s_Data == null)
                    Load();
                return s_Data;
            }
        }

        public static string LoadError
        {
            get
            {
                if (s_Data == null)
                    Load();
                return s_LoadError;
            }
        }

        public static void Load()
        {
            s_LoadError = null;
            try
            {
                var asset = Resources.Load<TextAsset>(ResourcePath);
                if (asset == null)
                {
                    s_LoadError = "No se encontró Resources/" + ResourcePath + ".json";
                    s_Data = new ContentData();
                    return;
                }
                s_Data = ParseJson(asset.text, out s_LoadError);
            }
            catch (Exception e)
            {
                s_LoadError = "Error al leer el contenido: " + e.Message;
                s_Data = new ContentData();
            }
            if (!string.IsNullOrEmpty(s_LoadError))
                Debug.LogError("[Factory Safety] " + s_LoadError);
        }

        /// <summary>Convierte el JSON en datos y devuelve los problemas encontrados (o null).</summary>
        public static ContentData ParseJson(string json, out string error)
        {
            error = null;
            ContentData data;
            try
            {
                data = JsonUtility.FromJson<ContentData>(json);
            }
            catch (Exception e)
            {
                error = "El JSON de contenido no es válido: " + e.Message;
                return new ContentData();
            }
            if (data == null)
            {
                error = "El JSON de contenido está vacío.";
                return new ContentData();
            }
            var missing = Validate(data);
            if (missing.Count > 0)
                error = "Faltan textos en el JSON: " + string.Join(", ", missing);
            return data;
        }

        public static List<string> Validate(ContentData data)
        {
            var missing = new List<string>();
            foreach (var id in new[] { "A", "B", "C", "D", "E", "F" })
            {
                if (FindScenario(data, id) == null)
                    missing.Add("escenario " + id);
            }
            foreach (var req in ContentRequirements.All)
            {
                var sc = FindScenario(data, req.scenarioId);
                if (sc == null)
                    continue;
                var ok = req.kind == "error" ? sc.GetError(req.id) != null : sc.GetOptionText(req.id) != null;
                if (!ok)
                    missing.Add(req.scenarioId + "/" + req.kind + "/" + req.id);
            }
            return missing;
        }

        static ScenarioContent FindScenario(ContentData data, string id)
        {
            if (data == null || data.escenarios == null)
                return null;
            foreach (var s in data.escenarios)
            {
                if (s != null && s.id == id)
                    return s;
            }
            return null;
        }

        public static ScenarioContent Scenario(string id)
        {
            var sc = FindScenario(Data, id);
            if (sc == null)
            {
                sc = new ScenarioContent
                {
                    id = id,
                    titulo = "Situación " + id + " (sin texto)",
                    categoria = "SEGURIDAD",
                    objetivoConCapacitacion = "(Falta el texto de esta situación en contenido_es.json)",
                    objetivoSinInduccion = "(Falta el texto de esta situación en contenido_es.json)",
                    guiaConCapacitacion = new string[0],
                    guiaSinInduccion = new string[0],
                    ayudaGuia = new string[0],
                    opciones = new DecisionOptionContent[0],
                    errores = new ErrorContent[0],
                    exito = new SuccessContent { titulo = "Decisión adecuada", mensaje = "" }
                };
            }
            return sc;
        }

        public static ErrorContent Error(string scenarioId, string errorId)
        {
            var e = Scenario(scenarioId).GetError(errorId);
            if (e != null)
                return e;
            return new ErrorContent
            {
                id = errorId,
                titulo = "Error registrado",
                queOcurrio = "(Falta el texto " + scenarioId + "/" + errorId + " en contenido_es.json)",
                informacionFaltante = "-",
                consecuencia = "-",
                decisionAdecuada = "-",
                factorOrganizacional = "-"
            };
        }

        public static string Option(string scenarioId, string optionId)
        {
            var text = Scenario(scenarioId).GetOptionText(optionId);
            return string.IsNullOrEmpty(text) ? optionId : text;
        }

        public static string[] Lines(string[] lines)
        {
            return lines ?? new string[0];
        }

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]
        static void ResetStatics()
        {
            s_Data = null;
            s_LoadError = null;
        }
    }
}
