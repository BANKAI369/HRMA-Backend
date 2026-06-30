import { Injectable } from "@nestjs/common";
import { CalendarQueryDto } from "./dto/calendar-query.dto";
import { CalendarEventDto } from "./dto/calendar-response.dto";
import { HolidayService } from "../holiday/holiday.service";
import { LeaveService } from "../leave-request/leave.service";
import { AttendanceService } from "../../services/attendance.service";

@Injectable()
export class CalendarService {
  constructor(
    private readonly holidayService: HolidayService,
    private readonly leaveService: LeaveService,
    private readonly attendanceService: AttendanceService
  ) {}

  async getEvents(query: CalendarQueryDto): Promise<CalendarEventDto[]> {
    if (!query.startDate || !query.endDate) {
      return [];
    }

    const [holidayEvents, leaveEvents, attendanceEvents] = await Promise.all([
      this.holidayService.getCalendarEvents(
        query.startDate,
        query.endDate,
        query.tenantId,
        query.region
      ),
      this.leaveService.getCalendarEvents(query.startDate, query.endDate, {
        tenantId: query.tenantId,
        userId: query.userId,
        departmentId: query.departmentId,
      }),
      this.attendanceService.getCalendarEvents(query.startDate, query.endDate, {
        tenantId: query.tenantId,
        userId: query.userId,
        departmentId: query.departmentId,
      }),
    ]);

    return [...holidayEvents, ...leaveEvents, ...attendanceEvents].sort(
      (a, b) => {
        const dateDiff = a.startDate.getTime() - b.startDate.getTime();
        if (dateDiff !== 0) {
          return dateDiff;
        }

        return a.type.localeCompare(b.type);
      }
    );
  }
}
