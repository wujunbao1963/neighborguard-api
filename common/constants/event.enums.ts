/**
 * Event-related enumerations
 */

export enum EventStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum EventSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum EventType {
  SECURITY = 'security',
  MAINTENANCE = 'maintenance',
  NOISE = 'noise',
  PARKING = 'parking',
  OTHER = 'other',
}

export enum EventResolution {
  RESOLVED = 'resolved',
  NO_ACTION_NEEDED = 'no_action_needed',
  FALSE_ALARM = 'false_alarm',
  ESCALATED = 'escalated',
}
