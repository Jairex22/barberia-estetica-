using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace FactoryVisitorSafety
{
    /// <summary>
    /// F. Ruta de evacuación obstruida. Primero el visitante puede detectar y reportar cajas que
    /// bloquean la ruta. Después, una alarma de práctica demuestra la diferencia entre una ruta
    /// despejada (salida este, corta) y una obstruida (salida norte, más larga). El visitante debe
    /// seguir al guía hasta el punto de reunión. Aquí "Continuar" reanuda el simulacro.
    /// </summary>
    public class ScenarioEvacuation : ScenarioBase
    {
        public Interactable boxesInteractable;
        public Transform[] boxes;
        public Transform[] boxClearedSpots;
        public NpcWalker warehouseWorker;
        public Transform workerStart;
        public Transform workerNearBoxes;
        public ZoneVolume alarmStartZone;
        public ZoneVolume backZone;
        public ZoneVolume assemblyZone;
        public Transform eastDoor;
        public Transform northDoor;
        public float eastDoorOpenYaw = 100f;
        public float northDoorOpenYaw = -100f;
        public BlinkingLamp[] alarmLamps;
        public GameObject blockedRouteSign;
        public Transform blockedLookout;
        public Transform[] shortRoute;
        public Transform[] longRoute;
        public float autoAlarmSeconds = 45f;

        static readonly string[] Options = { "reportar", "mover", "ignorar" };

        enum Stage { Detection, Clearing, Drill, Finished }

        Stage m_Stage;
        bool m_RouteCleared;
        bool m_RouteErrorRecorded;
        bool m_GuideOnLongRoute;
        float m_DetectionTimer;
        float m_DrillStart;
        string m_LastError;
        Vector3[] m_BoxPositions;
        Quaternion[] m_BoxRotations;
        Quaternion m_EastDoorClosed;
        Quaternion m_NorthDoorClosed;

        protected override void OnInitialize()
        {
            if (boxes != null)
            {
                m_BoxPositions = new Vector3[boxes.Length];
                m_BoxRotations = new Quaternion[boxes.Length];
                for (var i = 0; i < boxes.Length; i++)
                {
                    if (boxes[i] == null) continue;
                    m_BoxPositions[i] = boxes[i].position;
                    m_BoxRotations[i] = boxes[i].rotation;
                }
            }
            if (eastDoor != null) m_EastDoorClosed = eastDoor.localRotation;
            if (northDoor != null) m_NorthDoorClosed = northDoor.localRotation;
            if (boxesInteractable != null) boxesInteractable.Interacted += _ => Ask();
            if (alarmStartZone != null) alarmStartZone.Entered += _ => OnAlarmZone();
            if (backZone != null) backZone.Entered += _ => OnBack();
            if (assemblyZone != null) assemblyZone.Entered += _ => OnAssemblyPoint();
        }

        protected override void OnReset()
        {
            m_Stage = Stage.Detection;
            m_RouteCleared = false;
            m_RouteErrorRecorded = false;
            m_GuideOnLongRoute = false;
            m_DetectionTimer = 0f;
            m_LastError = null;
            if (boxes != null && m_BoxPositions != null)
            {
                for (var i = 0; i < boxes.Length; i++)
                {
                    if (boxes[i] == null) continue;
                    boxes[i].SetPositionAndRotation(m_BoxPositions[i], m_BoxRotations[i]);
                }
            }
            if (eastDoor != null) eastDoor.localRotation = m_EastDoorClosed;
            if (northDoor != null) northDoor.localRotation = m_NorthDoorClosed;
            SetAlarm(false);
            if (blockedRouteSign != null) blockedRouteSign.SetActive(false);
            if (warehouseWorker != null && workerStart != null)
                warehouseWorker.Place(workerStart.position, workerStart.eulerAngles.y);
            if (boxesInteractable != null)
                boxesInteractable.SetAvailable(false);
        }

        protected override void OnActivated()
        {
            if (m_Stage == Stage.Detection && boxesInteractable != null)
                boxesInteractable.SetAvailable(true);
        }

        void Update()
        {
            if (game == null || Phase != ScenarioPhase.Active)
                return;
            if (m_Stage == Stage.Detection)
            {
                m_DetectionTimer += Time.deltaTime;
                if (m_DetectionTimer >= autoAlarmSeconds)
                    StartDrill();
            }
            else if (m_Stage == Stage.Drill)
            {
                game.ui.SetStatusLine("Simulacro en curso: " + UIManager.FormatTime(game.recorder.Elapsed - m_DrillStart) +
                                      (m_RouteCleared ? "  ·  Ruta: salida este (despejada)" : "  ·  Ruta: salida norte (alternativa, más larga)"));
            }
        }

        void Ask()
        {
            if (m_Stage != Stage.Detection)
                return;
            AskDecision(Options, choice =>
            {
                switch (choice)
                {
                    case "reportar":
                        game.recorder.HazardIdentified(scenarioId, "Identificó cajas que obstruyen la ruta de evacuación");
                        game.recorder.ReportMade(scenarioId, "ruta_obstruida", "Reportó al guía la ruta de evacuación obstruida");
                        game.recorder.Decision(scenarioId, "reportar", "Reportó la obstrucción sin manipular la carga", true);
                        game.audioCues.Play(Cue.Success);
                        game.ui.ShowToast("Reporte registrado: ruta de evacuación obstruida");
                        m_Stage = Stage.Clearing;
                        if (boxesInteractable != null)
                            boxesInteractable.SetAvailable(false);
                        game.RunConsequence(ClearBoxesRoutine(true), null);
                        break;
                    case "mover":
                        m_LastError = "mover_cajas";
                        RaiseError("mover_cajas", "Intentó mover las cajas por su cuenta", WobbleRoutine());
                        break;
                    default:
                        m_LastError = "ruta_no_reportada";
                        m_RouteErrorRecorded = true;
                        RaiseError("ruta_no_reportada", "Decidió no reportar la ruta obstruida", null);
                        break;
                }
            });
        }

        void OnAlarmZone()
        {
            if (Phase == ScenarioPhase.Active && m_Stage == Stage.Detection && m_DetectionTimer > 8f)
                StartDrill();
        }

        IEnumerator ClearBoxesRoutine(bool thenDrill)
        {
            GuideSayResolution();
            if (warehouseWorker != null && workerNearBoxes != null)
            {
                var arrived = false;
                warehouseWorker.WalkPath(new[] { workerNearBoxes.position }, () => arrived = true);
                var timeout = 8f;
                while (!arrived && timeout > 0f)
                {
                    timeout -= Time.deltaTime;
                    yield return null;
                }
            }
            if (boxes != null && boxClearedSpots != null)
            {
                for (var i = 0; i < boxes.Length && i < boxClearedSpots.Length; i++)
                {
                    if (boxes[i] == null || boxClearedSpots[i] == null) continue;
                    var from = boxes[i].position;
                    var to = boxClearedSpots[i].position;
                    for (var t = 0f; t < 1f; t += Time.deltaTime / 0.5f)
                    {
                        boxes[i].position = Vector3.Lerp(from, to, Mathf.SmoothStep(0f, 1f, t));
                        yield return null;
                    }
                    boxes[i].position = to;
                    boxes[i].rotation = boxClearedSpots[i].rotation;
                }
            }
            m_RouteCleared = true;
            if (warehouseWorker != null && workerStart != null)
                warehouseWorker.WalkPath(new[] { workerStart.position });
            game.ui.ShowToast("Ruta de evacuación despejada");
            if (thenDrill)
            {
                yield return new WaitForSeconds(3f);
                StartDrill();
            }
        }

        IEnumerator WobbleRoutine()
        {
            game.ui.ShowBanner("(!) Carga inestable: los visitantes no manipulan material", 4f);
            if (boxes != null && boxes.Length > 0 && boxes[boxes.Length - 1] != null)
            {
                var top = boxes[boxes.Length - 1];
                var start = top.position;
                var startRot = top.rotation;
                var end = start + top.right * 0.35f + Vector3.down * 0.1f;
                for (var t = 0f; t < 1f; t += Time.deltaTime / 0.8f)
                {
                    top.position = Vector3.Lerp(start, end, t);
                    top.rotation = startRot * Quaternion.Euler(0f, 0f, -18f * t);
                    yield return null;
                }
            }
            yield return new WaitForSeconds(1.5f);
        }

        void StartDrill()
        {
            if (m_Stage == Stage.Drill || m_Stage == Stage.Finished)
                return;
            m_Stage = Stage.Drill;
            m_DrillStart = game.recorder.Elapsed;
            if (boxesInteractable != null)
                boxesInteractable.SetAvailable(false);
            SetAlarm(true);
            OpenDoors();
            game.ui.SetObjective("ALARMA DE PRÁCTICA: sigue al guía por la ruta de evacuación hasta el punto de reunión.");
            game.recorder.Info(scenarioId, "simulacro", "Inicia la alarma de práctica (ruta " + (m_RouteCleared ? "despejada" : "obstruida") + ")");

            if (m_RouteCleared)
            {
                game.guide.SayLines(new[] { "¡Alarma de práctica! Sígueme con calma por la ruta marcada hacia la salida este. No regreses por objetos." });
                game.guide.WalkRoute(Points(shortRoute));
                return;
            }

            if (!m_RouteErrorRecorded)
            {
                m_RouteErrorRecorded = true;
                m_LastError = "ruta_no_reportada";
                RaiseError("ruta_no_reportada", "La ruta obstruida no se reportó antes de la alarma", BlockedRouteRoutine());
            }
            else
            {
                game.RunConsequence(BlockedRouteRoutine(), () => StartLongRoute());
            }
        }

        IEnumerator BlockedRouteRoutine()
        {
            if (blockedRouteSign != null)
                blockedRouteSign.SetActive(true);
            if (blockedLookout != null)
            {
                var arrived = false;
                game.guide.WalkTo(blockedLookout.position, () => arrived = true);
                var timeout = 8f;
                while (!arrived && timeout > 0f)
                {
                    timeout -= Time.deltaTime;
                    yield return null;
                }
            }
            game.guide.SayLines(ContentDatabase.Lines(Content.intervencionGuia));
            game.ui.ShowBanner("RUTA OBSTRUIDA — el guía cambia a la salida norte (más larga)", 4f);
            yield return new WaitForSeconds(2.5f);
        }

        void StartLongRoute()
        {
            if (m_GuideOnLongRoute)
                return;
            m_GuideOnLongRoute = true;
            game.guide.WalkRoute(Points(longRoute));
        }

        void OnBack()
        {
            if (Phase != ScenarioPhase.Active || m_Stage != Stage.Drill)
                return;
            m_LastError = "regresar";
            RaiseError("regresar", "Regresó hacia el área de ensamble durante la alarma", GuideCallsRoutine());
        }

        IEnumerator GuideCallsRoutine()
        {
            game.ui.ShowBanner("Durante la alarma: no regreses, sigue al guía", 4f);
            yield return new WaitForSeconds(1.5f);
        }

        void OnAssemblyPoint()
        {
            if (Phase != ScenarioPhase.Active || m_Stage != Stage.Drill)
                return;
            m_Stage = Stage.Finished;
            var seconds = game.recorder.Elapsed - m_DrillStart;
            SetAlarm(false);
            game.ui.SetStatusLine(null);
            var detail = "Tiempo del simulacro: " + UIManager.FormatTime(seconds) + ". Ruta utilizada: " +
                         (m_RouteCleared ? "salida este, despejada gracias al reporte." : "salida norte (alternativa), más larga porque la ruta principal estaba obstruida.");
            Succeed("punto_reunion", "Llegó al punto de reunión siguiendo al guía (" + UIManager.FormatTime(seconds) + ")", ArrivalRoutine(), detail);
        }

        IEnumerator ArrivalRoutine()
        {
            game.ui.ShowBanner("Fin del simulacro: todos en el punto de reunión", 3f);
            game.guide.SayLines(new[] { "Llegamos al punto de reunión. Aquí se pasa lista y se esperan instrucciones." });
            yield return new WaitForSeconds(2f);
        }

        /// <summary>En F, "Continuar" reanuda el flujo en lugar de cerrar la situación.</summary>
        protected override void ContinueAfterError()
        {
            ResumeActive();
            var error = m_LastError;
            m_LastError = null;
            if (m_Stage == Stage.Detection)
            {
                if (boxesInteractable != null)
                    boxesInteractable.SetAvailable(false);
                if (error == "mover_cajas")
                {
                    // El guía reporta la obstrucción y el personal de almacén despeja la ruta.
                    m_Stage = Stage.Clearing;
                    game.RunConsequence(ClearBoxesRoutine(true), null);
                }
                else
                {
                    // Se mantiene la obstrucción: la alarma mostrará la consecuencia.
                    StartDrill();
                }
                return;
            }
            if (m_Stage == Stage.Drill && !m_RouteCleared && error == "ruta_no_reportada")
                StartLongRoute();
        }

        void OpenDoors()
        {
            StartCoroutine(RotateDoor(eastDoor, m_EastDoorClosed, eastDoorOpenYaw));
            StartCoroutine(RotateDoor(northDoor, m_NorthDoorClosed, northDoorOpenYaw));
        }

        IEnumerator RotateDoor(Transform door, Quaternion closed, float openYaw)
        {
            if (door == null)
                yield break;
            var open = closed * Quaternion.Euler(0f, openYaw, 0f);
            for (var t = 0f; t < 1f; t += Time.deltaTime / 1.2f)
            {
                door.localRotation = Quaternion.Slerp(closed, open, t);
                yield return null;
            }
            door.localRotation = open;
        }

        void SetAlarm(bool on)
        {
            if (alarmLamps != null)
            {
                foreach (var lamp in alarmLamps)
                {
                    if (lamp == null) continue;
                    if (on && game != null && game.palette != null)
                        lamp.SetState(game.palette.lampRed, true);
                    else
                        lamp.TurnOff();
                }
            }
            if (game != null && game.audioCues != null)
                game.audioCues.SetSiren(on);
            if (game != null && game.ui != null)
            {
                if (on)
                    game.ui.ShowBanner("ALARMA DE PRÁCTICA — Sigue al guía hasta el punto de reunión", 0f);
                else
                    game.ui.HideBanner();
            }
        }

        static List<Vector3> Points(Transform[] route)
        {
            var list = new List<Vector3>();
            if (route == null)
                return list;
            foreach (var t in route)
            {
                if (t != null)
                    list.Add(t.position);
            }
            return list;
        }
    }
}
