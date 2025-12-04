/**
 * Member and role-related enumerations
 */

export enum MemberRole {
  OWNER = 'owner',
  RESIDENT = 'resident',
  NEIGHBOR = 'neighbor',
  OBSERVER = 'observer',
}

export enum MemberStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

export enum NotificationPreference {
  ALL = 'all',
  IMPORTANT_ONLY = 'important_only',
  NONE = 'none',
}
