/**
 * Client-side encryption utilities using Web Crypto API
 * Encrypts files before upload to ensure confidentiality
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;

/**
 * Generate a random encryption key
 */
export async function generateEncryptionKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Export key to base64 string for transmission
 */
export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('raw', key);
  const exportedArrayBuffer = new Uint8Array(exported);
  return btoa(String.fromCharCode(...exportedArrayBuffer));
}

/**
 * Import key from base64 string
 */
export async function importKey(keyData: string): Promise<CryptoKey> {
  const keyArray = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    'raw',
    keyArray,
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Generate a random IV (Initialization Vector)
 */
function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(12)); // 12 bytes for GCM
}

/**
 * Encrypt file data using AES-GCM
 * Returns encrypted data with IV prepended
 */
export async function encryptFile(file: File): Promise<{
  encryptedData: ArrayBuffer;
  key: string;
  iv: string;
}> {
  // Generate encryption key
  const key = await generateEncryptionKey();
  
  // Generate IV
  const iv = generateIV();
  
  // Read file as ArrayBuffer
  const fileData = await file.arrayBuffer();
  
  // Encrypt the data
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv: iv,
    },
    key,
    fileData
  );
  
  // Export key to base64
  const keyString = await exportKey(key);
  
  // Convert IV to base64
  const ivString = btoa(String.fromCharCode(...iv));
  
  return {
    encryptedData,
    key: keyString,
    iv: ivString,
  };
}

/**
 * Decrypt file data (for client-side preview if needed)
 */
export async function decryptFile(
  encryptedData: ArrayBuffer,
  keyString: string,
  ivString: string
): Promise<ArrayBuffer> {
  const key = await importKey(keyString);
  const iv = Uint8Array.from(atob(ivString), (c) => c.charCodeAt(0));
  
  return await crypto.subtle.decrypt(
    {
      name: ALGORITHM,
      iv: iv,
    },
    key,
    encryptedData
  );
}

