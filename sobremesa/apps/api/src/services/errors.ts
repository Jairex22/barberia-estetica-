export class AppError extends Error {
  constructor(public statusCode: number, public code: string, message: string, public details?: unknown) {
    super(message);
  }
}
export const errors = {
  unauthorized: (msg = 'No has iniciado sesión') => new AppError(401, 'unauthorized', msg),
  forbidden: (msg = 'No tienes permiso para esta acción') => new AppError(403, 'forbidden', msg),
  notFound: (msg = 'No encontrado') => new AppError(404, 'not_found', msg),
  conflict: (code: string, msg: string) => new AppError(409, code, msg),
  badRequest: (code: string, msg: string, details?: unknown) => new AppError(400, code, msg, details),
  tooMany: (msg = 'Demasiadas solicitudes. Espera un momento.') => new AppError(429, 'rate_limited', msg),
  unavailable: (code: string, msg: string) => new AppError(503, code, msg),
};
