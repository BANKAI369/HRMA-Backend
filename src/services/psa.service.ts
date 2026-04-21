import { AppDataSource } from "../config/data-source";
import { Client } from "../entities/Client";
import { Project, ProjectStatus } from "../entities/Projects";
import { ProjectPhase } from "../entities/ProjectPhase";

const clientRepo = AppDataSource.getRepository(Client);
const projectRepo = AppDataSource.getRepository(Project);
const projectPhaseRepo = AppDataSource.getRepository(ProjectPhase);

export type CreateClientInput = {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  address?: string;
  isActive?: boolean;
};

export type UpdateClientInput = Partial<CreateClientInput>;

export type CreateProjectInput = {
  name: string;
  code: string;
  description?: string;
  status?: ProjectStatus;
  startDate?: string;
  endDate?: string;
  budget?: number;
  clientId: string;
};

export type UpdateProjectInput = Partial<CreateProjectInput>;

export type CreateProjectPhaseInput = {
  name: string;
  description?: string;
  phaseOrder?: number;
  isActive?: boolean;
  projectId: string;
};

const BILLING_ROLES = [
  { id: "billable", name: "Billable" },
  { id: "non-billable", name: "Non-Billable" },
  { id: "shadow", name: "Shadow" },
  { id: "management", name: "Management" },
];

export class PsaService {
  async listClients() {
    return clientRepo.find({
      relations: ["projects"],
      order: { name: "ASC" },
    });
  }

  async createClient(input: CreateClientInput) {
    const name = input.name.trim();
    const existing = await clientRepo.findOne({ where: { name } });

    if (existing) {
      throw new Error("Client already exists");
    }

    if (input.email) {
      const normalizedEmail = input.email.trim().toLowerCase();
      const existingEmail = await clientRepo.findOne({
        where: { email: normalizedEmail },
      });

      if (existingEmail) {
        throw new Error("Client email already exists");
      }
    }

    const client = clientRepo.create({
      name,
      contactPerson: input.contactPerson?.trim() || undefined,
      email: input.email?.trim().toLowerCase() || undefined,
      phone: input.phone?.trim() || undefined,
      companyName: input.companyName?.trim() || undefined,
      address: input.address?.trim() || undefined,
      isActive: input.isActive ?? true,
    });

    return clientRepo.save(client);
  }

  async getClient(id: string) {
    const client = await clientRepo.findOne({
      where: { id },
      relations: ["projects", "projects.phases"],
    });

    if (!client) {
      throw new Error("Client not found");
    }

    return client;
  }

  async updateClient(id: string, input: UpdateClientInput) {
    const client = await clientRepo.findOne({ where: { id } });

    if (!client) {
      throw new Error("Client not found");
    }

    if (input.name) {
      const name = input.name.trim();
      const existing = await clientRepo.findOne({ where: { name } });
      if (existing && existing.id !== id) {
        throw new Error("Client already exists");
      }
      client.name = name;
    }

    if (typeof input.email !== "undefined") {
      const normalizedEmail = input.email?.trim().toLowerCase() || null;
      if (normalizedEmail) {
        const existingEmail = await clientRepo.findOne({
          where: { email: normalizedEmail },
        });
        if (existingEmail && existingEmail.id !== id) {
          throw new Error("Client email already exists");
        }
      }
      client.email = normalizedEmail ?? undefined;
    }

    if (typeof input.contactPerson !== "undefined") {
      client.contactPerson = input.contactPerson?.trim() || undefined;
    }

    if (typeof input.phone !== "undefined") {
      client.phone = input.phone?.trim() || undefined;
    }

    if (typeof input.companyName !== "undefined") {
      client.companyName = input.companyName?.trim() || undefined;
    }

    if (typeof input.address !== "undefined") {
      client.address = input.address?.trim() || undefined;
    }

    if (typeof input.isActive !== "undefined") {
      client.isActive = input.isActive;
    }

    return clientRepo.save(client);
  }

  async listBillingRoles() {
    return BILLING_ROLES;
  }

  async listProjects() {
    return projectRepo.find({
      relations: ["client", "phases"],
      order: { createdAt: "DESC" },
    });
  }

  async createProject(input: CreateProjectInput) {
    const client = await clientRepo.findOne({ where: { id: input.clientId } });

    if (!client) {
      throw new Error("Client not found");
    }

    const code = input.code.trim();
    const existing = await projectRepo.findOne({ where: { code } });
    if (existing) {
      throw new Error("Project code already exists");
    }

    const project = projectRepo.create({
      name: input.name.trim(),
      code,
      description: input.description?.trim() || undefined,
      status: input.status ?? ProjectStatus.PLANNED,
      startDate: input.startDate,
      endDate: input.endDate,
      budget: input.budget,
      clientId: client.id,
      client,
    });

    return projectRepo.save(project);
  }

  async getProject(id: string) {
    const project = await projectRepo.findOne({
      where: { id },
      relations: ["client", "phases"],
    });

    if (!project) {
      throw new Error("Project not found");
    }

    project.phases = [...(project.phases ?? [])].sort(
      (left, right) => left.phaseOrder - right.phaseOrder
    );

    return project;
  }

  async updateProject(id: string, input: UpdateProjectInput) {
    const project = await projectRepo.findOne({
      where: { id },
      relations: ["client"],
    });

    if (!project) {
      throw new Error("Project not found");
    }

    if (input.clientId) {
      const client = await clientRepo.findOne({ where: { id: input.clientId } });
      if (!client) {
        throw new Error("Client not found");
      }
      project.clientId = client.id;
      project.client = client;
    }

    if (input.name) {
      project.name = input.name.trim();
    }

    if (input.code) {
      const code = input.code.trim();
      const existing = await projectRepo.findOne({ where: { code } });
      if (existing && existing.id !== id) {
        throw new Error("Project code already exists");
      }
      project.code = code;
    }

    if (typeof input.description !== "undefined") {
      project.description = input.description?.trim() || undefined;
    }

    if (typeof input.status !== "undefined") {
      project.status = input.status;
    }

    if (typeof input.startDate !== "undefined") {
      project.startDate = input.startDate;
    }

    if (typeof input.endDate !== "undefined") {
      project.endDate = input.endDate;
    }

    if (typeof input.budget !== "undefined") {
      project.budget = input.budget;
    }

    return projectRepo.save(project);
  }

  async listProjectPhases(projectId?: string) {
    return projectPhaseRepo.find({
      where: projectId ? { projectId } : {},
      relations: ["project"],
      order: { phaseOrder: "ASC", createdAt: "ASC" },
    });
  }

  async createProjectPhase(input: CreateProjectPhaseInput) {
    const project = await projectRepo.findOne({ where: { id: input.projectId } });

    if (!project) {
      throw new Error("Project not found");
    }

    const phase = projectPhaseRepo.create({
      name: input.name.trim(),
      description: input.description?.trim() || undefined,
      phaseOrder: input.phaseOrder ?? 1,
      isActive: input.isActive ?? true,
      projectId: project.id,
      project,
    });

    return projectPhaseRepo.save(phase);
  }
}
