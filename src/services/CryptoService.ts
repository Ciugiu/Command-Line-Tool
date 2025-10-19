import crypto from 'crypto';

export class CryptoService {
    /**
     * Generate a random salt
     */
    static generateSalt(length: number = 32): string {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Hash a password with salt using PBKDF2
     */
    static async hashPassword(password: string, salt: string): Promise<string> {
        return new Promise((resolve, reject) => {
            crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
                if (err) reject(err);
                resolve(derivedKey.toString('hex'));
            });
        });
    }

    /**
     * Generate a challenge for authentication
     */
    static generateChallenge(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Sign a challenge with private data
     */
    static signChallenge(challenge: string, privateData: string): string {
        const hmac = crypto.createHmac('sha256', privateData);
        hmac.update(challenge);
        return hmac.digest('hex');
    }

    /**
     * Encrypt data using AES-256-GCM
     */
    static encrypt(data: string, key: string): { encrypted: string; iv: string; tag: string } {
        const keyBuffer = crypto.createHash('sha256').update(key).digest();
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);

        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const tag = cipher.getAuthTag();

        return {
            encrypted,
            iv: iv.toString('hex'),
            tag: tag.toString('hex')
        };
    }

    /**
     * Decrypt data using AES-256-GCM
     */
    static decrypt(encrypted: string, key: string, iv: string, tag: string): string {
        const keyBuffer = crypto.createHash('sha256').update(key).digest();
        const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, Buffer.from(iv, 'hex'));
        decipher.setAuthTag(Buffer.from(tag, 'hex'));

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }

    /**
     * Generate a secure random token
     */
    static generateToken(length: number = 32): string {
        return crypto.randomBytes(length).toString('base64url');
    }

    /**
     * Hash data using SHA-256
     */
    static hash(data: string): string {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Generate master key from password
     */
    static async deriveMasterKey(password: string, salt: string): Promise<string> {
        return this.hashPassword(password, salt);
    }

    /**
     * Generate encryption key for data
     */
    static deriveEncryptionKey(masterKey: string, purpose: string): string {
        const hmac = crypto.createHmac('sha256', masterKey);
        hmac.update(purpose);
        return hmac.digest('hex');
    }
}
