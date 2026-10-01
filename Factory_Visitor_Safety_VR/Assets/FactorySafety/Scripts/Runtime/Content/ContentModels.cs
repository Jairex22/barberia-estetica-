using System;
using System.Collections.Generic;

namespace FactoryVisitorSafety
{
    // Clases que reflejan la estructura de Resources/Content/contenido_es.json.
    // Los nombres de campo deben coincidir exactamente con las claves del JSON.

    [Serializable]
    public class DecisionOptionContent
    {
        public string id;
        public string texto;
    }

    [Serializable]
    public class ErrorContent
    {
        public string id;
        public string titulo;
        public string queOcurrio;
        public string informacionFaltante;
        public string consecuencia;
        public string decisionAdecuada;
        public string factorOrganizacional;
    }

    [Serializable]
    public class SuccessContent
    {
        public string titulo;
        public string mensaje;
    }

    [Serializable]
    public class ScenarioContent
    {
        public string id;
        public string titulo;
        public string area;
        public string categoria;
        public string objetivoConCapacitacion;
        public string objetivoSinInduccion;
        public string[] guiaConCapacitacion;
        public string[] guiaSinInduccion;
        public string[] ayudaGuia;
        public string[] intervencionGuia;
        public string[] resolucionGuia;
        public string pregunta;
        public DecisionOptionContent[] opciones;
        public SuccessContent exito;
        public ErrorContent[] errores;

        public ErrorContent GetError(string errorId)
        {
            if (errores != null)
            {
                foreach (var e in errores)
                {
                    if (e != null && e.id == errorId)
                        return e;
                }
            }
            return null;
        }

        public string GetOptionText(string optionId)
        {
            if (opciones != null)
            {
                foreach (var o in opciones)
                {
                    if (o != null && o.id == optionId)
                        return o.texto;
                }
            }
            return null;
        }
    }

    [Serializable]
    public class ContentData
    {
        public string version;
        public string descargo;
        public string[] induccion;
        public string[] reglasVisitantes;
        public string[] eppRequerido;
        public ScenarioContent[] escenarios;
    }

    /// <summary>Requisito de contenido usado por la validación (escenario, tipo, id).</summary>
    public struct ContentRequirement
    {
        public string scenarioId;
        public string kind;
        public string id;

        public ContentRequirement(string scenarioId, string kind, string id)
        {
            this.scenarioId = scenarioId;
            this.kind = kind;
            this.id = id;
        }
    }

    public static class ContentRequirements
    {
        /// <summary>
        /// Identificadores que el código de cada situación espera encontrar en el JSON.
        /// Puedes cambiar los textos libremente, pero estos "id" deben mantenerse.
        /// </summary>
        public static readonly List<ContentRequirement> All = new List<ContentRequirement>
        {
            new ContentRequirement("A", "error", "acceso_sin_requisitos"),

            new ContentRequirement("B", "error", "invadir_ruta"),
            new ContentRequirement("B", "error", "cruce_sin_senal"),

            new ContentRequirement("C", "opcion", "reportar"),
            new ContentRequirement("C", "opcion", "limpiar"),
            new ContentRequirement("C", "opcion", "ignorar"),
            new ContentRequirement("C", "error", "limpiar"),
            new ContentRequirement("C", "error", "pisar"),
            new ContentRequirement("C", "error", "ignorar"),

            new ContentRequirement("D", "opcion", "reportar"),
            new ContentRequirement("D", "opcion", "entrar"),
            new ContentRequirement("D", "opcion", "ignorar"),
            new ContentRequirement("D", "error", "entrar_zona"),
            new ContentRequirement("D", "error", "ignorar"),

            new ContentRequirement("E", "opcion", "reportar"),
            new ContentRequirement("E", "opcion", "corregir"),
            new ContentRequirement("E", "opcion", "ignorar"),
            new ContentRequirement("E", "error", "manipular_piezas"),
            new ContentRequirement("E", "error", "no_advertir"),

            new ContentRequirement("F", "opcion", "reportar"),
            new ContentRequirement("F", "opcion", "mover"),
            new ContentRequirement("F", "opcion", "ignorar"),
            new ContentRequirement("F", "error", "mover_cajas"),
            new ContentRequirement("F", "error", "ruta_no_reportada"),
            new ContentRequirement("F", "error", "regresar"),
        };
    }
}
