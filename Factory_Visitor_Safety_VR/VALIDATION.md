# VALIDATION — Factory Visitor Safety VR v1.0.0

Este documento separa lo que **se comprobó**, cómo se comprobó y lo que **queda pendiente**. No se afirma que el proyecto esté "probado" ni "100 % funcional" en Unity ni en un visor.

## Resumen honesto

| Tipo de verificación | Estado |
|---|---|
| Revisión estática del código y de la lógica | **Realizada** |
| Compilación de C# con un compilador real, contra ensamblados de referencia de Unity y *stubs* de los paquetes | **Realizada: 0 errores, 0 advertencias** (con limitaciones, ver abajo) |
| Validación del JSON de contenido y de los identificadores que usa el código | **Realizada** |
| Abrir el proyecto en Unity 6000.0.84f1, resolver paquetes y compilar en el editor | **Pendiente** (Unity no estaba disponible) |
| Ejecutar el generador y guardar la escena | **Pendiente** |
| Recorrido completo en el editor (escritorio) | **Pendiente** |
| Pruebas con visor VR / OpenXR | **Pendiente** (no hubo hardware) |
| Compilación de Windows | **Pendiente** |

## 1. Entorno disponible durante la creación

- Contenedor Linux sin Unity Editor y sin visor VR.
- La documentación de docs.unity3d.com y unity.com estaba bloqueada por la red. Las versiones se verificaron con búsquedas web y con el código fuente publicado de los paquetes (espejos `needle-mirror` en GitHub y el repositorio público `Unity-Technologies/Graphics`, rama `6000.0/staging`).
- Se usó .NET SDK 8 (`dotnet build`) para compilar.

## 2. Comprobaciones realizadas

### 2.1 Versiones de paquetes (fuentes públicas)

- `com.unity.xr.interaction.toolkit@3.0.11` → `package.json` con `"unity": "6000.0"`.
- `com.unity.xr.openxr@1.16.1` (mín. 2022.3), `com.unity.inputsystem@1.18.0` (mín. 2022.3), `com.unity.xr.management@4.5.3` (mín. 2022.3), `com.unity.xr.core-utils@2.5.2` (mín. 2021.3).
- `com.unity.render-pipelines.universal` 17.0.4 en la rama 6000.0 (`"unity": "6000.0"`). Unity 6000.0.84f1 figura como versión LTS publicada el 16-09-2026 en las notas de versión indexadas.

### 2.2 APIs verificadas contra el código fuente de los paquetes

Las firmas usadas se revisaron en el código fuente de cada versión fijada:

- Input System 1.18.0: `InputAction(...)`, `AddBinding`, `AddCompositeBinding(...).With(...)`, `ReadValue<T>`, `WasPressedThisFrame`, `InputActionProperty`, `TrackedPoseDriver.positionInput/rotationInput/trackingType`, `InputSystemUIInputModule` (asigna acciones predeterminadas en `OnEnable`).
- XR Interaction Toolkit 3.0.11: `LocomotionProvider` (métodos protegidos `TryStartLocomotionImmediately`, `TryQueueTransformation`, `TryEndLocomotion`, propiedad `mediator`), `LocomotionState`, `XRBodyYawRotation`, `TeleportationProvider.QueueTeleportRequest`, `TeleportRequest`, `MatchOrientation`, `LocomotionMediator` (requiere `XRBodyTransformer`), compuestos `Vector3Fallback`/`QuaternionFallback` y sus partes `first`/`second`.
- XR Core Utils 2.5.2: `XROrigin.Origin/Camera/CameraFloorOffsetObject/RequestedTrackingOriginMode`, `MatchOriginUpCameraForward`, `RotateAroundCameraUsingOriginUp`.
- XR Management 4.5.3: `XRGeneralSettings.Instance/Manager/InitManagerOnStart/k_SettingsKey`, `XRManagerSettings.InitializeLoader/StartSubsystems/StopSubsystems/DeinitializeLoader/activeLoader(s)`, `XRGeneralSettingsPerBuildTarget` (`HasManagerSettingsForBuildTarget`, `CreateDefaultManagerSettingsForBuildTarget`, `SettingsForBuildTarget`), `XRPackageMetadataStore.AssignLoader`.
- OpenXR 1.16.1: `OpenXRSettings.GetSettingsForBuildTargetGroup` (solo editor), `GetFeature<T>()`, `OpenXRFeature.enabled`, perfiles `OculusTouchControllerProfile`, `ValveIndexControllerProfile`, `HTCViveControllerProfile`, `KHRSimpleControllerProfile`. *Usages* `{TriggerButton}`, `{Primary2DAxis}`, `{MenuButton}`, `{SecondaryButton}` presentes en esos perfiles.
- URP 17.0.4: `UniversalRenderPipelineAsset.Create(ScriptableRendererData)`, `msaaSampleCount`, `shadowDistance`, `renderScale`, `UniversalRendererData`.

### 2.3 Compilación con `dotnet build`

- **Arnés:** todos los scripts (`Scripts/Runtime` y `Scripts/Editor`) se compilaron juntos, con `UNITY_EDITOR` definido, contra:
  - `UnityEngine.dll` y `UnityEditor.dll` de referencia (Unity 2021.1, paquete NuGet `Unity3D.SDK 2021.1.14.1`),
  - `UnityEngine.UI.dll` de referencia (paquete NuGet `Unity3D.UnityEngine.UI`),
  - *stubs* escritos a mano para los tipos de los paquetes, copiando las firmas del código fuente indicado en 2.2.
- **Resultado:** `0 Warning(s), 0 Error(s)`.
- **Limitaciones de esta prueba:**
  - Los ensamblados de referencia son de Unity 2021, no de Unity 6. APIs nuevas, obsoletas o retiradas en Unity 6 no se detectan con certeza. Se evitaron deliberadamente las APIs obsoletas conocidas (`FindObjectOfType`, `GraphicsSettings.renderPipelineAsset`, `Rigidbody.velocity`, fuente `Arial.ttf` → se usa `LegacyRuntime.ttf`).
  - Los *stubs* reproducen firmas, no comportamiento.
  - Una propiedad de uGUI más reciente que la DLL de referencia (`ColorBlock.selectedColor`) se eliminó del código para obtener una compilación limpia.
- Se comprobó que cada `MonoBehaviour`/`ScriptableObject` está en un archivo con su mismo nombre (requisito de Unity para serializarlos en escenas).

### 2.4 Contenido

- `contenido_es.json` se analizó con un intérprete JSON. Los 25 identificadores requeridos (`ContentRequirements`) y todos los `RaiseError(...)` del código tienen su texto.
- Los caracteres no ASCII usados en textos visibles (á é í ó ú ñ ¡ ¿ ° · —) existen en la fuente integrada `LegacyRuntime`. Se evitaron símbolos como ✓ ✗ ⚠: se usan `[OK]`, `[X]` y `(!)`.

### 2.5 Revisión lógica (estática)

- **Sin puntuación repetida:** `ZoneVolume` solo dispara en transiciones de entrada o salida. `ZoneMonitor` solo evalúa en estado *Touring* y se detiene al abrirse una ventana. Cada situación acepta eventos solo en fase *Activa* y cambia a *AwaitingFeedback* al registrar un resultado. `HazardIdentified` y `ReportMade` son idempotentes por situación.
- **Reinicio:** `Reiniciar recorrido` recarga la escena: crea un `SessionRecorder` nuevo y objetos nuevos. Los estáticos (`ZoneVolume.Active`, `ContentDatabase`, `ComfortSettings`, `LaunchState`) se limpian con `RuntimeInitializeOnLoadMethod(SubsystemRegistration)` aunque la recarga de dominio esté desactivada. Solo se conserva el resumen de sesiones para la comparación.
- **Una sola cámara:** el rig VR se guarda inactivo y la cámara de escritorio tiene `stereoTargetEye = None`. `PlayerRigManager` desactiva un rig antes de activar el otro. El validador del editor comprueba que haya exactamente 1 cámara activa.
- **Escritorio sin visor:** `InitManagerOnStart = false`. OpenXR solo se inicializa al elegir VR y, si falla, el flujo vuelve al menú de escritorio con un mensaje.
- **Exportación:** errores de directorio, JSON y CSV capturados por separado, con un mensaje legible y sin cerrar la aplicación.
- **Generador idempotente:** solo destruye raíces con `GeneratedByFactorySafety` y actualiza los materiales en el mismo archivo.

## 3. Pruebas pendientes (lista para ejecutar en Unity)

Marca cada punto al probarlo en **Unity 6000.0.84f1**:

### Apertura y generación
- [ ] El proyecto abre, los paquetes se resuelven y la consola no muestra errores de compilación.
- [ ] "Factory Safety → Generar todo" termina, guarda `FactoryTour.unity` y el validador reporta 0 problemas.
- [ ] Ejecutar "Generar todo" por segunda vez no duplica objetos ni materiales y conserva un objeto agregado a mano a la escena.
- [ ] Los materiales se ven con URP (sin rosa) y los textos del mundo son legibles.

### Escritorio (modo "Visita con capacitación" y "Visita sin inducción")
- [ ] Menú: selección de modo y plataforma, Ajustes, Salir.
- [ ] Inducción de 4 páginas (solo en el modo con capacitación).
- [ ] A: tablero de reglas, pedir orientación al guía, tomar el EPP (3 objetos), puerta bloqueada sin requisitos (error) y abierta con requisitos (acierto).
- [ ] B: cruce con luz verde (acierto); invadir la ruta o cruzar en rojo (casi accidente, pausa, retroalimentación). Permanecer en la ruta no suma errores adicionales.
- [ ] C: reportar / limpiar / ignorar / pisar / pasar de largo. Conos y letrero visibles. Representación simbólica sin caída.
- [ ] D: reportar (llega el técnico y retira la caja); entrar a la zona (paro de seguridad); ignorar (paro no programado). El resguardo no es interactivo.
- [ ] E: la línea rechaza piezas, se ve el retrabajo y el contador; reportar (interrupción breve y corrección); a las 3 piezas rechazadas, error automático. Se muestra la etiqueta CALIDAD.
- [ ] F: reportar cajas (se despeja la ruta y luego hay simulacro por la salida este); no reportar (ruta alternativa norte y error); regresar durante la alarma (error); llegar al punto de reunión.
- [ ] "Repetir situación" reposiciona con fundido y restablece la situación; "Continuar recorrido" aplica la resolución segura.
- [ ] Pausa (Escape), Reanudar, Reiniciar recorrido (estado limpio), Volver al menú.
- [ ] Pantalla de resultados con las métricas; la puntuación coincide con la fórmula; comparación después de dos sesiones.
- [ ] Guardar reporte: se crean JSON y CSV. Simular un fallo (carpeta sin permisos) muestra un mensaje sin cerrar la aplicación.
- [ ] Duración total entre 8 y 12 minutos.

### Realidad virtual (requiere visor y runtime OpenXR)
- [ ] Al elegir VR con el visor conectado se inicia OpenXR y solo queda activa la cámara VR.
- [ ] Al elegir VR sin visor se muestra el aviso y se puede seguir en escritorio.
- [ ] Seguimiento de cabeza y mandos; orientación del rayo (pose *pointer* o *device*).
- [ ] Teletransporte con arco, giro por incrementos (30/45/60°), modo sentado y reducir destellos.
- [ ] Rayo y gatillo sobre menús, decisiones, retroalimentación, pausa y resultados. Legibilidad y alcance de los paneles.
- [ ] Botón Menú o B/Y abre la pausa.
- [ ] Reiniciar recorrido en VR mantiene OpenXR activo.

### Compilación
- [ ] "Factory Safety → Compilar para Windows" produce `Builds/Windows/FactoryVisitorSafetyVR.exe` y el ejecutable funciona en escritorio y, con runtime OpenXR, en VR.

## 4. Riesgos conocidos a revisar primero

1. **Diferencias de API en Unity 6** no detectables con los ensamblados de referencia de 2021 (ver 2.3).
2. **Creación del recurso URP por código** (`UniversalRenderPipelineAsset.Create`): si fallara, crear uno con *Assets → Create → Rendering → URP Asset (with Universal Renderer)*, asignarlo en *Project Settings → Graphics* y volver a generar.
3. **Configuración automática de XR/OpenXR:** si no se crean los ajustes, activar OpenXR a mano en *Project Settings → XR Plug-in Management* (pestaña Windows), desactivar *Initialize XR on Startup* y volver a ejecutar "Generar todo".
4. **Pose del rayo de los mandos** según el perfil OpenXR.
