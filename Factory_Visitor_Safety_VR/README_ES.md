# Factory Visitor Safety VR — v1.0.0

Recorrido educativo en primera persona por una **fábrica ficticia de ensamble electrónico** ("Ensambles Demo"). El usuario participa como **VISITANTE** acompañado por un guía virtual y enfrenta seis situaciones donde una capacitación deficiente puede provocar accidentes, incidentes, errores de calidad o interrupciones de producción.

> **Aviso:** demostración educativa adaptable a los procedimientos de cada planta. **No certifica capacitación ni cumplimiento normativo.** La fábrica, las personas y las marcas son ficticias. La puntuación es una referencia didáctica y **no** mide la probabilidad real de un accidente.

---

## 1. Versiones exactas

| Elemento | Versión |
|---|---|
| **Editor de Unity** | **Unity 6000.0.84f1** (Unity 6.0 LTS) |
| Universal Render Pipeline | `com.unity.render-pipelines.universal` **17.0.4** |
| Input System | `com.unity.inputsystem` **1.18.0** |
| XR Interaction Toolkit | `com.unity.xr.interaction.toolkit` **3.0.11** |
| OpenXR Plugin | `com.unity.xr.openxr` **1.16.1** |
| XR Plug-in Management | `com.unity.xr.management` **4.5.3** |
| XR Core Utilities | `com.unity.xr.core-utils` **2.5.2** |
| Unity UI (uGUI) | `com.unity.ugui` **2.0.0** |

Las versiones están fijadas en `Packages/manifest.json`. Cómo se eligieron:

- La documentación oficial de Unity no fue accesible desde el entorno donde se creó el proyecto (bloqueo de red). Las versiones se confirmaron con búsquedas web que citan el manual de Unity 6.0 y las notas de versión, y con el `package.json` de cada paquete publicado en espejos públicos de GitHub (`needle-mirror`): XRI 3.0.11 declara `"unity": "6000.0"`; OpenXR 1.16.1, Input System 1.18.0, XR Management 4.5.3 y XR Core Utils 2.5.2 declaran versiones mínimas anteriores a Unity 6.
- URP 17.0.4 es la versión integrada en Unity 6.0 desde 6000.0.40f1 (confirmado en el `package.json` de la rama `6000.0/staging` del repositorio oficial *Unity-Technologies/Graphics*). URP es un paquete "core": si tu editor 6000.0.x trae otra versión 17.0.x, Unity la ajusta solo.
- **Compatibilidad esperada:** cualquier Unity 6000.0.x a partir de 6000.0.40f1. Solo se indica la 6000.0.84f1 como versión recomendada. **No se probó en Unity** (ver `VALIDATION.md`).

## 2. Requisitos

- Windows 10/11 de 64 bits, Unity Hub y el editor **6000.0.84f1** con el módulo de compilación para Windows (viene incluido con el editor de Windows).
- **Internet solo la primera vez** que se abre el proyecto, para descargar los paquetes. Después funciona sin conexión: no hay backend, cuentas, servicios de pago ni APIs de IA.
- **VR (opcional):** un visor para PC con un runtime OpenXR activo (por ejemplo, el software del fabricante del visor configurado como runtime OpenXR). **No se ha probado en ningún visor**; consulta "Limitaciones".

## 3. Desde el ZIP hasta pulsar Play

1. Extrae `Factory_Visitor_Safety_VR_v1.0.0.zip`. Obtendrás la carpeta `Factory_Visitor_Safety_VR` con `Assets`, `Packages`, `ProjectSettings` y esta guía. Usa una ruta corta y sin caracteres raros (por ejemplo, `C:\Proyectos\Factory_Visitor_Safety_VR`).
2. Abre **Unity Hub → Add → Add project from disk** y elige esa carpeta.
3. Abre el proyecto con **Unity 6000.0.84f1**. La primera apertura tarda varios minutos: Unity descarga los paquetes y crea `Library`.
4. Si Unity pregunta por el **Input System** ("...enable the new input system backends?"), responde **Yes**. El editor se reinicia.
5. Cuando el editor termine de cargar aparecerá el diálogo **"La escena del recorrido aún no existe"**. Pulsa **Generar ahora**.
   Si no aparece, usa el menú **Factory Safety → Generar todo (configurar + escena)**.
6. Si el generador avisa **"Reinicio necesario"** (cambio de *Active Input Handling*), acepta el reinicio y, al volver, ejecuta otra vez **Factory Safety → Generar todo**.
7. Al terminar verás un resumen. La escena `Assets/FactorySafety/Scenes/FactoryTour.unity` queda abierta y agregada a *Build Settings*.
8. Pulsa **Play**. En el menú elige el modo educativo, la forma de uso (**Escritorio** o **Realidad virtual**) y pulsa **Comenzar recorrido**.

**Qué hace "Generar todo" (una sola acción):**

- Activa el Input System, configura el reproductor (nombre, versión, espacio de color lineal) y crea y asigna el recurso URP (`Assets/FactorySafety/Settings`).
- Configura XR Plug-in Management: OpenXR para Windows con **"Initialize XR on Startup" desactivado** (XR solo se inicia al elegir VR) y perfiles de interacción Oculus Touch, Valve Index, HTC Vive y Khronos Simple.
- Crea o actualiza los materiales (`Assets/FactorySafety/Materials`) y la paleta usada en tiempo de ejecución.
- Construye la fábrica, las seis situaciones, el guía, los rigs de escritorio y VR, el sistema de eventos y la interfaz completa, con todas las referencias asignadas. Guarda la escena.
- Valida el contenido, las referencias, URP, XR, las escenas de compilación y que solo haya una cámara activa al iniciar.

**Se puede ejecutar de nuevo sin duplicar nada:** solo elimina y vuelve a crear los objetos raíz marcados con el componente `GeneratedByFactorySafety` (los que empiezan por `[FVS]`). Los objetos que agregues tú a la escena se conservan. Los materiales se actualizan en el mismo archivo, sin copias.

Sin interfaz (opcional): `Unity.exe -batchmode -projectPath <ruta> -executeMethod FactoryVisitorSafety.EditorTools.BatchCommands.GenerateAll -quit -logFile generar.log`

## 4. Controles

### Escritorio (sin visor)

| Acción | Control |
|---|---|
| Desplazarse | **W A S D** |
| Mirar | **Ratón** |
| Interactuar con el objeto señalado (centro de la pantalla) | **E** |
| Menú de pausa | **Escape** |
| Elegir una opción de decisión | Clic o teclas **1–4** |

Los controles se muestran siempre en la parte inferior de la pantalla.

### Realidad virtual (OpenXR)

| Acción | Control |
|---|---|
| Teletransporte | Stick **hacia adelante** para apuntar el arco (verde = válido, rojo = no válido) y **soltar** para moverte |
| Giro por incrementos | Stick a la **izquierda/derecha** (30°, 45° o 60°; se cambia en Ajustes) |
| Interactuar / pulsar botones | Apunta con el **rayo** del mando y pulsa el **gatillo** |
| Pausa | Botón **Menú** o **B/Y** |

Ajustes de comodidad (menú → Ajustes): ángulo de giro, **modo sentado** (eleva la vista 45 cm), **reducir destellos** (las luces de alarma quedan fijas), sensibilidad del ratón y volumen. Los menús en VR aparecen frente al usuario y se reacomodan suavemente al girar; nunca se mueve la cámara de forma forzada: los incidentes se representan con pausas, señales y textos.

**Selección escritorio/VR:** al elegir "Realidad virtual" el simulador inicia OpenXR, desactiva el rig de escritorio y activa el XR Origin. Si no hay visor o runtime, muestra un aviso y sigue en escritorio. Nunca hay dos cámaras activas. En VR, el menú inicial se usa con el ratón en el monitor; después de iniciar, pausa, decisiones y resultados se manejan con el rayo.

## 5. Recorrido y situaciones (8–12 minutos)

| # | Área | Situación | Decisión adecuada | Consecuencia visible de un error |
|---|---|---|---|---|
| A | Recepción y acceso | Acceso sin inducción o EPP | Revisar el tablero de reglas, pedir orientación al guía y tomar chaleco, lentes y protección auditiva | La puerta no se abre, luz roja, letrero "ACCESO DETENIDO" y el guía interviene |
| B | Pasillo y cruce | Cruce con montacargas | Usar el paso peatonal y cruzar con la luz verde | El montacargas frena, claxon, cartel "¡CASI ACCIDENTE!", línea roja de trayectoria y pausa explicativa |
| C | Pasillo | Derrame | Mantenerse alejado y reportarlo | Advertencia de sustancia desconocida, huellas que esparcen el líquido o una representación simbólica (sin caída) de otra persona a punto de resbalar |
| D | Producción | Objeto junto a máquina protegida | Avisar al guía y quedarse fuera de la franja amarilla | Paro de seguridad o paro no programado y producción detenida. El resguardo nunca es interactivo |
| E | Ensamble y calidad | Instrucción incompleta (CALIDAD) | Comentar al guía que la hoja no indica qué conector usar | Tarjetas rechazadas, contenedor de retrabajo, contador e interrupción simulada de la línea |
| F | Almacén y salida | Ruta de evacuación obstruida + alarma de práctica | Reportar las cajas; durante la alarma, seguir al guía al punto de reunión | La ruta bloqueada obliga a usar la salida norte, más larga, y se muestra el tiempo del simulacro |

Cada situación tiene un **disparador** (zona de activación), una **decisión** (objeto interactivo con opciones o una acción en el espacio), una **consecuencia visible**, **retroalimentación** y **registro**. Después de un error se muestra *qué ocurrió*, *qué información faltó*, *qué consecuencia podría tener*, *qué decisión era más adecuada* y el *factor organizacional*, con los botones **Repetir situación** y **Continuar recorrido**:

- *Repetir* devuelve al visitante al inicio de esa situación (con fundido) y la restablece.
- *Continuar* hace que el guía aplique la resolución segura y la situación se registra como "continuada tras error". En F, *Continuar* reanuda el simulacro.

La situación E se presenta siempre como **CALIDAD — no es un riesgo de lesión**, con letreros y textos propios.

## 6. Modos educativos

- **Visita sin inducción:** el guía da indicaciones deliberadamente incompletas ("La planta está por allá, pasa cuando quieras") y los objetivos son vagos.
- **Visita con capacitación:** inducción breve de 4 páginas, objetivos claros y orientación del guía antes de cada punto crítico.

Ambos modos usan **las mismas situaciones, disparadores y reglas de evaluación**. La retroalimentación señala los factores organizacionales (inducción incompleta, instrucciones ambiguas, señalización insuficiente, falta de supervisión) para no atribuir todo a la persona. La pantalla de resultados compara las sesiones de la ejecución actual **solo con las decisiones registradas**. No se presentan porcentajes de prevención ni estadísticas reales.

## 7. Resultados y puntuación

Se registra por sesión: situaciones completadas, peligros de seguridad y problemas de calidad identificados, decisiones, reportes, errores, reintentos, tiempo total, tiempo por situación y una lista cronológica de eventos.

**Puntuación educativa (0–100):**

- Por situación:
  - Resuelta con la decisión adecuada del visitante: `max(25, 100 − 25 × errores)`.
  - Continuada tras error (el guía aplicó la resolución): `0`.
  - No iniciada o en curso: `0`.
- Total = promedio de las 6 situaciones, redondeado al entero más cercano (0,5 sube).
- Reintentos, reportes y peligros identificados se informan aparte y no cambian la cifra.
- Ejemplo: A sin errores (100), B con 1 error y resuelta (75), C continuada tras error (0), D, E y F sin errores (100 cada una) → (100+75+0+100+100+100)/6 = 79,17 → **79**.

Los valores están en `ScoreCalculator.cs` (`PointsPerScenario`, `PenaltyPerError`, `MinimumWhenResolved`).

**Guardar reporte:** en la pantalla final, **Guardar reporte (JSON y CSV)**. Los archivos se guardan en `Application.persistentDataPath/Reportes`, que en Windows es:
`%USERPROFILE%\AppData\LocalLow\Demostracion Educativa\Factory Visitor Safety VR\Reportes\`
(en el editor, antes de ejecutar la configuración, la carpeta usa `DefaultCompany`). Si una escritura falla, aparece un mensaje y la aplicación sigue funcionando. El CSV (UTF-8 con BOM, separado por comas) tiene tres bloques: resumen, situaciones y eventos.

## 8. Compilar para Windows

1. Ejecuta antes **Factory Safety → Generar todo**.
2. Menú **Factory Safety → Compilar para Windows (64 bits)**. Resultado: `Builds/Windows/FactoryVisitorSafetyVR.exe`.
   También puedes usar **File → Build Profiles → Windows** con la escena `FactoryTour` incluida.
3. Por línea de comandos:
   `Unity.exe -batchmode -projectPath <ruta> -executeMethod FactoryVisitorSafety.EditorTools.WindowsBuilder.BuildFromCommandLine -quit -logFile build.log`

Para usar VR con el ejecutable, inicia antes el runtime OpenXR del visor.

## 9. Modificar mensajes y situaciones

- **Textos educativos** (guía, objetivos, preguntas, opciones, retroalimentación, inducción y reglas): `Assets/FactorySafety/Resources/Content/contenido_es.json`. Puedes cambiar libremente los textos. **No cambies los campos `id`** de opciones y errores, porque el código los usa para evaluar (la lista está en `ContentModels.cs → ContentRequirements`). Valida con **Factory Safety → 3. Validar escena y contenido**.
  - `objetivoConCapacitacion` / `objetivoSinInduccion`: objetivo mostrado en cada modo.
  - `guiaConCapacitacion` / `guiaSinInduccion`: lo que dice el guía al activarse la situación.
  - `ayudaGuia`: respuesta al pedir orientación. `intervencionGuia`: intervención tras un error. `resolucionGuia`: resolución segura.
  - `errores[]`: `queOcurrio`, `informacionFaltante`, `consecuencia`, `decisionAdecuada`, `factorOrganizacional`.
- **Etiquetas de la interfaz**: `Scripts/Runtime/Content/UIText.cs`.
- **Lógica de cada situación**: `Scripts/Runtime/Scenarios/Scenario*.cs` (A = `ScenarioAccess`, B = `ScenarioForklift`, C = `ScenarioSpill`, D = `ScenarioMachine`, E = `ScenarioAssembly`, F = `ScenarioEvacuation`). Todas heredan de `ScenarioBase`, que define el ciclo armada → activa → decisión → consecuencia → retroalimentación → registro.
- **Posiciones, zonas y objetos**: `Scripts/Editor/FactorySceneGenerator.Areas.cs`. Después de editarlo, vuelve a ejecutar el generador. Si mueves objetos a mano en la escena, el próximo "Generar" los reemplaza; para cambios permanentes, edita el generador.
- Ajustes rápidos en el Inspector, por ejemplo: `ForkliftController.speed/waitSeconds`, `AssemblyLine.interval`, `ScenarioAssembly.rejectionLimit`, `ScenarioEvacuation.autoAlarmSeconds` y textos de la hoja de instrucción en `AssemblyLine`.

## 10. Organización del código

```
Assets/FactorySafety/
  Resources/Content/contenido_es.json   Textos educativos (editable)
  Scripts/Runtime/  (ensamblado FactorySafety.Runtime)
    Core/         GameFlow (estados, pausa, modales, reinicio), audio, ajustes, utilidades
    Content/      Carga y validación del JSON, textos de interfaz
    Tour/         TourDirector (orden y progreso), ZoneVolume/ZoneMonitor (disparadores)
    Scenarios/    ScenarioBase y las seis situaciones
    Actors/       Montacargas, máquina, línea de ensamble, personajes
    Interaction/  Interactable, interacción de escritorio y rayo VR
    Guide/        Guía virtual
    Player/       Rigs de escritorio y VR, sesión OpenXR, locomoción, fundidos
    UI/           Construcción de la interfaz y paneles
    Results/      Registro de sesión, puntuación, exportación JSON/CSV
  Scripts/Editor/   (ensamblado FactorySafety.Editor) generador, configuración, validación y compilación
```

**Uso de XR Interaction Toolkit:** el rig de VR usa `XROrigin` (XR Core Utils), `LocomotionMediator` + `XRBodyTransformer` + `TeleportationProvider` de XRI 3, un proveedor de giro propio derivado de `LocomotionProvider` de XRI y los compuestos `Vector3Fallback`/`QuaternionFallback` de XRI para la pose de los mandos. El rayo de interacción y su uso sobre los menús se implementaron con Input System (`VRHandPointer`) en lugar de `XRRayInteractor`/`XRUIInputModule`, para no depender de los *Starter Assets* (que se importan a mano) y mantener una sola lógica de interacción para escritorio y VR.

**Detección sin repeticiones:** las zonas (`ZoneVolume`) solo disparan eventos al **entrar** o **salir**, nunca por permanecer dentro. Las situaciones solo aceptan eventos en fase *Activa* y pasan a *Esperando retroalimentación* en cuanto registran un error o un acierto. Los peligros y reportes cuentan una vez por situación. **Reiniciar** recarga la escena y crea un registro nuevo; solo se conserva el resumen de sesiones anteriores para la comparación.

## 11. Solución de problemas

| Problema | Solución |
|---|---|
| Materiales rosas o magenta | URP no está asignado. Ejecuta **Factory Safety → 1. Configurar proyecto** y luego **2. Generar o regenerar escena**. |
| WASD/ratón no responden o hay errores de `Keyboard.current` | *Active Input Handling* debe ser "Input System Package (New)" o "Both" (Project Settings → Player). Ejecuta "Generar todo" y reinicia el editor. |
| "Scene ... couldn't be loaded because it has not been added to the build settings" al reiniciar | Ejecuta "Generar todo" (agrega la escena a Build Settings). |
| No aparece el diálogo de primera ejecución | Usa el menú **Factory Safety → Generar todo**. |
| Errores de compilación en la consola al abrir | Espera a que terminen de resolverse los paquetes. Si persisten, comprueba que el editor sea 6000.0.x y que `Packages/manifest.json` no se haya modificado. Usa **Window → Package Manager** para revisar paquetes con error. |
| Paquetes no se descargan | La primera apertura requiere internet (o una caché de paquetes ya poblada). |
| "No se pudo iniciar OpenXR" al elegir VR | Conecta el visor, inicia su software y configúralo como runtime OpenXR activo. Si no hay visor, usa Escritorio. |
| "OpenXR no está configurado" | Ejecuta "Generar todo" o activa OpenXR en Project Settings → XR Plug-in Management → pestaña Windows. |
| En VR no funcionan el teletransporte o el giro | Comprueba que el perfil de tu mando esté en Project Settings → XR Plug-in Management → OpenXR → Interaction Profiles. El perfil Khronos Simple no tiene stick: no permite teletransporte. |
| El rayo de VR apunta con un ángulo extraño | Depende de la pose que entregue el perfil del mando ("pointer" o "device"). Las rutas se definen en `FactorySceneGenerator.BuildHand`; es una de las pruebas pendientes en hardware. |
| Las luces parpadeantes molestan | Ajustes → "Reducir destellos: Sí". |
| No se guarda el reporte | El mensaje indica la carpeta y el error (permisos o espacio). La aplicación sigue funcionando. |
| Textos demasiado pequeños en VR | Ajusta la escala en `UIManager.SetPresentation` (valor `0.00085`) o la distancia en los anclajes `LazyFollow`. |

## 12. Limitaciones conocidas

- **No se ejecutó Unity ni se probó ningún visor** durante la creación (ver `VALIDATION.md`). La compatibilidad con visores concretos no está garantizada.
- La escena se genera con el editor (no se incluye `.unity` prehecha) porque no se pudo abrir Unity para guardarla y verificarla.
- Personajes y animaciones son simplificados (primitivas). No hay voz: el guía se comunica por texto.
- La comparación entre modos se limita a las sesiones de la ejecución actual (más los reportes guardados).
- El contenido es un ejemplo general y debe adaptarse a los procedimientos reales de cada planta.
