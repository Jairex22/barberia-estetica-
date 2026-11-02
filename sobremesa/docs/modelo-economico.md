# Modelo económico de Sobremesa — guía de lectura

**Archivo:** `docs/modelo-economico.xlsx` (Excel editable, fórmulas vivas, etiquetas en español).
**Fecha:** 2026-11-02 · **Moneda:** MXN (precios de proveedores en USD convertidos con el FIX) · **Precio Premium:** USD 10/mes ≈ MX$187.96 (IVA incluido).

> Los números de este documento se calcularon en Python replicando exactamente las fórmulas del libro, con los **mismos supuestos del escenario Base** que vienen cargados en la hoja *Supuestos*. Si cambias una celda azul en Excel, los resultados del libro cambian; los de este documento no.

---

## 1. Qué hay en cada hoja

| Hoja | Para qué sirve |
|---|---|
| **Supuestos** | Única hoja donde se editan datos (celdas azules sobre fondo crema; las amarillas son las palancas clave). Cada fila tiene unidad y fuente. Las filas sin fuente verificada dicen **HIPÓTESIS** en rojo. Arriba hay una nota "Cómo usar". |
| **Neto por suscriptor** | Cadena por canal: importe cobrado con IVA → menos IVA → menos comisión del canal (sin IVA, porque el IVA de la comisión es acreditable) → menos reembolsos y contracargos esperados → **neto efectivo**. Columnas: Stripe, Mercado Pago, App Store, Google Play, web ponderado y ponderado por mezcla. |
| **Escenarios** | Conservador / Base / Optimista lado a lado. La columna Base lee de Supuestos; las otras dos tienen sus propias entradas (conversión 2/4/7 %, churn 12/8/5 %, mezcla web 20/35/50 %, CAC pagado 90/60/45). **Bloque 1:** meta de MX$20,000 de *ingreso neto*. **Bloque 2:** meta de MX$20,000 de *beneficio operativo* (distinta y más difícil), incluida una variante "sostenible" que además paga la reposición de bajas con CAC. |
| **Sensibilidad** | Tablas de fórmulas: (1) suscriptores necesarios vs conversión × churn (meta operativa sostenible) y (1b) usuarios activos; (2) LTV/CAC vs conversión × churn + suscriptores/usuarios para la meta operativa; (3) beneficio operativo vs conversión × costos fijos para una base de usuarios editable; (4) neto por suscriptor vs % de mezcla web. |
| **Costos iniciales vs recurrentes** | Pagos únicos (Apple USD 99, Google USD 25, dominios, legal/diseño/marca/alta fiscal marcados HIPÓTESIS, KYC) frente a los mensuales, y la caja recomendada para 6 y 12 meses. |
| **Proyección 12 meses** | Mes a mes: usuarios activos (crecimiento), suscriptores (conversión con rampa y churn), ingreso bruto/IVA/neto, costos fijos, variables, soporte, adquisición, ISR aproximado, beneficio, acumulado y caja. Todo lee de Supuestos. |
| **Fuentes** | Tabla con URL, fecha, región, método y confianza de cada dato usado, lista de hipótesis a validar y la sección **"Qué NO es esto"**. |

Convenciones de color: **azul** = entrada editable · **negro** = fórmula · **verde** = enlace a otra hoja · **rojo** = HIPÓTESIS sin fuente.

---

## 2. Supuestos clave del escenario Base (editables en la hoja Supuestos)

| Supuesto | Valor | Origen |
|---|---|---|
| Precio Premium | USD 10/mes | Proyecto |
| FIX Banxico | 18.7962 MXN/USD (30-oct-2026) | `research/pagos_tiendas.md` §H, confianza Media |
| IVA | 16 % | LIVA 18-B. Web: lo desglosa y entera el comerciante. Tiendas: el precio incluye IVA; Apple/Google lo cobran y lo entregan al desarrollador con RFC, quien lo entera. |
| Stripe MX | 3.6 % + MX$3 + Billing 0.7 % | Oficial vía buscador (Alta) / Billing (Media-Baja) |
| Mercado Pago | 3.49 % + MX$4 (IVA incluido → /1.16) | Oficial promocional (Media-Alta); IVA incluido es hipótesis |
| App Store / Google Play | 15 % sobre la base sin IVA (SBP / tier 15 %) | Oficial (Alta) |
| Reembolsos / contracargos | Web 2 % y 0.5 % (MX$150 por disputa); tiendas 3 % | HIPÓTESIS salvo la cuota de MX$150 (Alta) |
| Mezcla de canal | 35 % web (solo Stripe), 32.5 % iOS, 32.5 % Android | HIPÓTESIS |
| Conversión a Premium | 4 % de usuarios activos | Referencia MX: ~6.8 % pagó en 6 meses (The CIU 2024, Media) |
| Churn mensual | 8 % | HIPÓTESIS |
| CAC | Orgánico MX$0, referido MX$15, pagado MX$60 por usuario activo nuevo; mezcla 50/20/30 → **MX$21 por usuario, MX$525 por suscriptor** | HIPÓTESIS |
| Costos fijos | USD 183.27/mes ≈ **MX$3,445** (Supabase+Vercel 45, R2 2, Resend 20, dominios 3.33, Apple 8.25, Google 0.69, Expo 19, Sentry 26, mínimo KYC 49, otros 10) | `research/legal_seguridad_costos.md` §5 |
| Costos variables por usuario activo | USD 0.081 ≈ **MX$1.52/mes** (Vision 3 fotos, Haiku 5.5 60 mensajes + 0.1 conversaciones de soporte, 5 % verificación documental a USD 1.50) | Precios Alta; volúmenes HIPÓTESIS |
| Soporte humano | 10 h fijas + 4 h por cada 1,000 usuarios, MX$120/h → MX$1,200 fijos + MX$0.48/usuario | HIPÓTESIS |
| ISR aproximado | RESICO 2.5 % sobre ingresos sin IVA (≈ MX$4.05 por suscripción) | **REQUIERE CONTADOR** |

---

## 3. Neto por suscriptor y mes (MXN)

De cada MX$187.96 cobrados: IVA MX$25.93 → base MX$162.04.

| Canal | Comisión neta | Neto antes de reembolsos | Reembolsos + contracargos | **Neto efectivo** | % del cobro |
|---|---|---|---|---|---|
| Web · Stripe (3.6 % + 3 + 0.7 %) | 11.08 | 150.95 | 4.52 | **146.43** | 77.9 % |
| Web · Mercado Pago (3.49 % + 4, IVA incl.) | 9.10 | 152.93 | 4.57 | **148.36** | 78.9 % |
| iOS · App Store (15 % SBP) | 24.31 | 137.73 | 4.13 | **133.60** | 71.1 % |
| Android · Google Play (15 %) | 24.31 | 137.73 | 4.13 | **133.60** | 71.1 % |
| **Ponderado Base (35/32.5/32.5)** | | 142.36 | | **138.09** | 73.5 % |

Los netos antes de reembolsos coinciden con la tabla del research (150.95 / 152.93 / 137.73). Llevar a un suscriptor a pagar por web en vez de por la tienda vale **MX$12.83 al mes**.

---

## 4. Resultados por escenario

### Bloque 1 — Meta: MX$20,000 de ingreso neto mensual

| | Conservador | **Base** | Optimista |
|---|---|---|---|
| Conversión / churn / mezcla web | 2 % / 12 % / 20 % | 4 % / 8 % / 35 % | 7 % / 5 % / 50 % |
| Neto ponderado por suscriptor | 136.17 | **138.09** | 140.01 |
| **Suscriptores necesarios** | 147 | **145** | 143 |
| **Usuarios activos necesarios** | 7,344 | **3,621** | 2,041 |
| Altas mensuales para compensar bajas | 17.6 | **11.6** | 7.1 |
| Costo variable por suscriptor (= MX$1.52 / conversión) | 76.20 | **38.10** | 21.77 |
| Margen de contribución por suscriptor | 59.97 | **99.99** | 118.24 |
| **Punto de equilibrio (fijos MX$3,445 / margen)** | 57 suscriptores / 2,872 usuarios | **34 suscriptores / 861 usuarios** | 29 suscriptores / 416 usuarios |
| CAC por suscriptor | 2,325 | **525** | 161 |
| Meses para recuperar el CAC | 38.8 | **5.3** | 1.4 |
| LTV (margen / churn) | 500 | **1,250** | 2,365 |
| LTV / CAC | 0.21x | **2.38x** | 14.7x |

Lectura: el número de suscriptores casi no cambia entre escenarios (lo fija el neto por suscriptor); lo que cambia radicalmente es **cuántos usuarios activos hacen falta** y **si el CAC se recupera**. En el Conservador el negocio destruye valor (LTV/CAC 0.2x).

### Bloque 2 — Meta distinta y más difícil: MX$20,000 de beneficio operativo mensual

Beneficio operativo = ingreso neto − fijos − variables − soporte humano − ISR aproximado (no incluye adquisición ni sueldos).

| | Conservador | **Base** | Optimista |
|---|---|---|---|
| Margen operativo por suscriptor | 31.91 | **83.94** | 107.34 |
| Fijos totales (fijos + soporte fijo) | 4,645 | **4,645** | 4,645 |
| Punto de equilibrio operativo | 146 suscriptores | **55 suscriptores** | 43 suscriptores |
| **Suscriptores necesarios** | 772 | **294** | 230 |
| **Usuarios activos necesarios** | 38,611 | **7,340** | 3,280 |
| Altas mensuales para sostenerla | 93 | **23** | 11 |
| Ingreso bruto cobrado en ese punto | 145,147 | **55,186** | 43,157 |
| Veces más difícil que la meta de ingreso neto | 5.3x | **2.0x** | 1.6x |
| Variante **sostenible** (pagando la reposición de bajas con CAC): suscriptores / usuarios | no se sostiene (margen < 0) | **588 / 14,691** | 248 / 3,546 |

---

## 5. Proyección a 12 meses (Base: 400 usuarios en el mes 1, +30 %/mes, rampa de 3 meses)

| Mes | Usuarios activos | Suscriptores | Ingreso bruto | Ingreso neto | Beneficio operativo | Beneficio (con adquisición) | Caja acumulada* |
|---|---|---|---|---|---|---|---|
| 1 | 400 | 5 | 1,002 | 736 | −4,732 | −13,132 | −66,714 |
| 3 | 676 | 27 | 5,082 | 3,734 | −2,375 | −7,289 | −81,611 |
| 6 | 1,485 | 59 | 11,166 | 8,203 | 342 | −10,454 | −109,262 |
| 9 | 3,263 | 131 | 24,532 | 18,023 | 6,311 | −17,408 | −153,330 |
| 10 | 4,242 | 170 | 31,892 | 23,430 | 9,597 | −21,237 | −174,567 |
| 12 | 7,169 | 287 | 53,897 | 39,597 | 19,424 | −32,686 | −233,468 |
| **Total 12 m** | | | 220,222 | 161,790 | 41,726 | −179,886 | |

\* Caja = beneficio acumulado − costos iniciales (MX$53,583, de los cuales ~MX$50,500 son HIPÓTESIS legal/diseño/marca/fiscal).

- La meta de **ingreso neto** se alcanza en el **mes 10**; la de **beneficio operativo** no se alcanza en 12 meses (mes 12: MX$19,424, a MX$576 de la meta).
- El beneficio con adquisición es negativo todo el año porque el modelo paga CAC por **todos** los usuarios nuevos (crecimiento del 30 % + reposición del 15 % de abandono): el crecimiento cuesta ~MX$222k en 12 meses. Con adquisición 100 % orgánica el acumulado sería ~MX$42k positivo antes de costos iniciales.
- Capital a aportar en el escenario Base con adquisición pagada: ~**MX$233k** en 12 meses; iniciales + 6 meses de fijos sin adquisición: **MX$81k**.

---

## 6. Qué NO es esto

- **No es una garantía** ni una predicción. Es una calculadora: cambia las celdas azules y recalcula.
- **Instalaciones ≠ usuarios activos ≠ suscriptores.** En México solo ~6.8 % de los usuarios de apps de citas pagó en 6 meses (The CIU 2024); Tinder y Bumble pierden pagadores (−7 % y −13 % en 2025).
- **Ingreso bruto ≠ ganancia.** De MX$187.96 cobrados quedan MX$133.60–148.36 según el canal antes de pagar hosting, IA, soporte, adquisición e ISR.
- Las dos metas de MX$20,000 son **distintas**: la de beneficio operativo exige el doble de suscriptores en el Base (294 vs 145) y cuatro veces más si además se paga la reposición de bajas (588).
- Los impuestos están **aproximados con RESICO (1–2.5 % sobre ingresos)**; el régimen real, las retenciones de ISR de Apple y el acreditamiento del IVA de comisiones los debe definir un contador.
- Varias fuentes son secundarias (las páginas oficiales de Stripe, Mercado Pago, Google y Banxico no eran accesibles en la sesión de research); la columna *Confianza* de la hoja Fuentes lo indica.

---

## 7. Cómo reproducir los números sin Excel

El escenario Base se puede recomputar con las fórmulas de las hojas; en resumen:

```
P = 10 × 18.7962 = 187.96 ; B = P / 1.16 = 162.04
Neto web (Stripe) = (B − 0.036·P − 3 − 0.007·P) × (1 − 0.02 − 0.005) − 0.005 × 150 = 146.43
Neto tienda       = B × (1 − 0.15) × (1 − 0.03) = 133.60
Neto ponderado    = 0.35 × 146.43 + 0.65 × 133.60 = 138.09
Suscriptores (ingreso neto 20,000) = 20,000 / 138.09 = 145   → usuarios = 145 / 0.04 = 3,621
Margen de contribución = 138.09 − 1.524 / 0.04 = 99.99      → equilibrio = 3,444.78 / 99.99 = 34
Margen operativo = 99.99 − 0.48 / 0.04 − 0.025 × 162.04 = 83.94
Suscriptores (beneficio operativo 20,000) = (20,000 + 3,444.78 + 1,200) / 83.94 = 294 → usuarios = 7,340
```
