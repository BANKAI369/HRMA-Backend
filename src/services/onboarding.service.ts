import { AppDataSource } from "../config/data-source";
import { TenantSignupRequest } from "../entities/TenantSignupRequest";
import { randomUUID } from "crypto";
import { add } from "date-fns";
import { sendSignupEmail } from "../utils/mail.utils";
import { AuthService } from "./auth.service";

const signupRepo = AppDataSource.getRepository(TenantSignupRequest);
const authService = new AuthService();

export class OnboardingService {
  async createSignupRequest(data: {
    email: string;
    companyName: string;
    username: string;
    onboardingType?: "trial" | "demo";
  }) {
    const token = randomUUID();
    const expiresAt = add(new Date(), { hours: 48 });

    const existing = await signupRepo.findOne({ where: { email: data.email } });
    if (existing && existing.status === "accepted") {
      throw new Error("Account already exists for this email");
    }

    const req = signupRepo.create({
      email: data.email.trim().toLowerCase(),
      companyName: data.companyName.trim(),
      username: data.username.trim(),
      token,
      expiresAt,
      status: "pending",
      onboardingType: data.onboardingType ?? null,
    });

    await signupRepo.save(req);

    const mailResult = await sendSignupEmail(req.email, token);

    return { request: req, mail: mailResult };
  }

  async completeSignup(token: string, payload: { password: string }) {
    const req = await signupRepo.findOne({ where: { token } });
    if (!req) throw new Error("Signup request not found");
    if (req.status !== "pending") throw new Error("Signup request is not pending");
    if (req.expiresAt.getTime() < Date.now()) throw new Error("Signup token expired");

    // create tenant/org/user using AuthService.register-like flow
    const result = await authService.register({
      username: req.username,
      email: req.email,
      password: payload.password,
      companyName: req.companyName,
      onboardingType: (req.onboardingType as any) ?? "trial",
    });

    req.status = "accepted";
    await signupRepo.save(req);

    return result;
  }
}

export default new OnboardingService();
