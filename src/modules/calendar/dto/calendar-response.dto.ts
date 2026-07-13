export class CalendarEventDto {
  id: string;
  title: string;
  type: "LEAVE" | "HOLIDAY" | "WFH" | "OTHER";

  startDate: Date;
  endDate: Date;

  status?: "APPROVED" | "PENDING" | "REJECTED";

  userId?: string;
  userName?: string;

  color?: string; // for UI
}