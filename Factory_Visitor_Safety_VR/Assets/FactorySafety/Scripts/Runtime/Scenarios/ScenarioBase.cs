using System;
using System.Collections;
using UnityEngine;

namespace FactoryVisitorSafety
{
    public enum ScenarioPhase
    {
        Idle,
        Armed,
        Active,
        AwaitingFeedback,
        Done
    }

    /// <summary>
    /// Ciclo común de una situación: Armada (el guía se dirige al punto) → Activa (al entrar en la zona
    /// de activación) → decisión del visitante → consecuencia visible → retroalimentación → registro.
    /// Los eventos solo se aceptan en fase Activa, por lo que permanecer en una zona o repetir una
    /// acción no suma errores ni aciertos duplicados.
    /// </summary>
    public abstract class ScenarioBase : MonoBehaviour
    {
        public string scenarioId = "A";
        public HazardCategory category = HazardCategory.Safety;
        public ZoneVolume activationZone;
        public Transform playerStart;
        public Transform guideSpot;

        protected GameFlow game;

        public string ScenarioId => scenarioId;
        public HazardCategory Category => category;
        public ScenarioContent Content => ContentDatabase.Scenario(scenarioId);
        public ScenarioPhase Phase { get; protected set; } = ScenarioPhase.Idle;
        public bool IsActive => Phase == ScenarioPhase.Active;

        public string Objective => game != null && game.Mode == VisitMode.Trained
            ? Content.objetivoConCapacitacion
            : Content.objetivoSinInduccion;

        public void Initialize(GameFlow flow)
        {
            game = flow;
            if (activationZone != null)
                activationZone.Entered += OnActivationZoneEntered;
            OnInitialize();
        }

        void OnActivationZoneEntered(ZoneVolume zone)
        {
            if (Phase == ScenarioPhase.Armed)
                Activate();
        }

        /// <summary>Restablece objetos y banderas al estado inicial de la situación.</summary>
        public void ResetScenario()
        {
            StopAllCoroutines();
            Phase = ScenarioPhase.Idle;
            OnReset();
        }

        /// <summary>La situación pasa a ser la actual del recorrido.</summary>
        public void Arm()
        {
            Phase = ScenarioPhase.Armed;
            if (guideSpot != null)
                game.guide.WalkTo(guideSpot.position);
            game.ui.SetObjective(Objective);
            game.ui.SetStatusLine(null);
            OnArmed();
            if (activationZone == null || activationZone.PlayerInside)
                Activate();
        }

        protected void Activate()
        {
            if (Phase != ScenarioPhase.Armed)
                return;
            Phase = ScenarioPhase.Active;
            game.recorder.ScenarioStarted(scenarioId);
            game.ui.SetObjective(Objective);
            var lines = game.Mode == VisitMode.Trained ? Content.guiaConCapacitacion : Content.guiaSinInduccion;
            game.guide.SayLines(ContentDatabase.Lines(lines));
            OnActivated();
        }

        /// <summary>El visitante pide ayuda u orientación al guía.</summary>
        public virtual void OnAskGuide()
        {
            if (Phase == ScenarioPhase.Active)
                game.recorder.Decision(scenarioId, "pedir_ayuda", "Pidió orientación al guía", true);
            game.guide.SayLines(ContentDatabase.Lines(Content.ayudaGuia));
        }

        protected void AskDecision(string[] optionIds, Action<string> onChosen)
        {
            if (Phase != ScenarioPhase.Active)
                return;
            var request = new DecisionRequest
            {
                title = scenarioId + ". " + Content.titulo,
                question = Content.pregunta
            };
            foreach (var id in optionIds)
                request.choices.Add(new DecisionChoice(id, ContentDatabase.Option(scenarioId, id)));
            request.onChosen = choice =>
            {
                if (choice == null || Phase != ScenarioPhase.Active)
                    return;
                onChosen(choice);
            };
            game.ShowDecision(request);
        }

        /// <summary>Registra un error, muestra su consecuencia y luego la retroalimentación.</summary>
        protected void RaiseError(string errorId, string description, IEnumerator consequence, string extraDetail = null)
        {
            if (Phase != ScenarioPhase.Active)
                return;
            Phase = ScenarioPhase.AwaitingFeedback;
            game.recorder.Error(scenarioId, errorId, description);
            game.audioCues.Play(Cue.Error);
            game.RunConsequence(consequence, () => ShowErrorFeedback(errorId, extraDetail));
        }

        void ShowErrorFeedback(string errorId, string extraDetail)
        {
            var e = ContentDatabase.Error(scenarioId, errorId);
            var what = e.queOcurrio;
            if (!string.IsNullOrEmpty(extraDetail))
                what += " " + extraDetail;
            game.ShowFeedback(new FeedbackRequest
            {
                kind = FeedbackKind.Error,
                scenarioTitle = scenarioId + ". " + Content.titulo,
                category = category,
                heading = "Error registrado: " + e.titulo,
                whatHappened = what,
                missingInfo = e.informacionFaltante,
                consequence = e.consecuencia,
                betterDecision = e.decisionAdecuada,
                organizationalFactor = e.factorOrganizacional,
                modeNote = game.Mode == VisitMode.NoInduction
                    ? "En esta visita sin inducción esa información no se entregó antes del punto crítico: el problema no es solo de la persona."
                    : "En esta visita con capacitación la información se presentó antes del punto crítico. Repite la situación para practicar la decisión.",
                onRepeat = Repeat,
                onContinue = ContinueAfterError
            });
        }

        /// <summary>Registra la decisión adecuada, muestra el resultado y la retroalimentación positiva.</summary>
        protected void Succeed(string decisionCode, string description, IEnumerator outcome, string extraMessage = null)
        {
            if (Phase != ScenarioPhase.Active)
                return;
            Phase = ScenarioPhase.AwaitingFeedback;
            game.recorder.Decision(scenarioId, decisionCode, description, true);
            game.RunConsequence(outcome, () =>
            {
                game.audioCues.Play(Cue.Success);
                var exito = Content.exito ?? new SuccessContent { titulo = "Decisión adecuada", mensaje = "" };
                var message = exito.mensaje;
                if (!string.IsNullOrEmpty(extraMessage))
                    message += "\n\n" + extraMessage;
                game.ShowFeedback(new FeedbackRequest
                {
                    kind = FeedbackKind.Success,
                    scenarioTitle = scenarioId + ". " + Content.titulo,
                    category = category,
                    heading = "Decisión adecuada: " + exito.titulo,
                    successMessage = message,
                    onContinue = () => Complete(ScenarioStatus.Resolved)
                });
            });
        }

        void Repeat()
        {
            game.recorder.Retry(scenarioId);
            var start = playerStart != null ? playerStart : transform;
            game.RepositionPlayer(start.position, start.eulerAngles.y, () =>
            {
                ResetScenario();
                game.ui.SetStatusLine(null);
                game.ui.HideBanner();
                if (guideSpot != null)
                    game.guide.PlaceAt(guideSpot.position, guideSpot.eulerAngles.y);
                Phase = ScenarioPhase.Armed;
                OnArmed();
                Activate();
            });
        }

        /// <summary>
        /// Tras "Continuar": por defecto el guía aplica la resolución segura y la situación se cierra
        /// como "continuada tras error". Las situaciones pueden redefinirlo (F reanuda el simulacro).
        /// </summary>
        protected virtual void ContinueAfterError()
        {
            game.RunConsequence(SafeResolution(), () => Complete(ScenarioStatus.ContinuedAfterError));
        }

        protected virtual IEnumerator SafeResolution()
        {
            yield break;
        }

        protected void Complete(ScenarioStatus status)
        {
            if (Phase == ScenarioPhase.Done)
                return;
            Phase = ScenarioPhase.Done;
            game.recorder.ScenarioCompleted(scenarioId, status);
            game.ui.SetStatusLine(null);
            OnCompleted();
            game.tour.OnScenarioFinished(this);
        }

        /// <summary>Vuelve a fase Activa (usado por situaciones que continúan tras un error).</summary>
        protected void ResumeActive()
        {
            if (Phase == ScenarioPhase.AwaitingFeedback)
                Phase = ScenarioPhase.Active;
        }

        protected void GuideSayResolution()
        {
            game.guide.SayLines(ContentDatabase.Lines(Content.resolucionGuia));
        }

        protected virtual void OnInitialize() { }
        protected abstract void OnReset();
        protected virtual void OnArmed() { }
        protected virtual void OnActivated() { }
        protected virtual void OnCompleted() { }
    }
}
