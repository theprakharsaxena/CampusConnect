import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Per-attempt timeout (ms). Cloudinary's default has no hard client-side
// deadline, so a slow upload can stall the entire request indefinitely.
const UPLOAD_TIMEOUT_MS = 30_000; // 30 s per attempt

// Retry configuration
const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 500; // 500 ms → 1 s → 2 s

/**
 * Upload a buffer to Cloudinary with a per-attempt timeout and automatic
 * exponential-backoff retry on transient failures.
 */
const attemptUpload = (
  buffer: Buffer,
  folder: string,
  resourceType: 'auto' | 'image' | 'video' | 'raw' = 'auto',
  format?: string
): Promise<{ url: string; publicId: string }> => {
  return new Promise((resolve, reject) => {
    let settled = false;

    // Hard timeout: abort and reject if Cloudinary doesn't respond in time
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error(`Cloudinary upload timed out after ${UPLOAD_TIMEOUT_MS / 1000}s`));
      }
    }, UPLOAD_TIMEOUT_MS);

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType, ...(format && { format }) },
      (error, result) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (error || !result) {
          reject(error || new Error('Upload failed'));
        } else {
          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      }
    );

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

export const uploadToCloudinary = async (
  buffer: Buffer,
  folder: string = 'campusconnect',
  resourceType: 'auto' | 'image' | 'video' | 'raw' = 'auto',
  format?: string
): Promise<{ url: string; publicId: string }> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await attemptUpload(buffer, folder, resourceType, format);
    } catch (err) {
      lastError = err;
      if (attempt < MAX_ATTEMPTS) {
        const delay = BASE_BACKOFF_MS * Math.pow(2, attempt - 1);
        console.warn(
          `Cloudinary upload attempt ${attempt}/${MAX_ATTEMPTS} failed. Retrying in ${delay}ms…`,
          err instanceof Error ? err.message : err
        );
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError;
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};
