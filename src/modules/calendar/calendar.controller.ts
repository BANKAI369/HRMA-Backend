import { Controller, Get, Query } from "@nestjs/common";
import { CalendarService } from "./calendar.service";
import { CalendarQueryDto } from "./dto/calendar-query.dto";

@Controller("calendar")
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  async getCalendarEvents(@Query() query: CalendarQueryDto) {
    return this.calendarService.getEvents(query);
  }
}