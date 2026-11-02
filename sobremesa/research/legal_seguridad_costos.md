# App de citas 18+ en México (web + iOS + Android): legal, confianza y seguridad, costos de infraestructura

**Fecha de investigación:** 2 de noviembre de 2026. **Equipo objetivo:** pequeño, lanzamiento en México.
**Método:** búsquedas web y lectura de fuentes primarias cuando el entorno lo permitió. Varias páginas oficiales (stripe.com, veriff.com, sumsub.com, withpersona.com, developer.incode.com, aws.amazon.com, sightengine.com, hivemoderation.com, platform.openai.com, expo.dev, supabase.com, vercel.com, neon.com, railway.com, fly.io, render.com, developers.cloudflare.com, resend.com, postmarkapp.com, onesignal.com, sentry.io, support.google.com, diputados.gob.mx, marcanet.impi.gob.mx, w3.org, apps.apple.com, rdap.org) **no resolvieron desde esta sesión** (fuera de la lista de dominios permitidos), y el presupuesto de búsquedas se agotó antes de cerrar algunos puntos. Donde la fuente primaria no se pudo abrir, lo indico y bajo la confianza.

**Convención:** cada bloque separa **HECHOS** (verificados en fuente primaria o en ≥2 fuentes consistentes), **ESTIMACIONES** (cálculos propios sobre hechos) e **HIPÓTESIS** (no verificado; requiere confirmación). Confianza: Alta / Media / Baja.

---

## 1. Protección de datos y derecho del consumidor en México

### HECHOS
- **Nueva LFPDPPP.** La nueva *Ley Federal de Protección de Datos Personales en Posesión de los Particulares* se publicó en el **DOF el 20 de marzo de 2025** y entró en vigor al día siguiente (21-mar-2025), abrogando la ley de 2010. Fuentes: resumen EY (https://www.ey.com/es_mx/technical/tax/boletines-fiscales/nueva-ley-federal-proteccion-datos-personal-posesion-particulares), Garrigues (https://www.garrigues.com/es_ES/noticia/mexico-nueva-ley-federal-proteccion-datos-personales-posesion-particulares-introduce), Usercentrics (https://usercentrics.com/es/knowledge-hub/lfpdppp-mexico/). Texto vigente: https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf (no se pudo abrir desde aquí). **Confianza: Alta.**
- **Autoridad.** Tras la extinción del INAI, las facultades de verificación, protección de derechos y sanción en materia de particulares pasaron a la **Secretaría Anticorrupción y Buen Gobierno** (fundamento citado: art. 39 de la nueva ley). Contra sus resoluciones procede juicio de amparo. Fuentes: EY, Garrigues, dplnews (https://dplnews.com/una-nueva-era-en-la-proteccion-de-datos-personales-en-mexico/). **Confianza: Alta.**
- **Obligaciones clave que aplican a una app de citas** (estructura heredada de la ley de 2010, confirmada en los resúmenes): aviso de privacidad (integral y simplificado/corto en el primer contacto), principios de licitud, consentimiento, información, calidad, finalidad, lealtad, proporcionalidad y responsabilidad; derechos **ARCO** con respuesta en **20 días hábiles** y ejecución en **15 días hábiles** más (ambos prorrogables una vez); reglas de **transferencias** (consentimiento salvo excepciones; remisiones a encargados por contrato); **medidas de seguridad** administrativas, técnicas y físicas y **notificación de vulneraciones** al titular. Fuentes: Usercentrics, Legiscope (https://www.legiscope.com/blog/lfpdppp-mexico-guia-cumplimiento.html). **Confianza: Media-Alta** (los números de artículo de la ley nueva no pude confirmarlos en el texto).
- **Datos sensibles.** La categoría de datos personales sensibles incluye, en la tradición de la ley mexicana, origen racial/étnico, estado de salud, información genética, creencias religiosas, afiliación sindical, opiniones políticas y **preferencia sexual**. Una app de citas trata orientación/preferencia sexual y potencialmente salud (p. ej., estatus VIH, discapacidad) → requiere **consentimiento expreso** (en la ley de 2010: expreso y por escrito/firma electrónica/equivalente) y aviso de privacidad que lo señale. **Confianza: Media** sobre la redacción exacta en la ley de 2025; el principio se mantiene según los resúmenes.
- **Sanciones.** Multas expresadas en **UMA**: rangos reportados de **100 a 160,000 UMA** y de **200 a 320,000 UMA** para las infracciones más graves; **se duplican cuando se trata de datos sensibles** (una fuente habla de hasta 640,000 UMA). UMA 2026 ≈ 117.31 MXN/día (valor 2026 no verificado aquí; úsese el publicado por INEGI). Fuentes: Usercentrics, Legiscope, SDV (https://sdv.com.mx/compendio/ley-proteccion-datos-personales/articulo-64/), Tax Today (https://www.taxtodaymexico.com/?p=3897). **Confianza: Media.** La ley de 2010 también preveía **penas de prisión** (3 meses a 3 años por vulneración de seguridad con ánimo de lucro, 6 meses a 5 años por tratamiento engañoso; duplicadas con datos sensibles); los resúmenes indican que la ley nueva conserva tipos penales, pero no pude confirmar el texto. **Confianza: Baja-Media.**
- **Derecho del consumidor (PROFECO).** Reforma a la **Ley Federal de Protección al Consumidor** publicada en el **DOF el 12 de diciembre de 2025** y en vigor el 13-dic-2025: se adicionan las **fracciones VIII y IX al art. 76 Bis**: (VIII) el proveedor debe **notificar con al menos 5 días naturales de anticipación** cualquier renovación automática y permitir cancelar sin penalización; (IX) debe ofrecer **mecanismos de cancelación inmediata**, sin procesos confusos o disuasivos. Multas reportadas por medios: hasta ~**3 millones MXN** (art. 128 LFPC, monto actualizado anualmente). Fuentes: El Imparcial 13-dic-2025 (https://www.elimparcial.com/mexico/2025/12/13/ya-esta-en-vigor-nueva-reforma-a-la-ley-federal-del-consumidor-te-protege-de-cobros-fantasma-en-plataformas-de-servicios-digitales/), Xataka México (https://www.xataka.com.mx/legislacion-y-derechos/a-partir-hoy-debe-ser-facil-cancelar-servicios-suscripciones-mexico-multaran), Publimetro 14-dic-2025 (https://www.publimetro.com.mx/noticias/2025/12/14/cancelar-servicios-digitales-debe-ser-inmediato-en-mexico-o-habra-multas-millonarias/). **Confianza: Alta** en fecha y contenido; **Media** en monto de multa.
- **Decreto de entornos digitales seguros para NNA (14-oct-2026).** Publicado en la edición vespertina del DOF el **14 de octubre de 2026** (nota SIDOF 5801237: https://sidof.segob.gob.mx/notas/docFuente/5801237), aplica a "plataformas digitales" cuya función principal es que usuarios interactúen o compartan contenido; exige **verificación de edad que no dependa de la autodeclaración**, clasificación de contenidos, controles parentales, mecanismos de denuncia y privacidad por defecto, con **informe de medidas a 30 días naturales** (~13-nov-2026). Fuentes: UnoTV (https://www.unotv.com/nacional/ciberacoso-pornografia-y-violencia-dof-publica-decreto-para-restringir-estos-contenidos-a-menores/), Xataka MX, dplnews (https://dplnews.com/?p=333771), Basham (https://basham.com.mx/decreto-de-entornos-digitales-seguros-para-ninas-ninos-y-adolescentes/). **Confianza: Media-Alta** (no leí el texto íntegro). Hay además iniciativas en Senado/Diputados (edad mínima 13 o 15 para redes sociales) **no aprobadas** al 19-oct-2026 (Publimetro https://www.publimetro.com.mx/noticias/2026/10/19/redes-sociales-buscan-prohibir-su-uso-a-menores-de-13-anos-en-mexico/).
- **NOM-151-SCFI-2016.** Regula la **conservación de mensajes de datos y digitalización** (constancia de conservación emitida por un PSC acreditado). Es **obligatoria solo para quien opta por conservar electrónicamente** mensajes de datos con valor probatorio; no es requisito para que un contrato de adhesión digital (T&C) sea válido, pero una constancia NOM-151 sobre la versión aceptada de T&C/aviso de privacidad fortalece la prueba. Fuentes: Secretaría de Economía (https://platiica.economia.gob.mx/normalizacion/nom-151-scfi-2016/), respuestas a comentarios (https://www2.aladi.org/nsfaladi/normasTecnicas.nsf/ccc11adff39a6a9403257cf600683dc4/05ede6b0a94e65c7032585b9005a3a9b/$FILE/Proy%20151%20Respuestas.pdf). **Confianza: Alta** en alcance; **Media** en aplicación a T&C.

### ESTIMACIONES
- Una app de citas que trate orientación sexual sin consentimiento expreso documentado se expone al rango alto de multas duplicado; con UMA ≈ 117 MXN, 320,000 UMA ≈ 37.5 millones MXN (orden de magnitud).
- Flujo mínimo de consentimiento: aviso corto en registro (link al integral), casilla separada no premarcada para datos sensibles, registro de timestamp/versión/IP, y pantalla de "Eliminar cuenta" que ejecute cancelación ARCO (también exigido por Apple 5.1.1(v)).

### HIPÓTESIS / REQUIERE ABOGADO
- Redacción del aviso de privacidad y cláusulas de transferencia a proveedores en EE. UU. (Supabase, Vercel, Anthropic, proveedores KYC) y tratamiento de biometría (selfie/liveness) como dato sensible.
- Si la app, al ser 18+, queda dentro del decreto del 14-oct-2026 y cómo documentar el "método confiable" de edad.
- Cómo instrumentar el aviso de 5 días con suscripciones gestionadas por App Store/Google Play (las tiendas envían su propio aviso; conviene duplicarlo por correo/push para cumplir art. 76 Bis).
- Registro de contratos de adhesión ante PROFECO (RPCA): normalmente voluntario para apps, verificar.

---

## 2. Aseguramiento de edad (age assurance)

### HECHOS
- **Apple.** Las guías exigen a apps con contenido generado por usuarios (1.2) filtrado, reporte, bloqueo y datos de contacto; las apps "hookup"/pornográficas están prohibidas (1.1.4); si hay creación de cuenta debe existir **borrado de cuenta in-app** (5.1.1(v)). Fuente: https://developer.apple.com/app-store/review/guidelines/ (leído 2-nov-2026). Las **clasificaciones** son 4+, 9+, **13+, 16+, 18+** (nuevo esquema anunciado 24-jul-2025: https://developer.apple.com/news/?id=ks775ehf; referencia: https://developer.apple.com/help/app-store-connect/reference/age-ratings). 18+ se asigna por "contenido sexual o desnudez frecuente", apuestas, violencia realista frecuente, etc.; el cuestionario, no la categoría "citas" por sí misma, determina la clasificación. **Confianza: Alta.**
- **Declared Age Range API.** Devuelve rango de edad (no fecha de nacimiento) con consentimiento; desde el **24-feb-2026** Apple **bloquea descargas de apps 18+** a usuarios no confirmados como adultos en **Australia, Brasil y Singapur** y aclara que "developers may have separate obligations to independently confirm that their users are adults"; Utah (6-may-2026) y Luisiana (1-jul-2026) para cuentas nuevas. Fuente primaria: https://developer.apple.com/news/?id=f5zj08ey. **Confianza: Alta.** México no está en la lista; tendencia: expansión regional progresiva.
- **Google Play.** La política de *Age-Restricted Content* exige que **apps de citas/matchmaking usen "Restrict Minor Access"** en Play Console para bloquear menores de 18 (https://support.google.com/googleplay/android-developer/answer/16838200); además la política de **Child Safety Standards** obliga a apps sociales/de citas a publicar estándares contra CSAE, ofrecer reporte in-app y designar un punto de contacto de seguridad infantil (https://support.google.com/googleplay/android-developer/answer/14747720 — no abierto desde aquí). La **Play Age Signals API** se expande globalmente a fines de 2026 (anuncio 29-jul-2026, https://mobileworldlive.com/devices/google-expands-play-age-signals-api-globally). Un aviso de Play Console menciona la nueva política para apps de citas/apuestas con plazos de enero de 2026; la fecha exacta 28-ene-2026 no pude confirmarla para la regla de citas. **Confianza: Media-Alta.**
- **México.** No existía hasta el 14-oct-2026 una obligación legal específica de verificar edad en apps; el **decreto NNA** sí exige métodos que no dependan de autodeclaración a las plataformas cubiertas (ver §1). **Confianza: Media.**
- **Práctica de la industria.** Tinder exige **Face Check** (video-selfie, liveness + comparación con fotos; selfie borrada tras verificación) a nuevos usuarios en 7 países + California (oct-2025) y en Reino Unido (mar-2026), reportando −60 % exposición a malos actores; mantiene **ID Check** aparte para edad/identidad (https://mtch.dd-nyc.co/?p=3758, https://www.globaldatinginsights.com/featured/tinder-rolls-out-mandatory-face-check-for-new-uk-users/). **Confianza: Alta.**

**Proveedores (precios públicos o reportados; la mayoría de páginas oficiales no se pudieron abrir):**

| Proveedor | Precio por verificación | Mínimo | INE/IFE México | Retención de datos | Confianza |
|---|---|---|---|---|---|
| Stripe Identity | **USD 1.50** doc+selfie; USD 0.50 lookup de número de ID; ~50 gratis | ninguno | Verifica "cientos de documentos" pero Identity está GA sólo para negocios en **EE. UU., Reino Unido, Japón** (https://docs.stripe.com/identity/verification-checks); soporte INE no confirmado | configurable, por defecto retiene imágenes en Stripe | Media |
| Veriff | **USD 0.80 / 1.39 / 1.89** por verificación según plan | **USD 49 / 99 / 209** al mes | Tiene producto "INE biometric database verification" (https://devdocs.veriff.com/v1/docs/ine-biometric-database-verification) | configurable | Media |
| Sumsub | **USD 1.35** (Basic) / **1.85** (Compliance) | **USD 149 / 299** al mes; trial 14 días/50 checks | Amplia cobertura LATAM; INE no confirmado en fuente primaria | configurable (política de retención) | Media |
| Persona | Essential **USD 250/mes anual, 500 "services", USD 1.50 extra**; cobra por verificación exitosa; programa startups | USD 250/mes | no confirmado | configurable | Media |
| Onfido (Entrust IDV) | no público; estimado **USD 2–3+** | contrato empresarial | no confirmado | configurable | Baja |
| Incode (México) | no público, "sales-led"; módulos (ID, face, liveness, consulta gubernamental) | — | **Sí**: conexión directa a INE para validación de datos/rostro, CURP/RENAPO (https://developer.incode.com/docs/system-of-record-mexico) | configurable | Media |
| MetaMap (México; adquirida por Incode, jun-2024) | no público | — | Sí (histórico) | — | Baja |
| Truora (LATAM) | no público; terceros reportan **USD 0.60–1.40** + fee plataforma USD 50–250/mes | — | Sí (listas gubernamentales LATAM) | — | Baja |
| Yoti (estimación facial de edad) | no público; terceros **USD 1.50–3.00**; precisión declarada ±2.5 años (6–70) y ±1.3 años (13–17), NIST FATE y ACCS | — | n/a (no usa documento) | imagen no retenida tras estimar (declaración Yoti) | Media |

Fuentes: Stripe (https://www.stripe.com/identity y blogs), signzy (https://www.signzy.com/blogs/veriff-alternatives), costbench Sumsub (https://costbench.com/software/kyc-aml/sumsub/), Persona (https://withpersona.com/pricing vía Capterra/G2), Spendbase Truora (https://test.spendbase.co/de/?p=40049), Yoti (https://www.yoti.com/business/facial-age-estimation, white paper jul-2025 https://www.yoti.com/wp-content/uploads/2025/07/Yoti-Age-Estimation-White-Paper-July-2025-PUBLIC-v1.pdf).

### ESTIMACIONES
- Con 1,000 registros/mes verificados con documento: **USD 1,350–1,900/mes** (Sumsub/Veriff/Stripe). Es el mayor costo variable del MVP, por encima de hosting.
- Estrategia barata: **estimación facial de edad para todos** (USD ~0.10–0.30 si se negocia; Didit anuncia 0.10–0.30 como competidor, no verificado) con **"buffer" de 23–25 años** y **verificación documental sólo** para quien cae en zona gris o reporta edad límite; más **verificación de foto (liveness + face match) gratuita o casi** para badge "verificado".

### HIPÓTESIS
- Para México conviene un proveedor con consulta a INE (Incode, Veriff INE DB, Truora) sólo si se exige identidad real; para un simple 18+ basta OCR del documento + selfie, sin consulta al padrón (menos datos sensibles).

---

## 3. Moderación de contenido: herramientas y costos

### HECHOS
- **AWS Rekognition (Image Moderation):** **USD 1.00 por 1,000 imágenes** (primer millón/mes), USD 0.80 (siguientes 9 M), 0.60, 0.40; capa gratuita de 1,000 (o 5,000 según fuente) imágenes/mes por 12 meses; nuevos clientes desde 15-jul-2025 reciben hasta USD 200 en créditos. Nota: una fuente indica que **moderación de video/batch se cerró a nuevos clientes el 30-abr-2026** (verificar). Fuentes: https://www.wring.co/blog/aws-rekognition-pricing-guide, https://mixpeek.com/curated-lists/best-nsfw-detection-apis. **Confianza: Media** (página oficial no abierta).
- **Google Cloud Vision SafeSearch:** primeras **1,000 unidades/mes gratis**; **USD 1.50 por 1,000** (1,001–5 M); USD 0.60 por 1,000 >5 M; **gratis si se pide junto con Label Detection**. Fuente oficial (versiones localizadas): https://cloud.google.com/vision/pricing. **Confianza: Alta.**
- **Hive Moderation:** pago por uso reportado **USD 3.00 por 1,000 imágenes**, **USD 0.50–1.50 por 1,000 textos**, audio USD 0.03/min; 100 req/día gratis en playground. Fuentes: https://www.getstream.io/blog/sightengine-alternatives/, https://www.edenai.co/post/content-moderation-apis-text-image-and-video-compared. **Confianza: Media-Baja.**
- **Sightengine:** plan de entrada ~**USD 29/mes por 10,000 operaciones**; Pro USD 399/mes por 200,000 (+USD 0.0015 extra); equivale a ~USD 1–3 por 1,000. Fuente: https://aipromptshub.co/safety/ai-content-moderation-cost-by-provider. **Confianza: Media-Baja.**
- **OpenAI Moderation API:** **gratuita** para usuarios de la API (texto e imagen, modelo omni-moderation). Fuente: Help Center de OpenAI citado en https://aipromptshub.co/safety/ai-content-moderation-cost-by-provider. **Confianza: Media-Alta.**
- **Moderación con Anthropic (texto/imagen vía Claude):** no hay endpoint dedicado; se usa el Messages API con precios de §4.

### ESTIMACIONES (cálculo propio con precios de §4)
- **Texto con Claude Haiku 5.5:** mensaje ~100 tokens + system prompt ~500 tokens cacheado + salida ~20 tokens ≈ 100×0.10 + 500×0.01 + 20×0.50 por millón ≈ **USD 0.000025/mensaje ≈ USD 0.025 por 1,000 mensajes** (USD 0.0125 con Batch). Con Sonnet 5.5 ≈ USD 0.45 por 1,000.
- **Imagen con Haiku 5.5 (visión):** una foto de ~1,000×1,000 px ≈ 1,300–1,500 tokens → ≈ **USD 0.15–0.16 por 1,000 imágenes**, i.e. ~6–10× más barato que Rekognition/Vision, pero sin las categorías/ SLA de un clasificador dedicado. Recomendación: clasificador dedicado (Vision/Rekognition) como primera capa + Claude para casos ambiguos y moderación conversacional (acoso, extorsión, menores).
- Con 20,000 fotos y 500,000 mensajes/mes: Vision ≈ USD 30 + Haiku texto ≈ USD 12 → **< USD 50/mes**.

---

## 4. Precios y límites de la API de Anthropic (verificado 2-nov-2026)

### HECHOS — fuente primaria https://platform.claude.com/docs/en/about-claude/pricing
| Modelo | Input | Cache write 5 min | Cache write 1 h | Cache read | Output | Batch (in/out) |
|---|---|---|---|---|---|---|
| **claude-haiku-5-5** (prompt ≤100k tok) | **USD 0.10/MTok** | 0.125 | 0.20 | **0.01** | **USD 0.50/MTok** | 0.05 / 0.25 |
| claude-haiku-5-5 (prompt >100k) | 0.50 | 0.625 | 1.00 | 0.05 | 2.50 | 0.25 / 1.25 |
| **claude-sonnet-5-5** | **USD 2/MTok** | 2.50 | 4 | **0.10** (0.05×) | **USD 10/MTok** | 1 / 5 |
| **claude-opus-5-5** | **USD 4/MTok** | 5 | 8 | **0.20** (0.05×) | **USD 20/MTok** | 2 / 10 |
| **claude-fable-5-1** | **USD 10/MTok** | 12.50 | 20 | **0.25** (0.025×) | **USD 50/MTok** | 5 / 25 |

- Batch API: **50 % de descuento** en input y output; se acumula con caché. Ventana de 1 M tokens a precio estándar (excepto Haiku 5.5, que cobra más arriba de 100k). `inference_geo: "us"` aplica 1.1×. Fast mode Opus 5.5: USD 8/40. **Confianza: Alta.**
- **Rate limits** (https://platform.claude.com/docs/en/api/rate-limits): niveles **Evaluation → Start → Build → Scale → Custom**, asignados automáticamente por historial. Topes de gasto mensual: **Start USD 500, Build USD 1,000, Scale USD 200,000**. Límites por modelo (RPM / ITPM / OTPM): Haiku 5.5, Sonnet 5.5 y Opus 5.5 en Start **4,000 / 2,000,000 / 400,000**; Build 10,000 / 5 M / 1 M; Scale 13,000 / 10 M / 2 M. Fable 5.x: Start 4,000 / 500,000 / 100,000. Sólo tokens no cacheados cuentan para ITPM. Batch: Start 1,000 RPM, 200,000 en cola. **Confianza: Alta.**
- **Claude Max y créditos de API.** El plan **Max incluye USD 100/mes de créditos de API** (Ultra USD 200; Team hasta USD 500 agrupado) que se reclaman vinculando una organización de la Consola; cubren Claude API, Managed Agents, Agent SDK y Playground; **NO cubren Claude Code ni uso extra en las apps de Claude**; expiran cada ciclo sin acumularse; se puede reclamar tras 7 días de suscripción; no requieren tarjeta en la Consola; la organización vinculada sube al menos a tier Start. Fuente primaria: https://platform.claude.com/docs/en/about-claude/api-credits-for-subscribers (y https://support.claude.com/en/articles/17154008). **Corrección al supuesto del encargo:** hoy el Max **sí** trae créditos de API (USD 100/mes), pero **no** son usables en Claude Code y son promocionales/no acumulables. **Confianza: Alta.**
- **Límites de Claude Code bajo Max** (https://support.claude.com/en/articles/11145838): límite por **sesión de 5 horas** + **límite semanal**, compartidos entre Claude.ai y Claude Code (y IDEs); Max/Ultra tienen además un límite semanal separado para Fable. Al agotarse: esperar el reinicio, subir de plan, o activar "usage credits" (cobrados a **tarifa estándar de API**). Si `ANTHROPIC_API_KEY` está definida, Claude Code **cobra a la API** en lugar de usar la suscripción. El artículo no publica precios ni el significado de "5x/20x". **Confianza: Alta.**

### ESTIMACIONES
- Un MVP con moderación de texto (Haiku 5.5), sugerencias de perfil y resúmenes de reportes para el equipo cabe cómodamente dentro de los **USD 100/mes** de créditos del Max en etapa temprana.

---

## 5. Costos de hosting y herramientas (equipo pequeño)

### HECHOS (páginas oficiales no abiertas salvo indicación; valores corroborados en ≥2 fuentes de 2026)
| Servicio | Gratis | Pago inicial | Notas / fuente | Conf. |
|---|---|---|---|---|
| Supabase | 500 MB DB, 2 proyectos, 50k MAU, pausa tras 7 días inactivo | **Pro USD 25/mes**: 8 GB DB, 100 GB storage, 250 GB egress, 100k MAU, USD 10 crédito compute; DB extra USD 0.125/GB | https://supabase.com/pricing (vía makerkit/jetadmin) | Media-Alta |
| Neon | plan Free (0.5 GB en 2025) | plan Launch; terceros reportan **USD 15/mes**; plan intermedio eliminado 4-feb-2026 (costbench) | sin confirmar en fuente primaria | Baja |
| Railway | sólo crédito de prueba | **Hobby USD 5/mes** + uso; Pro USD 20/asiento | tarifas vCPU/GB-h no confirmadas | Media |
| Fly.io | sin capa gratuita para cuentas nuevas | máquina mínima shared-cpu-1x 256 MB ≈ **USD 2.19/mes** (RAM USD 6/GB desde 1-oct-2026); snapshots USD 0.08/GB | https://www.buildmvpfast.com/blog/fly-io-pricing-2026-ram-increase-vs-hetzner | Media |
| Render | web service gratis (se duerme); Postgres gratis 30 días/1 GB | **Starter USD 7/mes** por servicio; ancho de banda extra | https://costbench.com/compare/render-vs-fly-io/ | Media |
| Vercel | Hobby gratis **sólo uso no comercial**, 1 asiento | **Pro USD 20/asiento/mes** con USD 20 de crédito de uso | https://makerkit.dev/blog/saas/vercel-cost | Alta |
| Cloudflare R2 | 10 GB-mes, 1 M Clase A, 10 M Clase B | **USD 0.015/GB-mes**, Clase A USD 4.50/M, Clase B USD 0.36/M, **egress 0** | https://developers.cloudflare.com/r2/pricing/ (corroborado) | Alta |
| Resend | 3,000 correos/mes (100/día) | **Pro USD 20/mes = 50,000**; extra USD 0.90/1,000 | https://www.usecarly.com/blog/resend-pricing/ | Alta |
| Postmark | 100 correos/mes | **USD 15/mes = 10,000**; extra ~USD 1.80/1,000 | https://automationatlas.io/answers/postmark-pricing-explained-2026/ | Alta |
| Expo EAS | **15 builds Android + 15 iOS/mes**, 1k MAU Updates, push gratis | **Starter USD 19/mes** (USD 45 crédito build); **Production USD 199/mes** (ya no USD 99) | https://docs.expo.dev/billing/plans/ (vía pricingsaas, oct-2026) | Media-Alta |
| Apple Developer Program | — | **USD 99/año**; comisión 15 % con Small Business Program | https://developer.apple.com/programs/whats-included/ (leído) | Alta |
| Google Play Console | — | **USD 25 único**; cuentas personales nuevas: prueba cerrada con **12 testers por 14 días** antes de producción | https://support.google.com/googleplay/android-developer/answer/14151465 (vía terceros) | Media-Alta |
| Push | Expo Push gratis; OneSignal Free (10k suscriptores web; push móvil ilimitado según OneSignal; cambios 1-sep-2026) | OneSignal Growth reportado USD 19–99/mes (inconsistente) | https://onesignal.com/blog/whats-changing-on-onesignals-free-plan/ | Baja |
| Sentry | Developer: 1 usuario, **5,000 errores/mes** | Team desde **USD 26–29/mes** | https://costbench.com/software/developer-tools/sentry/free-plan/ | Media |
| Dominio | — | **.mx USD ~25–57/año** (Dondominio 24.96, Dynadot 36.64, promedio 57; ~295 MXN según GoDaddy); **.com ~USD 10–15**; **.app ~USD 15–20** (no verificado) | https://domainoffer.net/tld/mx | Media |

### ESTIMACIONES (MVP, primeros 6 meses, sin KYC)
- Supabase Pro 25 + Vercel Pro 20 + R2 ~2 + Resend 0–20 + Expo 0–19 + Sentry 0 + push 0 + Anthropic 0 (créditos Max) + moderación ~10–50 ≈ **USD 60–140/mes**, más **USD 99/año Apple + USD 25 Google + ~USD 40 dominios**.
- Añadiendo verificación documental a 1,000 usuarios/mes: **+USD 1,350–1,900/mes** (§2). Con estimación facial + documental selectivo: **+USD 300–600/mes** (hipótesis de precio).

---

## 6. Prácticas de seguridad para apps de citas y riesgos en México

### HECHOS
- **Industria.** Tinder/Match: Face Check obligatorio (ver §2), ID Check, "Are You Sure?" y "Does This Bother You?" (detección de mensajes dañinos en tiempo real), "Share My Date" (compartir detalles de la cita con contactos), integración histórica con **Noonlight** (botón de pánico/compartir ubicación, EE. UU.; estado actual no verificado). **Garbo** (background checks) **cerró su servicio al consumidor y su relación con Match en 2023** — no está disponible. Fuentes: Axios 30-jun-2025 (https://www.axios.com/2025/06/30/tinder-face-check-safety), TechCrunch (https://techcrunch.com/?p=2584559). **Confianza: Alta.**
- **Bumble.** **Private Detector** (IA que difumina desnudos no solicitados en el chat; abierto como código en 2022) y **Deception Detector** (feb-2024; bloqueó automáticamente 95 % de cuentas spam/estafa en pruebas; −45 % reportes en 2 meses, cifras de la empresa). Fuentes: https://bumble.com/the-buzz/bumble-deception-detector, https://techcrunch.com/2024/02/05/bumbles-new-ai-tool-identifies-and-blocks-scam-accounts-and-fake-profiles. **Confianza: Alta.**
- **Riesgos México (con fechas):**
  - **CDMX, 26–27 sep 2025:** FGJCDMX detiene a 6 integrantes de una banda que usaba **Tinder** para citas falsas y **secuestro exprés/extorsión**; **dos eran policías de la SSC** (https://www.elimparcial.com/mexico/2025/09/27/detienes-a-dos-policias-en-cdmx-por-participar-en-secuestros-expres-con-citas-de-tinder/, https://www.unotv.com/estados/ciudad-de-mexico/citas-falsas-en-tinder-detienen-a-banda-que-usaba-la-app-para-secuestro-expres-en-cdmx/).
  - **Jalisco/Nayarit, 5–6 jun 2025:** Consulado de EE. UU. en Guadalajara alerta por **secuestros de estadounidenses** contactados por apps de citas en Puerto Vallarta y Nuevo Nayarit (https://www.adn40.mx/mexico/2025-06-06/apps-citas-eua-emite-alerta-viaje-a-puerto-vallarta-y-nuevo-nayarit-por-secuestro/, https://zetatijuana.com/2025/06/consulado-de-eu-en-gdl-emite-alerta-tras-secuestro-de-estadounidenses-que-usaron-apps-de-citas/); nueva alerta reportada el **31-jul-2026** (https://www.ejecentral.com.mx/nuestro-eje/consulado-de-eu-alerta-por-secuestros-mediante-apps-de-citas-en-jalisco).
  - **CDMX, 21 jul 2026:** detención de integrante de banda colombo-venezolana que contactaba víctimas por **Tinder y Grindr** para robar casas (https://www.ejecentral.com.mx/nuestro-eje/detienen-otra-vez-a-colombiana-por-robo-en-cdmx-la-vinculan-con-banda-que-roba-casas-tras-contactar-victimas-en-tinder-y-grindr).
  - Patrón recurrente contra hombres LGBTIQ+ vía **Grindr**: "goteros" (sumisión química), robo y secuestro en CDMX, Edomex y Jalisco; N+ reporta ~100 víctimas (sin fecha visible) (https://www.nmas.com.mx/seguridad/robo-dopaje-secuestro-hombres-lgbtiq-app-citas/); "depredador de Grindr" detenido oct-2023 (https://www.publimetro.com.mx/noticias/2023/10/19/violador-serial-es-detenido-drogaba-y-violaba-a-victimas-que-contactaba-por-grindr/). **Confianza: Alta** en hechos; **Baja** en cifras agregadas.

### Controles recomendados (ESTIMACIÓN basada en lo anterior)
1. **Verificación de foto (liveness + face match) obligatoria** antes de chatear; badge visible; re-verificación si cambia foto principal.
2. **Edad:** estimación facial con buffer + documento selectivo; bloquear menores (Restrict Minor Access en Play; cuestionario Apple 18+).
3. **Antifraude de cuentas:** límites de velocidad, detección de fotos robadas (hash/reverse), señales de dispositivo, bloqueo de VPN/emuladores sospechosos, detección de "pedir dinero / mover la conversación a WhatsApp en el primer mensaje".
4. **Mensajería:** no compartir ubicación exacta (redondear distancia, no mostrar <1 km), desenfoque de imágenes no solicitadas (estilo Private Detector), aviso contextual al detectar mensajes de riesgo (Claude Haiku), bloqueo/denuncia a un toque con respuesta <24 h, **reporte post-unmatch** (conservar evidencia).
5. **Primera cita segura (México):** consejos in-app en español: lugar público, no aceptar bebidas abiertas ("goteros"), no ir a domicilio en la primera cita, **compartir cita con un contacto** (nombre, lugar, hora, foto del perfil) con recordatorio de check-in; botón de emergencia a **911** y Línea de Seguridad CDMX 55 5533 5533; recurso para extranjeros (alertas consulares).
6. **Centro de seguridad** público + **estándares contra CSAE y contacto de seguridad infantil** (requisito Google Play) + política de retención de datos de denuncias para colaborar con fiscalías.
7. **Transparencia:** informe trimestral de reportes/acciones (bajo costo, alta confianza).

---

## 7. Checklist rápido WCAG 2.2 AA para UI móvil de citas (HECHOS de la norma; fuente https://www.w3.org/WAI/WCAG22/quickref/ — no abierta desde aquí, contenido de conocimiento estable)
- **1.4.3 Contraste mínimo 4.5:1** (texto), 3:1 texto grande; **1.4.11 Contraste no textual 3:1** (iconos de like/nope, bordes de campos, indicadores de verificación).
- **1.1.1** Texto alternativo en fotos de perfil (nombre + descripción breve) y en badges ("Perfil verificado").
- **1.3.1 / 4.1.2** Botones de swipe también como botones accesibles con nombre/rol/estado para VoiceOver/TalkBack; no depender sólo de gestos (**2.5.1 Gestos de puntero**: alternativa de un toque al swipe).
- **2.5.8 Tamaño de objetivo (mínimo) ≥ 24×24 CSS px** (nuevo en 2.2, AA); recomendación práctica 44×44.
- **2.4.11 Foco no oscurecido (mínimo)** (nuevo, AA): el foco no debe quedar bajo barras flotantes/toasts.
- **2.5.7 Movimientos de arrastre** (nuevo, AA): cualquier arrastre (reordenar fotos, sliders de edad/distancia) con alternativa sin arrastre.
- **3.3.7 Entrada redundante** y **3.3.8 Autenticación accesible (mínimo)** (nuevos, AA): no reescribir datos ya dados en onboarding; login sin pruebas cognitivas (permitir pegar OTP, gestor de contraseñas, passkeys).
- **3.2.6 Ayuda consistente** (nuevo, A): acceso a ayuda/denuncia en el mismo lugar en todas las pantallas.
- **1.4.4 / 1.4.10 / 1.4.12** Texto redimensionable 200 %, sin pérdida al reflow a 320 px, espaciado de texto; **1.4.1** no usar sólo color (rojo/verde en estados de match).
- **2.3.3 / 2.2.2** Reducir animaciones (respetar "reducir movimiento"); confeti de match pausable.
- **3.3.1 / 3.3.3** Errores de formulario identificados en texto y con sugerencia; **1.3.5** autocompletar en campos (email, teléfono, fecha de nacimiento).

---

## 8. Screening básico de nombres (NO es una búsqueda legal de marca)

**Limitaciones:** IMPI Marcanet (https://marcanet.impi.gob.mx), App Store, Google Play y RDAP/WHOIS **no fueron accesibles** desde esta sesión. Lo siguiente proviene de resultados de búsqueda web. Un **despacho debe hacer la búsqueda fonética/figurativa en clases 9, 38, 42 y 45** antes de decidir.

| Nombre | Hallazgos | Veredicto preliminar | Conf. |
|---|---|---|---|
| **Velada** | Existe **"Velada" app gastronómica** (reservas de restaurantes, NYC; desarrollador *Velada Digital Services SL*, España; origen ex-Telefónica; https://blogthinkbig.com/velada-app-gastronomica-fundada-por-antiguos-trabajadores-de-telefonica). Ninguna app de citas con ese nombre. Dominios velada.app / velada.mx / getvelada.com: **no verificados**. | **Riesgo medio**: hay app activa homónima en otra clase (servicios de restaurantes, 43) y posible marca en UE/EE. UU.; en México no se encontró conflicto en citas (clase 45). Palabra común → marca débil pero registrable con elemento figurativo. | Media |
| **Lumbre** | Sin apps de citas ni apps relevantes encontradas; término genérico (fuego) muy usado en restaurantes/parrillas. Dominios lumbre.app: no verificado. | **Riesgo bajo-medio** por falta de conflicto hallado; alta probabilidad de marcas "Lumbre" en clase 43 (restaurantes) en IMPI, irrelevantes para 45 pero verificar. | Media-Baja |
| **Sobremesa** | Sólo eventos presenciales de singles en un bar "Sobremesa" (Dubái) y productos de parrilla; ninguna app. sobremesa.app: no verificado. | **Riesgo bajo-medio**; palabra descriptiva de reunión social → buen "fit" semántico pero fuerza distintiva limitada. | Media-Baja |
| **Brasa** | **"Brasa Rosticería"** (App Store, restaurante, https://apps.apple.com/us/app/-/id1666761291), "O Mundo na Brasa" (delivery, Portugal), "Embrasa" (app MX, id6747142288). Ninguna de citas. brasa.app: no verificado. | **Riesgo medio**: múltiples usos comerciales de "Brasa" en gastronomía y una app mexicana parecida ("Embrasa"); fonéticamente cercana. | Media |
| **Chispa** (referencia) | **Confirmado: app de citas para latinos de Match Group**, lanzada dic-2017 con Univision; App Store id1289684085 (https://mtch.com/?p=2224, https://www.globaldatinginsights.com/news/match-group-and-univision-communications-launch-latino-dating-app/). | **Evitar** "Chispa" y variantes fonéticas (Chispas, Chispazo) en clase 45. | Alta |

### HIPÓTESIS
- Los cuatro candidatos son sustantivos comunes del español; el IMPI puede exigir distintividad vía diseño/eslogan. "Velada" y "Sobremesa" son los más alineados con una propuesta de citas "lentas"; "Velada" conlleva el mayor riesgo de confusión con una app existente (aunque de otro giro).

---

## Pendientes de verificación (no cerrados por bloqueo de red / fin de presupuesto de búsqueda)
1. Texto íntegro de la LFPDPPP 2025 (artículos de datos sensibles, consentimiento, vulneraciones, sanciones y tipos penales) y del decreto DOF 14-oct-2026.
2. Soporte explícito de INE en Stripe Identity, Persona y Sumsub; precios de Incode/MetaMap/Truora/Yoti (requieren cotización).
3. Páginas oficiales de precios de AWS Rekognition, Hive, Sightengine, OpenAI Moderation, Neon, Railway (tarifas de uso), Expo (precio por build extra), OneSignal (planes de pago), Sentry.
4. Estado actual de la integración Tinder–Noonlight y detalle de "Share My Date".
5. Búsqueda fonética en IMPI Marcanet y disponibilidad WHOIS de velada.mx/.app, lumbre.app, sobremesa.app, brasa.app, getvelada.com.
