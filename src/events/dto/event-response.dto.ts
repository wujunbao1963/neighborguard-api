import { EventSeverity, EventStatus } from '../event.entity';

export type EventCreatorRole =
  | 'owner'
  | 'resident'
  | 'neighbor'
  | 'observer'
  | 'unknown';

export class EventResponseDto {
  id: string;

  circleId: string;
  circleName?: string;
  circleAddress?: string;

  title?: string;
  description?: string;
  requestText: string;

  eventType: string;
  cameraZone: string;

  severity: EventSeverity;
  status: EventStatus;

  resolution: string;
  resolutionNote?: string;

  occurredAt?: Date;

  createdAt: Date;
  updatedAt: Date;

  videoAssetId?: string;
  videoUrl?: string;

  createdById?: string;
  createdByName?: string;
  createdByEmail?: string;

  createdByRole?: EventCreatorRole;

  // 当前用户视角
  isMine: boolean;
  myRoleInCircle: EventCreatorRole;

  canEditEvent: boolean;
  canChangeResolution: boolean;
}
