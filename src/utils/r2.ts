import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { config } from '../config';

const hasR2Config =
  config.r2.accountId &&
  config.r2.accessKeyId &&
  config.r2.secretAccessKey &&
  config.r2.bucketName &&
  config.r2.publicUrl;

const s3Client = hasR2Config
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${config.r2.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.r2.accessKeyId,
        secretAccessKey: config.r2.secretAccessKey,
      },
    })
  : null;

/**
 * Returns true if Cloudflare R2 configurations are fully defined.
 */
export const isR2Configured = (): boolean => {
  return !!s3Client;
};

/**
 * Uploads a Buffer to Cloudflare R2 bucket and returns its public URL.
 */
export const uploadToR2 = async (
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> => {
  if (!s3Client) {
    throw new Error('Cloudflare R2 is not configured.');
  }

  const command = new PutObjectCommand({
    Bucket: config.r2.bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);

  // Return the public URL
  const baseUrl = config.r2.publicUrl.replace(/\/$/, '');
  const cleanKey = key.replace(/^\//, '');
  return `${baseUrl}/${cleanKey}`;
};
