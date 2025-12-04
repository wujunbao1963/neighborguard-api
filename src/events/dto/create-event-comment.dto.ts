import { IsString, IsOptional, IsEnum } from 'class-validator';
import { EventCommentType } from '../event-comment.entity';

export class CreateEventCommentDto {
  @IsString()
  body: string; // ✅ 和 entity 对齐，不再叫 content

  @IsOptional()
  @IsEnum(EventCommentType)
  type?: EventCommentType;
}
