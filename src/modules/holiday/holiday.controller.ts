import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { HolidayService } from "./holiday.service";
import { CreateHolidayDto } from "./create-holiday.dto";
import { UpdateHolidayDto } from "./update-holiday.dto";

@Controller("holidays")
export class HolidayController {
  constructor(private readonly holidayService: HolidayService) {}

  @Post()
  create(@Body() dto: CreateHolidayDto) {
    return this.holidayService.create(dto);
  }

  @Get()
  findAll() {
    return this.holidayService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.holidayService.findOne(id);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdateHolidayDto) {
    return this.holidayService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.holidayService.remove(id);
  }
}