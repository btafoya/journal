import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

/**
 * Derive encryption key from password using PBKDF2
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, "sha256");
}

/**
 * Get encryption password from environment
 */
function getEncryptionPassword(): string {
  const password = process.env.FILE_ENCRYPTION_SECRET || process.env.ENCRYPTION_SECRET;
  if (!password) {
    throw new Error("FILE_ENCRYPTION_SECRET or ENCRYPTION_SECRET environment variable is required");
  }
  return password;
}

/**
 * Encrypt file buffer
 * Returns encrypted buffer with prepended salt, IV, and auth tag
 */
export function encryptFile(fileBuffer: Buffer): Buffer {
  const password = getEncryptionPassword();

  // Generate random salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);

  // Derive encryption key
  const key = deriveKey(password, salt);

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Encrypt data
  const encrypted = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Combine: salt + IV + authTag + encrypted data
  return Buffer.concat([salt, iv, authTag, encrypted]);
}

/**
 * Decrypt file buffer
 * Expects buffer with prepended salt, IV, and auth tag
 */
export function decryptFile(encryptedBuffer: Buffer): Buffer {
  const password = getEncryptionPassword();

  // Extract components
  const salt = encryptedBuffer.subarray(0, SALT_LENGTH);
  const iv = encryptedBuffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = encryptedBuffer.subarray(
    SALT_LENGTH + IV_LENGTH,
    SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
  );
  const encrypted = encryptedBuffer.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

  // Derive decryption key
  const key = deriveKey(password, salt);

  // Create decipher
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  // Decrypt data
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

/**
 * Validate file type based on MIME type
 */
export function validateFileType(mimeType: string): boolean {
  const allowedTypes = [
    // Images
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
    // Audio
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/ogg",
    "audio/webm",
    // Video
    "video/mp4",
    "video/mpeg",
    "video/webm",
    "video/ogg",
    "video/quicktime",
  ];

  return allowedTypes.includes(mimeType);
}

/**
 * Get file category from MIME type
 */
export function getFileCategory(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "application/pdf") return "document";
  if (mimeType.includes("word") || mimeType.includes("document")) return "document";
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "spreadsheet";
  if (mimeType.includes("powerpoint") || mimeType.includes("presentation")) return "presentation";
  if (mimeType.startsWith("text/")) return "text";
  return "other";
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

/**
 * Get file size limit from environment (default: 10MB)
 */
export function getFileSizeLimit(): number {
  const limitMB = parseInt(process.env.MAX_FILE_SIZE_MB || "10");
  return limitMB * 1024 * 1024; // Convert to bytes
}

/**
 * Check if file size is within limit
 */
export function validateFileSize(size: number): boolean {
  return size <= getFileSizeLimit();
}
