import { AppDataSource } from "../config/data-source";
import { BatchPayment } from "../entities/BatchPayment";
import { BonusType } from "../entities/BonusType";
import { EmployeeFnF } from "../entities/EmployeeFnF";
import { EmployeeProfile } from "../entities/EmployeeProfile";
import { EmployeeSalary } from "../entities/EmployeeSalary";
import { PayBand } from "../entities/PayBand";
import { PayBatch } from "../entities/PayBatch";
import { PayCycle } from "../entities/PayCycle";
import { PayGrade } from "../entities/PayGrade";
import { PayGroup } from "../entities/PayGroup";
import { SalaryComponent } from "../entities/SalaryComponent";
import { User } from "../entities/User";

const salaryComponentRepository = AppDataSource.getRepository(SalaryComponent);
const payGroupRepository = AppDataSource.getRepository(PayGroup);
const payCycleRepository = AppDataSource.getRepository(PayCycle);
const payBatchRepository = AppDataSource.getRepository(PayBatch);
const batchPaymentRepository = AppDataSource.getRepository(BatchPayment);
const payGradeRepository = AppDataSource.getRepository(PayGrade);
const payBandRepository = AppDataSource.getRepository(PayBand);
const employeeSalaryRepository = AppDataSource.getRepository(EmployeeSalary);
const employeeFnfRepository = AppDataSource.getRepository(EmployeeFnF);
const bonusTypeRepository = AppDataSource.getRepository(BonusType);
const employeeProfileRepository = AppDataSource.getRepository(EmployeeProfile);

export type UpdatePaymentStatusInput = {
  paymentStatus: "PENDING" | "PROCESSING" | "PAID" | "FAILED" | "CANCELLED";
  paymentReference?: string | null;
  paidAt?: string | null;
};

const toNumber = (value: string | number | null | undefined) =>
  value == null ? 0 : Number(value);

const normalizeOptionalText = (value: string | null | undefined) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const buildFullName = (profile: EmployeeProfile | null, user: User | null) => {
  const firstName = profile?.firstName?.trim();
  const lastName = profile?.lastName?.trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  return fullName || user?.username || null;
};

export class PayrollService {
  private async loadProfilesByUserIds(userIds: string[]) {
    if (!userIds.length) {
      return new Map<string, EmployeeProfile>();
    }

    const profiles = await employeeProfileRepository
      .createQueryBuilder("profile")
      .where("profile.userId IN (:...userIds)", { userIds })
      .getMany();

    return new Map(profiles.map((profile) => [profile.userId, profile]));
  }

  private serializeSalaryComponent(component: SalaryComponent) {
    return {
      id: component.id,
      code: component.code,
      name: component.name,
      type: component.type,
      calculationType: component.calculationType,
      isTaxable: component.isTaxable,
      isActive: component.isActive,
      createdAt: component.createdAt?.toISOString?.(),
      updatedAt: component.updatedAt?.toISOString?.(),
    };
  }

  private serializePayCycle(payCycle: PayCycle) {
    return {
      id: payCycle.id,
      name: payCycle.name,
      frequency: payCycle.frequency,
      processingDay: payCycle.processingDay,
      payoutDay: payCycle.payoutDay,
      isActive: payCycle.isActive,
      createdAt: payCycle.createdAt?.toISOString?.(),
      updatedAt: payCycle.updatedAt?.toISOString?.(),
    };
  }

  private serializePayGroup(payGroup: PayGroup) {
    return {
      id: payGroup.id,
      name: payGroup.name,
      description: payGroup.description,
      payCycle: payGroup.payCycle
        ? {
            id: payGroup.payCycle.id,
            name: payGroup.payCycle.name,
            frequency: payGroup.payCycle.frequency,
          }
        : null,
      currency: payGroup.currency
        ? {
            id: payGroup.currency.id,
            name: payGroup.currency.name,
            code: payGroup.currency.code,
            symbol: payGroup.currency.symbol,
          }
        : null,
      isActive: payGroup.isActive,
      createdAt: payGroup.createdAt?.toISOString?.(),
      updatedAt: payGroup.updatedAt?.toISOString?.(),
    };
  }

  private serializePayBatch(batch: PayBatch) {
    return {
      id: batch.id,
      batchNumber: batch.batchNumber,
      name: batch.name,
      periodStart: batch.periodStart,
      periodEnd: batch.periodEnd,
      payoutDate: batch.payoutDate,
      status: batch.status,
      payGroup: batch.payGroup
        ? {
            id: batch.payGroup.id,
            name: batch.payGroup.name,
          }
        : null,
      payCycle: batch.payCycle
        ? {
            id: batch.payCycle.id,
            name: batch.payCycle.name,
            frequency: batch.payCycle.frequency,
          }
        : null,
      createdAt: batch.createdAt?.toISOString?.(),
      updatedAt: batch.updatedAt?.toISOString?.(),
    };
  }

  private serializePayGrade(payGrade: PayGrade) {
    return {
      id: payGrade.id,
      name: payGrade.name,
      description: payGrade.description,
      minAmount: toNumber(payGrade.minAmount),
      maxAmount: toNumber(payGrade.maxAmount),
      currency: payGrade.currency
        ? {
            id: payGrade.currency.id,
            name: payGrade.currency.name,
            code: payGrade.currency.code,
            symbol: payGrade.currency.symbol,
          }
        : null,
      isActive: payGrade.isActive,
      createdAt: payGrade.createdAt?.toISOString?.(),
      updatedAt: payGrade.updatedAt?.toISOString?.(),
    };
  }

  private serializePayBand(payBand: PayBand) {
    return {
      id: payBand.id,
      name: payBand.name,
      description: payBand.description,
      minAmount: toNumber(payBand.minAmount),
      maxAmount: toNumber(payBand.maxAmount),
      payGrade: payBand.payGrade
        ? {
            id: payBand.payGrade.id,
            name: payBand.payGrade.name,
          }
        : null,
      isActive: payBand.isActive,
      createdAt: payBand.createdAt?.toISOString?.(),
      updatedAt: payBand.updatedAt?.toISOString?.(),
    };
  }

  private serializeBonusType(bonusType: BonusType) {
    return {
      id: bonusType.id,
      name: bonusType.name,
      description: bonusType.description,
      payoutMode: bonusType.payoutMode,
      isRecurring: bonusType.isRecurring,
      isActive: bonusType.isActive,
      createdAt: bonusType.createdAt?.toISOString?.(),
      updatedAt: bonusType.updatedAt?.toISOString?.(),
    };
  }

  private serializeBatchPayment(
    payment: BatchPayment,
    profile: EmployeeProfile | null
  ) {
    return {
      id: payment.id,
      employee: {
        id: payment.user?.id ?? null,
        employeeCode: payment.employeeCode,
        username: payment.user?.username ?? null,
        email: payment.user?.email ?? null,
        fullName: buildFullName(profile, payment.user ?? null),
      },
      payBatch: payment.payBatch
        ? {
            id: payment.payBatch.id,
            batchNumber: payment.payBatch.batchNumber,
            name: payment.payBatch.name,
            status: payment.payBatch.status,
          }
        : null,
      grossAmount: toNumber(payment.grossAmount),
      deductionAmount: toNumber(payment.deductionAmount),
      netAmount: toNumber(payment.netAmount),
      paymentStatus: payment.paymentStatus,
      paidAt: payment.paidAt?.toISOString?.() ?? null,
      paymentReference: payment.paymentReference,
      createdAt: payment.createdAt?.toISOString?.(),
      updatedAt: payment.updatedAt?.toISOString?.(),
    };
  }

  async listSalaryComponents() {
    const components = await salaryComponentRepository.find({
      order: { name: "ASC" },
    });

    return components.map((component) => this.serializeSalaryComponent(component));
  }

  async listPayGroups() {
    const payGroups = await payGroupRepository.find({
      relations: ["payCycle", "currency"],
      order: { name: "ASC" },
    });

    return payGroups.map((payGroup) => this.serializePayGroup(payGroup));
  }

  async listPayCycles() {
    const payCycles = await payCycleRepository.find({
      order: { name: "ASC" },
    });

    return payCycles.map((payCycle) => this.serializePayCycle(payCycle));
  }

  async listPayRegister() {
    const payments = await batchPaymentRepository.find({
      relations: ["payBatch", "user"],
      order: { createdAt: "DESC" },
    });
    const profilesByUserId = await this.loadProfilesByUserIds(
      payments.map((payment) => payment.userId).filter((value): value is string => Boolean(value))
    );

    return payments.map((payment) => ({
      ...this.serializeBatchPayment(
        payment,
        payment.userId ? profilesByUserId.get(payment.userId) ?? null : null
      ),
      periodStart: payment.payBatch?.periodStart ?? null,
      periodEnd: payment.payBatch?.periodEnd ?? null,
    }));
  }

  async listPayBatches() {
    const batches = await payBatchRepository.find({
      relations: ["payGroup", "payCycle"],
      order: { createdAt: "DESC" },
    });

    return batches.map((batch) => this.serializePayBatch(batch));
  }

  async listBatchPayments() {
    const payments = await batchPaymentRepository.find({
      relations: ["payBatch", "user"],
      order: { createdAt: "DESC" },
    });
    const profilesByUserId = await this.loadProfilesByUserIds(
      payments.map((payment) => payment.userId).filter((value): value is string => Boolean(value))
    );

    return payments.map((payment) =>
      this.serializeBatchPayment(
        payment,
        payment.userId ? profilesByUserId.get(payment.userId) ?? null : null
      )
    );
  }

  async updatePaymentStatus(paymentId: string, input: UpdatePaymentStatusInput) {
    const payment = await batchPaymentRepository.findOne({
      where: { id: paymentId },
      relations: ["payBatch", "user"],
    });

    if (!payment) {
      throw Object.assign(new Error("Batch payment not found"), {
        statusCode: 404,
      });
    }

    payment.paymentStatus = input.paymentStatus;

    if (input.paymentReference !== undefined) {
      payment.paymentReference = normalizeOptionalText(input.paymentReference) ?? null;
    }

    if (input.paidAt !== undefined) {
      payment.paidAt = input.paidAt ? new Date(input.paidAt) : null;
    } else if (input.paymentStatus === "PAID" && !payment.paidAt) {
      payment.paidAt = new Date();
    }

    if (input.paymentStatus !== "PAID" && input.paidAt === undefined) {
      payment.paidAt = null;
    }

    const savedPayment = await batchPaymentRepository.save(payment);
    const profile = savedPayment.userId
      ? await employeeProfileRepository.findOne({
          where: { userId: savedPayment.userId },
        })
      : null;

    return this.serializeBatchPayment(savedPayment, profile);
  }

  async listPayGrades() {
    const payGrades = await payGradeRepository.find({
      relations: ["currency"],
      order: { name: "ASC" },
    });

    return payGrades.map((payGrade) => this.serializePayGrade(payGrade));
  }

  async listPayBands() {
    const payBands = await payBandRepository.find({
      relations: ["payGrade"],
      order: { name: "ASC" },
    });

    return payBands.map((payBand) => this.serializePayBand(payBand));
  }

  async listEmployeeSalaries() {
    const salaries = await employeeSalaryRepository.find({
      relations: ["user", "payGroup", "payGrade", "payBand"],
      order: { createdAt: "DESC" },
    });
    const profilesByUserId = await this.loadProfilesByUserIds(
      salaries.map((salary) => salary.userId)
    );

    return salaries.map((salary) => {
      const profile = profilesByUserId.get(salary.userId) ?? null;

      return {
        id: salary.id,
        employee: {
          id: salary.user.id,
          employeeCode: salary.employeeCode,
          username: salary.user.username,
          email: salary.user.email,
          fullName: buildFullName(profile, salary.user),
        },
        payGroup: salary.payGroup
          ? {
              id: salary.payGroup.id,
              name: salary.payGroup.name,
            }
          : null,
        payGrade: salary.payGrade
          ? {
              id: salary.payGrade.id,
              name: salary.payGrade.name,
            }
          : null,
        payBand: salary.payBand
          ? {
              id: salary.payBand.id,
              name: salary.payBand.name,
            }
          : null,
        annualCtc: toNumber(salary.annualCtc),
        monthlyGross: toNumber(salary.monthlyGross),
        monthlyNet: toNumber(salary.monthlyNet),
        effectiveFrom: salary.effectiveFrom,
        components: salary.components,
        isActive: salary.isActive,
        createdAt: salary.createdAt?.toISOString?.(),
        updatedAt: salary.updatedAt?.toISOString?.(),
      };
    });
  }

  async listEmployeeFnfDetails() {
    const fnfRecords = await employeeFnfRepository.find({
      relations: ["user"],
      order: { createdAt: "DESC" },
    });
    const profilesByUserId = await this.loadProfilesByUserIds(
      fnfRecords.map((record) => record.userId)
    );

    return fnfRecords.map((record) => {
      const profile = profilesByUserId.get(record.userId) ?? null;

      return {
        id: record.id,
        employee: {
          id: record.user.id,
          employeeCode: record.employeeCode,
          username: record.user.username,
          email: record.user.email,
          fullName: buildFullName(profile, record.user),
        },
        lastWorkingDate: record.lastWorkingDate,
        status: record.status,
        payableAmount: toNumber(record.payableAmount),
        deductionAmount: toNumber(record.deductionAmount),
        netSettlementAmount: toNumber(record.netSettlementAmount),
        remarks: record.remarks,
        createdAt: record.createdAt?.toISOString?.(),
        updatedAt: record.updatedAt?.toISOString?.(),
      };
    });
  }

  async listBonusTypes() {
    const bonusTypes = await bonusTypeRepository.find({
      order: { name: "ASC" },
    });

    return bonusTypes.map((bonusType) => this.serializeBonusType(bonusType));
  }
}

