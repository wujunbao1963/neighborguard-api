import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { EventSeverity } from '../event.entity';

export class CreateEventDto {
  @IsUUID()
  circleId: string;

  @IsString()
  eventType: string;

  @IsString()
  cameraZone: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  requestText: string;

  @IsOptional()
  @IsEnum(EventSeverity)
  severity?: EventSeverity;

  @IsOptional()
  @IsDateString()
  occurredAt?: string;

  @IsOptional()
  @IsUUID()
  videoAssetId?: string;
}
