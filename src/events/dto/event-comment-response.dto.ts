import { EventCommentType } from '../event-comment.entity';

export class EventCommentResponseDto {
  id: string;

  eventId: string;
  circleId: string;

  userId: string;
  userName: string;
  userEmail: string;

  body: string; // ✅ 前端用这个字段
  type: EventCommentType;

  createdAt: Date;
}
