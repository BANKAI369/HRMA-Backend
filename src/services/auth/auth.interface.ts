export interface AuthUser {
    id: string;
    role: "ADMIN" | "USER";
}

export interface AuthService {
    validateToken(token: string): Promise<AuthUser | null>;
}