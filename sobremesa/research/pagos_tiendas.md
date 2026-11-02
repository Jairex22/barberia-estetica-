# Pagos, tiendas de apps e impuestos para una app de citas por suscripción en México

**Fecha de investigación:** 2026-11-02 · **Precio de referencia:** Premium USD 10/mes · **Mercado:** México (MXN)

> **Nota metodológica.** En esta sesión solo se pudieron leer directamente páginas de `developer.apple.com`; `stripe.com`, `docs.stripe.com`, `mercadopago.com.mx`, `support.google.com`, `banxico.org.mx`, `dof.gob.mx`, `revenuecat.com`, `sat.gob.mx`, `conekta.com` y `openpay.mx` están fuera de la lista de dominios permitidos de la sesión. Para esos proveedores se usaron fragmentos de sus páginas oficiales devueltos por el buscador (marcados "oficial vía buscador") y fuentes secundarias. Cada afirmación lleva fuente, fecha y confianza (**Alta / Media / Baja**). Lo que no pudo verificarse está separado como ESTIMACIÓN o HIPÓTESIS.
>
> Leyenda: **[H]** = HECHO verificado en fuente primaria · **[E]** = ESTIMACIÓN (dato secundario o parcial) · **[HIP]** = HIPÓTESIS (razonamiento sin fuente directa).

---

## A. Stripe México

**Negocio restringido**
- [H] La lista "Prohibited and Restricted Businesses" de Stripe (versión 13-may-2026) incluye **dating** entre las categorías *restringidas* (no prohibidas): se admiten con condiciones/diligencia adicional y, según el FAQ oficial, "con aprobación previa explícita". Fuente: https://support.stripe.com/questions/prohibited-and-restricted-businesses-list-faqs ; resumen de la versión 2026 en https://terms.law/Privacy-Watchdog/payment-processors/stripe/ y registro de cláusula "Online Dating Services – Due Diligence Required" en https://conductatlas.com/platform/stripe/stripe-restricted-businesses-list/online-dating-services-due-diligence-required/ (prohibiciones específicas solo en India, EAU y Tailandia; México no aparece). Confianza: **Media-Alta** (texto literal de stripe.com no leído).
- [H] Para el producto *Financial Accounts for platforms* (Connect) "adult, escort or dating services" sí es **prohibido**. https://edge-docs.stripe.com/financial-accounts/connect/requirements. Confianza: Alta. No aplica a una cuenta estándar.
- [HIP] Proceso práctico: abrir la cuenta declarando el giro real ("servicio de citas en línea por suscripción, sin contenido sexual"), contactar a soporte antes de aceptar el SSA para solicitar la aprobación del giro restringido, y tener listos T&C, política de moderación y verificación de edad 18+. Si el contenido tiene "énfasis sexual" cae en prohibido (cláusula sobre dating sites con contenido sexual explícito).
- No se pudo abrir la página de soporte específica de México sobre negocios restringidos (dominio bloqueado).

**Comisiones (MXN)**
- [H] Tarjetas nacionales: **3.6 % + MX$3.00** por transacción exitosa. Fuente oficial vía buscador: https://stripe.com/en-mx/pricing/local-payment-methods y https://stripe.com/en-mx/billing/pricing. Confianza: Alta.
- [H] Tarjetas internacionales: **+0.5 %** adicional según la página oficial; terceros citan +1.5 % o "4.4 % + MX$3" (posible dato anterior). **+2 %** si hay conversión de moneda (oficial). Confianza: Media (conflicto entre fuentes).
- [E] OXXO: terceros reportan 3.6 % + MX$3 o ~3.9 %; cifra oficial no leída. SPEI: terceros ~1.8 % (sin confirmar). Confianza: Baja.
- [E] Stripe Billing: 0.7 % del volumen facturado (plan Starter, global) — fuente secundaria https://dupple.com/learn/best-subscription-management-software; página oficial MX no leída. Confianza: Media-Baja.
- [H] Stripe Tax (pay-as-you-go): **0.5 % del volumen** en jurisdicciones donde estés registrado. https://support.stripe.com/questions/understanding-stripe-tax-pay-as-you-go-pricing. Confianza: Alta.
- [H] Stripe cobra **IVA sobre sus comisiones** a negocios con sede en México y emite factura (acreditable). https://support.stripe.com/questions/taxes-on-stripe-fees-for-mexico-based-businesses. Confianza: Alta.
- [H] Disputa (contracargo): **MX$150** por disputa; en México se **devuelve si ganas** o si el tarjetahabiente retira; la "comisión por contestar" (USD 15 en EE. UU.) **no aplica** en México. https://support.stripe.com/questions/disputes-and-fraud-in-mexico-faq ; https://support.stripe.com/questions/june-2025-pricing-updates-for-disputes. Confianza: Alta.

**Moneda, payouts y requisitos**
- [H] Liquidación en **MXN a cuenta CLABE**. Requisitos (https://support.stripe.com/questions/required-information-to-open-your-stripe-account-in-mexico): tipo de negocio *Persona Física con Actividad Empresarial* (equivalente a sole proprietorship) o persona moral; **RFC personal obligatorio** en el formulario del representante; RFC de empresa opcional para persona física; **CLABE**; carga de **Constancia de Situación Fiscal** (texto truncado en el fragmento). Confianza: Alta.
- [E] Plazo de payout: Stripe anunció pagos acelerados "en 3 días" para usuarios elegibles en México (https://stripe.com/nz/newsroom/news/stripe-and-mexico). El plazo estándar para cuentas nuevas no se pudo leer en docs.stripe.com/payouts. [HIP] Históricamente ~7 días hábiles; confirmar en Dashboard → Configuración → Payouts. Confianza: Baja.

**Suscripciones y métodos locales**
- [H] **OXXO: "Recurring payments: Not supported"**; además **no es reembolsable** y no está disponible en Customer Portal. https://docs.stripe.com/payments/oxxo. Confianza: Alta.
- [H] **SPEI (Mexico bank transfers): "Recurring payments: Not supported"**. Son pagos *push* financiados por el cliente; Stripe no puede debitar. Sí puede usarse el **customer balance**: si el cliente transfiere fondos, una factura de suscripción puede cobrarse contra ese saldo (el cliente debe transferir cada ciclo). https://docs.stripe.com/payments/mx-bank-transfers. Confianza: Alta.
- [H] Checkout + Billing: la página oficial Billing para México existe y muestra la misma tarifa base (3.6 % + MX$3), lo que confirma disponibilidad de Billing/Checkout en modo suscripción con tarjeta en MXN. Confianza: Media-Alta.
- [H] Stripe Tax México: soportado; umbral de registro "una transacción"; sin registro simplificado para no residentes (deben nombrar representante legal). Para residente con RFC basta activar el registro en Dashboard. https://docs.stripe.com/tax/supported-countries/latin-america-and-caribbean/mexico. Confianza: Alta.

## B. Mercado Pago México

- [H] Comisiones Checkout Pro / Link de pago según plazo de liberación (guía oficial Hot Sale 2026, https://www.mercadopago.com.mx/blog/hot-sale-integra-mercado-pago): **inmediato 3.49 % + MX$4.00; 7 días 3.19 % + MX$4.00; 30 días 2.95 % + MX$4.00**. Confianza: Media-Alta (fuente oficial, pero promocional). [HIP] Mercado Pago MX suele publicar tarifas "IVA incluido"; terceros discrepan (algunos dicen "+IVA"). Verificar en *Tu negocio → Costos*.
- [E] OXXO/efectivo: ~3.79 % + MX$4 (liberación 3 días) según https://atempora.studio/blog/comisiones-mercado-pago-2026 (dice verificado agosto 2026). SPEI: 1–1.8 % o tarifa fija según fuente. Confianza: Baja.
- [H] Liberación del dinero: **instantánea, 7 días o 30 días**; vendedores nuevos suelen empezar en 7 días y la instantánea se habilita tras ventas. https://www.mercadopago.com.mx/herramientas-para-vender/link-de-pago. Confianza: Alta.
- [E] **Suscripciones (preapproval / preapproval_plan)**: el cobro recurrente en México es **solo con tarjeta de crédito/débito** (y saldo en cuenta MP según algunas integraciones); **OXXO y SPEI no son recurrentes** y solo funcionan en Checkout Pro para pagos únicos (workaround: prepago de varios meses). Fuente secundaria (integración documentada en https://github.com/Yiipi24/menuabierto/pull/76). Tarifa específica de Suscripciones no encontrada; [HIP] misma tabla que Checkout. Confianza: Media.
- [H] Negocios permitidos: los T&C de México remiten a una página de "Actividades Prohibidas" (no leída). La lista de actividades prohibidas para México en Global Selling (https://global-selling.mercadopago.com/help/18572) prohíbe pornografía, contenido sexual con menores, violencia, fraude, drogas; **no menciona citas/dating**. Confianza: Media. [HIP] Una app de citas sin contenido pornográfico no está prohibida, pero el riesgo de revisión/retención por "rubro sensible" existe.
- [H] Métodos: tarjetas, OXXO, SPEI, saldo Mercado Pago, MSI. Confianza: Alta.
- [H] **Webhooks – firma `x-signature`**: header `x-signature: ts=...,v1=...`; se construye el manifest `id:[data.id];request-id:[x-request-id];ts:[ts];` (omitiendo campos ausentes), se calcula **HMAC-SHA256 en hex** con la clave secreta del panel de Webhooks y se compara con `v1`. Usar URLs distintas para prueba y producción. https://www.mercadopago.com/developers/es/docs/your-integrations/notifications/webhooks. Confianza: Alta.
- [H] **Cuentas de prueba**: se crean en el Panel de Developers → Cuentas de prueba (tipos Vendedor / Comprador / Integrador, hasta 15, no se pueden borrar); login con los últimos 6 dígitos del User ID; Checkout Bricks no admite usuarios de prueba. https://www.mercadopago.com.mx/developers/es/docs/checkout-pro/test-accounts. Confianza: Alta.
- [H] **Contracargos**: el vendedor tiene **10 días** para presentar comprobantes; el proceso puede durar **hasta 140 días**; el importe queda retenido; existe Programa de Protección al Vendedor condicionado. https://www.mercadopago.com.mx/developers/es/docs/checkout-pro/chargebacks. **No se encontró comisión fija por contracargo** (Confianza: Media). Para servicios digitales la protección suele ser limitada [HIP].

## C. Conekta, Openpay (BBVA), Clip — breve (todas Confianza: Baja, solo fuentes terciarias)

| Proveedor | Tarjeta | Efectivo (OXXO) | SPEI | Suscripciones |
|---|---|---|---|---|
| Conekta | 2.9 % + MX$2.50 a 3.4–4.49 % + MX$3 (+IVA) según fuente | MX$9–17 fijos o 2.6 % + MX$3 | ~1 % | Sí ("planes/suscripciones") |
| Openpay/BBVA | 2.9 % + MX$2.50 + IVA (negociable) | sí (tiendas) | sí | Sí (API de suscripciones/cargos recurrentes) |
| Clip | 3.6 % + IVA, sin fijo | — | — | Links/online; recurrencia limitada |

Fuentes: https://www.guiadesoftware.com/blog/mejor-pasarela-pago-mexico, https://www.appaguitos.com/comparativa/conekta-vs-openpay, https://atempora.studio/blog/comisiones-clip-2026, https://growflowautomat.com/en/blog/ecommerce-mexico-stripe-vs-mercadopago-vs-conekta-2026. Las páginas oficiales no pudieron leerse. [HIP] Conekta/Openpay convienen solo si se negocia volumen o se requiere adquirencia local más barata; su tooling de suscripciones es menos maduro que Stripe Billing.

## D. Apple App Store (2026)

- [H] **Guideline 3.1.1**: desbloquear funciones (incluidas suscripciones) exige **In-App Purchase**; 3.1.1(a) permite enlaces externos solo con *StoreKit External Purchase Link Entitlement* en regiones específicas, y "en todas las demás tiendas, excepto la de Estados Unidos, las apps no pueden incluir botones, enlaces o llamadas a la acción hacia otros mecanismos de compra". 3.1.3(a) "Reader apps" solo para revistas, libros, audio, música y video → **no aplica a citas**. **Conclusión: en la tienda de México una app de citas debe vender Premium vía IAP y no puede enlazar a su web de pago.** https://developer.apple.com/app-store/review/guidelines/ (leída 2026-11-02). Confianza: Alta.
- [H] EE. UU.: sin comisión en links externos tras *Epic v. Apple* (mayo 2025); estado de apelación/Supremo no verificado hoy. UE: términos unificados anunciados 18-ago-2026 con vigencia 1-oct-2026 (IAP 26 %, pago alternativo 20 %, link-out 15 %, SBP 15/10 %; CTC 5 %). Fuentes secundarias (https://www.irishtimes.com/business/2026/08/19/apple-introduces-app-store-changes/). Confianza: Media. **Nada de esto aplica a México.**
- [H] **Comisión**: estándar 30 %; **Small Business Program 15 %** si las ganancias netas < USD 1M en el año anterior y actual; además 10 % para suscripciones tras el primer año solo en términos alternativos UE. https://developer.apple.com/app-store/small-business-program/. Confianza: Alta. [E] Suscripciones >1 año a 15 % en términos estándar (práctica conocida, no en la página leída). Confianza: Media-Alta.
- [H] **Clasificación por edad**: nuevos niveles **4+, 9+, 13+, 16+, 18+** (se eliminan 12+ y 17+); cuestionario obligatorio antes del **31-ene-2026**; en OS < 26 se muestra la equivalencia anterior. "Frequent mature or suggestive themes" → 16+; "frequent sexual content or nudity" o gambling → 18+. https://developer.apple.com/news/upcoming-requirements/ ; https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions. Confianza: Alta. [HIP] Una app de citas con T&C 18+ debería fijar manualmente **18+** (antes 17+) para coherencia con su EULA; fuentes de terceros afirman que Apple exige subir el rating si el EULA pone una edad mínima mayor (no verificado en Apple).
- [H] **Requisitos para apps con UGC (1.2)**: filtrado de contenido objetable, **mecanismo de denuncia** con respuesta oportuna, **bloqueo de usuarios**, **datos de contacto publicados**. Apps que deriven en "Chatroulette-style", chat anónimo o "hot-or-not" pueden retirarse. **5.1.1(v): eliminación de cuenta dentro de la app** obligatoria. **4.3(b)**: las apps de citas son categoría "saturada": deben ofrecer una experiencia "significativamente diferente o mejorada". 1.1.4: apps "hookup" se consideran contenido sexual. Confianza: Alta.
- [H] **StoreKit 2 + App Store Server Notifications v2**: tipos clave `SUBSCRIBED (INITIAL_BUY/RESUBSCRIBE)`, `DID_RENEW (BILLING_RECOVERY)`, `DID_CHANGE_RENEWAL_STATUS`, `DID_FAIL_TO_RENEW (GRACE_PERIOD)`, `GRACE_PERIOD_EXPIRED`, `EXPIRED (VOLUNTARY/BILLING_RETRY/PRICE_INCREASE)`, `REFUND` (incluye suscripciones auto-renovables), `REFUND_DECLINED`, `REFUND_REVERSED`, `CONSUMPTION_REQUEST`, `REVOKE` (Family Sharing), `PRICE_INCREASE`, `RENEWAL_EXTENDED`. https://developer.apple.com/documentation/appstoreservernotifications/notificationtype. Confianza: Alta. [E] Ventana para responder `CONSUMPTION_REQUEST`: 12 h (fuentes secundarias). Confianza: Media.
- [E] **Precio en MXN ≈ USD 9.99**: no se pudo leer la matriz de precios ni la tienda MX (`apps.apple.com` bloqueado). [HIP] Con FIX 18.80 y tienda MX con IVA incluido, el punto de precio auto-generado por Apple quedaría en **MX$179–199**; una fuente de terceros observó en oct-2026 tiers redondos de MX$149/199 en MX. Confianza: Baja. Recomendación: fijar manualmente MX$189 o MX$199 en el storefront MX.

## E. Google Play (2026)

- [H] **Facturación**: en México las suscripciones digitales deben usar **Google Play Billing**. El nuevo programa "billing choice" (10 % servicio + 5 % facturación) rige en **EE. UU., Reino Unido y EEE desde 30-jun-2026**, Australia 30-sep-2026, Japón/Corea después; **México no aparece** y, según terceros, el resto del mundo migra hasta el **30-sep-2027**. https://android-developers.googleblog.com/2026/06/play-expanded-billing.html ; https://support.google.com/googleplay/android-developer/answer/17161464. Confianza: Alta (ausencia de México) / Media (fecha 2027). **User Choice Billing / alternative billing: no disponible en México.**
- [H] **Tarifa de servicio (esquema vigente para México)**: **15 % sobre el primer USD 1M anual** (requiere inscripción en Play Console) y **15 % para suscripciones desde el día 1** (desde ene-2022); 30 % por encima. https://support.google.com/googleplay/android-developer/answer/112622. Confianza: Alta.
- [H] **Política para apps de citas**: deben usar **Restrict Minor Access** en Play Console (Age-Restricted Content and Functionality); categorías Social y Dating deben cumplir **Child Safety Standards** (CSAE: política publicada, mecanismo de denuncia, contacto designado); prohibido "sugar dating"/citas compensadas. https://support.google.com/googleplay/android-developer/answer/16926792 ; https://support.google.com/googleplay/android-developer/answer/14747720. Confianza: Alta. Clasificación IARC se obtiene con el cuestionario (una app de citas típicamente "Mature 17+"/18 según región) [E].
- [H] **Real-Time Developer Notifications** vía Cloud Pub/Sub: `SUBSCRIPTION_PURCHASED, RENEWED, CANCELED, ON_HOLD, IN_GRACE_PERIOD, RESTARTED, PRICE_CHANGE_CONFIRMED, DEFERRED, PAUSED, REVOKED, EXPIRED` + `voidedPurchaseNotification`; siempre confirmar estado con la API `purchases.subscriptionsv2`. **Voided Purchases API**: últimos 30 días, cuota 6,000/día. https://developer.android.com/google/play/billing/rtdn-reference ; https://developers.google.com/android-publisher/voided-purchases. Confianza: Alta.
- [H] **Impuestos en precios**: México es país de **precio con impuesto incluido**: Play aplica la tasa configurada sobre el precio sin impuesto para mostrar el total al comprador. Desde **1-abr-2021 Google determina, cobra y remite el IVA 16 % para desarrolladores fuera de México**; desde 1-ago-2020 aplica **IVA 16 % sobre la tarifa de servicio** a desarrolladores en México. https://support.google.com/googleplay/android-developer/answer/138000. Confianza: Alta. [HIP] Para un desarrollador **con sede en México**, Google no actúa como retenedor: entrega el IVA al desarrollador, quien lo declara (modelo análogo a Apple). Confirmar en Play Console → Configuración de pagos → Impuestos.
- [E] **Precio MXN ≈ USD 9.99**: no verificado. [HIP] Con precio con IVA incluido, fijar **MX$189** (equivale a USD 10.06 al FIX). Confianza: Baja.
- [H] **Reembolsos**: el desarrollador puede reembolsar total o parcialmente desde Play Console; un reembolso parcial reduce payout y tarifa en la misma proporción; Google devuelve la tarifa de servicio; irreversible. https://support.google.com/googleplay/android-developer/answer/2741495. Confianza: Alta. [E] Autoservicio del usuario dentro de 48 h (fuentes secundarias). Confianza: Media.

## F. RevenueCat

- [H] **Precio**: gratis hasta **USD 2,500 de MTR** (Monthly Tracked Revenue); por encima, **1 % del MTR total** (no solo el excedente; ej. USD 26 sobre USD 2,600). https://www.revenuecat.com/docs/welcome/set-up-revenuecat/account-management ; https://www.revenuecat.com/pricing/. Confianza: Alta.
- [H] **Funciones**: entitlements, offerings/paywalls, webhooks, integraciones (Amplitude, Mixpanel, etc.), Customer Center. **Web Billing (RevenueCat Billing) sí existe y procesa con Stripe** por debajo; RevenueCat no es procesador: te paga Apple/Google/Stripe. Confianza: Alta. [E] Un tercero afirma que los webhooks solo se habilitan por encima del umbral; verificar. Confianza: Baja.
- [HIP] Para una app en México, RevenueCat unifica IAP (Apple/Google) con suscripciones web Stripe bajo un solo *entitlement* "premium"; el 1 % es menor que mantener un backend propio de reconciliación.

## G. Impuestos (todo este bloque **requiere revisión profesional**)

- [H] **IVA 16 %** aplica a servicios digitales consumidos en México (LIVA 18-B: descarga/acceso a contenidos, intermediación, clubes/citas en línea, enseñanza a distancia). http://www.diputados.gob.mx/LeyesBiblio/pdf/LIVA.pdf. Confianza: Alta.
- [H] **Venta vía App Store**: Apple actúa como **comisionista** (exhibit México del acuerdo de desarrollador, 29-ene-2026). Para **personas físicas con RFC y empresas en México**, Apple **cobra el IVA y se lo entrega al desarrollador**, quien debe **enterarlo al SAT**; Apple solo lo remite directamente al SAT por **personas físicas no registradas** y empresas extranjeras no registradas. Además, al desarrollador mexicano se le descuenta **IVA sobre la comisión de Apple** (acreditable) y una **retención de ISR sobre ventas mundiales mensuales antes de IVA** (tasa no publicada en la página). Documentos: Clave RFC, CURP, Cédula de Identificación Fiscal. https://developer.apple.com/help/app-store-connect/provide-tax-information/provide-mexico-tax-information. Confianza: Alta.
- [E] Tasa de retención de ISR por plataformas (LISR 113-A): **1 %** para enajenación de bienes y prestación de servicios desde 2022; retención de **IVA 50 %** (con RFC) o **100 %** (sin RFC) cuando la plataforma cobra por cuenta del vendedor (LIVA 18-J). Reforma 2026 al 18-J: retención 100 % de IVA a residentes en el extranjero sin establecimiento que vendan vía plataformas (https://grupofiscalcastroycia.com.mx/regimen-de-plataformas-digitales/). Confianza: Media. [HIP] Como Apple dice "collect and remit the VAT to you", parece operar sin la retención del 50 %; verificar en los estados de cuenta mensuales ("withholding income tax statement").
- [H] **Venta vía Google Play**: Google remite IVA por desarrolladores **fuera** de México; para desarrolladores **en** México cobra IVA sobre su tarifa (ver E). [HIP] El desarrollador mexicano declara el IVA de sus ventas Play.
- [H] **Venta web (Stripe/Mercado Pago)**: el comerciante es el contribuyente: **desglosa y entera el IVA 16 %**, emite CFDI (puede ser global al público en general), y acredita el IVA de las comisiones del PSP. Confianza: Alta.
- [E] **Régimen del fundador (persona física)**: RESICO personas físicas — ISR **1 % a 2.5 %** sobre ingresos cobrados, tope **MX$3.5 M** anuales, sin deducciones, declaración mensual, requiere e.firma y buzón tributario (https://idconline.mx/fiscal-contable/2026/01/14/resico-2026-requisitos-para-que-personas-fisicas-se-incorporen-o-cambien-de-regimen). Alternativa: Actividad Empresarial y Profesional (tarifa progresiva, con deducciones). Confianza: Media. [HIP] Las retenciones de Apple (ISR) serían acreditables contra el ISR del RESICO; compatibilidad RESICO + ingresos por plataformas debe confirmarla un contador. **Requiere revisión profesional.**

## H. Tipo de cambio

- [E] **FIX Banxico determinado el viernes 30-oct-2026: 18.7962 MXN/USD** (último hábil antes de hoy; el 2-nov es feriado bancario). Último valor leído directamente de Banxico (X oficial): FIX 26-oct-2026 = 18.5798. Fuentes: https://tribuna.com.mx/politica-y-economia/2026/11/01/precio-del-dolar-hoy-domingo-1-de-noviembre-de-2026-tipo-de-cambio-actual-en-mexico_709356/ ; https://x.com/Banxico/status/2114779192453685678. Banxico/DOF no pudieron leerse directamente. Confianza: **Media**. Serie oficial: SF43718.

## I. Contracargos y reembolsos (resumen)

| Canal | Costo de disputa | Reembolsos | Notificación |
|---|---|---|---|
| Stripe MX | MX$150, reembolsable si ganas [H] | Tarjeta: sí; **OXXO: no reembolsable** [H] | `charge.dispute.created`, `charge.refunded`, `customer.subscription.*` |
| Mercado Pago | Sin cuota publicada encontrada [E]; retención del monto hasta 140 días; 10 días para evidencia [H] | Desde panel/API | webhook `topic=chargebacks`, `payment` |
| Apple | Apple decide; el desarrollador puede responder `CONSUMPTION_REQUEST` [H] | Apple reembolsa; desarrollador no puede reembolsar directamente | `REFUND`, `REFUND_DECLINED`, `REFUND_REVERSED`, `REVOKE` [H] |
| Google | Google o el desarrollador reembolsan; Google devuelve la tarifa [H] | Parcial/total desde Console [H] | `SUBSCRIPTION_REVOKED`, `voidedPurchaseNotification`, Voided Purchases API [H] |

---

## Tabla: neto por suscriptor (USD 10 ≈ MX$187.96 al FIX 18.7962)

**Fórmulas**
- Precio al público con IVA: `P = 10 × 18.7962 = MX$187.96`
- Base sin IVA: `B = P / 1.16 = MX$162.03`; IVA a enterar = `P − B = MX$25.93`
- Web: `Neto = B − comisión_PSP_sin_IVA` (el IVA de la comisión se acredita, por eso se resta la comisión neta)
- Tiendas: `Neto = B × (1 − comisión)`; el IVA sobre la comisión (16 % × comisión) es acreditable; la retención de ISR (≈1 % × B ≈ MX$1.62) es acreditable, no costo.

| Canal | Comisión sobre MX$187.96 | Neto (MXN) | Neto (USD) | % del precio con IVA | Tipo |
|---|---|---|---|---|---|
| Web · Stripe (tarjeta nacional 3.6 % + 3 + Billing 0.7 %) | 9.77 + 1.32 = 11.09 | **150.95** | 8.03 | 80.3 % | [H] tarjeta; [E] Billing |
| Web · Mercado Pago (3.49 % + 4, liberación inmediata, IVA incl.) | 10.56 (9.10 sin IVA) | **152.93** | 8.14 | 81.4 % | [H] tarifa; [HIP] IVA incl. |
| Web · Mercado Pago si tarifa es + IVA | 10.56 | 151.47 | 8.06 | 80.6 % | [HIP] |
| App Store · SBP 15 % | 24.31 (+3.89 IVA acreditable) | **137.73** | 7.33 | 73.3 % | [H] |
| App Store · 30 % (sin SBP / >USD 1M) | 48.61 | 113.42 | 6.03 | 60.3 % | [H] |
| Google Play · 15 % (suscripciones) | 24.31 (+3.89 IVA acreditable) | **137.73** | 7.33 | 73.3 % | [H] |
| Google Play · 30 % (>USD 1M, no suscripción) | 48.61 | 113.42 | 6.03 | 60.3 % | [H] |

Ajustes: si se usa RevenueCat por encima de USD 2.5k MTR, restar 1 % de P (≈MX$1.88) en todos los canales. Con tarjeta internacional en Stripe sumar 0.5 % (+2 % si hay conversión). Con Mercado Pago a 30 días el neto web sube a ≈MX$154.4. **Diferencia web vs tienda al 15 %: ≈MX$13–15 por suscriptor/mes (≈9–10 % del ingreso neto).**

---

## Recomendación

**Pasarela web principal: Stripe (Checkout + Billing + Stripe Tax), con Mercado Pago Checkout Pro como secundaria para OXXO/SPEI/saldo MP en prepagos de 1, 3 y 6 meses.**

Razones: (1) Stripe tiene el stack de suscripciones más completo (Billing, Customer Portal, Smart Retries, Tax con IVA 16 %) y webhooks firmados; (2) la diferencia de costo con Mercado Pago es ~MX$1–2 por suscriptor y se compensa con menor desarrollo; (3) Mercado Pago aporta la cobertura de usuarios sin tarjeta (OXXO/SPEI/wallet), que ninguna pasarela puede cobrar de forma recurrente, por lo que su rol natural es **prepago** y no recurrencia. Riesgo a gestionar: Stripe clasifica "dating" como **restringido** → solicitar aprobación previa antes de ir a producción; tener plan B (Mercado Pago o Conekta) si Stripe rechaza el giro.

En las tiendas, vender Premium solo vía IAP (Apple) y Google Play Billing, inscribirse en **Small Business Program** y en el **tier 15 %** de Play, y usar RevenueCat para unificar entitlements con la suscripción web (sin enlazar a la web desde la app en la tienda de México).

### Checklist exacto de requisitos de producción

**Legal/fiscal (requiere revisión profesional)**
- [ ] RFC activo (persona física con actividad empresarial o RESICO, o persona moral), e.firma, buzón tributario, Constancia de Situación Fiscal vigente.
- [ ] CLABE a nombre del titular de la cuenta Stripe/Mercado Pago.
- [ ] Alta de obligación de IVA; CFDI global por ventas al público; acreditamiento de IVA de comisiones (Stripe, MP, Apple, Google).
- [ ] T&C 18+, Aviso de Privacidad (LFPDPPP), política de reembolsos y cancelación publicadas.

**Stripe**
- [ ] Cuenta MX activada; giro declarado "online dating subscription"; **aprobación de negocio restringido** por escrito de Stripe.
- [ ] Productos/Precios en MXN (MX$189/mes sugerido, `tax_behavior=inclusive`), Stripe Tax con registro MX, Customer Portal, Smart Retries y dunning.
- [ ] Checkout mode=subscription solo con `card`; Checkout mode=payment con `oxxo`/`customer_balance` (SPEI) para prepagos.
- [ ] Webhooks con verificación de firma: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated/deleted`, `charge.dispute.created`, `charge.refunded`. Idempotencia por `event.id`.
- [ ] Radar reglas para alto riesgo; respuesta a disputas en plazo (MX$150 recuperable).

**Mercado Pago**
- [ ] Cuenta vendedor verificada; aplicación en Developers con credenciales productivas; webhooks con validación `x-signature` (HMAC-SHA256, manifest `id;request-id;ts`).
- [ ] Preferencias Checkout Pro para prepagos (OXXO/SPEI/wallet) con `external_reference` = user_id y `notification_url`; topic `payment` activado.
- [ ] Opcional: Suscripciones (preapproval) solo tarjeta.
- [ ] Plazo de liberación elegido (inmediato 3.49 % / 7 d 3.19 % / 30 d 2.95 %).

**Apple**
- [ ] Cuestionario de edad nuevo completado; rating **18+** (o el que arroje el cuestionario, nunca menor al EULA).
- [ ] Guideline 1.2: filtro de contenido, denuncia, bloqueo, contacto publicado; 5.1.1(v) borrar cuenta in-app; diferenciación para 4.3(b).
- [ ] StoreKit 2; App Store Server Notifications v2 (sandbox y producción) hacia backend o RevenueCat; manejo de `REFUND`/`CONSUMPTION_REQUEST`.
- [ ] Inscripción Small Business Program; información fiscal México en App Store Connect (RFC, CURP, Cédula); contratos Paid Apps firmados.
- [ ] Precio manual en storefront MX (MX$189–199) para evitar desajustes de equalización.

**Google Play**
- [ ] Play Billing Library vigente; RTDN con Pub/Sub; verificación server-side `purchases.subscriptionsv2`; Voided Purchases API.
- [ ] Declaraciones: Restrict Minor Access, Child Safety Standards (CSAE: política, denuncia, contacto, cumplimiento legal), Data Safety, cuestionario IARC.
- [ ] Inscripción tier 15 %; perfil de pagos e impuestos México; precio MX$189 (IVA incluido).

**RevenueCat (opcional)**
- [ ] Proyecto con apps iOS/Android + Stripe (Web Billing o Stripe nativo), entitlement `premium`, webhooks a backend, Customer Center.

**Operación**
- [ ] Monitoreo de ratio de contracargos (<0.75 %), política de reembolso 1-click en web para evitar disputas, logs de webhooks, pruebas con cuentas sandbox de MP y StoreKit/Play test tracks antes del lanzamiento.
