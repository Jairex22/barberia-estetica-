import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { apiCtx, seedUser, loginUI, tokenFromOutbox, uniq, PASSWORD, makeAdmin } from './helpers';

test.describe('Público', () => {
  test('landing, navegación y accesibilidad básica', async ({ page }, info) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Conversaciones');
    await page.screenshot({ path: `test-results/capturas/landing-${info.project.name}.png`, fullPage: true });
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
    expect(axe.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious'), JSON.stringify(axe.violations, null, 1)).toEqual([]);
    await page.getByRole('link', { name: 'Aviso de privacidad' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Aviso de privacidad');
  });
  test('registro por interfaz, verificación de correo y perfil', async ({ page }, info) => {
    const email = uniq('ui');
    await page.goto('/registro');
    await page.getByLabel('Nombre que verán los demás').fill('Prueba UI');
    await page.getByLabel('Correo', { exact: true }).fill(email);
    await page.getByLabel('Contraseña', { exact: true }).fill(PASSWORD);
    await page.getByLabel('Fecha de nacimiento').fill('1992-02-02');
    await page.getByRole('radio', { name: 'Mujer', exact: true }).click();
    await page.getByRole('radio', { name: 'Hombres' }).click();
    for (const l of ['Confirmo que tengo 18', 'Acepto los', 'He leído el']) await page.getByLabel(l).check();
    await page.getByRole('button', { name: 'Crear cuenta' }).click();
    await expect(page).toHaveURL(/verificar-correo/);
    const ctx = await apiCtx();
    const token = await tokenFromOutbox(ctx, email, 'verificar-correo');
    await page.goto(`/verificar-correo?token=${token}`);
    await expect(page.getByText('Correo verificado')).toBeVisible();
    await page.getByRole('link', { name: 'Completar mi perfil' }).click();
    await expect(page.getByRole('heading', { name: 'Editar perfil' })).toBeVisible();
    await page.getByLabel(/Presentación/).fill('Café de especialidad, caminar sin rumbo y cine de autor los martes.');
    await page.getByRole('radio', { name: 'Relación seria' }).click();
    const intereses = page.getByRole('group', { name: /Intereses/ });
    await intereses.getByRole('button', { name: 'Café', exact: true }).click();
    await intereses.getByRole('button', { name: 'Cine', exact: true }).click();
    await page.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByRole('status')).toContainText('Guardado');
    await page.screenshot({ path: `test-results/capturas/editar-perfil-${info.project.name}.png`, fullPage: true });
    // Menor de edad rechazado desde la interfaz
    await page.goto('/registro');
    await page.getByLabel('Nombre que verán los demás').fill('Menor');
    await page.getByLabel('Correo', { exact: true }).fill(uniq('menor'));
    await page.getByLabel('Contraseña', { exact: true }).fill(PASSWORD);
    await page.getByLabel('Fecha de nacimiento').fill('2012-02-02');
    await page.getByRole('radio', { name: 'Hombre', exact: true }).click();
    await page.getByRole('radio', { name: 'Mujeres' }).click();
    for (const l of ['Confirmo que tengo 18', 'Acepto los', 'He leído el']) await page.getByLabel(l).check();
    await page.getByRole('button', { name: 'Crear cuenta' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'mayores de 18' })).toBeVisible();
  });
});

test.describe('Dos cuentas reales: descubrir, conexión y chat', () => {
  test('match por interfaz, regla de inicio y mensajes sincronizados', async ({ browser }, info) => {
    const ctx = await apiCtx();
    const tag = Math.random().toString(36).slice(2, 6);
    const ana = await seedUser(ctx, { gender: 'mujer', interestedIn: 'hombres', name: `Ana${tag}` });
    const luis = await seedUser(ctx, { gender: 'hombre', interestedIn: 'mujeres', name: `Luis${tag}` });
    // Luis da like a Ana por API; Ana lo encuentra en Descubrir y da like por UI → conexión.
    await ctx.post('/discover/swipe', { headers: luis.H, data: { targetId: ana.userId, action: 'like' } });
    const pa = await browser.newPage(); await loginUI(pa, ana.email);
    await pa.goto('/descubrir');
    await expect(pa.getByRole('heading', { name: 'Descubrir' })).toBeVisible();
    // Pasar hasta encontrar a Luis (cola ordenada por afinidad; máximo 15 intentos)
    for (let i = 0; i < 40; i++) {
      const h = await pa.getByRole('article').getByRole('heading', { level: 2 }).first().textContent();
      if (h?.includes(`Luis${tag}`)) break;
      await pa.getByRole('button', { name: /^Pasar de/ }).click();
    }
    await pa.screenshot({ path: `test-results/capturas/descubrir-${info.project.name}.png` });
    await pa.getByRole('button', { name: `Me gusta Luis${tag}` }).click();
    await expect(pa.getByRole('dialog')).toContainText('¡Conexión!');
    await pa.getByRole('link', { name: 'Ir a la conversación' }).click();
    await expect(pa.getByText('Tú das el primer paso')).toBeVisible();
    const url = pa.url();
    // Luis entra a la misma conversación: no puede escribir todavía.
    const pl = await browser.newPage(); await loginUI(pl, luis.email);
    await pl.goto(url);
    await expect(pl.getByText('ella da el primer paso')).toBeVisible();
    await expect(pl.getByLabel('Mensaje', { exact: true })).toBeDisabled();
    // Ana escribe (usa rompehielos y luego envía); Luis lo recibe en tiempo real y ya puede responder.
    await pa.getByRole('button', { name: /rompehielos/ }).click();
    await pa.getByRole('button', { name: /también te gusta|plan favorito|plan ideal|nos late/ }).first().click();
    await pa.getByRole('button', { name: 'Enviar' }).click();
    await expect(pl.getByRole('log')).toContainText(/también te gusta|plan favorito|plan ideal|nos late/, { timeout: 10_000 });
    await expect(pl.getByLabel('Mensaje', { exact: true })).toBeEnabled();
    await pl.getByLabel('Mensaje', { exact: true }).fill('¡Hola Ana! Me encanta la idea.');
    await pl.getByRole('button', { name: 'Enviar' }).click();
    await expect(pa.getByRole('log')).toContainText('Me encanta la idea', { timeout: 10_000 });
    await pa.screenshot({ path: `test-results/capturas/chat-${info.project.name}.png` });
    // Bloqueo desde el chat: la conversación desaparece para ambos y persiste tras recargar.
    await pa.getByRole('button', { name: 'Más opciones' }).click();
    await pa.getByRole('menuitem', { name: 'Denunciar o bloquear' }).click();
    await pa.getByRole('button', { name: 'Solo bloquear, sin denunciar' }).click();
    await pa.getByRole('button', { name: 'Cerrar' }).click();
    await expect(pa).toHaveURL(/\/mensajes$/);
    await pl.reload();
    await expect(pl.getByText('Conversación no disponible')).toBeVisible();
    await pa.goto('/perfil/privacidad');
    await expect(pa.getByText('Personas bloqueadas (1)')).toBeVisible();
    await pa.close(); await pl.close();
  });
});

test.describe('Premium, ayuda y panel', () => {
  test('precios honestos, asistente identificado y panel admin', async ({ page }, info) => {
    const ctx = await apiCtx();
    const u = await seedUser(ctx, { gender: 'otro', interestedIn: 'todas', name: 'AdminE2E' });
    makeAdmin(u.userId);
    await loginUI(page, u.email);
    await page.goto('/premium');
    await expect(page.getByRole('heading', { name: 'Premium' })).toBeVisible();
    await expect(page.getByText(/no cambia quién inicia/i).first()).toBeVisible();
    // Sin Stripe configurado: el botón de pago no se ofrece como funcional.
    await expect(page.getByText('No disponible').first()).toBeVisible();
    await page.screenshot({ path: `test-results/capturas/premium-${info.project.name}.png`, fullPage: true });
    await page.goto('/ayuda');
    await expect(page.getByText('Asistente de IA').first()).toBeVisible();
    await page.getByLabel('Tu pregunta').fill('¿Cómo cancelo mi suscripción?');
    await page.getByRole('button', { name: 'Enviar' }).click();
    await expect(page.getByRole('log')).toContainText(/cancel/i, { timeout: 15_000 });
    await expect(page.getByRole('log')).toContainText(/modo FAQ|Asistente de IA/);
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: /Panel administrativo/ })).toBeVisible();
    await expect(page.getByText('Ingresos conciliados')).toBeVisible();
    await page.screenshot({ path: `test-results/capturas/admin-${info.project.name}.png`, fullPage: true });
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(axe.violations.filter((v) => v.impact === 'critical'), JSON.stringify(axe.violations, null, 1)).toEqual([]);
    // Navegación por teclado: el primer Tab llega al enlace "Saltar al contenido".
    await page.goto('/descubrir'); await page.keyboard.press('Tab');
    await expect(page.getByText('Saltar al contenido')).toBeFocused();
  });
});
