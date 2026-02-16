export interface AuthService {
  generateToken(payload: any): string;
  verifyToken(token: string): any;
}
