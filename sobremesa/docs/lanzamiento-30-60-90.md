# Plan de lanzamiento 30 / 60 / 90 días

Nada de esto se ejecuta sin tu autorización: no se han contactado personas, comprado anuncios ni publicado nada. Presupuestos orientativos en MXN; FIX 18.80 MXN/USD (30‑oct‑2026).

## Principios

Arranque por **comunidad local con densidad** (una zona de Guadalajara, p. ej. Americana/Chapultepec/Providencia/Zapopan centro), lista de espera y **apertura gradual por cohortes equilibradas** (demanda recíproca: no abrir una cohorte si una de las partes de la preferencia mutua no alcanza un mínimo), alianzas con negocios de "planes" (cafeterías, clubes de senderismo, talleres) y usuarios reales. Nunca perfiles ficticios ni bots románticos. Optimizamos conexiones útiles y confianza, no minutos de uso.

## Días 0–30: validar antes de abrir

| Experimento | Hipótesis que prueba | Métrica y umbral | Costo | Tiempo |
|---|---|---|---|---|
| Landing + lista de espera por zona (ya implementada) con tráfico orgánico y 2–3 comunidades locales | Hay demanda recíproca en la ZMG para "planes + intención seria" | ≥300 registros en lista de espera en 30 días con ≥35 % de cada lado de la preferencia mutua; continuar. <120 → cambiar zona o propuesta | MX$0–3,000 (impresos en cafeterías aliadas) | 4 semanas |
| 15 entrevistas (guion en `docs/investigacion-nichos.md`) con personas de la lista | Dolor real: cansancio de apps, seguridad, planes concretos | ≥10/15 mencionan sin inducir "seguridad" o "planes concretos" como motivo | MX$1,500 (café/incentivo) | 2 semanas |
| Prueba de precio con consentimiento: dos variantes mostradas (MX$149 vs MX$199) en la página Premium, solo intención (sin cobro) | Disposición a pagar ~USD 10 | ≥8 % de visitantes verificados pulsan "me interesa" en alguna variante | MX$0 | 3 semanas |
| Evento piloto "sobremesa" con una cafetería aliada (20–30 personas, inscripción vía app) | La comunidad responde a planes reales | ≥60 % de inscritos asisten; ≥30 % crean cuenta completa | MX$3,000–6,000 | 1 evento |

Criterios: **continuar** si ≥3 de 4 umbrales se cumplen; **cambiar** (zona, segmento de edad o propuesta) si 2; **detener** y reevaluar nicho si ≤1.

Entregables técnicos en paralelo: aprobación de Stripe, cuentas de tiendas, RevenueCat sandbox, revisión legal de textos, dominio y correo, despliegue en staging.

## Días 31–60: beta privada

- Abrir cohortes de 150–300 personas por zona con códigos de invitación; mantener ratio de preferencias mutuas ≥40/60.
- Pagos en sandbox → producción con Stripe (web) cuando haya ≥200 perfiles completos; tiendas en TestFlight/pruebas internas.
- Métricas semanales (definiciones abajo). Umbrales para pasar a 90: activación ≥60 %, primer match en 7 días ≥40 %, conversación recíproca ≥25 % de matches, reportes <2 % de usuarios activos, churn semanal <15 %.
- Presupuesto: MX$5,000–15,000 (eventos, impresos, incentivos a aliados). Anuncios pagados solo si el CAC orgánico/referido no alcanza; prueba pequeña (MX$5,000) con medición de CAC real.

## Días 61–90: apertura y Premium

- Lanzamiento público en la ZMG, apps en tiendas (si aprobadas), Premium activo en web y tiendas.
- Experimentos de valor: orden de beneficios en la página Premium, prueba de precio real por cohortes (solo con precios mostrados antes de pagar y sin discriminación oculta), recordatorio de "pausar cuenta" al detectar inactividad tras conversaciones recíprocas (señal de pareja encontrada).
- Criterios a 90 días: ≥1,500 usuarios activos mensuales, conversión a Premium ≥3 %, MRR neto ≥MX$6,000 (30 % de la meta) con churn ≤10 % → continuar; <MX$2,000 → cambiar modelo (p. ej., eventos de pago) o ciudad.

## Métricas: definiciones

| Métrica | Numerador | Denominador | Ventana |
|---|---|---|---|
| Activación | usuarios con correo verificado y perfil completo | registros | 7 días desde registro |
| Personas compatibles disponibles | mediana de candidatos devueltos por `/discover` por usuario activo | — | diaria |
| Primer match | usuarios con ≥1 match | perfiles completos | 7 días |
| Conversación recíproca | conversaciones con mensajes de ambas partes | matches | 14 días desde match |
| Retención | activos en semana N | cohorte de la semana 0 | semanas 1, 4, 8 |
| Conversión a Premium | suscriptores activos | usuarios activos 30 días | mensual |
| Bajas (churn) | suscripciones que no renuevan | suscripciones activas al inicio del mes | mensual |
| Reportes | usuarios reportados | usuarios activos 30 días | mensual |
| CAC | gasto de adquisición | nuevos usuarios con perfil completo | por canal, mensual |

Todas están disponibles o derivables del panel (`/admin/metrics`) y de la BD; instalaciones no cuentan como usuarios activos.
