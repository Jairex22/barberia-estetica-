import type { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.session.adminEmail) {
    return next();
  }
  return res.status(401).json({ error: "No autenticado. Inicia sesión para continuar." });
}

export function requireCsrf(req: Request, res: Response, next: NextFunction) {
  const headerToken = req.header("x-csrf-token");
  if (!req.session || !req.session.csrfToken || headerToken !== req.session.csrfToken) {
    return res.status(403).json({ error: "Token CSRF inválido o ausente." });
  }
  return next();
}
