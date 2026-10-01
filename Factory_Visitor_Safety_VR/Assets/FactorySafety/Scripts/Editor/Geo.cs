using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace FactoryVisitorSafety.EditorTools
{
    /// <summary>Ayudas para construir geometría low poly con primitivas y textos en el mundo.</summary>
    internal static class Geo
    {
        public static Dictionary<string, Material> Mats = new Dictionary<string, Material>();
        public static MaterialPalette Palette;
        public static Font Font;

        public const float WallHeight = 4.5f;
        public const float WallThickness = 0.2f;
        public const float DoorHeight = 2.8f;

        public static Material M(string name)
        {
            if (Mats.TryGetValue(name, out var m))
                return m;
            Debug.LogWarning("[Factory Safety] Material no encontrado: " + name);
            return null;
        }

        public static Transform Group(string name, Transform parent)
        {
            var go = new GameObject(name);
            if (parent != null)
                go.transform.SetParent(parent, false);
            return go.transform;
        }

        public static Transform Point(string name, Transform parent, Vector3 worldPos, float yaw)
        {
            var t = Group(name, parent);
            t.SetPositionAndRotation(worldPos, Quaternion.Euler(0f, yaw, 0f));
            return t;
        }

        static GameObject Primitive(PrimitiveType type, string name, Transform parent, string mat, bool collider, bool shadows)
        {
            var go = GameObject.CreatePrimitive(type);
            go.name = name;
            go.transform.SetParent(parent, false);
            var r = go.GetComponent<Renderer>();
            if (r != null)
            {
                var m = M(mat);
                if (m != null)
                    r.sharedMaterial = m;
                if (!shadows)
                    r.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            }
            if (!collider)
            {
                var c = go.GetComponent<Collider>();
                if (c != null)
                    Object.DestroyImmediate(c);
            }
            return go;
        }

        /// <summary>Caja en coordenadas mundiales (centro y tamaño).</summary>
        public static GameObject Box(string name, Transform parent, Vector3 center, Vector3 size, string mat, bool collider = true, bool shadows = true)
        {
            var go = Primitive(PrimitiveType.Cube, name, parent, mat, collider, shadows);
            go.transform.position = center;
            go.transform.localScale = size;
            return go;
        }

        /// <summary>Caja en coordenadas locales del padre.</summary>
        public static GameObject LocalBox(string name, Transform parent, Vector3 localCenter, Vector3 size, string mat, bool collider = false, bool shadows = true)
        {
            var go = Primitive(PrimitiveType.Cube, name, parent, mat, collider, shadows);
            go.transform.localPosition = localCenter;
            go.transform.localRotation = Quaternion.identity;
            go.transform.localScale = size;
            return go;
        }

        public static GameObject LocalCylinder(string name, Transform parent, Vector3 localCenter, float diameter, float height, string mat, bool collider = false)
        {
            var go = Primitive(PrimitiveType.Cylinder, name, parent, mat, collider, true);
            go.transform.localPosition = localCenter;
            go.transform.localScale = new Vector3(diameter, height * 0.5f, diameter);
            return go;
        }

        public static GameObject LocalSphere(string name, Transform parent, Vector3 localCenter, Vector3 size, string mat, bool collider = false)
        {
            var go = Primitive(PrimitiveType.Sphere, name, parent, mat, collider, true);
            go.transform.localPosition = localCenter;
            go.transform.localScale = size;
            return go;
        }

        public static GameObject Cylinder(string name, Transform parent, Vector3 baseCenter, float diameter, float height, string mat, bool collider = true)
        {
            var go = Primitive(PrimitiveType.Cylinder, name, parent, mat, collider, true);
            go.transform.position = baseCenter + Vector3.up * (height * 0.5f);
            go.transform.localScale = new Vector3(diameter, height * 0.5f, diameter);
            return go;
        }

        /// <summary>Marca de piso (sin colisión ni sombras).</summary>
        public static GameObject FloorMark(string name, Transform parent, Vector3 center, Vector3 size, string mat, float y = 0.006f)
        {
            var go = Box(name, parent, new Vector3(center.x, y, center.z), new Vector3(size.x, 0.01f, size.z), mat, false, false);
            return go;
        }

        public static GameObject Floor(string name, Transform parent, float x0, float x1, float z0, float z1, string mat)
        {
            var go = Box(name, parent, new Vector3((x0 + x1) * 0.5f, -0.05f, (z0 + z1) * 0.5f), new Vector3(x1 - x0, 0.1f, z1 - z0), mat, true, false);
            go.AddComponent<TeleportSurface>();
            return go;
        }

        public static void Roof(string name, Transform parent, float x0, float x1, float z0, float z1)
        {
            Box(name, parent, new Vector3((x0 + x1) * 0.5f, WallHeight + 0.05f, (z0 + z1) * 0.5f), new Vector3(x1 - x0 + 0.4f, 0.1f, z1 - z0 + 0.4f), "Techo", true, false);
            // Luminarias (sin luces reales para mantener buen rendimiento en VR).
            for (var x = x0 + 2.5f; x < x1 - 1f; x += 5f)
            {
                for (var z = z0 + 2.5f; z < z1 - 1f; z += 5f)
                    Box("Luminaria", parent, new Vector3(x, WallHeight - 0.06f, z), new Vector3(1.4f, 0.06f, 0.35f), "LuzBlanca", false, false);
            }
        }

        /// <summary>Muro a lo largo del eje X (z fijo) con aberturas [desde, hasta] en X.</summary>
        public static void WallAlongX(string name, Transform parent, float z, float x0, float x1, params Vector2[] openings)
        {
            var cuts = new List<Vector2>(openings);
            cuts.Sort((a, b) => a.x.CompareTo(b.x));
            var start = x0;
            foreach (var o in cuts)
            {
                if (o.x > start)
                    Box(name, parent, new Vector3((start + o.x) * 0.5f, WallHeight * 0.5f, z), new Vector3(o.x - start, WallHeight, WallThickness), "Pared");
                Box(name + " (dintel)", parent, new Vector3((o.x + o.y) * 0.5f, (DoorHeight + WallHeight) * 0.5f, z), new Vector3(o.y - o.x, WallHeight - DoorHeight, WallThickness), "ParedAcento");
                start = o.y;
            }
            if (x1 > start)
                Box(name, parent, new Vector3((start + x1) * 0.5f, WallHeight * 0.5f, z), new Vector3(x1 - start, WallHeight, WallThickness), "Pared");
        }

        /// <summary>Muro a lo largo del eje Z (x fijo) con aberturas [desde, hasta] en Z.</summary>
        public static void WallAlongZ(string name, Transform parent, float x, float z0, float z1, params Vector2[] openings)
        {
            var cuts = new List<Vector2>(openings);
            cuts.Sort((a, b) => a.x.CompareTo(b.x));
            var start = z0;
            foreach (var o in cuts)
            {
                if (o.x > start)
                    Box(name, parent, new Vector3(x, WallHeight * 0.5f, (start + o.x) * 0.5f), new Vector3(WallThickness, WallHeight, o.x - start), "Pared");
                Box(name + " (dintel)", parent, new Vector3(x, (DoorHeight + WallHeight) * 0.5f, (o.x + o.y) * 0.5f), new Vector3(WallThickness, WallHeight - DoorHeight, o.y - o.x), "ParedAcento");
                start = o.y;
            }
            if (z1 > start)
                Box(name, parent, new Vector3(x, WallHeight * 0.5f, (start + z1) * 0.5f), new Vector3(WallThickness, WallHeight, z1 - start), "Pared");
        }

        /// <summary>Texto en un lienzo del mundo. "scale" convierte píxeles del lienzo a metros.</summary>
        public static Text WorldText(string name, Transform parent, Vector3 localPos, Quaternion localRot, string text, int fontSize, Color color,
            Vector2 sizePx, float scale = 0.004f, bool billboard = false, Color? background = null, FontStyle style = FontStyle.Bold)
        {
            var go = new GameObject(name, typeof(RectTransform));
            go.transform.SetParent(parent, false);
            go.transform.localPosition = localPos;
            go.transform.localRotation = localRot;
            go.transform.localScale = Vector3.one * scale;
            var canvas = go.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.WorldSpace;
            ((RectTransform)go.transform).sizeDelta = sizePx;
            if (background.HasValue)
            {
                var bg = new GameObject("Fondo", typeof(RectTransform));
                bg.transform.SetParent(go.transform, false);
                var img = bg.AddComponent<Image>();
                img.color = background.Value;
                img.raycastTarget = false;
                Stretch((RectTransform)bg.transform);
            }
            var tgo = new GameObject("Texto", typeof(RectTransform));
            tgo.transform.SetParent(go.transform, false);
            var t = tgo.AddComponent<Text>();
            t.font = Font;
            t.text = text;
            t.fontSize = fontSize;
            t.fontStyle = style;
            t.color = color;
            t.alignment = TextAnchor.MiddleCenter;
            t.horizontalOverflow = HorizontalWrapMode.Wrap;
            t.verticalOverflow = VerticalWrapMode.Truncate;
            t.supportRichText = true;
            t.raycastTarget = false;
            var trt = (RectTransform)tgo.transform;
            Stretch(trt);
            trt.offsetMin = new Vector2(10f, 6f);
            trt.offsetMax = new Vector2(-10f, -6f);
            if (billboard)
                go.AddComponent<Billboard>();
            return t;
        }

        static void Stretch(RectTransform rt)
        {
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
        }

        /// <summary>
        /// Letrero con placa y texto. "facing" es la dirección (horizontal) hacia donde está el lector.
        /// </summary>
        public static Text Sign(string name, Transform parent, Vector3 center, Vector3 facing, string text, float width, float height,
            string boardMat, Color textColor, int fontSize)
        {
            facing.y = 0f;
            var root = Group(name, parent);
            root.position = center;
            root.rotation = Quaternion.LookRotation(-facing.normalized, Vector3.up);
            LocalBox("Placa", root, new Vector3(0f, 0f, 0.025f), new Vector3(width, height, 0.04f), boardMat);
            const float scale = 0.004f;
            return WorldText("Texto", root, new Vector3(0f, 0f, -0.01f), Quaternion.identity, text, fontSize, textColor,
                new Vector2(width / scale, height / scale), scale);
        }

        public static ZoneVolume Zone(string name, Transform parent, Vector3 center, Vector3 size, Color color)
        {
            var t = Group(name, parent);
            t.position = new Vector3(center.x, 1.5f, center.z);
            var z = t.gameObject.AddComponent<ZoneVolume>();
            z.zoneId = name;
            z.size = new Vector3(size.x, 3f, size.z);
            z.gizmoColor = color;
            return z;
        }

        /// <summary>Convierte un objeto en interactivo y le agrega un marcador flotante con texto.</summary>
        public static Interactable MakeInteractable(GameObject target, string prompt, Vector3 markerWorldPos, Vector3? colliderSize = null)
        {
            if (colliderSize.HasValue)
            {
                var bc = target.GetComponent<BoxCollider>();
                if (bc == null)
                    bc = target.AddComponent<BoxCollider>();
                var ls = target.transform.lossyScale;
                bc.size = new Vector3(colliderSize.Value.x / Mathf.Max(0.001f, ls.x), colliderSize.Value.y / Mathf.Max(0.001f, ls.y), colliderSize.Value.z / Mathf.Max(0.001f, ls.z));
                bc.center = Vector3.zero;
            }
            var it = target.AddComponent<Interactable>();
            it.prompt = prompt;
            it.palette = Palette;

            var marker = new GameObject("Marcador interactivo");
            marker.transform.SetParent(target.transform, true);
            marker.transform.position = markerWorldPos;
            marker.transform.rotation = Quaternion.identity;
            var ls2 = target.transform.lossyScale;
            marker.transform.localScale = new Vector3(1f / Mathf.Max(0.001f, ls2.x), 1f / Mathf.Max(0.001f, ls2.y), 1f / Mathf.Max(0.001f, ls2.z));

            var spinRoot = Group("Giro", marker.transform);
            var diamond = LocalBox("Rombo", spinRoot, Vector3.zero, Vector3.one * 0.16f, "MarcadorReposo", false, false);
            diamond.transform.localRotation = Quaternion.Euler(45f, 0f, 45f);
            spinRoot.gameObject.AddComponent<FloatingSpin>();
            it.markerRenderer = diamond.GetComponent<Renderer>();
            it.markerLabel = WorldText("Etiqueta", marker.transform, new Vector3(0f, 0.28f, 0f), Quaternion.identity, prompt, 30,
                new Color(1f, 0.92f, 0.4f, 1f), new Vector2(700f, 70f), 0.0035f, true, new Color(0f, 0f, 0f, 0.55f));
            it.marker = marker;
            return it;
        }

        /// <summary>Persona simplificada (low poly) con extremidades articuladas.</summary>
        public static NpcWalker Person(string name, Transform parent, Vector3 pos, float yaw, string shirt, bool vest, string helmet, string label, string skin = "Piel1")
        {
            var root = Group(name, parent);
            root.SetPositionAndRotation(pos, Quaternion.Euler(0f, yaw, 0f));
            var walker = root.gameObject.AddComponent<NpcWalker>();

            Transform Limb(string limbName, Vector3 pivot, Vector3 size, string mat)
            {
                var p = Group(limbName, root);
                p.localPosition = pivot;
                LocalBox("Pieza", p, new Vector3(0f, -size.y * 0.5f, 0f), size, mat);
                return p;
            }

            walker.leftLeg = Limb("Pierna izquierda", new Vector3(-0.12f, 0.9f, 0f), new Vector3(0.17f, 0.88f, 0.2f), "Pantalon");
            walker.rightLeg = Limb("Pierna derecha", new Vector3(0.12f, 0.9f, 0f), new Vector3(0.17f, 0.88f, 0.2f), "Pantalon");
            LocalBox("Torso", root, new Vector3(0f, 1.22f, 0f), new Vector3(0.46f, 0.64f, 0.26f), shirt);
            if (vest)
                LocalBox("Chaleco", root, new Vector3(0f, 1.2f, 0f), new Vector3(0.48f, 0.5f, 0.28f), "ChalecoAltaVis");
            walker.leftArm = Limb("Brazo izquierdo", new Vector3(-0.31f, 1.5f, 0f), new Vector3(0.13f, 0.62f, 0.15f), shirt);
            walker.rightArm = Limb("Brazo derecho", new Vector3(0.31f, 1.5f, 0f), new Vector3(0.13f, 0.62f, 0.15f), shirt);
            LocalSphere("Cabeza", root, new Vector3(0f, 1.73f, 0f), Vector3.one * 0.27f, skin);
            if (!string.IsNullOrEmpty(helmet))
                LocalSphere("Casco", root, new Vector3(0f, 1.82f, 0f), new Vector3(0.31f, 0.17f, 0.31f), helmet);
            if (!string.IsNullOrEmpty(label))
                WorldText("Nombre", root, new Vector3(0f, 2.12f, 0f), Quaternion.identity, label, 30, Color.white, new Vector2(520f, 64f), 0.0035f, true, new Color(0f, 0f, 0f, 0.5f));
            return walker;
        }

        public static GameObject Cone(string name, Transform parent, Vector3 pos)
        {
            var root = Group(name, parent);
            root.position = pos;
            LocalBox("Base", root, new Vector3(0f, 0.02f, 0f), new Vector3(0.38f, 0.04f, 0.38f), "Negro");
            LocalCylinder("Cuerpo", root, new Vector3(0f, 0.3f, 0f), 0.24f, 0.52f, "Cono");
            LocalCylinder("Franja", root, new Vector3(0f, 0.36f, 0f), 0.25f, 0.08f, "Blanco");
            LocalCylinder("Punta", root, new Vector3(0f, 0.6f, 0f), 0.12f, 0.1f, "Cono");
            return root.gameObject;
        }

        public static LineRenderer Line(string name, Transform parent, string mat, float width)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var lr = go.AddComponent<LineRenderer>();
            lr.useWorldSpace = true;
            lr.positionCount = 2;
            lr.startWidth = width;
            lr.endWidth = width;
            lr.sharedMaterial = M(mat);
            lr.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            lr.receiveShadows = false;
            lr.enabled = false;
            return lr;
        }

        public static BlinkingLamp Lamp(string name, Transform parent, Vector3 worldPos, float size, bool withLight, Color lightColor)
        {
            var go = LocalSphere(name, parent, Vector3.zero, Vector3.one * size, "LuzApagada");
            go.transform.position = worldPos;
            var lamp = go.AddComponent<BlinkingLamp>();
            lamp.lampRenderer = go.GetComponent<Renderer>();
            lamp.offMaterial = M("LuzApagada");
            if (withLight)
            {
                var lg = new GameObject("Luz");
                lg.transform.SetParent(go.transform, false);
                var l = lg.AddComponent<Light>();
                l.type = LightType.Point;
                l.color = lightColor;
                l.range = 9f;
                l.intensity = 2.5f;
                l.shadows = LightShadows.None;
                l.enabled = false;
                lamp.lampLight = l;
            }
            return lamp;
        }
    }
}
