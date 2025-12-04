// src/home/dto/home-tasks.dto.ts
import { EventResponseDto } from '../../events/dto/event-response.dto';
import { NotificationDto } from '../../notifications/dto/notification.dto';

export class CircleSummaryDto {
  id: string;
  name: string;
  address?: string;
  role: string;
}

export class HomeTasksDto {
  inboxNewEvents: EventResponseDto[];
  inboxNotifications: NotificationDto[];
  pendingEvents: EventResponseDto[];
  myCircles: CircleSummaryDto[];
}
