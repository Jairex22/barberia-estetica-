using UnityEngine;

namespace FactoryVisitorSafety
{
    /// <summary>
    /// Materiales que el código cambia en tiempo de ejecución (semáforos, balizas, piezas, líneas).
    /// El generador del editor crea este recurso y asigna todos los campos.
    /// </summary>
    [CreateAssetMenu(menuName = "Factory Safety/Paleta de materiales", fileName = "MaterialPalette")]
    public class MaterialPalette : ScriptableObject
    {
        [Header("Luces de estado")]
        public Material lampGreen;
        public Material lampRed;
        public Material lampAmber;
        public Material lampOff;
        public Material lampBlue;

        [Header("Punteros de realidad virtual")]
        public Material rayNeutral;
        public Material rayValid;
        public Material rayInvalid;

        [Header("Ensamble")]
        public Material connectorCorrect;
        public Material connectorWrong;

        [Header("Marcadores")]
        public Material markerIdle;
        public Material markerHover;
    }
}
