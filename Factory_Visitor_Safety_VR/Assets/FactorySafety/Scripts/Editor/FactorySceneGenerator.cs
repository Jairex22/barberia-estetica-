using System.Collections.Generic;
using System.IO;
using Unity.XR.CoreUtils;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem;
using UnityEngine.InputSystem.UI;
using UnityEngine.InputSystem.XR;
using UnityEngine.Rendering;
using UnityEngine.SceneManagement;
using UnityEngine.XR.Interaction.Toolkit.Locomotion;
using UnityEngine.XR.Interaction.Toolkit.Locomotion.Teleportation;

namespace FactoryVisitorSafety.EditorTools
{
    /// <summary>
    /// Construye y guarda la escena FactoryTour. Solo elimina y vuelve a crear los objetos raíz marcados
    /// con GeneratedByFactorySafety; cualquier otro objeto que agregues a la escena se conserva.
    /// </summary>
    internal static partial class FactorySceneGenerator
    {
        public const string ScenePath = "Assets/FactorySafety/Scenes/FactoryTour.unity";

        // Referencias compartidas entre las partes del generador.
        static GameFlow s_Game;
        static GuideController s_Guide;
        static PlayerRigManager s_Rigs;
        static AudioCues s_Audio;
        static ForkliftController s_Forklift;

        public static bool Generate(out string summary)
        {
            summary = "";
            if (EditorApplication.isPlayingOrWillChangePlaymode)
            {
                summary = "Sal del modo Play antes de generar la escena.";
                return false;
            }
            if (!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo())
            {
                summary = "Generación cancelada por el usuario.";
                return false;
            }

            Geo.Mats = MaterialLibrary.CreateOrUpdate(out Geo.Palette);
            Geo.Font = UIFactory.DefaultFont();

            MaterialLibrary.EnsureFolder(Path.GetDirectoryName(ScenePath).Replace('\\', '/'));
            Scene scene;
            if (File.Exists(ScenePath))
                scene = EditorSceneManager.OpenScene(ScenePath, OpenSceneMode.Single);
            else
                scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            var removed = RemoveGenerated(scene);

            ConfigureLighting();
            var systems = Root("[FVS] Sistemas");
            var building = Root("[FVS] Edificio");
            var player = Root("[FVS] Visitante");

            BuildSystems(systems);
            BuildBuilding(building);
            BuildPlayer(player);
            BuildGuide(Root("[FVS] Guía"));

            var scenarios = new List<ScenarioBase>
            {
                BuildAreaA(Root("[FVS] A - Recepción y acceso")),
                BuildAreaB(Root("[FVS] B - Pasillo y cruce de montacargas")),
                BuildAreaC(Root("[FVS] C - Pasillo con derrame")),
                BuildAreaD(Root("[FVS] D - Producción con maquinaria protegida")),
                BuildAreaE(Root("[FVS] E - Ensamble y control de calidad")),
                BuildAreaF(Root("[FVS] F - Almacén, salida y punto de reunión"))
            };
            s_Game.tour.scenarios = scenarios.ToArray();
            s_Guide.forklift = s_Forklift;

            // Interfaz construida y guardada en la escena (los botones se conectan al iniciar).
            s_Game.ui.font = Geo.Font;
            s_Game.ui.BuildInterface();

            EditorSceneManager.MarkSceneDirty(scene);
            if (!EditorSceneManager.SaveScene(scene, ScenePath))
            {
                summary = "No se pudo guardar la escena en " + ScenePath;
                return false;
            }
            ProjectConfigurator.SetBuildScenes(ScenePath);
            AssetDatabase.SaveAssets();
            summary = "Escena generada y guardada en " + ScenePath + ". Objetos generados previos reemplazados: " + removed + ".";
            return true;
        }

        static int RemoveGenerated(Scene scene)
        {
            var count = 0;
            foreach (var root in scene.GetRootGameObjects())
            {
                if (root.GetComponent<GeneratedByFactorySafety>() != null)
                {
                    Object.DestroyImmediate(root);
                    count++;
                }
            }
            return count;
        }

        static Transform Root(string name)
        {
            var go = new GameObject(name);
            go.AddComponent<GeneratedByFactorySafety>();
            return go.transform;
        }

        static void ConfigureLighting()
        {
            RenderSettings.ambientMode = AmbientMode.Trilight;
            RenderSettings.ambientSkyColor = new Color(0.78f, 0.80f, 0.84f);
            RenderSettings.ambientEquatorColor = new Color(0.58f, 0.60f, 0.62f);
            RenderSettings.ambientGroundColor = new Color(0.36f, 0.36f, 0.36f);
            RenderSettings.fog = false;
            RenderSettings.skybox = null;
        }

        // ------------------------------------------------------------------ Sistemas

        static void BuildSystems(Transform root)
        {
            var sun = new GameObject("Luz direccional");
            sun.transform.SetParent(root, false);
            sun.transform.rotation = Quaternion.Euler(58f, -35f, 0f);
            var light = sun.AddComponent<Light>();
            light.type = LightType.Directional;
            light.intensity = 1.1f;
            light.color = new Color(1f, 0.97f, 0.92f);
            light.shadows = LightShadows.Soft;
            RenderSettings.sun = light;

            s_Game = root.gameObject.AddComponent<GameFlow>();
            s_Game.tour = root.gameObject.AddComponent<TourDirector>();
            s_Game.recorder = root.gameObject.AddComponent<SessionRecorder>();
            s_Audio = root.gameObject.AddComponent<AudioCues>();
            s_Audio.oneShotSource = root.gameObject.AddComponent<AudioSource>();
            s_Audio.sirenSource = root.gameObject.AddComponent<AudioSource>();
            s_Game.audioCues = s_Audio;
            s_Game.palette = Geo.Palette;
            var monitor = root.gameObject.AddComponent<ZoneMonitor>();
            monitor.game = s_Game;

            var uiGo = new GameObject("Interfaz");
            uiGo.transform.SetParent(root, false);
            var ui = uiGo.AddComponent<UIManager>();
            ui.game = s_Game;
            s_Game.ui = ui;

            var es = new GameObject("EventSystem");
            es.transform.SetParent(root, false);
            es.AddComponent<EventSystem>();
            // Sin acciones asignadas: el módulo usa sus acciones predeterminadas al activarse (OnEnable).
            es.AddComponent<InputSystemUIInputModule>();

            var xr = new GameObject("Sesión XR");
            xr.transform.SetParent(root, false);
            var xrSession = xr.AddComponent<XRSessionController>();

            // El rig se completa en BuildPlayer.
            s_Rigs = null;
            s_XrSession = xrSession;
            s_Monitor = monitor;
        }

        static XRSessionController s_XrSession;
        static ZoneMonitor s_Monitor;

        // ------------------------------------------------------------------ Visitante (escritorio y VR)

        static void BuildPlayer(Transform root)
        {
            s_Rigs = root.gameObject.AddComponent<PlayerRigManager>();
            s_Rigs.xrSession = s_XrSession;
            s_Game.rigs = s_Rigs;
            s_Monitor.rigs = s_Rigs;
            s_Rigs.startPoint = Geo.Point("Punto de inicio", root, new Vector3(0f, 0f, -10.2f), 0f);

            // Rig de escritorio.
            var desktop = new GameObject("Rig escritorio");
            desktop.transform.SetParent(root, false);
            desktop.transform.position = s_Rigs.startPoint.position;
            var cc = desktop.AddComponent<CharacterController>();
            cc.height = 1.75f;
            cc.radius = 0.3f;
            cc.center = new Vector3(0f, 0.875f, 0f);
            cc.stepOffset = 0.3f;
            cc.slopeLimit = 45f;
            var controller = desktop.AddComponent<DesktopPlayerController>();
            var camGo = new GameObject("Cámara escritorio");
            camGo.tag = "MainCamera";
            camGo.transform.SetParent(desktop.transform, false);
            camGo.transform.localPosition = new Vector3(0f, 1.62f, 0f);
            var cam = camGo.AddComponent<Camera>();
            ConfigureCamera(cam);
            cam.stereoTargetEye = StereoTargetEyeMask.None;
            camGo.AddComponent<AudioListener>();
            var interactor = camGo.AddComponent<DesktopInteractor>();
            interactor.viewCamera = cam;
            interactor.game = s_Game;
            controller.cameraPivot = camGo.transform;
            s_Rigs.desktopRig = desktop;
            s_Rigs.desktopController = controller;
            s_Rigs.desktopCamera = cam;

            // Rig de realidad virtual (XR Origin + locomoción de XR Interaction Toolkit).
            var vr = new GameObject("XR Origin (VR)");
            vr.transform.SetParent(root, false);
            vr.transform.position = s_Rigs.startPoint.position;
            var origin = vr.AddComponent<XROrigin>();
            var offset = Geo.Group("Camera Offset", vr.transform);
            var comfort = Geo.Group("Ajuste de altura (modo sentado)", offset);
            var vrCamGo = new GameObject("Main Camera (VR)");
            vrCamGo.tag = "MainCamera";
            vrCamGo.transform.SetParent(comfort, false);
            vrCamGo.transform.localPosition = new Vector3(0f, 1.6f, 0f);
            var vrCam = vrCamGo.AddComponent<Camera>();
            ConfigureCamera(vrCam);
            vrCamGo.AddComponent<AudioListener>();
            var headDriver = vrCamGo.AddComponent<TrackedPoseDriver>();
            headDriver.trackingType = TrackedPoseDriver.TrackingType.RotationAndPosition;
            headDriver.positionInput = new InputActionProperty(SimpleAction("Cabeza posición", "<XRHMD>/centerEyePosition", "Vector3"));
            headDriver.rotationInput = new InputActionProperty(SimpleAction("Cabeza rotación", "<XRHMD>/centerEyeRotation", "Quaternion"));

            origin.Origin = vr;
            origin.CameraFloorOffsetObject = offset.gameObject;
            origin.Camera = vrCam;
            origin.RequestedTrackingOriginMode = XROrigin.TrackingOriginMode.Floor;

            var mediator = vr.AddComponent<LocomotionMediator>();
            var bodyTransformer = vr.GetComponent<XRBodyTransformer>();
            if (bodyTransformer == null)
                bodyTransformer = vr.AddComponent<XRBodyTransformer>();
            bodyTransformer.xrOrigin = origin;

            var locomotion = Geo.Group("Locomoción", vr.transform);
            var teleport = locomotion.gameObject.AddComponent<TeleportationProvider>();
            teleport.mediator = mediator;
            var turn = locomotion.gameObject.AddComponent<SnapTurnLocomotionProvider>();
            turn.mediator = mediator;

            var input = vr.AddComponent<VRLocomotionInput>();
            var left = BuildHand("Mando izquierdo", comfort, false, input);
            var right = BuildHand("Mando derecho", comfort, true, input);
            input.leftHand = left;
            input.rightHand = right;
            input.head = vrCamGo.transform;
            input.palette = Geo.Palette;
            input.teleportProvider = teleport;
            input.turnProvider = turn;
            input.rigs = s_Rigs;
            input.game = s_Game;
            var arc = Geo.Line("Arco de teletransporte", vr.transform, "RayoValido", 0.03f);
            input.arcLine = arc;
            var reticle = Geo.LocalCylinder("Retícula de destino", vr.transform, Vector3.zero, 0.6f, 0.02f, "RayoValido");
            reticle.SetActive(false);
            input.reticle = reticle.transform;
            input.reticleRenderer = reticle.GetComponent<Renderer>();

            s_Rigs.vrRig = vr;
            s_Rigs.xrOrigin = origin;
            s_Rigs.vrCamera = vrCam;
            s_Rigs.vrComfortOffset = comfort;
            s_Rigs.vrLocomotion = input;
            vr.SetActive(false);
        }

        static Transform BuildHand(string name, Transform parent, bool right, VRLocomotionInput input)
        {
            var hand = new GameObject(name);
            hand.transform.SetParent(parent, false);
            hand.transform.localPosition = new Vector3(right ? 0.2f : -0.2f, 1.1f, 0.3f);
            var driver = hand.AddComponent<TrackedPoseDriver>();
            driver.trackingType = TrackedPoseDriver.TrackingType.RotationAndPosition;
            var side = right ? "{RightHand}" : "{LeftHand}";
            var pos = new InputAction("Posición " + name, InputActionType.Value, expectedControlType: "Vector3");
            pos.AddCompositeBinding("Vector3Fallback")
                .With("First", "<XRController>" + side + "/pointerPosition")
                .With("Second", "<XRController>" + side + "/devicePosition");
            var rot = new InputAction("Rotación " + name, InputActionType.Value, expectedControlType: "Quaternion");
            rot.AddCompositeBinding("QuaternionFallback")
                .With("First", "<XRController>" + side + "/pointerRotation")
                .With("Second", "<XRController>" + side + "/deviceRotation");
            driver.positionInput = new InputActionProperty(pos);
            driver.rotationInput = new InputActionProperty(rot);

            Geo.LocalBox("Modelo", hand.transform, new Vector3(0f, 0f, -0.03f), new Vector3(0.05f, 0.04f, 0.14f), "MetalOscuro");
            Geo.LocalBox("Punta", hand.transform, new Vector3(0f, 0.005f, 0.045f), new Vector3(0.03f, 0.03f, 0.02f), right ? "LuzAzul" : "LuzVerde");

            var pointer = hand.AddComponent<VRHandPointer>();
            pointer.rightHand = right;
            pointer.palette = Geo.Palette;
            pointer.game = s_Game;
            pointer.locomotion = input;
            pointer.line = Geo.Line("Rayo", hand.transform, "RayoNeutral", 0.008f);
            return hand.transform;
        }

        static InputAction SimpleAction(string name, string binding, string controlType)
        {
            return new InputAction(name, InputActionType.Value, binding, expectedControlType: controlType);
        }

        static void ConfigureCamera(Camera cam)
        {
            cam.nearClipPlane = 0.05f;
            cam.farClipPlane = 250f;
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = new Color(0.62f, 0.76f, 0.90f);
        }

        // ------------------------------------------------------------------ Guía

        static void BuildGuide(Transform root)
        {
            var walker = Geo.Person("Guía virtual", root, new Vector3(1.8f, 0f, -6.6f), -90f, "CamisaGuia", true, "CascoBlanco", "GUÍA", "Piel2");
            walker.speed = 1.5f;
            var guide = root.gameObject.AddComponent<GuideController>();
            guide.walker = walker;
            guide.game = s_Game;
            s_Guide = guide;
            s_Game.guide = guide;
            s_Game.guideStart = Geo.Point("Inicio del guía", root, new Vector3(1.8f, 0f, -6.6f), -90f);

            var col = walker.gameObject.AddComponent<CapsuleCollider>();
            col.center = new Vector3(0f, 0.95f, 0f);
            col.height = 1.9f;
            col.radius = 0.3f;
            guide.talkInteractable = Geo.MakeInteractable(walker.gameObject, "Hablar con el guía / pedir orientación", walker.transform.position + Vector3.up * 2.45f);

            var bubble = new GameObject("Burbuja");
            bubble.transform.SetParent(walker.transform, false);
            bubble.transform.localPosition = new Vector3(0f, 3.05f, 0f);
            guide.bubbleText = Geo.WorldText("Texto", bubble.transform, Vector3.zero, Quaternion.identity, "", 30, Color.black,
                new Vector2(560f, 210f), 0.0038f, true, new Color(1f, 1f, 1f, 0.92f), FontStyle.Normal);
            guide.bubble = bubble;
            bubble.SetActive(false);
        }
    }
}
