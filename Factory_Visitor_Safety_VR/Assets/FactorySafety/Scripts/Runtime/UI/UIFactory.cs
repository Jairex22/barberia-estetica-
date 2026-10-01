using UnityEngine;
using UnityEngine.UI;

namespace FactoryVisitorSafety
{
    /// <summary>Utilidades para construir la interfaz con componentes UGUI estándar.</summary>
    public static class UIFactory
    {
        public static readonly Color PanelColor = new Color(0.08f, 0.10f, 0.13f, 0.94f);
        public static readonly Color BoxColor = new Color(0.08f, 0.10f, 0.13f, 0.80f);
        public static readonly Color ButtonColor = new Color(0.20f, 0.36f, 0.62f, 1f);
        public static readonly Color ButtonAltColor = new Color(0.30f, 0.32f, 0.36f, 1f);
        public static readonly Color ButtonDangerColor = new Color(0.62f, 0.24f, 0.20f, 1f);
        public static readonly Color TextColor = new Color(0.95f, 0.96f, 0.97f, 1f);
        public static readonly Color MutedText = new Color(0.75f, 0.78f, 0.82f, 1f);
        public static readonly Color Accent = new Color(1f, 0.82f, 0.25f, 1f);

        public static Font DefaultFont()
        {
            return Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
        }

        public static RectTransform Rect(string name, Transform parent)
        {
            var go = new GameObject(name, typeof(RectTransform));
            go.layer = 5; // UI
            var rt = (RectTransform)go.transform;
            rt.SetParent(parent, false);
            return rt;
        }

        public static void Place(RectTransform rt, Vector2 anchorMin, Vector2 anchorMax, Vector2 pivot, Vector2 anchoredPosition, Vector2 size)
        {
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.pivot = pivot;
            rt.anchoredPosition = anchoredPosition;
            rt.sizeDelta = size;
        }

        public static void Stretch(RectTransform rt)
        {
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
        }

        public static Image Image(string name, Transform parent, Color color)
        {
            var rt = Rect(name, parent);
            var img = rt.gameObject.AddComponent<Image>();
            img.color = color;
            return img;
        }

        public static Text Label(string name, Transform parent, Font font, string text, int size, Color color, TextAnchor align = TextAnchor.UpperLeft, FontStyle style = FontStyle.Normal)
        {
            var rt = Rect(name, parent);
            var t = rt.gameObject.AddComponent<Text>();
            t.font = font;
            t.text = text;
            t.fontSize = size;
            t.color = color;
            t.alignment = align;
            t.fontStyle = style;
            t.supportRichText = true;
            t.horizontalOverflow = HorizontalWrapMode.Wrap;
            t.verticalOverflow = VerticalWrapMode.Overflow;
            t.raycastTarget = false;
            return t;
        }

        public static VerticalLayoutGroup Vertical(GameObject go, float spacing, int padding, TextAnchor align = TextAnchor.UpperLeft)
        {
            var v = go.AddComponent<VerticalLayoutGroup>();
            v.spacing = spacing;
            v.padding = new RectOffset(padding, padding, padding, padding);
            v.childAlignment = align;
            v.childControlWidth = true;
            v.childControlHeight = true;
            v.childForceExpandWidth = true;
            v.childForceExpandHeight = false;
            return v;
        }

        public static HorizontalLayoutGroup Horizontal(GameObject go, float spacing, TextAnchor align = TextAnchor.MiddleCenter)
        {
            var h = go.AddComponent<HorizontalLayoutGroup>();
            h.spacing = spacing;
            h.childAlignment = align;
            h.childControlWidth = true;
            h.childControlHeight = true;
            h.childForceExpandWidth = true;
            h.childForceExpandHeight = true;
            return h;
        }

        public static LayoutElement Layout(GameObject go, float preferredHeight = -1f, float preferredWidth = -1f, float flexibleWidth = -1f)
        {
            var le = go.GetComponent<LayoutElement>();
            if (le == null)
                le = go.AddComponent<LayoutElement>();
            if (preferredHeight >= 0f)
            {
                le.preferredHeight = preferredHeight;
                le.minHeight = preferredHeight;
            }
            if (preferredWidth >= 0f)
                le.preferredWidth = preferredWidth;
            if (flexibleWidth >= 0f)
                le.flexibleWidth = flexibleWidth;
            return le;
        }

        /// <summary>Panel modal centrado con fondo oscuro y disposición vertical.</summary>
        public static RectTransform ModalPanel(string name, Transform parent, Vector2 size)
        {
            var img = Image(name, parent, PanelColor);
            img.raycastTarget = true;
            var rt = img.rectTransform;
            Place(rt, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, size);
            Vertical(rt.gameObject, 14f, 32);
            return rt;
        }

        public static Button Button(string name, Transform parent, Font font, string label, Color color, int fontSize = 26, float height = 60f)
        {
            var img = Image(name, parent, color);
            img.raycastTarget = true;
            var button = img.gameObject.AddComponent<Button>();
            button.targetGraphic = img;
            var colors = button.colors;
            colors.highlightedColor = new Color(0.85f, 0.92f, 1f, 1f);
            colors.pressedColor = new Color(0.7f, 0.7f, 0.7f, 1f);
            button.colors = colors;
            var text = Label("Texto", img.transform, font, label, fontSize, Color.white, TextAnchor.MiddleCenter, FontStyle.Bold);
            Stretch(text.rectTransform);
            text.rectTransform.offsetMin = new Vector2(12f, 4f);
            text.rectTransform.offsetMax = new Vector2(-12f, -4f);
            Layout(img.gameObject, height);
            return button;
        }

        public static RectTransform Row(string name, Transform parent, float height, float spacing = 12f)
        {
            var rt = Rect(name, parent);
            Horizontal(rt.gameObject, spacing);
            Layout(rt.gameObject, height);
            return rt;
        }

        public static void SetLabel(Button button, string text)
        {
            if (button == null)
                return;
            var t = button.GetComponentInChildren<Text>(true);
            if (t != null)
                t.text = text;
        }
    }
}
