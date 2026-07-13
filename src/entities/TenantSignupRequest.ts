import { Column, Entity, Unique } from "typeorm";
import { BaseEntity } from "./base.entity";

@Entity("tenant_signup_requests")
@Unique(["token"])
export class TenantSignupRequest extends BaseEntity {
  @Column({ length: 255 })
  email: string;

  @Column({ length: 150 })
  companyName: string;

  @Column({ length: 100 })
  username: string;

  @Column({ length: 128 })
  token: string;

  @Column({ length: 20, default: "pending" })
  status: string;

  @Column({ length: 10, nullable: true })
  onboardingType: string | null;

  @Column({ type: "timestamptz", name: "expires_at" })
  expiresAt: Date;
}
