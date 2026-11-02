import sharp from 'sharp';
import { config } from '../config.js';
import { hmacSign, safeEqual } from './crypto.js';

/** Re-codifica la imagen: elimina EXIF/GPS, limita tamaño y normaliza a WebP. */
export async function processProfilePhoto(input: Buffer): Promise<{ data: Buffer; width: number; height: number }> {
  const img = sharp(input, { failOn: 'error', limitInputPixels: 40_000_000 }).rotate();
  const meta = await img.metadata();
  if (!meta.width || !meta.height) throw new Error('Imagen inválida');
  if (meta.width < 300 || meta.height < 300) throw new Error('La foto debe medir al menos 300x300');
  const out = await img.resize({ width: 1080, height: 1350, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
  return { data: out.data, width: out.info.width, height: out.info.height };
}

/** URL firmada temporal para servir una foto privada. `viewer` ata la URL a quien la pidió. */
export function signMediaUrl(key: string, viewerId: string, ttlSeconds = 3600): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const sig = hmacSign(config.MEDIA_SIGNING_SECRET, `${key}|${viewerId}|${exp}`);
  return `${config.API_PUBLIC_URL}/media/${encodeURIComponent(key)}?v=${viewerId}&e=${exp}&s=${sig}`;
}
export function verifyMediaSignature(key: string, viewerId: string, exp: number, sig: string): boolean {
  if (exp < Math.floor(Date.now() / 1000)) return false;
  return safeEqual(hmacSign(config.MEDIA_SIGNING_SECRET, `${key}|${viewerId}|${exp}`), sig);
}
