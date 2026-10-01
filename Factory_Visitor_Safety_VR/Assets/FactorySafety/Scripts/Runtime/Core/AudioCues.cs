using UnityEngine;

namespace FactoryVisitorSafety
{
    public enum Cue
    {
        Click,
        Success,
        Error,
        Horn,
        Beep,
        Notice
    }

    /// <summary>
    /// Sonidos generados por código (no requiere archivos de audio). Todo sonido importante
    /// va acompañado de un texto en pantalla; el audio nunca es la única señal.
    /// </summary>
    public class AudioCues : MonoBehaviour
    {
        public AudioSource oneShotSource;
        public AudioSource sirenSource;

        const int SampleRate = 44100;
        AudioClip m_Click, m_Success, m_Error, m_Horn, m_Beep, m_Notice, m_Siren;

        void Awake()
        {
            if (oneShotSource == null)
                oneShotSource = gameObject.AddComponent<AudioSource>();
            if (sirenSource == null)
                sirenSource = gameObject.AddComponent<AudioSource>();
            oneShotSource.playOnAwake = false;
            oneShotSource.spatialBlend = 0f;
            sirenSource.playOnAwake = false;
            sirenSource.loop = true;
            sirenSource.spatialBlend = 0f;
            sirenSource.volume = 0.35f;

            m_Click = Tone("click", 0.05f, t => 1200f, 0.4f);
            m_Success = Tone("exito", 0.45f, t => t < 0.2f ? 660f : 880f, 0.35f);
            m_Error = Tone("error", 0.5f, t => 220f, 0.35f, square: true);
            m_Horn = Tone("claxon", 0.7f, t => 350f, 0.45f, square: true);
            m_Beep = Tone("pitido", 0.25f, t => 1000f, 0.3f);
            m_Notice = Tone("aviso", 0.35f, t => t < 0.15f ? 523f : 784f, 0.3f);
            m_Siren = Tone("sirena", 2f, t => 600f + 300f * Mathf.Sin(t * Mathf.PI), 0.35f);
        }

        static AudioClip Tone(string clipName, float seconds, System.Func<float, float> frequency, float amplitude, bool square = false)
        {
            var samples = Mathf.CeilToInt(seconds * SampleRate);
            var data = new float[samples];
            var phase = 0f;
            for (var i = 0; i < samples; i++)
            {
                var t = i / (float)SampleRate;
                phase += 2f * Mathf.PI * frequency(t) / SampleRate;
                var s = Mathf.Sin(phase);
                if (square)
                    s = Mathf.Sign(s) * 0.6f;
                // Envolvente corta para evitar chasquidos.
                var env = Mathf.Clamp01(t / 0.01f) * Mathf.Clamp01((seconds - t) / 0.03f);
                data[i] = s * amplitude * env;
            }
            var clip = AudioClip.Create(clipName, samples, 1, SampleRate, false);
            clip.SetData(data, 0);
            return clip;
        }

        public void Play(Cue cue)
        {
            if (oneShotSource == null)
                return;
            AudioClip clip;
            switch (cue)
            {
                case Cue.Success: clip = m_Success; break;
                case Cue.Error: clip = m_Error; break;
                case Cue.Horn: clip = m_Horn; break;
                case Cue.Beep: clip = m_Beep; break;
                case Cue.Notice: clip = m_Notice; break;
                default: clip = m_Click; break;
            }
            if (clip != null)
                oneShotSource.PlayOneShot(clip);
        }

        public void SetSiren(bool on)
        {
            if (sirenSource == null || m_Siren == null)
                return;
            if (on && !sirenSource.isPlaying)
            {
                sirenSource.clip = m_Siren;
                sirenSource.Play();
            }
            else if (!on && sirenSource.isPlaying)
            {
                sirenSource.Stop();
            }
        }
    }
}
