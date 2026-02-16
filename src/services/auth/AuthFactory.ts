import { AuthService } from "./AuthService";
import { MockAuthService } from "./MockAuthService";
import { JwtAuthService } from "./JwtAuthService";

export class AuthFactory {
  static create(): AuthService {
    const provider = process.env.AUTH_PROVIDER || "mock";

    if (provider === "jwt") {
      return new JwtAuthService();
    }

    return new MockAuthService();
  }
}
