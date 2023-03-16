import crypto from 'crypto';
import config from 'config';
/**
 * 生成 hash 過的 email
 */
export async function encodeEmail(data: { email: string }): Promise<string> {
  const IV_LENGTH = 16;
  const algorithm = 'aes-256-cbc';
  const emailHashSecret = config.get<string>('EMAIL_HASH_SECRET');
  const iv = crypto.randomBytes(IV_LENGTH);
  // 加密規則 ase-256-cbc
  const cipher = crypto.createCipheriv(
    algorithm,
    Buffer.from(emailHashSecret),
    iv,
  );
  let encrypted = cipher.update(data.email);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * 驗證 email
 */
export async function decipherEmail(data: {
  hashValue: string;
}): Promise<string> {
  const textParts: any = data.hashValue.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const emailHashSecret = config.get<string>('EMAIL_HASH_SECRET');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(emailHashSecret),
    iv,
  );
  let decrypted: any = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
