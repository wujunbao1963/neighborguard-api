// src/events/dto/create-event-note.dto.ts
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EventCommentType } from '../event-comment.entity';

export class CreateEventNoteDto {
  @IsString()
  body: string;

  @IsOptional()
  @IsEnum(EventCommentType)
  type?: EventCommentType;
}
