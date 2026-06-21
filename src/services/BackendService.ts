import axios, {AxiosError, AxiosInstance} from 'axios';
import {SessionService} from './SessionService';
import {CryptoService} from './CryptoService';

export interface RegisterRequest {
    email: string;
    masterPasswordHash: string;
    salt: string;
    publicKey?: string;
}

export interface LoginRequest {
    email: string;
    masterPasswordHash: string;
}

export interface AuthResponse {
    userId: string;
    email: string;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

export interface Alias {
    id: string;
    alias: string;
    nickname?: string | null;
    isActive: boolean;
    createdAt: string;
}

export interface CreateAliasRequest {
    nickname?: string;
}

export class BackendService {
    private client: AxiosInstance;
    private sessionService: SessionService;
    private baseURL: string;

    constructor(baseURL: string = 'https://api.1337.legal') {
        this.baseURL = baseURL;
        this.sessionService = SessionService.getInstance();

        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Add request interceptor to include auth token
        this.client.interceptors.request.use(
            (config) => {
                const token = this.sessionService.getAccessToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Add response interceptor to handle token refresh
        this.client.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                const originalRequest = error.config;

                if (error.response?.status === 401 && originalRequest) {
                    // Try to refresh token
                    try {
                        const refreshToken = this.sessionService.getRefreshToken();
                        if (refreshToken) {
                            const response = await axios.post(`${this.baseURL}/auth/refresh`, {
                                refreshToken,
                            });

                            const {accessToken, expiresIn} = response.data;
                            this.sessionService.updateAccessToken(accessToken, expiresIn);

                            // Retry original request
                            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                            return axios(originalRequest);
                        }
                    } catch (refreshError) {
                        // Refresh failed, clear session
                        this.sessionService.clearSession();
                        throw new Error('Session expired. Please login again.');
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    /**
     * Register a new user
     */
    async register(email: string, password: string): Promise<AuthResponse> {
        // Generate salt
        const salt = CryptoService.generateSalt();

        // Derive master key from password
        const masterKey = await CryptoService.deriveMasterKey(password, salt);

        // Hash master key for authentication
        const masterPasswordHash = CryptoService.hash(masterKey);

        const response = await this.client.post<AuthResponse>('/auth/register', {
            email,
            masterPasswordHash,
            salt,
        });

        // Save session
        this.sessionService.saveSession({
            userId: response.data.userId,
            email: response.data.email,
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken,
            masterKey,
            salt,
            expiresAt: Date.now() + response.data.expiresIn * 1000,
        });

        return response.data;
    }

    /**
     * Login user
     */
    async login(email: string, password: string): Promise<AuthResponse> {
        // First, get the salt for the user
        const saltResponse = await this.client.post<{ salt: string }>('/auth/salt', {
            email,
        });

        const salt = saltResponse.data.salt;

        // Derive master key from password
        const masterKey = await CryptoService.deriveMasterKey(password, salt);

        // Hash master key for authentication
        const masterPasswordHash = CryptoService.hash(masterKey);

        const response = await this.client.post<AuthResponse>('/auth/login', {
            email,
            masterPasswordHash,
        });

        // Save session
        this.sessionService.saveSession({
            userId: response.data.userId,
            email: response.data.email,
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken,
            masterKey,
            salt,
            expiresAt: Date.now() + response.data.expiresIn * 1000,
        });

        return response.data;
    }

    /**
     * Logout user
     */
    async logout(): Promise<void> {
        try {
            await this.client.post('/auth/logout');
        } catch (error) {
            // Ignore errors, clear session anyway
        }
        this.sessionService.clearSession();
    }

    /**
     * Get current user info
     */
    async getUser(): Promise<any> {
        const response = await this.client.get('/user/me');
        return response.data;
    }

    /**
     * Get all aliases
     */
    async getAliases(): Promise<Alias[]> {
        const response = await this.client.get<Alias[]>('/alias');
        return response.data;
    }

    /**
     * Create a new alias
     */
    async createAlias(nickname?: string): Promise<Alias> {
        const response = await this.client.post<Alias>('/alias', {
            nickname,
        });
        return response.data;
    }

    /**
     * Delete an alias
     */
    async deleteAlias(aliasId: string): Promise<void> {
        await this.client.delete(`/alias/${aliasId}`);
    }

    /**
     * Update alias
     */
    async updateAlias(aliasId: string, data: Partial<Alias>): Promise<Alias> {
        const response = await this.client.patch<Alias>(`/alias/${aliasId}`, data);
        return response.data;
    }

    /**
     * Get alias details
     */
    async getAlias(aliasId: string): Promise<Alias> {
        const response = await this.client.get<Alias>(`/alias/${aliasId}`);
        return response.data;
    }

    /**
     * Change backend URL
     */
    setBaseURL(url: string): void {
        this.baseURL = url;
        this.client.defaults.baseURL = url;
    }
}
