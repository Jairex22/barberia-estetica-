using UnityEngine;
using UnityEngine.UI;

namespace FactoryVisitorSafety
{
    /// <summary>
    /// Máquina protegida por resguardo fijo. El resguardo no es interactivo: el simulador nunca
    /// permite manipularlo ni muestra cómo anular dispositivos de seguridad.
    /// </summary>
    public class MachineController : MonoBehaviour
    {
        public enum MachineState { Running, AuthorizedStop, SafetyStop, Jammed }

        public Transform pressHead;
        public float topY = 1.9f;
        public float bottomY = 1.25f;
        public float cycleSeconds = 2.4f;
        public BlinkingLamp beacon;
        public Text statusText;
        public MaterialPalette palette;
        public AudioCues audioCues;

        public MachineState State { get; private set; }
        float m_Phase;

        void Start()
        {
            Run();
        }

        void Update()
        {
            if (State != MachineState.Running || pressHead == null)
                return;
            m_Phase += Time.deltaTime / cycleSeconds;
            var t = 0.5f - 0.5f * Mathf.Cos(m_Phase * Mathf.PI * 2f);
            var p = pressHead.localPosition;
            pressHead.localPosition = new Vector3(p.x, Mathf.Lerp(topY, bottomY, t), p.z);
        }

        public void Run()
        {
            State = MachineState.Running;
            SetLamp(palette != null ? palette.lampGreen : null, false);
            SetStatus("EN OPERACIÓN\nResguardo cerrado · Solo personal autorizado");
        }

        public void AuthorizedStop()
        {
            State = MachineState.AuthorizedStop;
            RaiseHead();
            SetLamp(palette != null ? palette.lampAmber : null, false);
            SetStatus("DETENIDA POR PERSONAL AUTORIZADO\nRetiro del objeto en curso");
        }

        public void SafetyStop()
        {
            State = MachineState.SafetyStop;
            RaiseHead();
            SetLamp(palette != null ? palette.lampRed : null, true);
            SetStatus("PARO DE SEGURIDAD\nPersona en zona restringida · Producción detenida");
            if (audioCues != null)
                audioCues.Play(Cue.Error);
        }

        public void Jam()
        {
            State = MachineState.Jammed;
            SetLamp(palette != null ? palette.lampAmber : null, true);
            SetStatus("PARO NO PROGRAMADO\nObjeto cerca del mecanismo · Producción interrumpida");
            if (audioCues != null)
                audioCues.Play(Cue.Beep);
        }

        void RaiseHead()
        {
            if (pressHead == null)
                return;
            var p = pressHead.localPosition;
            pressHead.localPosition = new Vector3(p.x, topY, p.z);
            m_Phase = 0f;
        }

        void SetLamp(Material material, bool blink)
        {
            if (beacon != null)
                beacon.SetState(material, blink);
        }

        void SetStatus(string text)
        {
            if (statusText != null)
                statusText.text = text;
        }
    }
}
