# Asistente de soporte con IA

**Qué es**: un asistente identificado como IA (etiqueta visible, aviso "puede equivocarse"), en español e inglés, para registro, perfil, conexiones, privacidad, seguridad, pagos, suscripciones y problemas de la app. **Qué no es**: no es un perfil, no coquetea, no vende Premium con presión, no contacta a nadie, no ve chats ni datos de otras cuentas, no ejecuta acciones sensibles (indica dónde confirmarlas en la app).

## Diseño (`apps/api/src/modules/assistant`)

- Modelo: `claude-haiku-5-5` por defecto (0.10 USD/MTok entrada, 0.50 salida, verificado 2 nov 2026), configurable.
- Conocimiento: tabla `knowledge_articles` **versionada** (publicar crea versión nueva; solo se usa la última publicada por slug/idioma). Búsqueda: texto completo (`tsvector` español/inglés) + similitud trigram para errores de tecleo. Embeddings semánticos: **pendiente** (requiere proveedor de embeddings, p. ej. Voyage; la interfaz permite añadirlo).
- Herramientas (permisos mínimos, el modelo no puede pasar identificadores de otras cuentas): `search_knowledge`, `get_my_account`, `get_my_subscription` (siempre del usuario autenticado), `request_human_support` (marca la conversación para revisión humana).
- Fuentes autorizadas: políticas/precios desde la base publicada; estado de pago desde la BD. Si no hay evidencia, lo dice y ofrece soporte humano.
- Defensas: mensaje de sistema con prioridad sobre contenido recuperado; resultados de herramientas marcados como datos no confiables; esquema de herramientas sin parámetros de identidad; conversaciones ajenas no reanudables; sin acceso de escritura a la BD salvo el marcador de handoff; límite de 4 pasos de herramientas; tiempo máximo 20 s; salida máxima 600 tokens.
- Presupuesto y métricas: límite diario por usuario (30), presupuesto mensual global (USD 20) tras el cual responde en modo FAQ; costo por respuesta en microdólares, tokens, latencia y tasa de degradación visibles en `/admin/asistente`.
- Respaldo: sin clave o ante error/timeout/presupuesto → respuesta con artículos de la FAQ, marcada `degraded`, con contacto humano. La FAQ pública (`/assistant/faq`) no usa IA.
- Privacidad: no se entrena con conversaciones; no se envían datos de otras cuentas al modelo.

## Pruebas (`apps/api/test/assistant.test.ts`)

Modo degradado honesto; reconoce falta de información; con un cliente simulado que intenta pedir datos de otra cuenta, la herramienta devuelve solo los del usuario autenticado y la respuesta no contiene datos ajenos; límite diario; contabilidad de costo. No se probó contra la API real de Anthropic (sin clave en este entorno). El plan Claude Max incluye créditos de API mensuales limitados según `research/legal_seguridad_costos.md`; el presupuesto del bot se trata como consumo medido y no depende de esos créditos.
