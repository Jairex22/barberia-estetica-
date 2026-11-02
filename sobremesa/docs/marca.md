# Marca e identidad visual

## Nombres propuestos y selección provisional

| Nombre | Concepto | Pantallazo básico de conflictos (NO es búsqueda legal) | Veredicto |
|---|---|---|---|
| **Sobremesa** (seleccionado) | La conversación que se alarga después de comer; íntimo, cálido, muy mexicano/hispano. Encaja con "planes concretos + conversación con intención". | Término genérico; no se hallaron apps de citas con ese nombre (research/legal_seguridad_costos.md, sección 8). Dominios `sobremesa.app`/`.mx` no verificados (acceso bloqueado en la sesión). | Riesgo bajo‑medio por genericidad; registrable como marca mixta (logo + nombre) probablemente, confirmar con IMPI. |
| Lumbre | Brasa, fuego lento, "dar lumbre". Coqueto y breve. | Sin apps de citas halladas; término genérico. | Riesgo bajo‑medio. Alternativa principal. |
| Velada | Noche especial, elegante. | Existe una app gastronómica "Velada" (Velada Digital Services SL). | Descartado: conflicto evidente. |
| Brasa | Calor, intensidad. | Múltiples usos gastronómicos (Brasa Rosticería, etc.). | Descartado por saturación. |

**Chispa** se evitó desde el inicio: es una app de citas de Match Group (2017, con Univision).

Pendiente para ti: búsqueda fonética en IMPI (Marcanet) de "Sobremesa" en clases 9, 42 y 45; comprobar disponibilidad de `sobremesa.app`, `sobremesa.mx`, `sobremesa.com.mx`, `holasobremesa.com`; reservar nombres de usuario en redes. Nada de esto se ejecutó aquí (sin acceso ni autorización para contratar).

## Identidad

- **Tono**: sensual y elegante sin contenido sexual; directo, honesto, cercano (español de México, tuteo).
- **Paleta** (tokens en `apps/web/src/app/globals.css` y `apps/mobile/src/lib/theme.ts`): vino profundo `#6b1f2b` (primario), brasa `#a8432f` (acento; 5.5:1 sobre crema), crema `#faf4ee` (fondo), crema 2 `#f1e6dc`, tinta `#1d1413`, salvia `#4a6b4e` (éxito), peligro `#a82f2f`. Todos los pares texto/fondo usados cumplen WCAG AA (verificado con axe en E2E; el acento original `#c8563f` falló con 3.95:1 y se corrigió).
- **Tipografía**: titulares con serif (Fraunces si se carga; fallback Iowan/Palatino/Georgia), texto con Inter/system-ui. No se descargaron fuentes externas en esta sesión (red restringida); `next/font` puede activarse después.
- **Movimiento**: discreto (fade/rise 300–400 ms) y desactivado con `prefers-reduced-motion`.
- **Fotografía**: usar imágenes propias o licenciadas (Unsplash+/Pexels con licencia revisada). Los perfiles de demostración usan imágenes generadas por código con la palabra DEMOSTRACIÓN.
- **Navegación**: Descubrir, Conexiones, Mensajes, Perfil (barra inferior en móvil, lateral en escritorio). Botones explícitos "Pasar / Me gusta"; no depende de deslizar.
- **Estados**: carga, vacío ("no hay personas compatibles por ahora"), error, sin conexión, permiso denegado, pago pendiente y servicio no disponible, implementados en `StateView` (web y móvil).
