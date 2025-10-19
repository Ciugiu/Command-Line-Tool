type User = {
    id: string;
    email: string;
    createdAt: string;
    updatedAt: string;
}

type Alias = {
    id: string;
    alias: string;
    description?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

type Session = {
    userId: string;
    email: string;
    accessToken: string;
    refreshToken: string;
    masterKey: string;
    salt: string;
    expiresAt: number;
}

type ApiError = {
    message: string;
    code?: string;
    statusCode?: number;
}

