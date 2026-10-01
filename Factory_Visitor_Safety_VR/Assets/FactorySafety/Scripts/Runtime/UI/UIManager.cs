using System;
using System.Collections.Generic;
using System.Text;
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.UI;

namespace FactoryVisitorSafety
{
    /// <summary>
    /// Interfaz completa (menú, HUD, decisiones, retroalimentación, pausa, ajustes y resultados).
    /// El generador del editor llama a BuildInterface() y guarda el resultado en la escena; si por
    /// algún motivo la escena no la contiene, se construye al iniciar. Los botones se conectan en tiempo
    /// de ejecución (WireButtons) para que funcionen igual con ratón y con el rayo de VR.
    /// En escritorio los lienzos son "Screen Space Overlay"; en VR pasan a "World Space" frente al usuario.
    /// </summary>
    public class UIManager : MonoBehaviour
    {
        public Font font;
        public GameFlow game;

        [Header("Lienzos")]
        public Canvas hudCanvas;
        public Canvas modalCanvas;
        public LazyFollow hudAnchor;
        public LazyFollow modalAnchor;

        [Header("HUD")]
        public GameObject hudRoot;
        public Text progressText;
        public Text objectiveText;
        public Text statusLineText;
        public Text timerText;
        public Text guideText;
        public Text promptText;
        public Text controlsText;
        public Text bannerText;
        public GameObject bannerRoot;
        public Text toastText;
        public GameObject toastRoot;
        public GameObject reticle;
        public Image[] progressSegments;
        public Text[] progressSegmentLabels;

        [Header("Menú")]
        public GameObject menuPanel;
        public Button modeNoInductionButton;
        public Button modeTrainedButton;
        public Text modeDescriptionText;
        public Button platformDesktopButton;
        public Button platformVrButton;
        public Text menuStatusText;
        public Button startButton;
        public Button menuSettingsButton;
        public Button menuQuitButton;

        [Header("Inducción")]
        public GameObject inductionPanel;
        public Text inductionText;
        public Text inductionPageText;
        public Button inductionNextButton;

        [Header("Decisión")]
        public GameObject decisionPanel;
        public Text decisionTitleText;
        public Text decisionQuestionText;
        public Button[] decisionButtons;
        public Button decisionCloseButton;

        [Header("Retroalimentación")]
        public GameObject feedbackPanel;
        public Text feedbackHeadingText;
        public Text feedbackCategoryText;
        public Text feedbackBodyText;
        public Button feedbackRepeatButton;
        public Button feedbackContinueButton;

        [Header("Información")]
        public GameObject infoPanel;
        public Text infoTitleText;
        public Text infoBodyText;
        public Button infoCloseButton;

        [Header("Pausa")]
        public GameObject pausePanel;
        public Text pauseSummaryText;
        public Button pauseResumeButton;
        public Button pauseRestartButton;
        public Button pauseSettingsButton;
        public Button pauseMenuButton;
        public Button pauseQuitButton;

        [Header("Ajustes")]
        public GameObject settingsPanel;
        public Button settingTurnButton;
        public Button settingSeatedButton;
        public Button settingFlashButton;
        public Text settingSensitivityText;
        public Button settingSensitivityMinus;
        public Button settingSensitivityPlus;
        public Text settingVolumeText;
        public Button settingVolumeMinus;
        public Button settingVolumePlus;
        public Button settingsBackButton;

        [Header("Resultados")]
        public GameObject resultsPanel;
        public Text resultsSummaryText;
        public Text resultsScenariosText;
        public Text resultsComparisonText;
        public Text resultsExportText;
        public Button resultsSaveButton;
        public Button resultsFolderButton;
        public Button resultsAgainButton;
        public Button resultsMenuButton;
        public Button resultsQuitButton;

        [Header("Fundido")]
        public ScreenFader fader;

        public bool IsBuilt => hudCanvas != null && modalCanvas != null && menuPanel != null;
        public bool IsModalOpen => ActivePanel() != null;

        readonly Dictionary<object, string> m_Prompts = new Dictionary<object, string>();
        readonly Dictionary<Button, Color> m_ButtonBaseColors = new Dictionary<Button, Color>();
        readonly List<Button> m_ButtonBuffer = new List<Button>();
        DecisionRequest m_Decision;
        FeedbackRequest m_Feedback;
        Action m_InfoClose;
        Action m_SettingsBack;
        string[] m_InductionPages;
        int m_InductionIndex;
        Action m_InductionDone;
        float m_ToastTimer;
        float m_BannerTimer;
        bool m_BannerPersistent;
        bool m_Wired;
        InputPlatform m_Presentation = InputPlatform.Desktop;

        static readonly Vector2 DesktopReference = new Vector2(1920f, 1080f);
        static readonly Vector2 VrHudSize = new Vector2(1500f, 860f);
        static readonly Vector2 VrModalSize = new Vector2(1920f, 1080f);

        void Awake()
        {
            if (font == null)
                font = UIFactory.DefaultFont();
            if (!IsBuilt)
                BuildInterface();
            WireButtons();
            HideAllPanels();
            SetHudVisible(false);
        }

        // ------------------------------------------------------------------ Construcción

        public void BuildInterface()
        {
            if (font == null)
                font = UIFactory.DefaultFont();
            for (var i = transform.childCount - 1; i >= 0; i--)
            {
                var child = transform.GetChild(i).gameObject;
                if (Application.isPlaying)
                    Destroy(child);
                else
                    DestroyImmediate(child);
            }
            m_ButtonBaseColors.Clear();

            hudAnchor = CreateAnchor("Anclaje HUD (VR)", 1.6f, -0.12f, 35f);
            modalAnchor = CreateAnchor("Anclaje menús (VR)", 1.7f, 0f, 45f);
            hudCanvas = CreateCanvas("Lienzo HUD", hudAnchor.transform, 10);
            modalCanvas = CreateCanvas("Lienzo menús", modalAnchor.transform, 20);

            BuildHud();
            BuildMenu();
            BuildInduction();
            BuildDecision();
            BuildFeedback();
            BuildInfo();
            BuildPause();
            BuildSettings();
            BuildResults();
            BuildFader();
        }

        LazyFollow CreateAnchor(string name, float distance, float height, float angle)
        {
            var go = new GameObject(name);
            go.transform.SetParent(transform, false);
            var follow = go.AddComponent<LazyFollow>();
            follow.distance = distance;
            follow.heightOffset = height;
            follow.angleThreshold = angle;
            follow.enabled = false;
            return follow;
        }

        Canvas CreateCanvas(string name, Transform parent, int order)
        {
            var go = new GameObject(name, typeof(RectTransform));
            go.layer = 5;
            go.transform.SetParent(parent, false);
            var canvas = go.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = order;
            var scaler = go.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = DesktopReference;
            scaler.matchWidthOrHeight = 0.5f;
            scaler.dynamicPixelsPerUnit = 2f;
            go.AddComponent<GraphicRaycaster>();
            return canvas;
        }

        void BuildHud()
        {
            var root = UIFactory.Rect("HUD", hudCanvas.transform);
            UIFactory.Stretch(root);
            hudRoot = root.gameObject;

            // Progreso y objetivo (arriba a la izquierda).
            var box = UIFactory.Image("Progreso y objetivo", root, UIFactory.BoxColor);
            UIFactory.Place(box.rectTransform, new Vector2(0f, 1f), new Vector2(0f, 1f), new Vector2(0f, 1f), new Vector2(24f, -24f), new Vector2(820f, 0f));
            UIFactory.Vertical(box.gameObject, 6f, 16);
            var fitter = box.gameObject.AddComponent<ContentSizeFitter>();
            fitter.verticalFit = ContentSizeFitter.FitMode.PreferredSize;
            progressText = UIFactory.Label("Progreso", box.transform, font, "", 24, UIFactory.Accent, TextAnchor.UpperLeft, FontStyle.Bold);
            var segRow = UIFactory.Row("Segmentos", box.transform, 34f, 6f);
            progressSegments = new Image[6];
            progressSegmentLabels = new Text[6];
            for (var i = 0; i < 6; i++)
            {
                var seg = UIFactory.Image("Segmento " + i, segRow, new Color(0.35f, 0.37f, 0.40f, 1f));
                progressSegments[i] = seg;
                var lbl = UIFactory.Label("Etiqueta", seg.transform, font, "", 18, Color.white, TextAnchor.MiddleCenter, FontStyle.Bold);
                UIFactory.Stretch(lbl.rectTransform);
                progressSegmentLabels[i] = lbl;
            }
            objectiveText = UIFactory.Label("Objetivo", box.transform, font, "", 22, UIFactory.TextColor);
            statusLineText = UIFactory.Label("Estado", box.transform, font, "", 20, UIFactory.MutedText);

            // Tiempo (arriba a la derecha).
            var timerBox = UIFactory.Image("Tiempo", root, UIFactory.BoxColor);
            UIFactory.Place(timerBox.rectTransform, new Vector2(1f, 1f), new Vector2(1f, 1f), new Vector2(1f, 1f), new Vector2(-24f, -24f), new Vector2(330f, 84f));
            timerText = UIFactory.Label("Texto", timerBox.transform, font, "", 22, UIFactory.TextColor, TextAnchor.MiddleCenter);
            UIFactory.Stretch(timerText.rectTransform);

            // Banner (alarmas, avisos importantes).
            var banner = UIFactory.Image("Banner", root, new Color(0.70f, 0.12f, 0.10f, 0.92f));
            UIFactory.Place(banner.rectTransform, new Vector2(0.5f, 1f), new Vector2(0.5f, 1f), new Vector2(0.5f, 1f), new Vector2(0f, -200f), new Vector2(900f, 96f));
            bannerText = UIFactory.Label("Texto", banner.transform, font, "", 28, Color.white, TextAnchor.MiddleCenter, FontStyle.Bold);
            UIFactory.Stretch(bannerText.rectTransform);
            bannerRoot = banner.gameObject;

            // Aviso breve.
            var toast = UIFactory.Image("Aviso", root, new Color(0.10f, 0.40f, 0.22f, 0.92f));
            UIFactory.Place(toast.rectTransform, new Vector2(0.5f, 1f), new Vector2(0.5f, 1f), new Vector2(0.5f, 1f), new Vector2(0f, -310f), new Vector2(900f, 70f));
            toastText = UIFactory.Label("Texto", toast.transform, font, "", 24, Color.white, TextAnchor.MiddleCenter, FontStyle.Bold);
            UIFactory.Stretch(toastText.rectTransform);
            toastRoot = toast.gameObject;

            // Mensajes del guía (abajo a la izquierda).
            var guideBox = UIFactory.Image("Guía", root, new Color(0.05f, 0.22f, 0.35f, 0.88f));
            UIFactory.Place(guideBox.rectTransform, new Vector2(0f, 0f), new Vector2(0f, 0f), new Vector2(0f, 0f), new Vector2(24f, 70f), new Vector2(820f, 150f));
            guideText = UIFactory.Label("Texto", guideBox.transform, font, "", 22, Color.white, TextAnchor.MiddleLeft);
            UIFactory.Stretch(guideText.rectTransform);
            guideText.rectTransform.offsetMin = new Vector2(16f, 8f);
            guideText.rectTransform.offsetMax = new Vector2(-16f, -8f);

            // Indicación de interacción (centro abajo).
            promptText = UIFactory.Label("Indicación", root, font, "", 28, UIFactory.Accent, TextAnchor.MiddleCenter, FontStyle.Bold);
            UIFactory.Place(promptText.rectTransform, new Vector2(0.5f, 0f), new Vector2(0.5f, 0f), new Vector2(0.5f, 0f), new Vector2(150f, 250f), new Vector2(900f, 50f));
            var outline = promptText.gameObject.AddComponent<Outline>();
            outline.effectColor = Color.black;

            // Retícula (solo escritorio).
            var ret = UIFactory.Image("Retícula", root, new Color(1f, 1f, 1f, 0.85f));
            UIFactory.Place(ret.rectTransform, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(8f, 8f));
            reticle = ret.gameObject;

            // Controles visibles.
            var controlsBox = UIFactory.Image("Controles", root, UIFactory.BoxColor);
            UIFactory.Place(controlsBox.rectTransform, new Vector2(0f, 0f), new Vector2(1f, 0f), new Vector2(0.5f, 0f), new Vector2(0f, 12f), new Vector2(-48f, 46f));
            controlsText = UIFactory.Label("Texto", controlsBox.transform, font, UIText.DesktopControls, 19, UIFactory.MutedText, TextAnchor.MiddleCenter);
            UIFactory.Stretch(controlsText.rectTransform);
        }

        void BuildMenu()
        {
            var panel = UIFactory.ModalPanel("Menú principal", modalCanvas.transform, new Vector2(1300f, 980f));
            menuPanel = panel.gameObject;
            UIFactory.Label("Título", panel, font, UIText.AppTitle, 48, UIFactory.Accent, TextAnchor.MiddleCenter, FontStyle.Bold);
            UIFactory.Label("Subtítulo", panel, font, UIText.AppSubtitle + "\n" + UIText.Version, 22, UIFactory.MutedText, TextAnchor.MiddleCenter);

            UIFactory.Label("Modo", panel, font, UIText.ModeHeader, 26, UIFactory.TextColor, TextAnchor.MiddleLeft, FontStyle.Bold);
            var modeRow = UIFactory.Row("Fila modo", panel, 64f);
            modeNoInductionButton = UIFactory.Button("Sin inducción", modeRow, font, "", UIFactory.ButtonAltColor);
            modeTrainedButton = UIFactory.Button("Con capacitación", modeRow, font, "", UIFactory.ButtonAltColor);
            modeDescriptionText = UIFactory.Label("Descripción modo", panel, font, "", 21, UIFactory.MutedText);

            UIFactory.Label("Plataforma", panel, font, UIText.PlatformHeader, 26, UIFactory.TextColor, TextAnchor.MiddleLeft, FontStyle.Bold);
            var platRow = UIFactory.Row("Fila plataforma", panel, 64f);
            platformDesktopButton = UIFactory.Button("Escritorio", platRow, font, "", UIFactory.ButtonAltColor);
            platformVrButton = UIFactory.Button("Realidad virtual", platRow, font, "", UIFactory.ButtonAltColor);
            UIFactory.Label("Nota VR", panel, font, UIText.MenuVrNote, 19, UIFactory.MutedText);
            menuStatusText = UIFactory.Label("Estado", panel, font, "", 21, new Color(1f, 0.6f, 0.45f, 1f));

            var actions = UIFactory.Row("Acciones", panel, 70f);
            startButton = UIFactory.Button("Comenzar", actions, font, UIText.Start, UIFactory.ButtonColor, 28, 70f);
            menuSettingsButton = UIFactory.Button("Ajustes", actions, font, UIText.Settings, UIFactory.ButtonAltColor, 26, 70f);
            menuQuitButton = UIFactory.Button("Salir", actions, font, UIText.Quit, UIFactory.ButtonDangerColor, 26, 70f);

            UIFactory.Label("Controles", panel, font, UIText.DesktopControls + "\n" + UIText.VrControls, 18, UIFactory.MutedText, TextAnchor.UpperCenter);
            UIFactory.Label("Aviso", panel, font, UIText.Disclaimer, 17, UIFactory.MutedText, TextAnchor.UpperCenter, FontStyle.Italic);
        }

        void BuildInduction()
        {
            var panel = UIFactory.ModalPanel("Inducción", modalCanvas.transform, new Vector2(1200f, 640f));
            inductionPanel = panel.gameObject;
            UIFactory.Label("Título", panel, font, UIText.InductionTitle, 36, UIFactory.Accent, TextAnchor.MiddleCenter, FontStyle.Bold);
            inductionText = UIFactory.Label("Texto", panel, font, "", 28, UIFactory.TextColor);
            UIFactory.Layout(inductionText.gameObject, 330f);
            inductionPageText = UIFactory.Label("Página", panel, font, "", 20, UIFactory.MutedText, TextAnchor.MiddleCenter);
            var row = UIFactory.Row("Acciones", panel, 64f);
            inductionNextButton = UIFactory.Button("Siguiente", row, font, UIText.Next, UIFactory.ButtonColor);
        }

        void BuildDecision()
        {
            var panel = UIFactory.ModalPanel("Decisión", modalCanvas.transform, new Vector2(1200f, 720f));
            decisionPanel = panel.gameObject;
            decisionTitleText = UIFactory.Label("Título", panel, font, "", 30, UIFactory.Accent, TextAnchor.MiddleCenter, FontStyle.Bold);
            decisionQuestionText = UIFactory.Label("Pregunta", panel, font, "", 27, UIFactory.TextColor, TextAnchor.MiddleCenter);
            decisionButtons = new Button[4];
            for (var i = 0; i < decisionButtons.Length; i++)
                decisionButtons[i] = UIFactory.Button("Opción " + (i + 1), panel, font, "", UIFactory.ButtonColor, 24, 76f);
            decisionCloseButton = UIFactory.Button("Cerrar", panel, font, UIText.DecideLater, UIFactory.ButtonAltColor, 22, 56f);
        }

        void BuildFeedback()
        {
            var panel = UIFactory.ModalPanel("Retroalimentación", modalCanvas.transform, new Vector2(1400f, 900f));
            feedbackPanel = panel.gameObject;
            feedbackHeadingText = UIFactory.Label("Encabezado", panel, font, "", 32, UIFactory.Accent, TextAnchor.MiddleCenter, FontStyle.Bold);
            feedbackCategoryText = UIFactory.Label("Categoría", panel, font, "", 22, Color.white, TextAnchor.MiddleCenter, FontStyle.Bold);
            feedbackBodyText = UIFactory.Label("Cuerpo", panel, font, "", 22, UIFactory.TextColor);
            var row = UIFactory.Row("Acciones", panel, 70f);
            feedbackRepeatButton = UIFactory.Button("Repetir", row, font, UIText.RepeatScenario, UIFactory.ButtonAltColor, 26, 70f);
            feedbackContinueButton = UIFactory.Button("Continuar", row, font, UIText.ContinueTour, UIFactory.ButtonColor, 26, 70f);
        }

        void BuildInfo()
        {
            var panel = UIFactory.ModalPanel("Información", modalCanvas.transform, new Vector2(1200f, 800f));
            infoPanel = panel.gameObject;
            infoTitleText = UIFactory.Label("Título", panel, font, "", 32, UIFactory.Accent, TextAnchor.MiddleCenter, FontStyle.Bold);
            infoBodyText = UIFactory.Label("Cuerpo", panel, font, "", 24, UIFactory.TextColor);
            infoCloseButton = UIFactory.Button("Cerrar", panel, font, UIText.Close, UIFactory.ButtonColor);
        }

        void BuildPause()
        {
            var panel = UIFactory.ModalPanel("Pausa", modalCanvas.transform, new Vector2(900f, 720f));
            pausePanel = panel.gameObject;
            UIFactory.Label("Título", panel, font, UIText.PauseTitle, 40, UIFactory.Accent, TextAnchor.MiddleCenter, FontStyle.Bold);
            pauseSummaryText = UIFactory.Label("Resumen", panel, font, "", 22, UIFactory.MutedText, TextAnchor.MiddleCenter);
            pauseResumeButton = UIFactory.Button("Reanudar", panel, font, UIText.Resume, UIFactory.ButtonColor);
            pauseRestartButton = UIFactory.Button("Reiniciar", panel, font, UIText.Restart, UIFactory.ButtonAltColor);
            pauseSettingsButton = UIFactory.Button("Ajustes", panel, font, UIText.Settings, UIFactory.ButtonAltColor);
            pauseMenuButton = UIFactory.Button("Menú", panel, font, UIText.BackToMenu, UIFactory.ButtonAltColor);
            pauseQuitButton = UIFactory.Button("Salir", panel, font, UIText.Quit, UIFactory.ButtonDangerColor);
        }

        void BuildSettings()
        {
            var panel = UIFactory.ModalPanel("Ajustes", modalCanvas.transform, new Vector2(1000f, 760f));
            settingsPanel = panel.gameObject;
            UIFactory.Label("Título", panel, font, UIText.SettingsTitle, 32, UIFactory.Accent, TextAnchor.MiddleCenter, FontStyle.Bold);
            settingTurnButton = UIFactory.Button("Giro", panel, font, "", UIFactory.ButtonAltColor);
            settingSeatedButton = UIFactory.Button("Sentado", panel, font, "", UIFactory.ButtonAltColor);
            settingFlashButton = UIFactory.Button("Destellos", panel, font, "", UIFactory.ButtonAltColor);

            var sensRow = UIFactory.Row("Sensibilidad", panel, 60f);
            settingSensitivityMinus = UIFactory.Button("Menos", sensRow, font, "-", UIFactory.ButtonColor);
            UIFactory.Layout(settingSensitivityMinus.gameObject, 60f, 90f, 0f);
            settingSensitivityText = UIFactory.Label("Valor", sensRow, font, "", 24, UIFactory.TextColor, TextAnchor.MiddleCenter);
            settingSensitivityPlus = UIFactory.Button("Más", sensRow, font, "+", UIFactory.ButtonColor);
            UIFactory.Layout(settingSensitivityPlus.gameObject, 60f, 90f, 0f);

            var volRow = UIFactory.Row("Volumen", panel, 60f);
            settingVolumeMinus = UIFactory.Button("Menos", volRow, font, "-", UIFactory.ButtonColor);
            UIFactory.Layout(settingVolumeMinus.gameObject, 60f, 90f, 0f);
            settingVolumeText = UIFactory.Label("Valor", volRow, font, "", 24, UIFactory.TextColor, TextAnchor.MiddleCenter);
            settingVolumePlus = UIFactory.Button("Más", volRow, font, "+", UIFactory.ButtonColor);
            UIFactory.Layout(settingVolumePlus.gameObject, 60f, 90f, 0f);

            UIFactory.Label("Nota", panel, font, "El giro por incrementos y el modo sentado aplican en VR. \"Reducir destellos\" mantiene fijas las luces de alarma y balizas. Toda la información también aparece como texto.", 19, UIFactory.MutedText);
            settingsBackButton = UIFactory.Button("Volver", panel, font, UIText.Back, UIFactory.ButtonColor);
        }

        void BuildResults()
        {
            var panel = UIFactory.ModalPanel("Resultados", modalCanvas.transform, new Vector2(1760f, 1020f));
            resultsPanel = panel.gameObject;
            var layout = panel.GetComponent<VerticalLayoutGroup>();
            layout.spacing = 8f;
            layout.padding = new RectOffset(28, 28, 20, 20);
            UIFactory.Label("Título", panel, font, UIText.ResultsTitle, 36, UIFactory.Accent, TextAnchor.MiddleCenter, FontStyle.Bold);

            var columns = UIFactory.Rect("Columnas", panel);
            var h = UIFactory.Horizontal(columns.gameObject, 24f, TextAnchor.UpperLeft);
            h.childForceExpandHeight = false;
            var left = UIFactory.Rect("Izquierda", columns);
            UIFactory.Vertical(left.gameObject, 8f, 0);
            var right = UIFactory.Rect("Derecha", columns);
            UIFactory.Vertical(right.gameObject, 8f, 0);
            resultsSummaryText = UIFactory.Label("Resumen", left, font, "", 20, UIFactory.TextColor);
            resultsComparisonText = UIFactory.Label("Comparación", left, font, "", 18, UIFactory.MutedText);
            resultsScenariosText = UIFactory.Label("Situaciones", right, font, "", 18, UIFactory.TextColor);

            resultsExportText = UIFactory.Label("Exportación", panel, font, "", 18, new Color(0.7f, 0.95f, 0.75f, 1f));
            var row = UIFactory.Row("Acciones", panel, 62f);
            resultsSaveButton = UIFactory.Button("Guardar", row, font, UIText.SaveReport, UIFactory.ButtonColor, 22, 62f);
            resultsFolderButton = UIFactory.Button("Carpeta", row, font, UIText.OpenReportFolder, UIFactory.ButtonAltColor, 22, 62f);
            resultsAgainButton = UIFactory.Button("Repetir", row, font, UIText.PlayAgain, UIFactory.ButtonAltColor, 22, 62f);
            resultsMenuButton = UIFactory.Button("Menú", row, font, UIText.BackToMenu, UIFactory.ButtonAltColor, 22, 62f);
            resultsQuitButton = UIFactory.Button("Salir", row, font, UIText.Quit, UIFactory.ButtonDangerColor, 22, 62f);
        }

        void BuildFader()
        {
            var go = new GameObject("Fundido (escritorio)", typeof(RectTransform));
            go.layer = 5;
            go.transform.SetParent(transform, false);
            var canvas = go.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 100;
            var group = go.AddComponent<CanvasGroup>();
            group.alpha = 0f;
            group.blocksRaycasts = false;
            var img = UIFactory.Image("Negro", go.transform, Color.black);
            UIFactory.Stretch(img.rectTransform);
            fader = go.AddComponent<ScreenFader>();
            fader.desktopGroup = group;
        }

        // ------------------------------------------------------------------ Conexión de botones

        public void WireButtons()
        {
            if (m_Wired)
                return;
            m_Wired = true;

            Add(modeNoInductionButton, () => game.SelectMode(VisitMode.NoInduction));
            Add(modeTrainedButton, () => game.SelectMode(VisitMode.Trained));
            Add(platformDesktopButton, () => game.SelectPlatform(InputPlatform.Desktop));
            Add(platformVrButton, () => game.SelectPlatform(InputPlatform.VirtualReality));
            Add(startButton, () => game.StartFromMenu());
            Add(menuSettingsButton, () => ShowSettings(() => ShowOnly(menuPanel)));
            Add(menuQuitButton, () => game.QuitApplication());

            Add(inductionNextButton, NextInductionPage);

            for (var i = 0; i < decisionButtons.Length; i++)
            {
                var index = i;
                Add(decisionButtons[i], () => ChooseDecision(index));
            }
            Add(decisionCloseButton, () => ChooseDecision(-1));

            Add(feedbackRepeatButton, () => CloseFeedback(true));
            Add(feedbackContinueButton, () => CloseFeedback(false));
            Add(infoCloseButton, CloseInfo);

            Add(pauseResumeButton, () => game.Resume());
            Add(pauseRestartButton, () => game.RestartTour());
            Add(pauseSettingsButton, () => ShowSettings(() => game.ShowPauseMenu()));
            Add(pauseMenuButton, () => game.ReturnToMenu());
            Add(pauseQuitButton, () => game.QuitApplication());

            Add(settingTurnButton, () => { ComfortSettings.CycleSnapTurn(); RefreshSettings(); });
            Add(settingSeatedButton, () => { ComfortSettings.ToggleSeated(); RefreshSettings(); });
            Add(settingFlashButton, () => { ComfortSettings.ToggleReduceFlashing(); RefreshSettings(); });
            Add(settingSensitivityMinus, () => { ComfortSettings.ChangeSensitivity(-0.25f); RefreshSettings(); });
            Add(settingSensitivityPlus, () => { ComfortSettings.ChangeSensitivity(0.25f); RefreshSettings(); });
            Add(settingVolumeMinus, () => { ComfortSettings.ChangeVolume(-0.1f); RefreshSettings(); });
            Add(settingVolumePlus, () => { ComfortSettings.ChangeVolume(0.1f); RefreshSettings(); });
            Add(settingsBackButton, () =>
            {
                var back = m_SettingsBack;
                m_SettingsBack = null;
                if (back != null)
                    back();
                else
                    HideAllPanels();
            });

            Add(resultsSaveButton, () => game.SaveReport());
            Add(resultsFolderButton, () => game.OpenReportFolder());
            Add(resultsAgainButton, () => game.RestartTour());
            Add(resultsMenuButton, () => game.ReturnToMenu());
            Add(resultsQuitButton, () => game.QuitApplication());
        }

        void Add(Button button, UnityEngine.Events.UnityAction action)
        {
            if (button == null)
                return;
            button.onClick.AddListener(() =>
            {
                if (game != null && game.audioCues != null)
                    game.audioCues.Play(Cue.Click);
            });
            button.onClick.AddListener(action);
        }

        // ------------------------------------------------------------------ Presentación escritorio / VR

        public void SetPresentation(InputPlatform platform, Camera cam)
        {
            m_Presentation = platform;
            var vr = platform == InputPlatform.VirtualReality;
            ConfigureCanvas(hudCanvas, hudAnchor, vr, cam, VrHudSize, 0.00085f);
            ConfigureCanvas(modalCanvas, modalAnchor, vr, cam, VrModalSize, 0.00085f);
            if (reticle != null)
                reticle.SetActive(!vr);
            if (controlsText != null)
                controlsText.text = vr ? UIText.VrControls : UIText.DesktopControls;
            if (resultsFolderButton != null)
                resultsFolderButton.gameObject.SetActive(!vr);
            if (fader != null && cam != null)
            {
                fader.vrGroup = vr ? EnsureVrFadeGroup(cam) : null;
            }
        }

        void ConfigureCanvas(Canvas canvas, LazyFollow anchor, bool vr, Camera cam, Vector2 size, float scale)
        {
            if (canvas == null)
                return;
            var rt = (RectTransform)canvas.transform;
            if (vr)
            {
                canvas.renderMode = RenderMode.WorldSpace;
                canvas.worldCamera = cam;
                rt.sizeDelta = size;
                rt.localPosition = Vector3.zero;
                rt.localRotation = Quaternion.identity;
                rt.localScale = Vector3.one * scale;
                if (anchor != null)
                {
                    anchor.target = cam != null ? cam.transform : null;
                    anchor.enabled = true;
                    anchor.Recenter();
                }
            }
            else
            {
                if (anchor != null)
                    anchor.enabled = false;
                canvas.renderMode = RenderMode.ScreenSpaceOverlay;
                canvas.worldCamera = null;
            }
        }

        CanvasGroup EnsureVrFadeGroup(Camera cam)
        {
            var existing = cam.transform.Find("Fundido VR");
            if (existing != null)
                return existing.GetComponent<CanvasGroup>();
            var go = new GameObject("Fundido VR", typeof(RectTransform));
            go.transform.SetParent(cam.transform, false);
            go.transform.localPosition = new Vector3(0f, 0f, 0.3f);
            var canvas = go.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.WorldSpace;
            canvas.worldCamera = cam;
            canvas.sortingOrder = 100;
            var rt = (RectTransform)go.transform;
            rt.sizeDelta = new Vector2(3000f, 3000f);
            rt.localScale = Vector3.one * 0.001f;
            var group = go.AddComponent<CanvasGroup>();
            group.alpha = 0f;
            group.blocksRaycasts = false;
            var img = UIFactory.Image("Negro", go.transform, Color.black);
            UIFactory.Stretch(img.rectTransform);
            return group;
        }

        public void RecenterVrPanels()
        {
            if (m_Presentation != InputPlatform.VirtualReality)
                return;
            if (modalAnchor != null && modalAnchor.enabled)
                modalAnchor.Recenter();
        }

        // ------------------------------------------------------------------ Rayo VR sobre menús

        GameObject ActivePanel()
        {
            if (menuPanel != null && menuPanel.activeSelf) return menuPanel;
            if (settingsPanel != null && settingsPanel.activeSelf) return settingsPanel;
            if (pausePanel != null && pausePanel.activeSelf) return pausePanel;
            if (feedbackPanel != null && feedbackPanel.activeSelf) return feedbackPanel;
            if (decisionPanel != null && decisionPanel.activeSelf) return decisionPanel;
            if (infoPanel != null && infoPanel.activeSelf) return infoPanel;
            if (inductionPanel != null && inductionPanel.activeSelf) return inductionPanel;
            if (resultsPanel != null && resultsPanel.activeSelf) return resultsPanel;
            return null;
        }

        /// <summary>Intersección del rayo con el panel modal activo (solo en VR).</summary>
        public bool TryRaycastModal(Ray ray, float maxDistance, out Button button, out Vector3 point)
        {
            button = null;
            point = Vector3.zero;
            if (m_Presentation != InputPlatform.VirtualReality || modalCanvas == null)
                return false;
            var panel = ActivePanel();
            if (panel == null)
                return false;
            var canvasRt = (RectTransform)modalCanvas.transform;
            var plane = new Plane(canvasRt.forward, canvasRt.position);
            if (!plane.Raycast(ray, out var enter) || enter > maxDistance)
                return false;
            point = ray.GetPoint(enter);
            var panelRt = (RectTransform)panel.transform;
            if (!Inside(panelRt, point))
                return false;
            m_ButtonBuffer.Clear();
            panel.GetComponentsInChildren(false, m_ButtonBuffer);
            for (var i = m_ButtonBuffer.Count - 1; i >= 0; i--)
            {
                var b = m_ButtonBuffer[i];
                if (b.interactable && b.isActiveAndEnabled && Inside((RectTransform)b.transform, point))
                {
                    button = b;
                    break;
                }
            }
            return true;
        }

        static bool Inside(RectTransform rt, Vector3 worldPoint)
        {
            Vector2 local = rt.InverseTransformPoint(worldPoint);
            return rt.rect.Contains(local);
        }

        public void ClickButton(Button button)
        {
            if (button != null && button.interactable && button.isActiveAndEnabled)
                button.onClick.Invoke();
        }

        public void SetButtonHover(Button button, bool hovered)
        {
            if (button == null || button.image == null)
                return;
            if (!m_ButtonBaseColors.TryGetValue(button, out var baseColor))
            {
                baseColor = button.image.color;
                m_ButtonBaseColors[button] = baseColor;
            }
            button.image.color = hovered ? Color.Lerp(baseColor, Color.white, 0.35f) : baseColor;
        }

        // ------------------------------------------------------------------ HUD

        public void SetHudVisible(bool visible)
        {
            if (hudRoot != null)
                hudRoot.SetActive(visible);
        }

        public void SetObjective(string text)
        {
            if (objectiveText != null)
                objectiveText.text = "Objetivo: " + text;
        }

        public void SetStatusLine(string text)
        {
            if (statusLineText != null)
            {
                statusLineText.text = text ?? "";
                statusLineText.gameObject.SetActive(!string.IsNullOrEmpty(text));
            }
        }

        public void SetTimer(string text)
        {
            if (timerText != null)
                timerText.text = text;
        }

        public void SetGuideMessage(string line)
        {
            if (guideText != null)
                guideText.text = "<b>Guía:</b> " + line;
        }

        public void SetProgress(int currentIndex, IList<ScenarioBase> scenarios, ScenarioRecordLookup lookup)
        {
            if (scenarios == null)
                return;
            var completed = 0;
            for (var i = 0; i < progressSegments.Length && i < scenarios.Count; i++)
            {
                var sc = scenarios[i];
                var status = lookup != null ? lookup(sc.ScenarioId) : ScenarioStatus.NotStarted;
                string symbol;
                Color color;
                switch (status)
                {
                    case ScenarioStatus.Resolved:
                        symbol = " OK";
                        color = new Color(0.16f, 0.55f, 0.28f, 1f);
                        completed++;
                        break;
                    case ScenarioStatus.ContinuedAfterError:
                        symbol = " !";
                        color = new Color(0.80f, 0.45f, 0.10f, 1f);
                        completed++;
                        break;
                    default:
                        symbol = i == currentIndex ? " >" : "";
                        color = i == currentIndex ? new Color(0.20f, 0.40f, 0.75f, 1f) : new Color(0.35f, 0.37f, 0.40f, 1f);
                        break;
                }
                progressSegments[i].color = color;
                progressSegmentLabels[i].text = sc.ScenarioId + symbol;
            }
            var current = currentIndex >= 0 && currentIndex < scenarios.Count ? scenarios[currentIndex] : null;
            if (progressText != null)
            {
                progressText.text = current != null
                    ? "Situación " + (currentIndex + 1) + " de " + scenarios.Count + ": " + current.Content.titulo + "   (" + completed + " completadas)"
                    : "Recorrido: " + completed + " de " + scenarios.Count + " situaciones completadas";
            }
        }

        public void ShowBanner(string text, float seconds)
        {
            if (bannerRoot == null)
                return;
            bannerText.text = text;
            bannerRoot.SetActive(true);
            m_BannerPersistent = seconds <= 0f;
            m_BannerTimer = seconds;
        }

        public void HideBanner()
        {
            if (bannerRoot != null)
                bannerRoot.SetActive(false);
            m_BannerPersistent = false;
        }

        public void ShowToast(string text, float seconds = 3.5f)
        {
            if (toastRoot == null)
                return;
            toastText.text = text;
            toastRoot.SetActive(true);
            m_ToastTimer = seconds;
        }

        public void SetPrompt(object source, string text)
        {
            if (source == null)
                return;
            if (string.IsNullOrEmpty(text))
                m_Prompts.Remove(source);
            else
                m_Prompts[source] = text;
        }

        void Update()
        {
            var dt = Time.unscaledDeltaTime;
            if (toastRoot != null && toastRoot.activeSelf)
            {
                m_ToastTimer -= dt;
                if (m_ToastTimer <= 0f)
                    toastRoot.SetActive(false);
            }
            if (bannerRoot != null && bannerRoot.activeSelf && !m_BannerPersistent)
            {
                m_BannerTimer -= dt;
                if (m_BannerTimer <= 0f)
                    bannerRoot.SetActive(false);
            }

            if (promptText != null)
            {
                string shown = null;
                foreach (var kv in m_Prompts)
                {
                    shown = kv.Value;
                    break;
                }
                promptText.text = shown ?? "";
            }

            // Atajos de teclado para elegir opciones de decisión (1-4).
            if (m_Presentation == InputPlatform.Desktop && decisionPanel != null && decisionPanel.activeSelf && m_Decision != null)
            {
                var kb = Keyboard.current;
                if (kb != null)
                {
                    if (kb.digit1Key.wasPressedThisFrame) ChooseDecision(0);
                    else if (kb.digit2Key.wasPressedThisFrame) ChooseDecision(1);
                    else if (kb.digit3Key.wasPressedThisFrame) ChooseDecision(2);
                    else if (kb.digit4Key.wasPressedThisFrame) ChooseDecision(3);
                }
            }
        }

        // ------------------------------------------------------------------ Paneles

        public void HideAllPanels()
        {
            foreach (var p in new[] { menuPanel, inductionPanel, decisionPanel, feedbackPanel, infoPanel, pausePanel, settingsPanel, resultsPanel })
            {
                if (p != null)
                    p.SetActive(false);
            }
        }

        void ShowOnly(GameObject panel)
        {
            HideAllPanels();
            if (panel != null)
                panel.SetActive(true);
            RecenterVrPanels();
        }

        public void ShowMenu(VisitMode mode, InputPlatform platform, string status)
        {
            ShowOnly(menuPanel);
            UpdateMenuSelection(mode, platform);
            SetMenuStatus(status);
        }

        public void UpdateMenuSelection(VisitMode mode, InputPlatform platform)
        {
            UIFactory.SetLabel(modeNoInductionButton, (mode == VisitMode.NoInduction ? "[X] " : "[  ] ") + EnumText.ModeName(VisitMode.NoInduction));
            UIFactory.SetLabel(modeTrainedButton, (mode == VisitMode.Trained ? "[X] " : "[  ] ") + EnumText.ModeName(VisitMode.Trained));
            Tint(modeNoInductionButton, mode == VisitMode.NoInduction);
            Tint(modeTrainedButton, mode == VisitMode.Trained);
            if (modeDescriptionText != null)
                modeDescriptionText.text = mode == VisitMode.Trained ? UIText.ModeTrainedDesc : UIText.ModeNoInductionDesc;
            UIFactory.SetLabel(platformDesktopButton, (platform == InputPlatform.Desktop ? "[X] " : "[  ] ") + "Escritorio (sin visor)");
            UIFactory.SetLabel(platformVrButton, (platform == InputPlatform.VirtualReality ? "[X] " : "[  ] ") + "Realidad virtual (OpenXR)");
            Tint(platformDesktopButton, platform == InputPlatform.Desktop);
            Tint(platformVrButton, platform == InputPlatform.VirtualReality);
        }

        void Tint(Button b, bool selected)
        {
            if (b == null || b.image == null)
                return;
            var c = selected ? UIFactory.ButtonColor : UIFactory.ButtonAltColor;
            b.image.color = c;
            m_ButtonBaseColors[b] = c;
        }

        public void SetMenuStatus(string status)
        {
            if (menuStatusText != null)
            {
                menuStatusText.text = status ?? "";
                menuStatusText.gameObject.SetActive(!string.IsNullOrEmpty(status));
            }
        }

        public void SetStartInteractable(bool value)
        {
            if (startButton != null)
                startButton.interactable = value;
        }

        public void ShowInduction(string[] pages, Action done)
        {
            m_InductionPages = pages != null && pages.Length > 0 ? pages : new[] { "Sigue las indicaciones del guía durante el recorrido." };
            m_InductionIndex = 0;
            m_InductionDone = done;
            ShowOnly(inductionPanel);
            RefreshInduction();
        }

        void RefreshInduction()
        {
            inductionText.text = m_InductionPages[m_InductionIndex];
            inductionPageText.text = "Página " + (m_InductionIndex + 1) + " de " + m_InductionPages.Length;
            UIFactory.SetLabel(inductionNextButton, m_InductionIndex >= m_InductionPages.Length - 1 ? UIText.BeginTour : UIText.Next);
        }

        void NextInductionPage()
        {
            if (m_InductionPages == null)
                return;
            if (m_InductionIndex < m_InductionPages.Length - 1)
            {
                m_InductionIndex++;
                RefreshInduction();
                return;
            }
            HideAllPanels();
            var done = m_InductionDone;
            m_InductionDone = null;
            done?.Invoke();
        }

        public void ShowDecision(DecisionRequest request)
        {
            m_Decision = request;
            decisionTitleText.text = request.title;
            decisionQuestionText.text = request.question;
            for (var i = 0; i < decisionButtons.Length; i++)
            {
                var has = i < request.choices.Count;
                decisionButtons[i].gameObject.SetActive(has);
                if (has)
                    UIFactory.SetLabel(decisionButtons[i], (i + 1) + ". " + request.choices[i].text);
            }
            ShowOnly(decisionPanel);
        }

        void ChooseDecision(int index)
        {
            var request = m_Decision;
            if (request == null)
                return;
            if (index >= request.choices.Count)
                return;
            m_Decision = null;
            HideAllPanels();
            request.onChosen?.Invoke(index >= 0 ? request.choices[index].id : null);
        }

        public void ShowFeedback(FeedbackRequest request)
        {
            m_Feedback = request;
            var error = request.kind == FeedbackKind.Error;
            feedbackHeadingText.text = request.heading;
            feedbackHeadingText.color = error ? new Color(1f, 0.55f, 0.45f, 1f) : new Color(0.55f, 0.95f, 0.6f, 1f);
            feedbackCategoryText.text = request.scenarioTitle + "  |  " + (request.category == HazardCategory.Quality ? UIText.QualityNotInjury : UIText.SafetyRisk);

            var sb = new StringBuilder();
            if (error)
            {
                sb.Append("<b>Qué ocurrió:</b> ").Append(request.whatHappened).Append("\n\n");
                sb.Append("<b>Qué información faltó:</b> ").Append(request.missingInfo).Append("\n\n");
                sb.Append("<b>Qué consecuencia podría tener:</b> ").Append(request.consequence).Append("\n\n");
                sb.Append("<b>Qué decisión era más adecuada:</b> ").Append(request.betterDecision).Append("\n\n");
                if (!string.IsNullOrEmpty(request.organizationalFactor))
                    sb.Append("<b>Factor organizacional:</b> ").Append(request.organizationalFactor).Append("\n\n");
                if (!string.IsNullOrEmpty(request.modeNote))
                    sb.Append("<i>").Append(request.modeNote).Append("</i>");
            }
            else
            {
                sb.Append(request.successMessage);
            }
            feedbackBodyText.text = sb.ToString();
            feedbackRepeatButton.gameObject.SetActive(error && request.onRepeat != null);
            UIFactory.SetLabel(feedbackContinueButton, error ? UIText.ContinueTour : UIText.Continue);
            ShowOnly(feedbackPanel);
        }

        void CloseFeedback(bool repeat)
        {
            var request = m_Feedback;
            if (request == null)
                return;
            m_Feedback = null;
            HideAllPanels();
            if (repeat)
                request.onRepeat?.Invoke();
            else
                request.onContinue?.Invoke();
        }

        public void ShowInfo(string title, string body, Action onClose)
        {
            m_InfoClose = onClose;
            infoTitleText.text = title;
            infoBodyText.text = body;
            ShowOnly(infoPanel);
        }

        void CloseInfo()
        {
            var close = m_InfoClose;
            m_InfoClose = null;
            HideAllPanels();
            close?.Invoke();
        }

        public void ShowPause(string summary)
        {
            pauseSummaryText.text = summary;
            ShowOnly(pausePanel);
        }

        public void ShowSettings(Action onBack)
        {
            m_SettingsBack = onBack;
            RefreshSettings();
            ShowOnly(settingsPanel);
        }

        void RefreshSettings()
        {
            UIFactory.SetLabel(settingTurnButton, "Giro por incrementos (VR): " + ComfortSettings.SnapTurnAngle + "°");
            UIFactory.SetLabel(settingSeatedButton, "Modo sentado (VR, eleva la vista): " + (ComfortSettings.Seated ? "Sí" : "No"));
            UIFactory.SetLabel(settingFlashButton, "Reducir destellos: " + (ComfortSettings.ReduceFlashing ? "Sí" : "No"));
            settingSensitivityText.text = "Sensibilidad del ratón: " + ComfortSettings.MouseSensitivity.ToString("0.00");
            settingVolumeText.text = "Volumen: " + Mathf.RoundToInt(ComfortSettings.Volume * 100f) + "%";
        }

        public void ShowResults(SessionReport report, IList<SessionSummary> history)
        {
            var sb = new StringBuilder();
            sb.Append("<b>Modo:</b> ").Append(report.modoVisita).Append("   <b>Plataforma:</b> ").Append(report.plataforma).Append('\n');
            sb.Append("<b>Tiempo del recorrido:</b> ").Append(FormatTime(report.duracionSegundos)).Append('\n');
            sb.Append("<b>Situaciones completadas:</b> ").Append(report.situacionesCompletadas).Append(" de ").Append(report.situaciones.Count)
                .Append("  (resueltas con decisión adecuada: ").Append(report.situacionesResueltasAdecuadamente).Append(")\n");
            sb.Append("<b>Peligros de seguridad identificados:</b> ").Append(report.peligrosSeguridadIdentificados).Append('\n');
            sb.Append("<b>Problemas de calidad identificados:</b> ").Append(report.problemasCalidadIdentificados).Append('\n');
            sb.Append("<b>Reportes realizados:</b> ").Append(report.reportesRealizados).Append('\n');
            sb.Append("<b>Decisiones tomadas:</b> ").Append(report.decisionesTomadas).Append('\n');
            sb.Append("<b>Errores:</b> ").Append(report.errores).Append("   <b>Reintentos:</b> ").Append(report.reintentos).Append('\n');
            sb.Append("<b>Puntuación educativa:</b> ").Append(report.puntuacionEducativa).Append(" / 100\n");
            sb.Append("<size=16>").Append(UIText.ScoreExplanation).Append("</size>");
            resultsSummaryText.text = sb.ToString();

            var sc = new StringBuilder();
            sc.Append("<b>Detalle por situación</b>\n");
            foreach (var r in report.situaciones)
            {
                sc.Append("<b>").Append(r.id).Append(". ").Append(r.titulo).Append("</b> [").Append(r.categoria).Append("]\n");
                sc.Append("   ").Append(r.estado).Append(" · errores: ").Append(r.errores).Append(" · reintentos: ").Append(r.reintentos)
                    .Append(" · reportado: ").Append(r.reportado ? "sí" : "no").Append(" · puntos: ").Append(r.puntuacion).Append('\n');
            }
            resultsScenariosText.text = sc.ToString();

            var cmp = new StringBuilder();
            cmp.Append("<b>Comparación de sesiones en esta ejecución</b>\n");
            if (history == null || history.Count <= 1)
            {
                cmp.Append("Realiza otra visita (por ejemplo, en el otro modo) para comparar decisiones registradas.\n");
            }
            else
            {
                var start = Mathf.Max(0, history.Count - 5);
                for (var i = start; i < history.Count; i++)
                {
                    var h = history[i];
                    cmp.Append(i + 1).Append(". ").Append(EnumText.ModeName(h.mode))
                        .Append(": puntos ").Append(h.score)
                        .Append(", resueltas ").Append(h.resolved).Append("/6")
                        .Append(", errores ").Append(h.errors)
                        .Append(", reportes ").Append(h.reports)
                        .Append(", tiempo ").Append(FormatTime(h.durationSeconds)).Append('\n');
                }
            }
            cmp.Append("<i>").Append(UIText.ComparisonNote).Append("</i>");
            resultsComparisonText.text = cmp.ToString();
            resultsExportText.text = "Puedes guardar el reporte local en JSON y CSV.";
            ShowOnly(resultsPanel);
        }

        public void SetExportStatus(string text)
        {
            if (resultsExportText != null)
                resultsExportText.text = text;
        }

        public static string FormatTime(float seconds)
        {
            var s = Mathf.Max(0, Mathf.FloorToInt(seconds));
            return (s / 60).ToString("00") + ":" + (s % 60).ToString("00");
        }
    }

    public delegate ScenarioStatus ScenarioRecordLookup(string scenarioId);
}
