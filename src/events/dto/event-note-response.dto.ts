// src/events/dto/event-note-response.dto.ts
import { EventCommentType } from '../event-comment.entity';

export class EventNoteResponseDto {
  id: string;

  eventId: string;
  circleId: string;

  userId: string;
  userName: string;
  userEmail: string;

  body: string;
  type: EventCommentType;

  createdAt: Date;
}
