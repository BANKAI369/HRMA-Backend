import { AppDataSource } from "../config/data-source";
import { Module } from "../entities/Module";

type ModuleSeed = {
  code: string;
  name: string;
  description: string;
};

const modules: ModuleSeed[] = [
  {
    code: "admin",
    name: "Admin",
    description: "Roles, permissions, and access-control workflows.",
  },
  {
    code: "finance",
    name: "Finance",
    description: "Expenses, reimbursements, payroll, and financial workflows.",
  },
  {
    code: "leaves",
    name: "Leaves",
    description: "Time-off requests, approvals, and leave balance tracking.",
  },
  {
    code: "attendance",
    name: "Attendance",
    description: "Clock-in, clock-out, and daily attendance monitoring.",
  },
  {
    code: "inbox",
    name: "Inbox",
    description: "Internal communication, messages, and notifications.",
  },
  {
    code: "documents",
    name: "Documents",
    description: "Policies, files, templates, and employee documents.",
  },
  {
    code: "goals",
    name: "Goals",
    description: "Objectives, progress tracking, and performance goals.",
  },
  {
    code: "expenses",
    name: "Expenses",
    description: "Expense submissions, approvals, and reimbursements.",
  },
  {
    code: "engage",
    name: "Engage",
    description: "Announcements, praise, and team engagement posts.",
  },
];

export const seedModules = async () => {
  const moduleRepo = AppDataSource.getRepository(Module);

  console.log("Seeding application modules...");

  for (const moduleSeed of modules) {
    const existing = await moduleRepo.findOne({
      where: { code: moduleSeed.code },
    });

    if (existing) {
      existing.name = moduleSeed.name;
      existing.description = moduleSeed.description;
      existing.isActive = true;
      await moduleRepo.save(existing);
      continue;
    }

    const moduleEntity = moduleRepo.create({
      ...moduleSeed,
      isActive: true,
    });

    await moduleRepo.save(moduleEntity);
  }

  console.log("Application modules seed completed");
};
