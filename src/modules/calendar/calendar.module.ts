import { Module } from "@nestjs/common";
import { CalendarService } from "./calendar.service";
import { CalendarController } from "./calendar.controller";
import { HolidayService } from "../holiday/holiday.service";
import { LeaveService } from "../leave-request/leave.service";
import { AttendanceService } from "../../services/attendance.service";

@Module({
  controllers: [CalendarController],
  providers: [CalendarService, HolidayService, LeaveService, AttendanceService],
})
export class CalendarModule {}
