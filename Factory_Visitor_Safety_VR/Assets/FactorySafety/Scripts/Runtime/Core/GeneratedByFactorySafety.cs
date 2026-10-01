using UnityEngine;

namespace FactoryVisitorSafety
{
    /// <summary>Marca objetos creados por el generador para poder regenerarlos sin tocar contenido ajeno.</summary>
    public class GeneratedByFactorySafety : MonoBehaviour
    {
        public string generatorVersion = "1.0.0";
    }
}
