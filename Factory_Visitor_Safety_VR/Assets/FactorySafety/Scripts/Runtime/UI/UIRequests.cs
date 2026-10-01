using System;
using System.Collections.Generic;

namespace FactoryVisitorSafety
{
    public class DecisionChoice
    {
        public string id;
        public string text;

        public DecisionChoice(string id, string text)
        {
            this.id = id;
            this.text = text;
        }
    }

    /// <summary>Pregunta de decisión con varias opciones. onChosen recibe null si se cierra sin decidir.</summary>
    public class DecisionRequest
    {
        public string title;
        public string question;
        public readonly List<DecisionChoice> choices = new List<DecisionChoice>();
        public Action<string> onChosen;
    }

    /// <summary>Retroalimentación tras un error o una decisión adecuada.</summary>
    public class FeedbackRequest
    {
        public FeedbackKind kind;
        public string scenarioTitle;
        public HazardCategory category;
        public string heading;
        public string whatHappened;
        public string missingInfo;
        public string consequence;
        public string betterDecision;
        public string organizationalFactor;
        public string modeNote;
        public string successMessage;
        public Action onRepeat;
        public Action onContinue;
    }
}
