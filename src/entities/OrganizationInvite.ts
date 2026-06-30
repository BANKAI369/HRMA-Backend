import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  Unique,
} from "typeorm";
import { BaseEntity } from "./base.entity";
import { Organization } from "./Organization";
import { Tenant } from "./Tenant";
import { User } from "./User";

@Entity("organization_invites")
@Unique(["token"])
export class OrganizationInvite extends BaseEntity {
  @Column({ type: "uuid", name: "tenant_id" })
  tenantId: string;

  @ManyToOne(() => Tenant, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "tenant_id" })
  tenant: Tenant;

  @Column({ type: "uuid", name: "organization_id" })
  organizationId: string;

  @ManyToOne(() => Organization, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "organization_id" })
  organization: Organization;

  @Column({ length: 255 })
  email: string;

  @Column({ name: "role_name", length: 60, default: "Employee" })
  roleName: string;

  @Column({ length: 128 })
  token: string;

  @Column({ length: 20, default: "pending" })
  status: string;

  @Column({ type: "uuid", name: "invited_by_user_id", nullable: true })
  invitedByUserId: string | null;

  @ManyToOne(() => User, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "invited_by_user_id" })
  invitedBy: User | null;

  @Column({ type: "uuid", name: "accepted_by_user_id", nullable: true })
  acceptedByUserId: string | null;

  @ManyToOne(() => User, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "accepted_by_user_id" })
  acceptedBy: User | null;

  @Column({ type: "timestamptz", name: "expires_at" })
  expiresAt: Date;

  @Column({ type: "timestamptz", name: "accepted_at", nullable: true })
  acceptedAt: Date | null;
}
