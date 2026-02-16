import { AuthService } from "./AuthService";
import jwt from "jsonwebtoken";

export class JwtAuthService implements AuthService {
  private secret = "supersecret";

  generateToken(payload: any): string {
    return jwt.sign(payload, this.secret, { expiresIn: "1h" });
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.secret);
    } catch {
      throw new Error("Invalid Token");
    }
  }
}
