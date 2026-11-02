'use client';
/** Estados de interfaz consistentes: carga, vacío, error, sin conexión, permiso denegado, pago pendiente, no disponible. */
export type UiState = 'loading' | 'empty' | 'error' | 'offline' | 'permission' | 'payment_pending' | 'unavailable';
const COPY: Record<UiState, { title: string; body: string }> = {
  loading: { title: 'Cargando…', body: 'Un momento.' },
  empty: { title: 'No hay personas compatibles por ahora', body: 'Vuelve más tarde o amplía tus preferencias desde tu perfil. No inventamos perfiles ni ampliamos tus filtros sin avisarte.' },
  error: { title: 'Algo salió mal', body: 'Inténtalo de nuevo. Si persiste, escríbenos desde Ayuda.' },
  offline: { title: 'Sin conexión', body: 'Revisa tu internet. Lo que escribas se enviará al reconectar.' },
  permission: { title: 'Sin permiso de ubicación', body: 'Puedes indicar tu ciudad manualmente en tu perfil; mostramos solo distancias aproximadas.' },
  payment_pending: { title: 'Pago pendiente de confirmación', body: 'Premium se activará en cuanto el proveedor confirme el cobro. Te avisaremos por correo.' },
  unavailable: { title: 'Servicio no disponible', body: 'Esta función está desactivada o en mantenimiento. Vuelve a intentarlo más tarde.' },
};
export function StateView({ state, title, body, action }: { state: UiState; title?: string; body?: string; action?: React.ReactNode }) {
  const c = COPY[state];
  return (
    <div role={state === 'error' || state === 'offline' ? 'alert' : 'status'} aria-live="polite" className="card p-8 text-center fade-in max-w-md mx-auto">
      <div aria-hidden className={`mx-auto mb-4 h-12 w-12 rounded-full ${state === 'loading' ? 'bg-cream-2 animate-pulse motion-reduce:animate-none' : state === 'error' ? 'bg-danger-soft' : 'bg-ember-soft'}`} />
      <h2 className="text-xl font-semibold">{title ?? c.title}</h2>
      <p className="mt-2 text-ink-soft">{body ?? c.body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
