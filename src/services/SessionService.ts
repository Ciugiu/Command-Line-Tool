import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'fs';
import {join} from 'path';
import {homedir} from 'os';
import {CryptoService} from './CryptoService.js';

interface SessionData {
    userId?: string;
    email?: string;
    accessToken?: string;
    refreshToken?: string;
    masterKey?: string;
    salt?: string;
    expiresAt?: number;
}

export class SessionService {
    private static instance: SessionService;
    private configDir: string;
    private sessionFile: string;
    private encryptionKey: string;

    private constructor() {
        // Use OS-specific config directory
        this.configDir = join(homedir(), '.1337legal-cli');
        this.sessionFile = join(this.configDir, 'session.json');

        // Generate a machine-specific encryption key
        this.encryptionKey = this.getMachineKey();

        // Ensure config directory exists
        if (!existsSync(this.configDir)) {
            mkdirSync(this.configDir, {recursive: true, mode: 0o700});
        }
    }

    static getInstance(): SessionService {
        if (!SessionService.instance) {
            SessionService.instance = new SessionService();
        }
        return SessionService.instance;
    }

    /**
     * Save session data
     */
    saveSession(data: SessionData): void {
        const current = this.readSessionFile();
        const updated = {...current, ...data};
        this.writeSessionFile(updated);
    }

    /**
     * Get session data
     */
    getSession(): SessionData {
        return this.readSessionFile();
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        const session = this.getSession();
        if (!session.accessToken) {
            return false;
        }

        return !(session.expiresAt && session.expiresAt < Date.now());
    }

    /**
     * Get access token
     */
    getAccessToken(): string | undefined {
        return this.readSessionFile().accessToken;
    }

    /**
     * Get refresh token
     */
    getRefreshToken(): string | undefined {
        return this.readSessionFile().refreshToken;
    }

    /**
     * Get user ID
     */
    getUserId(): string | undefined {
        return this.readSessionFile().userId;
    }

    /**
     * Get email
     */
    getEmail(): string | undefined {
        return this.readSessionFile().email;
    }

    /**
     * Get master key
     */
    getMasterKey(): string | undefined {
        return this.readSessionFile().masterKey;
    }

    /**
     * Get salt
     */
    getSalt(): string | undefined {
        return this.readSessionFile().salt;
    }

    /**
     * Clear session
     */
    clearSession(): void {
        this.writeSessionFile({});
    }

    /**
     * Update access token
     */
    updateAccessToken(accessToken: string, expiresIn: number): void {
        const session = this.readSessionFile();
        session.accessToken = accessToken;
        session.expiresAt = Date.now() + expiresIn * 1000;
        this.writeSessionFile(session);
    }

    /**
     * Generate a machine-specific encryption key
     */
    private getMachineKey(): string {
        const machineId = `${homedir()}-${process.platform}-${process.arch}`;
        return CryptoService.hash(machineId);
    }

    /**
     * Read encrypted session from disk
     */
    private readSessionFile(): SessionData {
        if (!existsSync(this.sessionFile)) {
            return {};
        }

        try {
            const encrypted = readFileSync(this.sessionFile, 'utf8');
            const data = JSON.parse(encrypted);

            if (data.encrypted && data.iv && data.tag) {
                // Decrypt the session data
                const decrypted = CryptoService.decrypt(
                    data.encrypted,
                    this.encryptionKey,
                    data.iv,
                    data.tag
                );
                return JSON.parse(decrypted);
            }

            return {};
        } catch (error) {
            console.warn('Failed to read session file:', error);
            return {};
        }
    }

    /**
     * Write encrypted session to disk
     */
    private writeSessionFile(data: SessionData): void {
        try {
            const json = JSON.stringify(data);
            const encrypted = CryptoService.encrypt(json, this.encryptionKey);

            const payload = JSON.stringify({
                encrypted: encrypted.encrypted,
                iv: encrypted.iv,
                tag: encrypted.tag,
                timestamp: Date.now()
            });

            writeFileSync(this.sessionFile, payload, {mode: 0o600});
        } catch (error) {
            console.error('Failed to write session file:', error);
            throw error;
        }
    }
}
