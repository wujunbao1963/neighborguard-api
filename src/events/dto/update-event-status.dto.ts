import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EventStatus } from '../event.entity';

export class UpdateEventStatusDto {
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @IsOptional()
  @IsString()
  resolution?: string;
}
