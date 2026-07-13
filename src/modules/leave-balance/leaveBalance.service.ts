import { EntityManager } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import { LeavePolicy } from "../../entities/LeavePolicies";
import { LeaveBalance } from "../../entities/LeaveBalances";
import { LeavePolicyRule } from "../../entities/LeavePolicyRules";

export type LeaveBalanceUpdateInput = Partial<
  Pick<
    LeaveBalance,
    "allocated" | "used" | "pending" | "remaining"
  >
>;

type BalanceMutationInput = {
  employeeId: string;
  leaveTypeId: string;
  days: number;
  year?: number;
};

export class LeaveBalanceService {
  private get balanceRepo() {
    return AppDataSource.getRepository(LeaveBalance);
  }

  private get ruleRepo() {
    return AppDataSource.getRepository(LeavePolicyRule);
  }

  private get policyRepo() {
    return AppDataSource.getRepository(LeavePolicy);
  }

  private getCurrentYear() {
    return new Date().getUTCFullYear();
  }

  private getBalanceRepository(manager?: EntityManager) {
    return (manager ?? AppDataSource.manager).getRepository(LeaveBalance);
  }

  private getRuleRepository(manager?: EntityManager) {
    return (manager ?? AppDataSource.manager).getRepository(LeavePolicyRule);
  }

  private normalizeNumber(value: unknown) {
    const numberValue = Number(value);

    if (!Number.isFinite(numberValue)) {
      throw new Error("Invalid balance value");
    }

    return numberValue;
  }

  private async findBalance(
    employeeId: string,
    leaveTypeId: string,
    year: number,
    manager?: EntityManager
  ) {
    return this.getBalanceRepository(manager).findOne({
      where: {
        employeeId,
        leaveTypeId,
        year,
      },
    });
  }

  async generateBalance(
    tenantId: string,
    employeeId: string,
    policyId: string,
    year = this.getCurrentYear(),
    manager?: EntityManager
  ) {
    const policy = await (manager ?? AppDataSource.manager)
      .getRepository(LeavePolicy)
      .findOne({ where: { id: policyId } });

    if (!policy || policy.tenantId !== tenantId) {
      throw new Error("Policy not found");
    }

    const rules = await this.getRuleRepository(manager).find({
        where: {
          policyId,
        },
      });

    if (!rules.length) {
      return [];
    }

    const balances = [];

    for (const rule of rules) {
      const existing = await this.findBalance(
        employeeId,
        rule.leaveTypeId,
        year,
        manager
      );

      if (existing) {
        continue;
      }

      const balance = this.getBalanceRepository(manager).create({
        tenantId,
        employeeId,
        policyId,
        leaveTypeId: rule.leaveTypeId,
        year,
        allocated: rule.annualQuota,
        used: 0,
        pending: 0,
        remaining: rule.annualQuota,
      });

      balances.push(balance);
    }

    return this.getBalanceRepository(manager).save(balances);
  }

  async getEmployeeBalances(employeeId: string, tenantId?: string) {
    return this.getBalanceRepository().find({
      where: {
        employeeId,
        ...(tenantId ? { tenantId } : {}),
      },
      order: {
        year: "DESC",
        createdAt: "DESC",
      },
    });
  }

  async getBalance(id: string, tenantId?: string) {
    return this.getBalanceRepository().findOne({
      where: {
        id,
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }

  async updateBalance(
    id: string,
    payload: LeaveBalanceUpdateInput,
    tenantId?: string
  ) {
    const balance = await this.getBalance(id, tenantId);

    if (!balance) {
      throw new Error("Balance not found");
    }

    if (payload.allocated !== undefined) {
      balance.allocated = this.normalizeNumber(payload.allocated);
    }

    if (payload.used !== undefined) {
      balance.used = this.normalizeNumber(payload.used);
    }

    if (payload.pending !== undefined) {
      balance.pending = this.normalizeNumber(payload.pending);
    }

    if (payload.remaining !== undefined) {
      balance.remaining = this.normalizeNumber(payload.remaining);
    } else if (
      payload.allocated !== undefined ||
      payload.used !== undefined ||
      payload.pending !== undefined
    ) {
      balance.remaining =
        this.normalizeNumber(balance.allocated) -
        this.normalizeNumber(balance.used) -
        this.normalizeNumber(balance.pending);
    }

    if (this.normalizeNumber(balance.remaining) < 0) {
      throw new Error("Invalid balance totals");
    }

    return this.getBalanceRepository().save(balance);
  }

  async reserveLeave(
    input: BalanceMutationInput,
    tenantId?: string,
    manager?: EntityManager
  ) {
    const year = input.year ?? this.getCurrentYear();
    const balance = await this.findBalance(
      input.employeeId,
      input.leaveTypeId,
      year,
      manager
    );

    if (!balance) {
      throw new Error("Balance not found");
    }

    if (tenantId && balance.tenantId !== tenantId) {
      throw new Error("Balance not found");
    }

    const available = this.normalizeNumber(balance.remaining);

    if (available < input.days) {
      throw new Error("Insufficient leave balance");
    }

    balance.pending = this.normalizeNumber(balance.pending) + input.days;
    balance.remaining = available - input.days;

    return this.getBalanceRepository(manager).save(balance);
  }

  async approveLeave(
    input: BalanceMutationInput,
    tenantId?: string,
    manager?: EntityManager
  ) {
    const year = input.year ?? this.getCurrentYear();
    const balance = await this.findBalance(
      input.employeeId,
      input.leaveTypeId,
      year,
      manager
    );

    if (!balance) {
      throw new Error("Balance not found");
    }

    if (tenantId && balance.tenantId !== tenantId) {
      throw new Error("Balance not found");
    }

    const pending = this.normalizeNumber(balance.pending);
    const remaining = this.normalizeNumber(balance.remaining);
    const used = this.normalizeNumber(balance.used);

    if (pending >= input.days) {
      balance.pending = pending - input.days;
      balance.used = used + input.days;
    } else if (remaining >= input.days) {
      balance.used = used + input.days;
      balance.remaining = remaining - input.days;
    } else {
      throw new Error("Insufficient leave balance");
    }

    return this.getBalanceRepository(manager).save(balance);
  }

  async releasePendingLeave(
    input: BalanceMutationInput,
    tenantId?: string,
    manager?: EntityManager
  ) {
    const year = input.year ?? this.getCurrentYear();
    const balance = await this.findBalance(
      input.employeeId,
      input.leaveTypeId,
      year,
      manager
    );

    if (!balance) {
      throw new Error("Balance not found");
    }

    if (tenantId && balance.tenantId !== tenantId) {
      throw new Error("Balance not found");
    }

    const pending = this.normalizeNumber(balance.pending);

    if (pending <= 0) {
      return balance;
    }

    const releaseDays = Math.min(input.days, pending);
    balance.pending = pending - releaseDays;
    balance.remaining = this.normalizeNumber(balance.remaining) + releaseDays;

    return this.getBalanceRepository(manager).save(balance);
  }

  async restoreApprovedLeave(
    input: BalanceMutationInput,
    tenantId?: string,
    manager?: EntityManager
  ) {
    const year = input.year ?? this.getCurrentYear();
    const balance = await this.findBalance(
      input.employeeId,
      input.leaveTypeId,
      year,
      manager
    );

    if (!balance) {
      throw new Error("Balance not found");
    }

    if (tenantId && balance.tenantId !== tenantId) {
      throw new Error("Balance not found");
    }

    const used = this.normalizeNumber(balance.used);

    if (used < input.days) {
      throw new Error("Balance cannot be restored below zero");
    }

    balance.used = used - input.days;
    balance.remaining = this.normalizeNumber(balance.remaining) + input.days;

    return this.getBalanceRepository(manager).save(balance);
  }

  async consumeLeave(
    employeeId: string,
    leaveTypeId: string,
    days: number,
    year = this.getCurrentYear(),
    manager?: EntityManager
  ) {
    return this.approveLeave(
      {
        employeeId,
        leaveTypeId,
        days,
        year,
      },
      undefined,
      manager
    );
  }
}
