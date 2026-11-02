export const es = {
  nav: { discover: 'Descubrir', connections: 'Conexiones', messages: 'Mensajes', profile: 'Perfil' },
  states: {
    loading: 'Cargando…',
    emptyDiscover: 'No hay personas compatibles por ahora. Vuelve más tarde o amplía tus preferencias tú mismo; no inventamos perfiles.',
    error: 'Algo salió mal. Inténtalo de nuevo.',
    offline: 'Sin conexión. Tus mensajes se enviarán al reconectar.',
    permissionDenied: 'Sin permiso de ubicación. Puedes indicar tu ciudad manualmente.',
    paymentPending: 'Pago pendiente de confirmación. Te avisaremos en cuanto el proveedor lo confirme.',
    serviceUnavailable: 'Este servicio no está disponible por ahora.',
  },
  initiation: {
    them: 'Cuando ella escriba, podrás responder.',
    you: 'Tú das el primer paso. Escribe cuando quieras.',
    anyone: 'Cualquiera de los dos puede iniciar.',
  },
  ai: { label: 'Asistente de IA', disclaimer: 'Esto es una IA, no una persona. Puede equivocarse.' },
  demo: 'Demostración',
};
export type Dictionary = typeof es;
