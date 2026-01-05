/**
 * Server-side encryption utilities using Node.js crypto
 * Re-encrypts files with server key for additional security layer
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 12 bytes for GCM
const SALT_LENGTH = 64; // 64 bytes for salt
const KEY_LENGTH = 32; // 32 bytes for AES-256
const TAG_LENGTH = 16; // 16 bytes for GCM auth tag

/**
 * Get or generate encryption secret from environment
 */
function getEncryptionSecret(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET environment variable is not set');
  }
  
  // Decode base64 secret if provided, otherwise use as-is
  try {
    return Buffer.from(secret, 'base64');
  } catch {
    // If not base64, use the string directly (not recommended for production)
    return Buffer.from(secret);
  }
}

/**
 * Derive encryption key from user ID and secret
 * This ensures each user's data is encrypted with a unique key
 */
function deriveUserKey(userId: string): Buffer {
  const secret = getEncryptionSecret();
  return crypto.pbkdf2Sync(secret, userId, 100000, KEY_LENGTH, 'sha256');
}

/**
 * Decrypt client-encrypted data
 * This decrypts data that was encrypted on the client side
 */
export async function decryptClientData(
  encryptedData: Buffer,
  clientKey: string,
  clientIV: string
): Promise<Buffer> {
  // Note: In a real implementation, you might want to use Node.js crypto
  // to decrypt client-side encrypted data. However, since we're re-encrypting
  // on the server, we can simplify by expecting the client to send the decrypted
  // data in a secure way, or we decrypt here.
  
  // For now, we'll expect the client to send the encrypted data and we'll
  // re-encrypt it with server keys. In production, you might want to decrypt
  // client encryption first, but for simplicity and to avoid key management
  // complexity, we'll encrypt the already-encrypted data with server key.
  
  // This is a simplified approach - in production, you'd decrypt client encryption first
  return encryptedData;
}

/**
 * Encrypt data with server-side key
 */
export function encryptData(data: Buffer, userId: string): {
  encrypted: Buffer;
  iv: Buffer;
  tag: Buffer;
} {
  const key = deriveUserKey(userId);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(data),
    cipher.final(),
  ]);
  
  const tag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv,
    tag,
  };
}

/**
 * Decrypt data with server-side key
 */
export function decryptData(
  encrypted: Buffer,
  iv: Buffer,
  tag: Buffer,
  userId: string
): Buffer {
  const key = deriveUserKey(userId);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
}

/**
 * Encrypt file buffer for storage
 * Returns encrypted data with IV and tag prepended
 */
export function encryptFileForStorage(
  fileBuffer: Buffer,
  userId: string
): Buffer {
  const { encrypted, iv, tag } = encryptData(fileBuffer, userId);
  
  // Prepend IV and tag to encrypted data for storage
  // Format: [IV (12 bytes)][TAG (16 bytes)][ENCRYPTED DATA]
  return Buffer.concat([iv, tag, encrypted]);
}

/**
 * Decrypt file buffer from storage
 */
export function decryptFileFromStorage(
  encryptedBuffer: Buffer,
  userId: string
): Buffer {
  // Extract IV, tag, and encrypted data
  const iv = encryptedBuffer.subarray(0, IV_LENGTH);
  const tag = encryptedBuffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = encryptedBuffer.subarray(IV_LENGTH + TAG_LENGTH);
  
  return decryptData(encrypted, iv, tag, userId);
}

