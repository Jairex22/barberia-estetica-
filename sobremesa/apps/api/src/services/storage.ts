import { mkdir, writeFile, readFile, unlink, stat } from 'node:fs/promises';
import path from 'node:path';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { config } from '../config.js';

/** Almacenamiento PRIVADO: nunca se sirve directamente; el API firma URLs temporales. */
export interface StorageProvider {
  name: string;
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<{ data: Buffer; contentType: string } | null>;
  delete(key: string): Promise<void>;
}

function safeKey(key: string) {
  if (!/^[a-zA-Z0-9/_\-.]+$/.test(key) || key.includes('..')) throw new Error('storage key inválida');
  return key;
}

const localProvider: StorageProvider = {
  name: 'local',
  async put(key, data, contentType) {
    const file = path.resolve(config.STORAGE_LOCAL_DIR, safeKey(key));
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, data);
    await writeFile(file + '.meta', contentType);
  },
  async get(key) {
    const file = path.resolve(config.STORAGE_LOCAL_DIR, safeKey(key));
    try { await stat(file); } catch { return null; }
    const [data, contentType] = await Promise.all([readFile(file), readFile(file + '.meta', 'utf8').catch(() => 'application/octet-stream')]);
    return { data, contentType };
  },
  async delete(key) {
    const file = path.resolve(config.STORAGE_LOCAL_DIR, safeKey(key));
    await unlink(file).catch(() => {}); await unlink(file + '.meta').catch(() => {});
  },
};

function s3Provider(): StorageProvider {
  const client = new S3Client({
    region: config.S3_REGION, endpoint: config.S3_ENDPOINT,
    credentials: { accessKeyId: config.S3_ACCESS_KEY_ID!, secretAccessKey: config.S3_SECRET_ACCESS_KEY! },
  });
  const Bucket = config.S3_BUCKET!;
  return {
    name: 's3',
    async put(key, data, contentType) { await client.send(new PutObjectCommand({ Bucket, Key: safeKey(key), Body: data, ContentType: contentType })); },
    async get(key) {
      try {
        const out = await client.send(new GetObjectCommand({ Bucket, Key: safeKey(key) }));
        const bytes = await out.Body!.transformToByteArray();
        return { data: Buffer.from(bytes), contentType: out.ContentType ?? 'application/octet-stream' };
      } catch { return null; }
    },
    async delete(key) { await client.send(new DeleteObjectCommand({ Bucket, Key: safeKey(key) })); },
  };
}

export function getStorage(): StorageProvider {
  if (config.STORAGE_PROVIDER === 's3') {
    if (!config.S3_BUCKET || !config.S3_ACCESS_KEY_ID || !config.S3_SECRET_ACCESS_KEY) throw new Error('S3 mal configurado');
    return s3Provider();
  }
  return localProvider;
}
