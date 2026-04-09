import { AppDataSource } from "../config/data-source";
import { Currency } from "../entities/Currency";
import { Department } from "../entities/Department";
import { EmployeeGroup } from "../entities/EmployeeGroup";
import { ExitReason } from "../entities/ExitReason";
import { GroupType } from "../entities/GroupType";
import { JobTitle } from "../entities/JobTitle";
import { Location } from "../entities/Location";
import { NoticePeriod } from "../entities/NoticePeriod";

const departmentRepository = AppDataSource.getRepository(Department);
const locationRepository = AppDataSource.getRepository(Location);
const jobTitleRepository = AppDataSource.getRepository(JobTitle);
const currencyRepository = AppDataSource.getRepository(Currency);
const noticePeriodRepository = AppDataSource.getRepository(NoticePeriod);
const exitReasonRepository = AppDataSource.getRepository(ExitReason);
const groupTypeRepository = AppDataSource.getRepository(GroupType);
const groupRepository = AppDataSource.getRepository(EmployeeGroup);

export async function findAllDepartments() {
  const departments = await departmentRepository.find({
    order: {
      name: "ASC",
    },
  });

  return departments.map((department) => ({
    id: department.id,
    name: department.name,
  }));
}

export async function findAllLocations() {
  return locationRepository.find({
    order: {
      name: "ASC",
    },
  });
}

export async function findAllJobTitles() {
  return jobTitleRepository.find({
    order: {
      name: "ASC",
    },
  });
}

export async function findAllCurrencies() {
  return currencyRepository.find({
    order: {
      name: "ASC",
    },
  });
}

export async function findAllNoticePeriods() {
  return noticePeriodRepository.find({
    order: {
      days: "ASC",
    },
  });
}

export async function findAllExitReasons() {
  return exitReasonRepository.find({
    order: {
      name: "ASC",
    },
  });
}

export async function findAllGroups() {
  return groupRepository.find({
    order: {
      name: "ASC",
    },
  });
}

export async function findAllGroupTypes() {
  return groupTypeRepository.find({
    order: {
      name: "ASC",
    },
  });
}

export async function findAllMasterData() {
  return {
    departments: await findAllDepartments(),
    locations: await findAllLocations(),
    jobTitles: await findAllJobTitles(),
    currencies: await findAllCurrencies(),
    noticePeriods: await findAllNoticePeriods(),
    exitReasons: await findAllExitReasons(),
    groups: await findAllGroups(),
    groupTypes: await findAllGroupTypes(),
  };
}
