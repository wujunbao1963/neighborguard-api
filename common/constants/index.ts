/**
 * Application-wide constants
 */

export const APP_CONSTANTS = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 1,
  DEFAULT_TIMEZONE: 'UTC',
} as const;

export const PAGINATION = {
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
} as const;

export const HTTP_MESSAGES = {
  SUCCESS: 'Operation completed successfully',
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  BAD_REQUEST: 'Bad request',
  INTERNAL_ERROR: 'Internal server error',
} as const;

export const VALIDATION_MESSAGES = {
  REQUIRED: (field: string) => `${field} is required`,
  INVALID: (field: string) => `${field} is invalid`,
  TOO_SHORT: (field: string, min: number) => 
    `${field} must be at least ${min} characters`,
  TOO_LONG: (field: string, max: number) => 
    `${field} must be at most ${max} characters`,
  INVALID_FORMAT: (field: string) => `${field} has invalid format`,
} as const;

export const REGEX_PATTERNS = {
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  ISO_DATE: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/,
} as const;

export const ERROR_CODES = {
  // Authentication & Authorization
  AUTH_INVALID_CREDENTIALS: 'AUTH_001',
  AUTH_TOKEN_EXPIRED: 'AUTH_002',
  AUTH_UNAUTHORIZED: 'AUTH_003',
  AUTH_FORBIDDEN: 'AUTH_004',
  
  // Resource Errors
  RESOURCE_NOT_FOUND: 'RES_001',
  RESOURCE_ALREADY_EXISTS: 'RES_002',
  RESOURCE_CONFLICT: 'RES_003',
  
  // Validation Errors
  VALIDATION_FAILED: 'VAL_001',
  INVALID_INPUT: 'VAL_002',
  
  // Business Logic Errors
  BUSINESS_RULE_VIOLATION: 'BUS_001',
  OPERATION_NOT_ALLOWED: 'BUS_002',
  
  // System Errors
  INTERNAL_ERROR: 'SYS_001',
  DATABASE_ERROR: 'SYS_002',
  EXTERNAL_SERVICE_ERROR: 'SYS_003',
} as const;
