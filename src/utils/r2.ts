import crypto from 'crypto';
import { config } from '../config';

const hasR2Config = Boolean(
  config.r2.accountId &&
    config.r2.accessKeyId &&
    config.r2.secretAccessKey &&
    config.r2.bucketName &&
    config.r2.publicUrl
);

const sha256Hex = (data: Buffer | string): string =>
  crypto.createHash('sha256').update(data).digest('hex');

const hmac = (key: Buffer | string, data: string): Buffer =>
  crypto.createHmac('sha256', key).update(data, 'utf8').digest();

/**
 * Returns true if Cloudflare R2 configurations are fully defined.
 */
export const isR2Configured = (): boolean => {
  return hasR2Config;
};

/**
 * Uploads a Buffer directly to Cloudflare R2 via native fetch + crypto (no AWS SDK dependency)
 * and returns its public URL.
 */
export const uploadToR2 = async (
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> => {
  if (!hasR2Config) {
    throw new Error('Cloudflare R2 is not configured.');
  }

  const cleanKey = key.replace(/^\//, '');
  const encodedKey = cleanKey.split('/').map(encodeURIComponent).join('/');
  const host = `${config.r2.accountId}.r2.cloudflarestorage.com`;
  const canonicalUri = `/${encodeURIComponent(config.r2.bucketName)}/${encodedKey}`;
  const endpoint = `https://${host}${canonicalUri}`;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const region = 'auto';
  const service = 's3';

  const payloadHash = sha256Hex(buffer);
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
  const canonicalHeaders = [
    `content-type:${contentType}`,
    `host:${host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
  ].join('\n');

  const canonicalRequest = [
    'PUT',
    canonicalUri,
    '',
    canonicalHeaders,
    '',
    signedHeaders,
    payloadHash,
  ].join('\n');

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n');

  const kDate = hmac(`AWS4${config.r2.secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, 'aws4_request');
  const signature = crypto
    .createHmac('sha256', kSigning)
    .update(stringToSign, 'utf8')
    .digest('hex');

  const authorization = `AWS4-HMAC-SHA256 Credential=${config.r2.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
      Authorization: authorization,
    },
    body: new Uint8Array(buffer),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Cloudflare R2 upload failed (${response.status}): ${errText}`);
  }

  const baseUrl = config.r2.publicUrl.replace(/\/$/, '');
  return `${baseUrl}/${cleanKey}`;
};
