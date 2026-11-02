# Producto: funciones, reglas y propuesta de valor

## Nicho e hipótesis (ver `docs/investigacion-nichos.md`)

Personas de 25–40 años en la Zona Metropolitana de Guadalajara con intención seria, que prefieren quedar para **un plan concreto** (café, caminata, exposición) y valoran la **seguridad práctica**. Es una hipótesis comprobable, no una conclusión; las tres hipótesis críticas y sus experimentos están en el documento de nichos y en `docs/lanzamiento-30-60-90.md`.

## Propuesta de valor (no depende solo de "ella escribe primero")

1. **El plan como unidad de conexión**: cada perfil declara su plan ideal y tipos de plan; las recomendaciones y los rompehielos giran en torno a eso.
2. **Explicabilidad**: cada tarjeta dice por qué se muestra (intereses, intención y planes en común). No hay porcentajes de compatibilidad ni puntajes de atractivo.
3. **Honestidad estructural**: sin perfiles falsos, sin likes inventados, sin "alguien te escribió" detrás de un muro de pago; "no hay personas compatibles por ahora" es un estado de primera clase.
4. **Seguridad práctica**: verificación por selfie revisada por personas, fotos sin metadatos y moderadas, distancia solo por rangos, bloqueo/denuncia gratuitos, consejos de primera cita y 911.
5. **Ella da el primer paso** (mujer–hombre): aplicado en servidor, no comprable. Diferenciación tras la retirada de la regla por Bumble (agosto de 2026); también es un riesgo de demanda a validar.

## Funciones de la primera versión

**Cuenta**: registro con fecha de nacimiento (bloqueo <18 en servidor), consentimientos explícitos (términos, privacidad, mayoría de edad, marketing opcional), verificación de correo (24 h), recuperación de acceso (30 min; cierra otras sesiones), sesiones por dispositivo, cambio de contraseña, pausa, eliminación con confirmación por correo y purga a 30 días, exportación de datos.

**Perfil**: hasta 6 fotos (re‑codificadas, sin EXIF/GPS, revisión previa), presentación, intención, intereses, tipos de plan, plan ideal, ocupación, ciudad, ubicación aproximada opcional, mostrar/ocultar edad y distancia, preferencias (edad, distancia, a quién conocer).

**Descubrir**: candidatos por preferencias **mutuas**, edad, distancia (ambos con ubicación), perfil completo y correo verificado; excluye bloqueados, ya vistos, con match activo, pausados, suspendidos y eliminados; perfiles de demostración solo con `DEMO_MODE`. Botones Pasar / Me gusta accesibles. Límite diario de likes (25 gratis / 100 Premium).

**Conexiones**: match solo por like mutuo; lista; deshacer conexión; likes recibidos (número real para todos, identidades con Premium).

**Chat**: texto, sincronizado web/móvil en tiempo real, reconexión, cola sin conexión, sin duplicados, marcas de lectura, rompehielos y propuestas de plan por plantilla (nunca se envían solos), bloqueo/denuncia desde la conversación. Adjuntos y videollamada quedan para una fase posterior, cuando exista moderación suficiente.

**Regla de inicio**: mujer–hombre → ella; mismo género → cualquiera; otras combinaciones → `INITIATION_POLICY_MIXED` (`either` por defecto, `non_man_first` opcional). Sin inferencia de género. No hay expiración de matches: no se encontró evidencia de que la presión temporal mejore conversaciones reales y sí de que genera ansiedad; en su lugar, el buzón ordena por actividad.

**Seguridad**: bloqueo efectivo (termina match, oculta en ambas direcciones, persiste), denuncia con motivos y contexto para moderación, apelaciones, verificación por selfie con pose, moderación de fotos (humana por defecto; Sightengine opcional), señales heurísticas de spam/estafa en texto a auditoría.

**Ayuda**: asistente de IA identificado (es/en), FAQ publicada como respaldo, contacto humano.

## Free vs Premium

Gratis: descubrir, dar likes (25/día), conectar y chatear sin límite de mensajes tras la conexión, bloquear, denunciar, pausar, borrar cuenta, privacidad, exportar datos.

Premium (USD 10 de referencia; MX$199 con IVA en web, precio local en tiendas): ver quién te dio like (solo reales), filtros adicionales (intención, intereses, verificados), deshacer descartes (10/día), navegación privada, límites ampliados (100 likes, 25 conversaciones nuevas al día). **Justificación para el nicho**: personas con intención seria y poco tiempo quieren decidir con información (quién les dio like, filtros por intención) y controlar su exposición (incógnito), no "más volumen". Premium **no** cambia la regla de inicio, no garantiza respuestas ni citas, no desbloquea mensajes inexistentes y mantiene límites anti‑spam.

## Automatizaciones (todas identificadas como sistema)

Correos transaccionales (verificación, recuperación, bienvenida, estado de suscripción, eliminación), de producto (nueva conexión, resumen de no leídos máx. 1/día solo si hay mensajes reales) y promocionales (solo con opt‑in, máx. 1/semana, baja en un clic). Horas tranquilas por usuario (22–8 h México por defecto). Nunca mensajes que simulen personas. Push: tokens registrados; el envío real (Expo Push) está pendiente de credenciales (ver `ESTADO.md`).

## Estados de interfaz y accesibilidad

Carga, vacío, error, sin conexión, permiso denegado, pago pendiente y servicio no disponible, en web y móvil. Verificado con Playwright en 360, 390, 768 y 1440 px; axe-core sin violaciones críticas/serias en landing y panel; foco visible, roles ARIA, áreas táctiles ≥44 px, `prefers-reduced-motion`, enlace "saltar al contenido", teclado móvil (KeyboardAvoidingView) y áreas seguras. Lector de pantalla real (VoiceOver/TalkBack) **no probado** en esta sesión.
