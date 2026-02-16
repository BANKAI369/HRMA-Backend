import { AuthService } from "./AuthService";

export class MockAuthService implements AuthService {
  generateToken(payload: any): string {
    return Buffer.from(JSON.stringify(payload)).toString("base64");
  }

  verifyToken(token: string): any {
    try {
      return JSON.parse(Buffer.from(token, "base64").toString());
    } catch {
      throw new Error("Invalid Token");
    }
  }
}
