using System;
using System.Collections;
using System.IO;
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.SceneManagement;

namespace FactoryVisitorSafety
{
    /// <summary>
    /// Controlador principal: menú, inicio de sesión, pausa, ventanas modales, consecuencias,
    /// reinicio, regreso al menú y resultados. Mantiene un único estado global (GameState).
    /// </summary>
    public class GameFlow : MonoBehaviour
    {
        public UIManager ui;
        public PlayerRigManager rigs;
        public TourDirector tour;
        public GuideController guide;
        public SessionRecorder recorder;
        public AudioCues audioCues;
        public MaterialPalette palette;
        public Transform guideStart;

        public GameState State { get; private set; } = GameState.Menu;
        public VisitMode Mode { get; private set; } = VisitMode.Trained;
        public InputPlatform Platform => rigs != null ? rigs.Platform : InputPlatform.Desktop;

        /// <summary>El visitante puede interactuar con objetos (solo durante el recorrido activo).</summary>
        public bool CanInteract => State == GameState.Touring;

        /// <summary>El visitante puede desplazarse (no durante consecuencias, menús ni pausas).</summary>
        public bool CanMove => State == GameState.Touring;

        VisitMode m_SelectedMode;
        InputPlatform m_SelectedPlatform;
        bool m_Starting;
        GameState m_StateBeforePause;
        float m_TimeScaleBeforePause = 1f;

        void Awake()
        {
            Time.timeScale = 1f;
            ComfortSettings.Load();
            if (ui != null)
                ui.game = this;
            if (guide != null)
                guide.game = this;
        }

        void Start()
        {
            ContentDatabase.Load();
            tour.Initialize(this);
            tour.ResetAll();
            if (guide != null && guide.talkInteractable != null)
                guide.talkInteractable.Interacted += _ => OnGuideTalk();
            m_SelectedMode = LaunchState.Mode;
            m_SelectedPlatform = LaunchState.Platform;
            StartCoroutine(Boot());
        }

        IEnumerator Boot()
        {
            // Tras recargar la escena, OpenXR puede seguir activo (por ejemplo, al reiniciar en VR).
            if (XRSessionController.IsRunning)
            {
                if (m_SelectedPlatform == InputPlatform.VirtualReality)
                {
                    var ok = false;
                    yield return rigs.ActivateVR((success, msg) => ok = success);
                    if (!ok)
                        UseDesktop();
                    else
                        ui.SetPresentation(InputPlatform.VirtualReality, rigs.vrCamera);
                }
                else
                {
                    rigs.StopVRAndUseDesktop();
                    ui.SetPresentation(InputPlatform.Desktop, rigs.desktopCamera);
                }
            }
            else
            {
                UseDesktop();
            }

            if (LaunchState.AutoStart)
            {
                LaunchState.AutoStart = false;
                StartTour();
            }
            else
            {
                EnterMenu(null);
            }
        }

        void UseDesktop()
        {
            rigs.ActivateDesktop();
            ui.SetPresentation(InputPlatform.Desktop, rigs.desktopCamera);
        }

        // ------------------------------------------------------------------ Menú

        void EnterMenu(string status)
        {
            State = GameState.Menu;
            Time.timeScale = 1f;
            ui.SetHudVisible(false);
            var contentError = ContentDatabase.LoadError;
            ui.ShowMenu(m_SelectedMode, m_SelectedPlatform, string.IsNullOrEmpty(status) ? contentError : status);
            if (rigs.startPoint != null)
                rigs.TeleportTo(rigs.startPoint.position, rigs.startPoint.eulerAngles.y);
            if (guide != null && guideStart != null)
                guide.PlaceAt(guideStart.position, guideStart.eulerAngles.y);
        }

        public void SelectMode(VisitMode mode)
        {
            m_SelectedMode = mode;
            ui.UpdateMenuSelection(m_SelectedMode, m_SelectedPlatform);
        }

        public void SelectPlatform(InputPlatform platform)
        {
            m_SelectedPlatform = platform;
            ui.UpdateMenuSelection(m_SelectedMode, m_SelectedPlatform);
            ui.SetMenuStatus(null);
        }

        public void StartFromMenu()
        {
            StartTour();
        }

        void StartTour()
        {
            if (m_Starting)
                return;
            LaunchState.Mode = m_SelectedMode;

            if (m_SelectedPlatform == InputPlatform.VirtualReality && rigs.Platform != InputPlatform.VirtualReality)
            {
                m_Starting = true;
                ui.SetMenuStatus(UIText.XrStarting);
                ui.SetStartInteractable(false);
                StartCoroutine(rigs.ActivateVR((ok, message) =>
                {
                    m_Starting = false;
                    ui.SetStartInteractable(true);
                    if (!ok)
                    {
                        m_SelectedPlatform = InputPlatform.Desktop;
                        LaunchState.Platform = InputPlatform.Desktop;
                        EnterMenu(message);
                        return;
                    }
                    LaunchState.Platform = InputPlatform.VirtualReality;
                    ui.SetPresentation(InputPlatform.VirtualReality, rigs.vrCamera);
                    BeginSession();
                }));
                return;
            }

            if (m_SelectedPlatform == InputPlatform.Desktop && rigs.Platform == InputPlatform.VirtualReality)
            {
                rigs.StopVRAndUseDesktop();
                ui.SetPresentation(InputPlatform.Desktop, rigs.desktopCamera);
            }
            LaunchState.Platform = rigs.Platform;
            BeginSession();
        }

        void BeginSession()
        {
            Mode = m_SelectedMode;
            Time.timeScale = 1f;
            tour.ResetAll();
            if (rigs.startPoint != null)
                rigs.TeleportTo(rigs.startPoint.position, rigs.startPoint.eulerAngles.y);
            if (guide != null && guideStart != null)
                guide.PlaceAt(guideStart.position, guideStart.eulerAngles.y);
            recorder.BeginSession(Mode, rigs.Platform, tour.scenarios);
            ui.HideAllPanels();
            ui.SetHudVisible(true);
            ui.SetStatusLine(null);
            ui.HideBanner();

            if (Mode == VisitMode.Trained)
            {
                State = GameState.Induction;
                guide.Say("Bienvenida/o. Antes de entrar, revisemos una inducción breve.");
                ui.ShowInduction(ContentDatabase.Data.induccion, () =>
                {
                    State = GameState.Touring;
                    tour.Begin();
                });
            }
            else
            {
                State = GameState.Touring;
                tour.Begin();
            }
        }

        // ------------------------------------------------------------------ Bucle

        void Update()
        {
            ApplyControls();

            if (PausePressed())
            {
                if (State == GameState.Touring || State == GameState.Consequence)
                    Pause();
                else if (State == GameState.Paused)
                    Resume();
            }

            if (recorder != null && recorder.HasSession && State != GameState.Menu && State != GameState.Results)
                ui.SetTimer("Tiempo " + UIManager.FormatTime(recorder.Elapsed) + "\n" + EnumText.ModeName(Mode));
        }

        bool PausePressed()
        {
            var kb = Keyboard.current;
            if (rigs.Platform == InputPlatform.Desktop && kb != null && kb.escapeKey.wasPressedThisFrame)
                return true;
            return rigs.MenuPressedVR();
        }

        void ApplyControls()
        {
            if (rigs.Platform != InputPlatform.Desktop)
                return;
            var exploring = State == GameState.Touring || State == GameState.Consequence;
            Cursor.lockState = exploring ? CursorLockMode.Locked : CursorLockMode.None;
            Cursor.visible = !exploring;
            rigs.SetDesktopControl(State == GameState.Touring, exploring);
        }

        // ------------------------------------------------------------------ Pausa

        void Pause()
        {
            m_StateBeforePause = State;
            m_TimeScaleBeforePause = Time.timeScale;
            State = GameState.Paused;
            Time.timeScale = 0f;
            ShowPauseMenu();
        }

        public void ShowPauseMenu()
        {
            var current = tour.Current;
            var summary = EnumText.ModeName(Mode) + " · " + EnumText.PlatformName(rigs.Platform) +
                          (current != null ? "\nSituación actual: " + current.ScenarioId + ". " + current.Content.titulo : "");
            ui.ShowPause(summary);
        }

        public void Resume()
        {
            if (State != GameState.Paused)
                return;
            ui.HideAllPanels();
            State = m_StateBeforePause;
            Time.timeScale = m_TimeScaleBeforePause;
        }

        // ------------------------------------------------------------------ Ventanas modales

        void EnterModal()
        {
            State = GameState.Modal;
            Time.timeScale = 0f;
        }

        void ExitModal()
        {
            if (State == GameState.Modal)
            {
                State = GameState.Touring;
                Time.timeScale = 1f;
            }
        }

        public void ShowDecision(DecisionRequest request)
        {
            var original = request.onChosen;
            request.onChosen = choice =>
            {
                ExitModal();
                original?.Invoke(choice);
            };
            EnterModal();
            ui.ShowDecision(request);
        }

        public void ShowFeedback(FeedbackRequest request)
        {
            var repeat = request.onRepeat;
            var cont = request.onContinue;
            if (repeat != null)
            {
                request.onRepeat = () =>
                {
                    ExitModal();
                    repeat();
                };
            }
            request.onContinue = () =>
            {
                ExitModal();
                cont?.Invoke();
            };
            EnterModal();
            ui.ShowFeedback(request);
        }

        public void ShowInfo(string title, string body, Action onClose)
        {
            EnterModal();
            ui.ShowInfo(title, body, () =>
            {
                ExitModal();
                onClose?.Invoke();
            });
        }

        /// <summary>
        /// Reproduce una consecuencia visible (movimiento bloqueado, cámara libre) y después ejecuta "then".
        /// Si "then" no abre otra ventana, se vuelve al recorrido.
        /// </summary>
        public void RunConsequence(IEnumerator routine, Action then)
        {
            State = GameState.Consequence;
            Time.timeScale = 1f;
            StartCoroutine(ConsequenceRoutine(routine, then));
        }

        IEnumerator ConsequenceRoutine(IEnumerator routine, Action then)
        {
            if (routine != null)
                yield return StartCoroutine(routine);
            then?.Invoke();
            if (State == GameState.Consequence)
                State = GameState.Touring;
            tour.RefreshProgress();
        }

        /// <summary>Reposiciona al visitante con un fundido (usado por "Repetir situación").</summary>
        public void RepositionPlayer(Vector3 position, float yaw, Action afterTeleport)
        {
            StartCoroutine(RepositionRoutine(position, yaw, afterTeleport));
        }

        IEnumerator RepositionRoutine(Vector3 position, float yaw, Action afterTeleport)
        {
            State = GameState.Consequence;
            Time.timeScale = 1f;
            if (ui.fader != null)
                yield return ui.fader.FadeTo(1f, 0.35f);
            rigs.TeleportTo(position, yaw);
            afterTeleport?.Invoke();
            yield return null;
            if (ui.fader != null)
                yield return ui.fader.FadeTo(0f, 0.35f);
            if (State == GameState.Consequence)
                State = GameState.Touring;
            ui.RecenterVrPanels();
            tour.RefreshProgress();
        }

        void OnGuideTalk()
        {
            if (State != GameState.Touring)
                return;
            var current = tour.Current;
            if (current != null && (current.Phase == ScenarioPhase.Active || current.Phase == ScenarioPhase.Armed))
                current.OnAskGuide();
            else
                guide.Say("Sigamos el recorrido. Si tienes dudas, pregúntame en cualquier momento.");
        }

        // ------------------------------------------------------------------ Fin, reinicio y salida

        public void EndTour(bool completed)
        {
            State = GameState.Results;
            Time.timeScale = 1f;
            if (audioCues != null)
                audioCues.SetSiren(false);
            recorder.EndSession(completed);
            var summary = recorder.Summary();
            if (summary != null)
                LaunchState.History.Add(summary);
            ui.SetHudVisible(false);
            ui.ShowResults(recorder.Report, LaunchState.History);
        }

        public void SaveReport()
        {
            var result = ReportExporter.Export(recorder.Report);
            ui.SetExportStatus(result.message);
            if (audioCues != null)
                audioCues.Play(result.AllOk ? Cue.Success : Cue.Error);
        }

        public void OpenReportFolder()
        {
            var folder = ReportExporter.DefaultFolder;
            try
            {
                Directory.CreateDirectory(folder);
                Application.OpenURL("file:///" + folder.Replace('\\', '/'));
                ui.SetExportStatus("Carpeta de reportes: " + folder);
            }
            catch (Exception e)
            {
                ui.SetExportStatus("No se pudo abrir la carpeta (" + folder + "): " + e.Message);
            }
        }

        public void RestartTour()
        {
            LaunchState.AutoStart = true;
            LaunchState.Mode = Mode;
            LaunchState.Platform = rigs.Platform;
            ReloadScene();
        }

        public void ReturnToMenu()
        {
            LaunchState.AutoStart = false;
            LaunchState.Mode = Mode;
            LaunchState.Platform = rigs.Platform;
            ReloadScene();
        }

        void ReloadScene()
        {
            Time.timeScale = 1f;
            if (audioCues != null)
                audioCues.SetSiren(false);
            var scene = SceneManager.GetActiveScene();
            if (scene.buildIndex >= 0)
                SceneManager.LoadScene(scene.buildIndex);
            else
                SceneManager.LoadScene(scene.name);
        }

        public void QuitApplication()
        {
            if (rigs != null && rigs.xrSession != null)
                rigs.xrSession.StopXR();
#if UNITY_EDITOR
            UnityEditor.EditorApplication.isPlaying = false;
#else
            Application.Quit();
#endif
        }
    }
}
