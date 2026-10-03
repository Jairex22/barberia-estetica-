using System;
using System.Globalization;
using System.IO;
using System.Text;
using UnityEngine;

namespace FactoryVisitorSafety
{
    public struct ExportResult
    {
        public bool jsonOk;
        public bool csvOk;
        public string folder;
        public string jsonPath;
        public string csvPath;
        public string message;
        public bool AllOk => jsonOk && csvOk;
    }

    /// <summary>
    /// Guarda el reporte de la sesión en JSON y CSV dentro de la carpeta de datos persistentes.
    /// Nunca lanza excepciones hacia la interfaz: devuelve un resultado con un mensaje legible.
    /// </summary>
    public static class ReportExporter
    {
        public static string DefaultFolder => Path.Combine(Application.persistentDataPath, "Reportes");

        public static ExportResult Export(SessionReport report, string folder = null)
        {
            var result = new ExportResult { folder = folder ?? DefaultFolder };
            if (report == null)
            {
                result.message = "No hay una sesión para guardar.";
                return result;
            }

            var baseName = "reporte_" + SafeFileName(report.idSesion);
            result.jsonPath = Path.Combine(result.folder, baseName + ".json");
            result.csvPath = Path.Combine(result.folder, baseName + ".csv");

            try
            {
                Directory.CreateDirectory(result.folder);
            }
            catch (Exception e)
            {
                result.message = "No se pudo crear la carpeta de reportes (" + result.folder + "): " + e.Message;
                Debug.LogWarning(result.message);
                return result;
            }

            var errors = new StringBuilder();
            try
            {
                File.WriteAllText(result.jsonPath, JsonUtility.ToJson(report, true), new UTF8Encoding(false));
                result.jsonOk = true;
            }
            catch (Exception e)
            {
                errors.Append("JSON no guardado: ").Append(e.Message).Append(". ");
            }

            try
            {
                // UTF-8 con BOM para que hojas de cálculo muestren bien los acentos.
                File.WriteAllText(result.csvPath, BuildCsv(report), new UTF8Encoding(true));
                result.csvOk = true;
            }
            catch (Exception e)
            {
                errors.Append("CSV no guardado: ").Append(e.Message).Append(". ");
            }

            if (result.AllOk)
                result.message = "Reporte guardado en:\n" + result.jsonPath + "\n" + result.csvPath;
            else if (result.jsonOk || result.csvOk)
                result.message = "Guardado parcial. " + errors + "Carpeta: " + result.folder;
            else
                result.message = "No se pudo guardar el reporte. " + errors + "La aplicación sigue funcionando; revisa permisos o espacio en disco.";

            if (!result.AllOk)
                Debug.LogWarning(result.message);
            return result;
        }

        static string SafeFileName(string value)
        {
            if (string.IsNullOrEmpty(value))
                return "sesion";
            foreach (var c in Path.GetInvalidFileNameChars())
                value = value.Replace(c, '_');
            return value;
        }

        public static string BuildCsv(SessionReport r)
        {
            var inv = CultureInfo.InvariantCulture;
            var sb = new StringBuilder();
            sb.AppendLine("seccion,campo,valor");
            Row(sb, "resumen", "aplicacion", r.aplicacion);
            Row(sb, "resumen", "version", r.versionAplicacion);
            Row(sb, "resumen", "version_unity", r.versionUnity);
            Row(sb, "resumen", "id_sesion", r.idSesion);
            Row(sb, "resumen", "modo_visita", r.modoVisita);
            Row(sb, "resumen", "plataforma", r.plataforma);
            Row(sb, "resumen", "inicio", r.inicioLocal);
            Row(sb, "resumen", "fin", r.finLocal);
            Row(sb, "resumen", "duracion_segundos", r.duracionSegundos.ToString("0.0", inv));
            Row(sb, "resumen", "recorrido_completo", r.recorridoCompleto ? "si" : "no");
            Row(sb, "resumen", "situaciones_completadas", r.situacionesCompletadas.ToString(inv));
            Row(sb, "resumen", "situaciones_resueltas_adecuadamente", r.situacionesResueltasAdecuadamente.ToString(inv));
            Row(sb, "resumen", "peligros_seguridad_identificados", r.peligrosSeguridadIdentificados.ToString(inv));
            Row(sb, "resumen", "problemas_calidad_identificados", r.problemasCalidadIdentificados.ToString(inv));
            Row(sb, "resumen", "reportes_realizados", r.reportesRealizados.ToString(inv));
            Row(sb, "resumen", "decisiones_tomadas", r.decisionesTomadas.ToString(inv));
            Row(sb, "resumen", "errores", r.errores.ToString(inv));
            Row(sb, "resumen", "reintentos", r.reintentos.ToString(inv));
            Row(sb, "resumen", "puntuacion_educativa", r.puntuacionEducativa.ToString(inv));
            Row(sb, "resumen", "calculo_puntuacion", r.comoSeCalculaLaPuntuacion);
            Row(sb, "resumen", "aviso", r.aviso);
            sb.AppendLine();

            sb.AppendLine("situacion,titulo,categoria,estado,errores,reintentos,decisiones,peligro_identificado,reportado,segundos,puntuacion");
            foreach (var s in r.situaciones)
            {
                sb.Append(Csv(s.id)).Append(',')
                    .Append(Csv(s.titulo)).Append(',')
                    .Append(Csv(s.categoria)).Append(',')
                    .Append(Csv(s.estado)).Append(',')
                    .Append(s.errores.ToString(inv)).Append(',')
                    .Append(s.reintentos.ToString(inv)).Append(',')
                    .Append(s.decisiones.ToString(inv)).Append(',')
                    .Append(s.peligroIdentificado ? "si" : "no").Append(',')
                    .Append(s.reportado ? "si" : "no").Append(',')
                    .Append(s.segundosEnSituacion.ToString("0.0", inv)).Append(',')
                    .Append(s.puntuacion.ToString(inv)).AppendLine();
            }
            sb.AppendLine();

            sb.AppendLine("segundo,situacion,tipo,codigo,adecuada,descripcion");
            foreach (var e in r.eventos)
            {
                sb.Append(e.segundo.ToString("0.0", inv)).Append(',')
                    .Append(Csv(e.situacion)).Append(',')
                    .Append(Csv(e.tipo)).Append(',')
                    .Append(Csv(e.codigo)).Append(',')
                    .Append(e.adecuada ? "si" : "no").Append(',')
                    .Append(Csv(e.descripcion)).AppendLine();
            }
            return sb.ToString();
        }

        static void Row(StringBuilder sb, string section, string field, string value)
        {
            sb.Append(Csv(section)).Append(',').Append(Csv(field)).Append(',').Append(Csv(value)).AppendLine();
        }

        public static string Csv(string value)
        {
            if (value == null)
                return "";
            var needsQuotes = value.IndexOfAny(new[] { ',', '"', '\n', '\r', ';' }) >= 0;
            var escaped = value.Replace("\"", "\"\"");
            return needsQuotes ? "\"" + escaped + "\"" : escaped;
        }
    }
}
