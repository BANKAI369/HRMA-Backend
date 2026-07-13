import { AppDataSource } from "../../config/data-source";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { CalendarEventDto } from "../calendar/dto/calendar-response.dto";
import { Holiday } from "./Entity";

const holidayRepo = AppDataSource.getRepository(Holiday);

type HolidayMatchOptions = {
  tenantId?: string | null;
  region?: string | null;
};

export type HolidayEvent = Holiday & { date: string };

@Injectable()
export class HolidayService implements OnModuleInit {
  private readonly logger = new Logger(HolidayService.name);
  private holidayCache: Holiday[] = [];
  private lastCacheRefresh = 0;
  private static readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000;

  async onModuleInit() {
    try {
      await this.refreshCache();
    } catch (error) {
      this.logger.error("Failed to initialize holiday cache", error as Error);
    }

    setInterval(() => {
      this.refreshCache().catch((error) => {
        this.logger.error("Holiday cache refresh failed", error as Error);
      });
    }, HolidayService.CACHE_TTL_MS);
  }

  async refreshCache() {
    this.holidayCache = await holidayRepo.find();
    this.lastCacheRefresh = Date.now();
    this.logger.log(`Holiday cache refreshed (${this.holidayCache.length} records)`);
    return this.holidayCache;
  }

  private async ensureCache() {
    if (
      !this.holidayCache.length ||
      Date.now() - this.lastCacheRefresh > HolidayService.CACHE_TTL_MS
    ) {
      await this.refreshCache();
    }
  }

  private normalizeDateString(date: string) {
    return date.split("T")[0];
  }

  private dateMonthDay(date: string | Date) {
    const parsed = typeof date === "string" ? new Date(`${date}T00:00:00.000Z`) : date;
    return `${parsed.getUTCMonth() + 1}-${parsed.getUTCDate()}`;
  }

  private matchesTenant(holiday: Holiday, tenantId?: string | null) {
    if (holiday.tenantId === null) {
      return true;
    }

    return tenantId === holiday.tenantId;
  }

  private matchesRegion(holiday: Holiday, region?: string | null) {
    return !holiday.region || !region || holiday.region === region;
  }

  private buildDateRange(start: string, end: string) {
    const range: Array<{ iso: string; monthDay: string }> = [];
    const startDate = new Date(`${start}T00:00:00.000Z`);
    const endDate = new Date(`${end}T00:00:00.000Z`);

    for (let d = new Date(startDate); d <= endDate; d.setUTCDate(d.getUTCDate() + 1)) {
      const iso = d.toISOString().split("T")[0];
      range.push({ iso, monthDay: this.dateMonthDay(d) });
    }

    return range;
  }

  async create(data: any) {
    const holiday = holidayRepo.create({
      ...data,
      tenantId: data.tenantId ?? null,
      region: data.region ?? null,
    });

    const saved = await holidayRepo.save(holiday);
    await this.refreshCache();
    return saved;
  }

  async findAll(tenantId?: string | null, region?: string | null) {
    await this.ensureCache();
    return this.holidayCache.filter(
      (holiday) =>
        this.matchesTenant(holiday, tenantId) &&
        this.matchesRegion(holiday, region)
    );
  }

  async findOne(id: string) {
    const holiday = await holidayRepo.findOne({ where: { id } });
    if (!holiday) throw new Error("Holiday not found");
    return holiday;
  }

  async update(id: string, data: any) {
    const holiday = await this.findOne(id);
    Object.assign(holiday, data);
    const updated = await holidayRepo.save(holiday);
    await this.refreshCache();
    return updated;
  }

  async remove(id: string) {
    const holiday = await this.findOne(id);
    const removed = await holidayRepo.remove(holiday);
    await this.refreshCache();
    return removed;
  }

  async isHoliday(
    date: string,
    tenantId?: string | null,
    region?: string | null
  ): Promise<boolean> {
    await this.ensureCache();
    const normalized = this.normalizeDateString(date);

    return this.holidayCache.some((holiday) => {
      if (!this.matchesTenant(holiday, tenantId)) return false;
      if (!this.matchesRegion(holiday, region)) return false;
      if (holiday.date === normalized) return true;
      if (holiday.isRecurring) {
        return this.dateMonthDay(holiday.date) === this.dateMonthDay(normalized);
      }
      return false;
    });
  }

  async getHolidaysBetween(
    start: string,
    end: string,
    tenantId?: string | null,
    region?: string | null
  ): Promise<HolidayEvent[]> {
    await this.ensureCache();
    const normalizedStart = this.normalizeDateString(start);
    const normalizedEnd = this.normalizeDateString(end);
    const range = this.buildDateRange(normalizedStart, normalizedEnd);

    const actual = this.holidayCache
      .filter(
        (holiday) =>
          !holiday.isRecurring &&
          this.matchesTenant(holiday, tenantId) &&
          this.matchesRegion(holiday, region) &&
          holiday.date >= normalizedStart &&
          holiday.date <= normalizedEnd
      )
      .map((holiday) => ({ ...holiday }));

    const recurring = this.holidayCache
      .filter(
        (holiday) =>
          holiday.isRecurring &&
          this.matchesTenant(holiday, tenantId) &&
          this.matchesRegion(holiday, region)
      )
      .flatMap((holiday) =>
        range
          .filter((rangeDate) =>
            this.dateMonthDay(holiday.date) === rangeDate.monthDay
          )
          .map((rangeDate) => ({ ...holiday, date: rangeDate.iso }))
      );

    const uniqueMap = new Map<string, HolidayEvent>();
    [...actual, ...recurring].forEach((holiday) => {
      const key = `${holiday.id}::${holiday.date}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, holiday);
      }
    });

    return Array.from(uniqueMap.values());
  }

  async getCalendarEvents(
    start: string,
    end: string,
    tenantId?: string | null,
    region?: string | null
  ): Promise<CalendarEventDto[]> {
    const holidays = await this.getHolidaysBetween(start, end, tenantId, region);

    return holidays.map((holiday) => ({
      id: `holiday-${holiday.id}-${holiday.date}`,
      title: holiday.name,
      type: "HOLIDAY",
      startDate: new Date(`${holiday.date}T00:00:00.000Z`),
      endDate: new Date(`${holiday.date}T00:00:00.000Z`),
      color: holiday.type === "PUBLIC" ? "#1890ff" : "#faad14",
    }));
  }
}
