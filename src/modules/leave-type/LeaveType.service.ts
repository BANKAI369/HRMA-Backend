import { AppDataSource } from "../../config/data-source";
import { LeaveType } from "../../entities/LeaveType";
import { CreateLeaveTypeDto } from "./dto/create-leave-type.dto";

export class LeaveTypeService {
  private repository =
    AppDataSource.getRepository(LeaveType);

  async create(
    dto: CreateLeaveTypeDto,
    tenantId: string
  ) {
    const existing = await this.repository.findOne({
      where: {
        tenantId,
        code: dto.code,
      },
    });

    if (existing) {
      throw new Error(
        "Leave type code already exists"
      );
    }

    const leaveType = this.repository.create({
      ...dto,
      tenantId,
    });

    return await this.repository.save(leaveType);
  }

  async getAll(tenantId: string) {
    return await this.repository.find({
      where: {
        tenantId,
        isActive: true,
      },
      order: {
        name: "ASC",
      },
    });
  }

  async getById(id: string) {
    return await this.repository.findOne({
      where: { id },
    });
  }

  async deactivate(id: string) {
    await this.repository.update(id, {
      isActive: false,
    });
  }

  async update(
    id: string,
    payload: Partial<LeaveType>
  ) {
    await this.repository.update(id, payload);

    return this.getById(id);
  }
}
