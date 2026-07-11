/**
 * Client-side image compression before upload.
 *
 * The backend can't do this step itself - vehicle document/photo uploads go
 * straight from the browser to S3 via a presigned URL (see common/api.py's
 * presigned endpoints), so Django never receives the file bytes to compress
 * server-side. This only touches images over 300KB, and only replaces the
 * file if compression actually shrank it - an already-optimized JPEG or a
 * small PNG icon uploads as-is rather than risking a larger re-encoded output.
 */
const COMPRESS_THRESHOLD_BYTES = 300 * 1024
const MAX_DIMENSION = 1920
const JPEG_QUALITY = 0.8

export async function compressImageIfNeeded(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') return file
  if (file.size <= COMPRESS_THRESHOLD_BYTES) return file

  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close()
      return file
    }
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const blob: Blob | null = await new Promise(resolve =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
    )
    if (!blob || blob.size >= file.size) return file

    const compressedName = file.name.replace(/\.\w+$/, '') + '.jpg'
    return new File([blob], compressedName, { type: 'image/jpeg', lastModified: Date.now() })
  } catch {
    // Any failure here (unsupported format, browser quirk) - fall back to
    // uploading the original file rather than blocking the submission.
    return file
  }
}
