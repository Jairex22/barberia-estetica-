# VALIDATION — Factory Visitor Safety VR (Unity 6000.1.0f1)

Este documento separa lo que **se comprobó**, cómo se comprobó y lo que **queda pendiente**. No se afirma que el proyecto esté "probado" ni "100 % funcional" en Unity ni en un visor.

## Resumen

| Tipo de verificación | Estado |
|---|---|
| Revisión estática del código y de la lógica | **Realizada** |
| Firmas de las APIs de los paquetes, comparadas con el código fuente de las versiones fijadas | **Realizada** |
| Miembros de UnityEngine/UnityEditor usados, comparados con el código fuente de referencia de Unity **6000.1.0f1** | **Realizada**: 287 miembros, ninguno ausente (ver 2.4) |
| Compilación de C# con un compilador real (`dotnet build`) contra ensamblados de referencia de Unity y *stubs* de los paquetes | **Realizada: 0 errores, 0 advertencias** (limitaciones en 2.3) |
| Validación del JSON de contenido | **Realizada** |
| Abrir el proyecto en Unity 6000.1.0f1, resolver paquetes y compilar en el editor | **Pendiente**: el editor no estaba disponible (requiere instalación y activación de licencia con cuenta de Unity) |
| Ejecutar el generador y guardar la escena | **Pendiente** |
| Recorrido completo en el editor (escritorio), reinicio y exportación | **Pendiente** |
| Pruebas con visor VR / OpenXR | **Pendiente**: no hubo hardware |
| Compilación de Windows | **Pendiente** |

## 1. Entorno disponible

- Contenedor Linux sin Unity Editor y sin visor VR, con .NET SDK 8.
- docs.unity3d.com y unity.com estaban bloqueados por la red. Se usaron búsquedas web y el código fuente público de:
  - los paquetes (espejos `needle-mirror` en GitHub, una rama o etiqueta por versión);
  - `Unity-Technologies/Graphics`, rama `6000.1/staging` (URP);
  - `Unity-Technologies/UnityCsReference`, **etiqueta `6000.1.0f1`** (código C# de referencia del motor y del editor).

## 2. Comprobaciones realizadas

### 2.1 Versiones y requisitos de los paquetes

| Paquete | Versión | Fecha de publicación (espejo) | `unity` mínimo declarado | Dependencias relevantes |
|---|---|---|---|---|
| URP | 17.1.0 | rama 6000.1 | 6000.1 | — |
| Input System | 1.14.0 | 2025-03-20 | 2021.3 | — |
| XR Interaction Toolkit | 3.1.1 | 2025-02-28 | 2021.3 | Input System ≥ 1.8.1, Core Utils ≥ 2.4.0, uGUI ≥ 1.0.0 |
| OpenXR | 1.14.2 | 2025-03-20 | 2021.3 | XR Management ≥ 4.4.0, Core Utils ≥ 2.3.0, Input System ≥ 1.6.3 |
| XR Management | 4.5.1 | 2024-12-09 | 2020.3 | Core Utils ≥ 2.2.1 |
| XR Core Utils | 2.5.2 | 2025-03-15 | 2021.3 | — |
| uGUI | 2.0.0 | integrado en Unity 6 | — | — |

- El manual de Unity 6000.1 (según búsqueda indexada) lista la serie Input System 1.14 como publicada para 6000.1.
- **Pendiente:** confirmar en Package Manager de 6000.1.0f1 que todas aparecen como compatibles. No se incluye `packages-lock.json`, porque no se resolvieron dependencias con Unity.

### 2.2 APIs de los paquetes comparadas con su código fuente

- **Input System 1.14.0:** `InputAction(name, type, binding, interactions, processors, expectedControlType)`, `AddBinding`, `AddCompositeBinding(...).With(...)`, `ReadValue<T>`, `WasPressedThisFrame`, `InputActionProperty(InputAction)`, `TrackedPoseDriver.positionInput/rotationInput/trackingType`, `InputSystemUIInputModule` (asigna acciones predeterminadas en `OnEnable` si no tiene).
- **XR Interaction Toolkit 3.1.1:**
  - `LocomotionProvider`: `mediator`, `locomotionState`, `TryStartLocomotionImmediately`, `TryQueueTransformation`, `TryEndLocomotion`; no define `Update` propio.
  - `LocomotionState`, `XRBodyYawRotation.angleDelta`, `TeleportationProvider.QueueTeleportRequest`, `TeleportRequest`, `MatchOrientation`.
  - `LocomotionMediator` (`[RequireComponent(XRBodyTransformer)]`), `XRBodyTransformer.xrOrigin`.
  - Compuestos `Vector3Fallback`/`QuaternionFallback` con partes `first`/`second`.
- **XR Core Utils 2.5.2:** `XROrigin.Origin/Camera/CameraFloorOffsetObject/RequestedTrackingOriginMode`, `MatchOriginUpCameraForward`, `RotateAroundCameraUsingOriginUp`.
- **XR Management 4.5.1:**
  - `XRGeneralSettings.Instance/Manager/InitManagerOnStart/k_SettingsKey`.
  - `XRManagerSettings.InitializeLoader/StartSubsystems/StopSubsystems/DeinitializeLoader/activeLoader/activeLoaders/isInitializationComplete`.
  - `XRGeneralSettingsPerBuildTarget.HasManagerSettingsForBuildTarget/CreateDefaultManagerSettingsForBuildTarget/SettingsForBuildTarget`, `XRPackageMetadataStore.AssignLoader`.
- **OpenXR 1.14.2:** `OpenXRSettings.GetSettingsForBuildTargetGroup` (editor), `GetFeature<T>()`, `OpenXRFeature.enabled`, perfiles Oculus Touch, Valve Index, HTC Vive y Khronos Simple. *Usages* `{TriggerButton}`, `{Primary2DAxis}`, `{MenuButton}` y `{SecondaryButton}` presentes en el perfil Oculus Touch.
- **URP 17.1.0:** `UniversalRenderPipelineAsset.Create(ScriptableRendererData)`, `msaaSampleCount`, `shadowDistance`, `renderScale`, `UniversalRendererData`.

### 2.3 Compilación con `dotnet build`

- Todos los scripts (`Scripts/Runtime` y `Scripts/Editor`) se compilaron juntos, con `UNITY_EDITOR` definido, contra:
  - `UnityEngine.dll` y `UnityEditor.dll` de referencia (Unity 2021.1, NuGet `Unity3D.SDK 2021.1.14.1`) y `UnityEngine.UI.dll` (NuGet `Unity3D.UnityEngine.UI`);
  - *stubs* con las firmas de 2.2.
- **Resultado:** `0 Warning(s), 0 Error(s)`.
- **Limitación:** no existen ensamblados de referencia públicos de Unity 6000.1 en NuGet. Por eso el ensamblado compilado se contrastó con el código de Unity 6000.1.0f1 (2.4). Los *stubs* reproducen firmas, no comportamiento.

### 2.4 APIs del motor comparadas con Unity 6000.1.0f1

- Se extrajeron del ensamblado compilado (metadatos IL) **todas** las referencias a tipos y miembros de `UnityEngine*`/`UnityEditor*`.
- Los **287** miembros de motor y editor se buscaron en `UnityCsReference` (etiqueta `6000.1.0f1`).
  - Ningún miembro faltó, salvo `UnityEvent.AddListener` (y los delegados `UnityAction` y `EditorApplication.CallbackFunction`, que la búsqueda no detecta como clases). `UnityEvent` no forma parte del código publicado en ese repositorio; es API estándar de Unity 6.
- Revisión de `[Obsolete]`:
  - Ningún miembro usado está marcado como error en 6000.1.0f1.
  - `GraphicsSettings.defaultRenderPipeline` es la API vigente; la antigua `renderPipelineAsset` está obsoleta y **no** se usa.
  - Los miembros de `PlayerSettings` usados existen sin marca de obsolescencia.
- Los **38** miembros de uGUI usados (Text, Image, Button, CanvasScaler, grupos de disposición, ColorBlock, EventSystem…) existen en el código fuente público de uGUI (espejo, rama principal, versión 1.0.0). uGUI 2.0.0 de Unity 6 conserva esa API heredada.
- Cada `MonoBehaviour`/`ScriptableObject` está en un archivo con su mismo nombre (requisito de serialización de Unity).

### 2.5 Contenido

- `contenido_es.json` se analizó con un intérprete JSON. Los 25 identificadores requeridos (`ContentRequirements`) y todos los `RaiseError(...)` del código tienen su texto.
- Solo se usan caracteres disponibles en la fuente integrada `LegacyRuntime` (á é í ó ú ñ ¡ ¿ ° · —). No se usan ✓ ✗ ⚠: en su lugar aparecen `[OK]`, `[X]` y `(!)`.

### 2.6 Revisión lógica (estática)

- **Sin conteos repetidos:**
  - `ZoneVolume` solo dispara en las transiciones de entrada o salida.
  - `ZoneMonitor` solo evalúa durante el recorrido activo.
  - Cada situación acepta eventos solo en fase *Activa* y cambia de fase al registrar un resultado.
  - Peligros y reportes son idempotentes por situación.
- **Reinicio:** recarga la escena con un registro nuevo. Los estáticos se limpian con `RuntimeInitializeOnLoadMethod(SubsystemRegistration)` (válido aunque se desactive la recarga de dominio).
- **Una sola cámara:** el rig VR se guarda inactivo y la cámara de escritorio usa `stereoTargetEye = None`. El validador del editor comprueba que haya exactamente una cámara activa.
- **Escritorio sin visor:** `InitManagerOnStart = false`. OpenXR se inicializa solo al elegir VR; si falla, se vuelve al menú con un mensaje.
- **Exportación:** directorio, JSON y CSV con manejo de errores independiente y un mensaje legible.
- **Generador:**
  - Al abrir el proyecto no modifica nada: solo muestra un diálogo que pregunta.
  - Al regenerar, reemplaza únicamente las raíces marcadas con `GeneratedByFactorySafety` y actualiza los materiales en sus mismos archivos.

## 3. Pruebas pendientes (para ejecutar en Unity 6000.1.0f1)

### Apertura y generación
- [ ] El proyecto abre con 6000.1.0f1 sin pedir actualización, los paquetes se resuelven y no hay errores de compilación.
- [ ] Unity crea `Packages/packages-lock.json` (consérvalo para fijar las dependencias transitivas).
- [ ] "Factory Safety → Generar todo" termina, guarda `Assets/FactorySafety/Scenes/FactoryTour.unity` y el validador reporta 0 problemas.
- [ ] Regenerar no duplica objetos ni materiales y conserva un objeto agregado a mano.
- [ ] Los materiales se ven con URP (sin rosa) y los textos son legibles.

### Escritorio (ambos modos)
- [ ] Menú (modo, plataforma, ajustes, salir) e inducción de 4 páginas en el modo con capacitación.
- [ ] A: reglas, orientación, EPP, acceso bloqueado o permitido.
- [ ] B: cruce con luz verde; casi accidente al invadir la ruta o cruzar en rojo; permanecer en la ruta no suma errores.
- [ ] C: reportar, limpiar, ignorar, pisar o pasar de largo; conos, letrero y representación simbólica.
- [ ] D: reportar (técnico autorizado), entrar a la zona (paro de seguridad), ignorar (paro no programado); resguardo no interactivo.
- [ ] E: piezas rechazadas, retrabajo, contador e interrupción; reporte con corrección; etiqueta CALIDAD.
- [ ] F: reporte y despeje; ruta alternativa si no se reporta; error al regresar; llegada al punto de reunión.
- [ ] Repetir y Continuar; pausa, reanudar, reiniciar (estado limpio) y volver al menú.
- [ ] Resultados: métricas, puntuación según la fórmula y comparación tras dos sesiones.
- [ ] Exportación JSON y CSV; mensaje claro si la escritura falla.
- [ ] Duración total de 8 a 12 minutos.

### VR (visor + runtime OpenXR)
- [ ] Inicio de OpenXR al elegir VR; aviso y continuación en escritorio si no hay visor.
- [ ] Seguimiento, orientación del rayo, teletransporte, giro (30/45/60°), modo sentado y reducir destellos.
- [ ] Rayo y gatillo en todos los menús; legibilidad y alcance; botón Menú o B/Y abre la pausa.

### Compilación
- [ ] "Factory Safety → Compilar para Windows" genera `Builds/Windows/FactoryVisitorSafetyVR.exe`, que funciona en escritorio y, con runtime OpenXR, en VR.

## 4. Riesgos a revisar primero

1. Creación del recurso URP por código. Si falla: *Assets → Create → Rendering → URP Asset (with Universal Renderer)*, asígnalo en *Project Settings → Graphics* y vuelve a generar.
2. Configuración automática de XR/OpenXR. Si falla: activa OpenXR en *XR Plug-in Management* (pestaña Windows), desactiva *Initialize XR on Startup* y vuelve a generar.
3. Pose del rayo según el perfil OpenXR de cada mando.
4. Comportamiento en tiempo de ejecución, que solo puede confirmarse en el editor.
