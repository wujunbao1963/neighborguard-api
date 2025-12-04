// src/notifications/dto/notification.dto.ts
import { NotificationType } from '../notification.entity';

export class NotificationDto {
  id: string;
  type: NotificationType;
  payload: any;
  isRead: boolean;
  createdAt: Date;
}
