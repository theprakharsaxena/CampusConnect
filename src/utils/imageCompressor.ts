import sharp from 'sharp';

// Images above this size (in bytes) will be compressed before upload
const COMPRESSION_THRESHOLD_BYTES = 5 * 1024 * 1024; // 5 MB

// Target size we aim to stay within after compression
const TARGET_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// Lowest JPEG quality we'll go before giving up on size target
const MIN_QUALITY = 40;

/**
 * Compresses an image buffer if it exceeds the size threshold.
 *
 * Strategy:
 *  1. If the file is already within the threshold, return it unchanged.
 *  2. Otherwise convert to JPEG and iteratively reduce quality (80 → 60 → 40)
 *     until the buffer fits within TARGET_SIZE_BYTES.
 *  3. If still over after minimum quality, return the best (smallest) result
 *     so we never hard-reject the upload — we just get it as small as possible.
 *
 * @param buffer   Raw image buffer from multer memoryStorage
 * @param mimeType Original MIME type (used to skip compression for non-images)
 * @returns        Compressed (or original) buffer
 */
export async function compressImageIfNeeded(
  buffer: Buffer,
  mimeType: string
): Promise<Buffer> {
  // Skip non-image files (e.g. PDFs that multer also accepts)
  if (!mimeType.startsWith('image/')) {
    return buffer;
  }

  // Already within threshold — nothing to do
  if (buffer.length <= COMPRESSION_THRESHOLD_BYTES) {
    return buffer;
  }

  const qualitySteps = [80, 60, MIN_QUALITY];

  let bestBuffer: Buffer = buffer;

  for (const quality of qualitySteps) {
    const compressed = await sharp(buffer)
      .rotate() // respect EXIF orientation
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();

    // Track the smallest result so far
    if (compressed.length < bestBuffer.length) {
      bestBuffer = compressed;
    }

    // Stop as soon as we're within the target
    if (compressed.length <= TARGET_SIZE_BYTES) {
      return compressed;
    }
  }

  // Return the best we managed even if still over target
  return bestBuffer;
}
