# Investigación de nichos para una app de citas en la Zona Metropolitana de Guadalajara (ZMG)

**Fecha:** 2026-11-02 · **Tipo:** síntesis estratégica · **Estado:** decisión provisional (ningún experimento ha sido ejecutado)

**Fuentes.** Solo los cuatro informes locales del repositorio: `research/competidores.md`, `research/demografia_nichos.md`, `research/pagos_tiendas.md` y `research/legal_seguridad_costos.md` (2026-11-02). Cada cifra conserva la confianza (alta/media/baja) del informe de origen; donde no hay dato se escribe **no encontrado**. Cada factor se marca **HECHO** (fuente primaria), **ESTIMACIÓN** (dato secundario o interpolación) o **HIPÓTESIS** (supuesto sin fuente).

---

## 0. Base común de cálculo (ZMG)

La fórmula pedida para "personas potencialmente compatibles" (PPC) es:

> PPC = población base × % del segmento × % con internet × 15.1 % (cuenta activa en apps de citas)

| Factor | Valor usado | Tipo | Fuente (informe) |
|---|---|---|---|
| Población AMG (10 municipios), 2020 | 5,268,642 (51.0 % mujeres) | HECHO (alta) | IIEG, Análisis General del AMG 2020, vía `demografia_nichos.md` §1 |
| Banda 18–45 en el AMG | ~2.15 M (rango 2.0–2.3 M) | ESTIMACIÓN (baja) | interpolación propia del informe: 15–29 = 25.4 % del AMG; 30–64 = 40.9 % de Jalisco |
| Banda 25–40 en el AMG | ~1.19 M (25–29 = 436,934 HECHO media; 30–40 ≈ 35 % del bloque 30–64 HIPÓTESIS) | ESTIMACIÓN (baja) | DataMéxico + UdeG/IIEG vía `demografia_nichos.md` §1 |
| % con internet, Jalisco 2025 | 90 % ("9 de cada 10") | HECHO (alta) | INEGI ENDUTIH 2025 vía `demografia_nichos.md` §3 |
| % con cuenta activa en apps de citas | 15.1 % (nacional) | ESTIMACIÓN (media) | The CIU 2025 vía Expansión, `demografia_nichos.md` §3 |
| Uso de apps de citas por ciudad | **no encontrado** | — | `demografia_nichos.md` §3 |

Pool de referencia: 2,150,000 × 0.90 × 0.151 ≈ **292,000 cuentas activas en 18–45** (coherente con la hipótesis 1 del informe demográfico: 300–350 mil). El 15.1 % es un promedio nacional de todas las edades; aplicarlo por igual a cada segmento es una simplificación.

---

## 1. Mapa de nichos (14, representativo, no exhaustivo)

### 1.1 Relaciones serias (intención explícita)
- **Problema:** 39 % de usuarios en México teme "perder el tiempo con la persona equivocada"; el swipe generalista no filtra intención (Hinge MX vía Expansión, autoreportado, media).
- **Densidad:** 2,150,000 (EST) × 58.2 % buscan relación seria (dato de 180,398 usuarios de Hinge MX oct-2025–ago-2026, HECHO media, aplicado al pool general como **HIPÓTESIS**) × 0.90 (HECHO) × 0.151 (EST) = 1,251,300 × 0.90 = 1,126,170 × 0.151 ≈ **170,000 PPC**.
- **Solapamientos:** profesionales, 40+, divorciados, planes compartidos, seguridad-primero.
- **Competidores:** Hinge (México desde 24-sep-2025, "2.ª app más descargada" dic-2025, ingresos +22–27 %, alta); filtros de intención en Tinder y Bumble.
- **Riesgo de estereotipo:** asumir que "serio" = matrimonio (CDMX: fecundidad 0.8 y edad mediana 37, alta).

### 1.2 Profesionales con poco tiempo
- **Problema:** México trabaja 2,193–2,308 h/año vs 1,736 del promedio OCDE (alta, nacional); el swipe exige horas de pantalla sin resultado.
- **Densidad:** 2,150,000 (EST) × 30 % profesionales de tiempo completo con jornadas largas (**HIPÓTESIS**, sin dato ZMG) × 0.90 × 0.151 = 645,000 × 0.90 = 580,500 × 0.151 ≈ **88,000 PPC**.
- **Solapamientos:** relaciones serias, planes compartidos, recién llegados (ecosistema IBM/Intel/Oracle/ITESO/UdeG/Tec citado en `demografia_nichos.md` §8).
- **Competidores:** Inner Circle (comunidad "selecta" con eventos, pero solo CDMX, media); Hinge.
- **Riesgo de estereotipo:** "profesional" como sinónimo de alto ingreso o clase; excluye oficios con jornadas igual de largas.

### 1.3 Mayores de 40
- **Problema:** ninguna app grande en México se posiciona para 40+; los precios dinámicos por edad son queja recurrente (baja, cualitativa).
- **Densidad:** 5,268,642 × 40.9 % (30–64, Jalisco, HECHO alta) = 2,155,000; × 65 % que tiene 40–64 (**HIPÓTESIS**) = 1,400,000; × 25 % sin pareja (nacional 12 % separada+divorciada+viuda de 15+, HECHO, más solteros, **HIPÓTESIS**) = 350,000; × 85 % internet (ajuste a la baja por edad, **HIPÓTESIS**) = 297,500; × 0.151 (EST, probablemente sobreestimado en 40+) ≈ **45,000 PPC**.
- **Solapamientos:** divorciados, madres/padres solos, afinidad religiosa.
- **Competidores:** Facebook Parejas (gratis, dentro de Facebook, alta en lanzamiento; 8 de cada 10 sextorsiones ocurren ahí según Consejo Ciudadano, media).
- **Riesgo de estereotipo:** tratar al 40+ como "poco digital" o como "segunda oportunidad".

### 1.4 Divorciados / separados
- **Problema:** 33 divorcios por cada 100 matrimonios en 2024; edad promedio al divorcio 41.1 (mujeres) y 43.6 (hombres) (INEGI, alta). Vuelven a un mercado que cambió por completo.
- **Densidad:** población 12+ del AMG ≈ 5,268,642 × 80 % (**HIPÓTESIS**) = 4,215,000; × 6.8 % (separada 4.8 % Jalisco 2020, HECHO media + divorciada 2 % nacional, HECHO alta) = 286,600; × 0.90 = 258,000; × 0.151 ≈ **39,000 PPC**. Proxy estatal del informe: ~330 mil personas separadas en Jalisco.
- **Solapamientos:** 40+, madres/padres solos, relaciones serias.
- **Competidores:** ninguno enfocado (**no encontrado**); Hinge y Tinder los absorben.
- **Riesgo de estereotipo:** la etiqueta "divorciado" estigmatiza; mejor como preferencia privada.

### 1.5 Madres y padres solos
- **Problema:** tiempo y seguridad; cada cita implica logística de cuidado infantil.
- **Densidad:** hogares del AMG ≈ 5,268,642 / 3.3 ocupantes por vivienda (HECHO media, 2025) ≈ 1,600,000; × 12 % monoparentales (9.5 % madres solas HECHO media + ~2.5 % padres solos derivado de 993,935 hogares nacionales, **HIPÓTESIS**) = 192,000; × 0.90 = 172,800; × 0.151 ≈ **26,000 PPC**. Jalisco: **no encontrado**.
- **Solapamientos:** divorciados, 40+, seguridad-primero.
- **Competidores:** **no encontrado** en México.
- **Riesgo de estereotipo:** asumir baja capacidad de pago (hipótesis 3 del informe, no hecho) o reducir a la persona a su rol parental.

### 1.6 LGBTQ+
- **Problema:** patrón de "goteros", robo y secuestro vía Grindr en CDMX, Edomex y Jalisco; homicidio en Guadalajara (oct-2026) de un hombre contactado por app (alta en hechos; baja en cifras agregadas). Grindr sube precios (99–929 MXN) y no tiene verificación de identidad conocida.
- **Densidad:** AMG 15+ LGBTI+ ≈ 185,000–190,000 (ESTIMACIÓN baja del informe: Jalisco 298,270, 4.º del país, HECHO media; 63 % vive en el AMG); 187,500 × 0.90 = 168,750 × 0.151 ≈ **25,000 PPC** (el 15.1 % es conservador: el uso de apps en esta población es mayor, Grindr sola = 13.6 % de usuarios de apps en México, media).
- **Solapamientos:** transversal; sobre todo seguridad-primero y planes compartidos.
- **Competidores:** Grindr (top-5 país, media), Tinder, Hinge (21 orientaciones), Feeld (sin datos MX).
- **Riesgo de estereotipo:** tratar al colectivo como un único nicho; el contexto conservador (Jalisco 89.2 % católico, alta) exige privacidad por defecto; la orientación sexual es **dato sensible** bajo la LFPDPPP 2025 (consentimiento expreso, multas duplicadas).

### 1.7 Introvertidos
- **Problema:** el formato de "chat abierto + swipe" favorece a quien escribe mucho y rápido; estructura (prompts, planes) reduce la carga social.
- **Densidad:** **no encontrado** (no existe medición poblacional, `demografia_nichos.md` §6). Si se asume 33 % (**HIPÓTESIS** sin fuente): 2,150,000 × 0.33 × 0.90 × 0.151 ≈ **96,000 PPC**, cifra meramente ilustrativa.
- **Solapamientos:** gamers, planes compartidos, relaciones serias.
- **Competidores:** Boo (match por personalidad, sin datos MX, baja); Hinge (prompts).
- **Riesgo de estereotipo:** "introvertido" ≠ tímido ni socialmente ansioso; etiquetarlo como nicho público puede ahuyentar.

### 1.8 Afinidad cultural / religiosa (católica practicante y, en el otro extremo, laicos)
- **Problema:** ninguna app en México filtra con seriedad por fe o valores (Hinge ofrece filtro de religión, media).
- **Densidad:** 2,150,000 × 89.2 % católicos en Jalisco (HECHO alta) = 1,917,800; × 20 % que considera la fe criterio de pareja (**HIPÓTESIS**) = 383,560; × 0.90 = 345,204; × 0.151 ≈ **52,000 PPC**. Laicos: 2,150,000 × 4.6 % sin religión (HECHO alta) × 0.90 × 0.151 ≈ **13,400 PPC**.
- **Solapamientos:** relaciones serias, 40+, divorciados (con fricción doctrinal).
- **Competidores:** **no encontrado** con tracción en México.
- **Riesgo de estereotipo:** el más alto de la lista; además el informe señala (hipótesis 5) que es un nicho "grande pero conservador" sin dato de intención de uso de apps.

### 1.9 Actividades al aire libre / deporte
- **Problema:** la gente quiere conocer a alguien "haciendo algo", no en un chat; el ejercicio es lugar público y seguro por diseño.
- **Densidad:** 2,150,000 × 44.5 % activos físicamente en 18+ urbano (MOPRADEF 2025, 32 ciudades incl. ZMG sin desglose, HECHO alta) = 956,750; × 0.90 = 861,075; × 0.151 ≈ **130,000 PPC**.
- **Solapamientos:** planes compartidos (casi idéntico en mecánica), profesionales, recién llegados.
- **Competidores:** ninguno dedicado en México (**no encontrado**); Tinder "Double Date" como función.
- **Riesgo de estereotipo:** cuerpo y rendimiento como filtro; brecha de género (hombres 46.7 % vs mujeres 37.4 % activos, alta).

### 1.10 Gamers
- **Problema:** comunidad enorme con cultura propia, pero las apps no la reconocen.
- **Densidad:** 2,150,000 × 61.4 % (The CIU 2025, 6+ nacional, HECHO media) = 1,320,100; × 0.90 = 1,188,090; × 0.151 ≈ **179,000 PPC**. El informe advierte (hipótesis 4): esa amplitud lo hace poco diferenciador; "gamers que buscan pareja gamer" **no encontrado**.
- **Solapamientos:** introvertidos, jóvenes 18–29.
- **Competidores:** **no encontrado** en México; comunidades en Discord/Twitch cumplen la función social.
- **Riesgo de estereotipo:** hombre joven; en realidad ~49.5 % son mujeres (Cheil, media).

### 1.11 Personas que se mudaron de ciudad
- **Problema:** llegan sin red social; buscan amistad y pareja a la vez.
- **Densidad:** 2,150,000 × 12.3 % nacidos en otra entidad o país (ENADID 2018, stock, HECHO media) = 264,450; × 0.90 = 238,005; × 0.151 ≈ **36,000 PPC**; si solo cuentan llegadas recientes (≤2 años, ~25 % del stock, **HIPÓTESIS**) ≈ **9,000 PPC**. Migración reciente por municipio del AMG: **no encontrado**. Jalisco es además la entidad que más mujeres expulsa (8.4 %, alta), señal de saldo poco favorable.
- **Solapamientos:** profesionales (relocalizados por empleo tech), planes compartidos, nómadas.
- **Competidores:** Bumble BFF (México desde sep-2023, media); Inner Circle (CDMX).
- **Riesgo de estereotipo:** "foráneo" como etiqueta de exclusión local.

### 1.12 Encuentros basados en planes compartidos (el plan como unidad de match)
- **Problema:** fatiga de swipe y chats que no terminan en cita (quejas transversales, baja); 9 de cada 10 usuarios de Bumble MX ya lleva la primera cita a lugar público (media): el producto puede partir de ahí.
- **Densidad:** sin dato poblacional (`demografia_nichos.md` §6: "proxy MOPRADEF y gaming"). Supuesto: 40 % de 18–45 preferiría conocer gente alrededor de una actividad (**HIPÓTESIS**): 2,150,000 × 0.40 × 0.90 × 0.151 ≈ **117,000 PPC**.
- **Solapamientos:** aire libre, profesionales, recién llegados, introvertidos, relaciones serias.
- **Competidores:** Inner Circle (eventos semanales, solo CDMX, media); Tinder Double Date; SUGO compite por tiempo con salas de voz pero con reputación de "pagar para hablar" (baja).
- **Riesgo de estereotipo:** sesgo hacia quien puede pagar la actividad; planes deben incluir opciones gratuitas.

### 1.13 Seguridad-primero para mujeres (transversal, añadido por evidencia)
- **Problema:** 70.1 % de mujeres ha vivido violencia (Jalisco 71.9 %, 7.º lugar, ENDIREH, alta); 22.2 % de internautas mujeres sufrió ciberacoso (MOCIBA 2024, alta); 41–43 % de usuarios ha sido blanco de estafa (Norton, media-baja); alertas del Consulado de EE. UU. en Guadalajara (jun-2025 y jul-2026) por secuestros vía apps de citas (alta). Ninguna app verifica INE ni exige verificación a todos en México (**no encontrado**).
- **Densidad:** mujeres 18–45 = 2,150,000 × 51.0 % (HECHO alta) = 1,096,500; segmento 100 % (la seguridad es requisito, no preferencia); × 0.90 = 986,850; × 0.151 ≈ **149,000 PPC**.
- **Solapamientos:** todos.
- **Competidores:** Bumble (marca asociada a seguridad, Deception Detector, pero abandonó "women first" en ago-2026, alta); Tinder (ID Check en MX desde 2024 opcional; Face Check **no confirmado** en MX).
- **Riesgo de estereotipo:** presentar a la mujer como víctima o al hombre como sospechoso por defecto; la seguridad debe ser simétrica (los hombres LGBTQ+ son víctimas frecuentes).

### 1.14 Nómadas digitales y extranjeros
- **Problema:** demanda de confianza en un entorno desconocido.
- **Densidad ZMG:** **no encontrado** (solo CDMX y Puerto Vallarta tienen evidencia; >90,000 nómadas en México según Restart, baja). Jalisco: 91,987 nacidos en otro país (Censo 2020, media) → 91,987 × 63 % AMG (HIPÓTESIS) × 0.90 × 0.151 ≈ **7,900 PPC**.
- **Solapamientos:** recién llegados, profesionales.
- **Competidores:** Tinder (Passport), Bumble.
- **Riesgo:** la alerta consular apunta precisamente a extranjeros como blanco de secuestro; alto riesgo operativo y reputacional.

**Hipótesis de trabajo (combinación):** 25–40 años con intención seria, planes concretos y seguridad-primero: 1,190,000 (EST) × 58.2 % (HIPÓTESIS) × 0.90 × 0.151 = 692,580 × 0.90 = 623,322 × 0.151 ≈ **94,000 PPC**. Capturar 3–5 % de ese pool (hipótesis 1 del informe) = **2,800–4,700 usuarios** en la primera fase.

---

## 2. Matriz de puntuación

Pesos: problema desatendido (A) 20 %, densidad y compatibilidad local (B) 20 %, disposición a pagar (C) 15 %, adquisición accesible (D) 15 %, diferenciación (E) 15 %, seguridad y esfuerzo operativo (F) 10 % (5 = poco esfuerzo / bajo riesgo), retención saludable (G) 5 %. Escala 1–5.

| Nicho | A | B | C | D | E | F | G | Total ponderado |
|---|---|---|---|---|---|---|---|---|
| Relaciones serias | 3 | 5 | 4 | 3 | 2 | 4 | 4 | 0.60+1.00+0.60+0.45+0.30+0.40+0.20 = **3.55** |
| Profesionales | 3 | 3 | 5 | 3 | 3 | 4 | 3 | 0.60+0.60+0.75+0.45+0.45+0.40+0.15 = **3.40** |
| Mayores de 40 | 4 | 2 | 4 | 2 | 4 | 3 | 4 | 0.80+0.40+0.60+0.30+0.60+0.30+0.20 = **3.20** |
| Divorciados | 4 | 2 | 3 | 2 | 4 | 3 | 4 | 0.80+0.40+0.45+0.30+0.60+0.30+0.20 = **3.05** |
| Madres/padres solos | 4 | 2 | 2 | 3 | 4 | 2 | 4 | 0.80+0.40+0.30+0.45+0.60+0.20+0.20 = **2.95** |
| LGBTQ+ | 3 | 2 | 3 | 3 | 3 | 1 | 3 | 0.60+0.40+0.45+0.45+0.45+0.10+0.15 = **2.60** |
| Introvertidos | 3 | 3 | 3 | 2 | 3 | 4 | 3 | 0.60+0.60+0.45+0.30+0.45+0.40+0.15 = **2.95** |
| Afinidad religiosa | 4 | 3 | 2 | 3 | 4 | 4 | 4 | 0.80+0.60+0.30+0.45+0.60+0.40+0.20 = **3.35** |
| Aire libre / deporte | 3 | 4 | 3 | 4 | 3 | 4 | 4 | 0.60+0.80+0.45+0.60+0.45+0.40+0.20 = **3.50** |
| Gamers | 2 | 5 | 2 | 4 | 2 | 3 | 2 | 0.40+1.00+0.30+0.60+0.30+0.30+0.10 = **3.00** |
| Recién llegados | 4 | 1 | 3 | 2 | 4 | 4 | 3 | 0.80+0.20+0.45+0.30+0.60+0.40+0.15 = **2.90** |
| **Planes compartidos** | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 0.80+0.80+0.60+0.60+0.60+0.40+0.20 = **4.00** |
| Seguridad-primero mujeres | 5 | 4 | 3 | 4 | 4 | 2 | 4 | 1.00+0.80+0.45+0.60+0.60+0.20+0.20 = **3.85** |
| Nómadas / extranjeros | 3 | 1 | 4 | 2 | 3 | 1 | 2 | 0.60+0.20+0.60+0.30+0.45+0.10+0.10 = **2.35** |
| **Hipótesis de trabajo (combinación)** | 4 | 4 | 4 | 4 | 4 | 3 | 4 | 0.80+0.80+0.60+0.60+0.60+0.30+0.20 = **3.90** |

### Justificación (una línea por puntuación)

- **Relaciones serias:** A3 Hinge ya lo atiende desde sep-2025 · B5 ~170k, el pool más grande con dato de intención · C4 el 58 % que busca relación paga por eficiencia · D3 compite en CAC con Hinge/Tinder · E2 "Designed to be deleted" ya ocupa el mensaje · F4 sin riesgo adicional · G4 churn por éxito es sano.
- **Profesionales:** A3 problema real pero genérico · B3 88k por hipótesis · C5 mayor ingreso (ecosistema tech GDL) · D3 canales de oficina/LinkedIn caros · E3 Inner Circle solo en CDMX · F4 bajo riesgo · G3 abandono por falta de tiempo.
- **Mayores de 40:** A4 nadie se posiciona en MX · B2 45k con confianza baja · C4 ingreso consolidado · D2 canales digitales menos eficientes · E4 claro · F3 blanco preferente de estafa romántica · G4 intención estable.
- **Divorciados:** A4 igual que 40+ · B2 39k · C3 gastos de pensión/separación · D2 sin canal evidente · E4 claro · F3 idem 40+ · G4 estable.
- **Madres/padres solos:** A4 nadie lo atiende · B2 26k · C2 capacidad de pago baja (hipótesis 3 del informe) · D3 escuelas y grupos existen · E4 claro · F2 seguridad crítica con hijos · G4 alta intención.
- **LGBTQ+:** A3 Grindr/Hinge lo cubren, pero no la seguridad · B2 25k conservador · C3 Grindr prueba pago (99–929 MXN) · D3 comunidad organizada · E3 solo por seguridad · F1 homicidio GDL 2026, "goteros", dato sensible legal · G3 Grindr es geosocial inmediato.
- **Introvertidos:** A3 problema real sin medición · B3 ilustrativo · C3 sin dato · D2 no hay canal para "introvertidos" · E3 Boo existe · F4 bajo riesgo · G3 sin dato.
- **Afinidad religiosa:** A4 vacío total · B3 52k · C2 intención de uso desconocida y conservadora · D3 parroquias pueden rechazar apps · E4 clara · F4 bajo riesgo · G4 alta intención.
- **Aire libre:** A3 Tinder Double Date roza el tema · B4 130k con dato oficial · C3 pagan por actividad, no por app · D4 clubes y grupos deportivos como canal · E3 fácil de copiar · F4 lugar público por diseño · G4 hábito recurrente.
- **Gamers:** A2 Discord ya resuelve lo social · B5 179k · C2 gastan en juegos, no en citas (hipótesis) · D4 comunidades accesibles · E2 poco diferenciador (hipótesis 4 del informe) · F3 acoso y mezcla con menores · G2 retención por pantalla, no por citas.
- **Recién llegados:** A4 vacío (BFF es amistad) · B1 9–36k · C3 sin dato · D2 sin canal local · E4 clara · F4 bajo riesgo · G3 transitorio.
- **Planes compartidos:** A4 Inner Circle solo CDMX · B4 117k (hipótesis) · C4 pagar por un plan es valor tangible · D4 venues y eventos como canal · E4 unidad de match distinta al perfil · F4 lugar público por diseño · G4 cada plan es un motivo de volver.
- **Seguridad-primero mujeres:** A5 alerta consular, 41–43 % estafados, Bumble dejó el espacio · B4 149k · C3 quien paga suele ser el hombre, la mujer exige gratis · D4 mensaje claro para prensa y boca a boca · E4 vacío post-Bumble · F2 KYC USD 1,350–1,900/mes por 1,000 registros y responsabilidad legal · G4 confianza retiene.
- **Nómadas:** A3 · B1 no encontrado en ZMG · C4 ingreso en USD · D2 · E3 · F1 blanco explícito de la alerta consular · G2 rotación alta.
- **Hipótesis de trabajo:** A4 combina tres vacíos · B4 94k · C4 Premium con ventajas reales · D4 planes + seguridad como gancho de prensa · E4 nadie combina las tres · F3 hereda el costo de verificación · G4 planes recurrentes + confianza.

**Ranking base:** 1) Planes compartidos 4.00 · 2) Hipótesis de trabajo 3.90 · 3) Seguridad-primero mujeres 3.85 · 4) Relaciones serias 3.55 · 5) Aire libre 3.50 · 6) Profesionales 3.40 · 7) Afinidad religiosa 3.35 · 8) 40+ 3.20 · 9) Divorciados 3.05 · 10) Gamers 3.00 · 11) Madres/padres e Introvertidos 2.95 · 13) Recién llegados 2.90 · 14) LGBTQ+ 2.60 · 15) Nómadas 2.35.

---

## 3. Prueba de sensibilidad

Tres ponderaciones alternativas (todas suman 100 %):

| Criterio | Base | S1 "Densidad 30 %" | S2 "Pago 25 %" | S3 "Seguridad 20 %" |
|---|---|---|---|---|
| A Problema desatendido | 20 | 15 | 15 | 20 |
| B Densidad local | 20 | 30 | 20 | 15 |
| C Disposición a pagar | 15 | 10 | 25 | 15 |
| D Adquisición | 15 | 15 | 15 | 15 |
| E Diferenciación | 15 | 15 | 10 | 10 |
| F Seguridad / esfuerzo | 10 | 10 | 10 | 20 |
| G Retención | 5 | 5 | 5 | 5 |

Totales recalculados (mismas puntuaciones de la matriz):

| Nicho | Base | S1 | S2 | S3 |
|---|---|---|---|---|
| Planes compartidos | **4.00** | **4.00** | **4.00** | **4.00** |
| Hipótesis de trabajo | 3.90 | 3.90 | 3.90 | 3.80 |
| Seguridad-primero mujeres | 3.85 | 3.85 | 3.70 | 3.65 |
| Relaciones serias | 3.55 | 3.70 | 3.70 | 3.60 |
| Aire libre | 3.50 | 3.60 | 3.50 | 3.55 |
| Profesionales | 3.40 | 3.30 | 3.60 | 3.50 |
| Afinidad religiosa | 3.35 | 3.35 | 3.15 | 3.40 |
| Mayores de 40 | 3.20 | 3.00 | 3.20 | 3.20 |
| Divorciados | 3.05 | 2.90 | 2.95 | 3.05 |
| Gamers | 3.00 | 3.30 | 3.00 | 2.95 |
| Introvertidos | 2.95 | 2.95 | 2.95 | 3.05 |
| Madres/padres solos | 2.95 | 2.85 | 2.75 | 2.85 |
| Recién llegados | 2.90 | 2.65 | 2.80 | 3.05 |
| LGBTQ+ | 2.60 | 2.50 | 2.60 | 2.45 |
| Nómadas | 2.35 | 2.10 | 2.45 | 2.25 |

Ejemplo de aritmética (S3, hipótesis de trabajo): 4×0.20 + 4×0.15 + 4×0.15 + 4×0.15 + 4×0.10 + 3×0.20 + 4×0.05 = 0.80+0.60+0.60+0.60+0.40+0.60+0.20 = 3.80.

**Veredicto:** el ganador **no cambia**: "planes compartidos" es primero (4.00) y la hipótesis de trabajo segunda (3.80–3.90) en las cuatro ponderaciones. La distancia entre ambos (0.10–0.20) proviene solo del criterio F (costo de verificación) y es menor que la incertidumbre de los datos. Se mueve el bloque intermedio: con peso en pago, "profesionales" sube al 5.º lugar; con peso en densidad, "gamers" y "relaciones serias" suben sin alcanzar el podio. Advertencia: "planes compartidos" puntúa 4 en todo en parte porque es el nicho **menos medido** (su densidad es hipótesis); su ventaja es robusta a los pesos, no a un dato local que la contradiga.

---

## 4. Decisión provisional

### Nicho: hipótesis de trabajo confirmada, con matiz
La dirección actual, **"intención seria + planes concretos, seguridad-primero, 25–40 años"**, se adopta como hipótesis de trabajo. La matriz no la contradice: sus componentes ocupan los lugares 1 (planes), 3 (seguridad) y 4 (intención seria) y la combinación es 2.ª en todas las ponderaciones. El **trade-off** visible: "seguridad-primero" añade diferenciación y problema desatendido, pero asume el mayor costo variable del MVP (verificación documental USD 1,350–1,900/mes por 1,000 registros; USD 300–600 con estimación facial + documento selectivo, `legal_seguridad_costos.md` §2) y más responsabilidad legal (biometría y orientación sexual como datos sensibles). Acotar a 25–40 reduce el pool de ~170k a ~94k PPC. Si la lista de espera midiera menos del 50 % de lo estimado, la recomendación sería **abrir a 25–45 y mantener planes como núcleo**, con verificación escalonada (selfie para todos, documento solo en zonas grises), no eliminarla.

### Ciudad inicial: Guadalajara (ZMG), alternativa Monterrey

| Dimensión | ZMG | ZMVM (CDMX) | Monterrey | Fuente / confianza (`demografia_nichos.md` §8) |
|---|---|---|---|---|
| Población 2020 | 5.27 M | 21.8 M | 5.34 M | INEGI / alta |
| Perfil de edad | 25.4 % tiene 15–29 | edad mediana 37 (la más alta del país) | no encontrado | media |
| Soltería | no encontrado (Jalisco separada 4.8 %) | 38.1 % soltera 12+; Cuauhtémoc/BJ/MH >40 % | no encontrado | media |
| Internet 2025 | ~90 % | n/d | 93.9 % (1.º nacional) | INEGI / alta |
| Ingreso trimestral por hogar 2024 | MXN 87,199 | no encontrado | MXN 117,034 | INEGI / alta |
| LGBTI+ 15+ (estatal) | 298,270 | 310,788 | 286,490 | ENDISEG / media |
| Competencia presencial | ninguna hallada | Inner Circle con eventos semanales | ninguna hallada | media |
| Incidentes documentados | alerta consular PV 2025/2026; caso Grindr GDL 2026 | 58 % de reportes de extorsión; banda Tinder con policías (2025) | sin casos destacados hallados | media |

**Lectura:** Guadalajara tiene masa crítica equivalente a Monterrey, población más joven que CDMX, ecosistema tech consolidado y ningún competidor presencial; sus desventajas son menor ingreso por hogar que Nuevo León y mayor religiosidad (relevante para nichos LGBTQ+). **Alternativa preferente: Monterrey** (~34 % más ingreso por hogar, conectividad líder, sin incidentes destacados), sobre todo si la prueba de precio en ZMG falla. **CDMX** solo si la densidad pesara más que todo: mayor masa de solteros, pero mayor competencia (Hinge, Inner Circle) y más incidentes. Uso de apps por ciudad: **no encontrado**.

### Propuesta de valor (no depende de "ella escribe primero")
1. **El plan concreto como unidad de match.** No se hace match con un perfil sino con un plan (café, caminata, exposición) con lugar público, fecha y cupo; el chat se abre con un propósito. Responde al 39 % que teme perder el tiempo y a la fatiga de swipe.
2. **Recomendaciones explicables.** Cada sugerencia dice por qué aparece (plan en común, zona, horario, intención). Responde a la queja de "shadowban" (señal cualitativa, baja) y a la exigencia de Apple 4.3(b) de una experiencia "significativamente diferente" en categoría saturada.
3. **Honestidad.** Sin perfiles falsos, sin likes inventados, sin "quién te dio like" tras un muro sin contexto; precio publicado en MXN (Profeco señala que ninguna app tiene contrato de adhesión registrado, media).
4. **Seguridad práctica, simétrica.** Verificación por selfie (liveness + face match) antes de chatear; distancia aproximada (nunca <1 km); consejos locales de primera cita (lugar público, no aceptar bebidas abiertas, compartir la cita con un contacto); botón a **911**; reporte post-unmatch. Controles tomados de `legal_seguridad_costos.md` §6.
5. **Premium por ventajas reales a precio local.** MX$189/mes sugerido (≈USD 10 al FIX 18.7962; neto web ≈MX$151 con Stripe, ≈MX$138 en tiendas al 15 %, `pagos_tiendas.md`), con prepagos de 1/3/6 meses vía OXXO/SPEI por Mercado Pago porque ~70 % de adultos no tiene tarjeta de crédito (ENIF 2024, media-alta). Ventajas: más planes publicados, filtros de intención, ver compatibilidad explicada; nunca "pagar para ver likes". Renovación con aviso de 5 días y cancelación inmediata (reforma LFPC dic-2025, alta).

### El hecho Bumble y lo que implica
Bumble eliminó "la mujer escribe primero" el **11-ago-2026** (comunicado IR, TechCrunch; alta): en su encuesta a 2,267 mujeres en EE. UU. el **66 %** prefería que el hombre escribiera primero y las pruebas sin regla mostraron más engagement; además la empresa se vende a Ithaca Holdings por USD 1.3 MM con pagadores en caída (−16.4 %, alta). Dos lecturas:
- **Diferenciación:** queda vacío el posicionamiento "la mujer decide" en la 2.ª marca de México (68–75 % de uso, media); hay espacio para devolver el control femenino **con herramientas** (verificación, planes públicos, quién me ve, filtros), no con una regla rígida.
- **Riesgo de demanda validada:** el jugador con más datos concluyó que la regla era "una carga para un subconjunto" de clientas; copiarla ignoraría esa evidencia. Por eso la propuesta no depende de quién escribe primero: la seguridad viene del diseño (verificación, plan en lugar público, distancia aproximada), no del turno de mensaje.

---

## 5. Tres hipótesis críticas y experimentos baratos

Ninguno de estos experimentos se ha ejecutado; los umbrales son compromisos previos.

| Hipótesis | Experimento | Métrica | Éxito / fracaso | Costo estimado | Tiempo |
|---|---|---|---|---|---|
| **H1. Densidad:** en la ZMG hay suficientes personas de 25–40 con intención seria que prefieren el plan como forma de conocer gente. | **Lista de espera por zona** (landing + formulario: edad, zona/municipio, intención, "¿prefieres conocer gente con un plan concreto o por perfil?") + **15 entrevistas con guion** (5 mujeres 25–32, 5 mujeres 33–40, 5 hombres 25–40). | Registros por zona; % que declara intención seria; % que prefiere "plan"; en entrevistas, número que describe espontáneamente la fatiga de swipe. | Éxito: ≥500 registros en 3 semanas con ≥60 % prefiriendo "plan" y ≥10/15 entrevistados confirmando el problema. Fracaso: <150 registros o <40 % "plan". | Dominio .mx USD 25–57; hosting Vercel Pro USD 20/mes (Hobby no permite uso comercial); formulario sin costo; incentivo entrevistas MXN 300 × 15 = 4,500; pauta social MXN 3,000–5,000 (HIPÓTESIS). Total ≈ MXN 9,000–12,000. | 3–4 semanas |
| **H2. Seguridad como motivo de registro:** las mujeres (y hombres) de la ZMG valoran la verificación lo suficiente para completarla antes de chatear. | En la lista de espera, paso opcional de **pre-verificación por selfie** usando el trial de un proveedor (Sumsub 14 días / 50 checks gratis, media); en las 15 entrevistas, tarjeta de controles (selfie, distancia aproximada, compartir cita, 911) a ordenar por importancia. | % que inicia y completa la selfie; ranking de controles; % que dice que **no** usaría la app sin verificación. | Éxito: ≥70 % completa la selfie y "verificación" queda en el top-2 de controles. Fracaso: <40 % completa o verificación fuera del top-3. | Trial gratuito; después USD 0.80–1.89 por verificación documental o USD 0.10–0.30 por estimación facial (precio de competidor, no verificado). Total adicional ≈ MXN 0–2,000. | 3 semanas (en paralelo a H1) |
| **H3. Disposición a pagar:** usuarios de la ZMG aceptan un Premium de precio local por ventajas reales (sin "pagar para ver likes"). | **Prueba de precio con dos variantes** mostradas **con consentimiento** explícito ("esto es un prototipo; no se cobrará nada"): variante A MX$149/mes, variante B MX$199/mes, mismas ventajas; botón "me interesa este plan" como fake door con aviso. Opcional: **evento piloto** (un plan real en cafetería pública, 12–20 personas verificadas) que incluye una pregunta de precio al cierre. | % de clic en "me interesa" por variante; en el evento, asistencia sobre confirmados, 0 incidentes y % que pagaría ≥MX$149. | Éxito: ≥8 % de intención en al menos una variante (el referente nacional de pago real es 6.8 % en 6 meses, CIU 2024) y asistencia ≥60 % en el piloto. Fracaso: <3 % en ambas variantes o asistencia <40 %. | Prueba de precio: sin costo adicional sobre H1. Evento piloto: consumo/reserva MXN 3,000–6,000 (HIPÓTESIS) + 2 facilitadores voluntarios. | 2 semanas (precio) + 1 evento al cierre de la semana 4 |

Lectura conjunta: si H1 y H3 pasan y H2 falla, se mantiene el núcleo "planes" y la verificación pasa a opcional con insignia. Si H1 falla en la ZMG, se repite la lista de espera en Monterrey antes de construir nada.

---

## 6. Incertidumbres y datos faltantes

| Dato faltante | Impacto | Cómo reducirlo |
|---|---|---|
| Uso de apps de citas por ciudad (ZMG vs CDMX vs MTY) | El 15.1 % nacional puede sobre o subestimar la ZMG | Comprar/leer el desglose de The CIU 2026; medir con la lista de espera por zona |
| Banda 18–45 y 25–40 del AMG (solo interpolación) | Toda la columna PPC | Abrir tabulados del Censo 2020 por edad quinquenal y municipio (consulta interactiva INEGI); IIEG "Análisis General del AMG 2020" |
| Situación conyugal 40–59 en ZMG; divorcios Jalisco 2024 | Nichos 40+ y divorciados | Censo 2020 por municipio; IIEG "Situación Conyugal 2022"; Estadística de Divorcios por entidad |
| Intención seria en la población general (solo 58.2 % de usuarios de Hinge) | Nicho central | Pregunta directa en formulario y entrevistas |
| Hogares monoparentales y jefatura femenina en Jalisco | Nicho madres/padres | Intercensal 2025, boletín Jalisco |
| Introvertidos | Sin medición posible | Tratar como preferencia de producto, no como nicho de adquisición |
| Migración reciente al AMG | Nicho recién llegados | Intercensal 2025 (lugar de residencia hace 5 años) |
| Porcentaje LGBTI+ en Jalisco y aceptación social local | Nicho LGBTQ+ y diseño de privacidad | ENDISEG 2021 cuadros por entidad |
| Precios oficiales vigentes en MXN de Tinder/Bumble/Hinge y estado de Opening Moves | Posicionamiento de precio | Abrir las fichas de App Store/Google Play MX en un dispositivo y la app |
| Tasa de pago local y sensibilidad al precio | Modelo de ingresos | Experimento H3; desglose CIU 2026 |
| Si Tinder acepta INE y si Face Check llega a México | Ventana de diferenciación en seguridad | Seguir newsroom de Match; Q3 2026 de Match Group (4-nov-2026) |
| Aplicabilidad del decreto NNA (14-oct-2026) a una app 18+ y tratamiento de biometría bajo LFPDPPP 2025 | Costo legal y de verificación | Opinión de abogado; leer texto íntegro DOF |
| Aprobación de Stripe para giro "dating" (restringido) | Cobro web | Solicitar aprobación por escrito antes de producción; plan B Mercado Pago/Conekta |
| Delitos vinculados a apps de citas en Jalisco (cifras oficiales) | Mensaje de seguridad y riesgo reputacional | Solicitud de transparencia a Fiscalía de Jalisco / Consejo Ciudadano |
| Ingreso por hogar CDMX (ENIGH 2024) y soltería Monterrey | Comparación de ciudades | Boletines ENIGH/Intercensal por entidad |

**Regla de decisión:** mientras estos huecos sigan abiertos, las cifras de PPC sirven para ordenar nichos, no para dimensionar ingresos. Revisión al cierre de H1–H3 (≈ semana 5) o antes si el Q3 2026 de Match Group (4-nov-2026) aporta datos de México.
