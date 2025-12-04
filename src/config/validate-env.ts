// src/config/validate-env.ts
export function validateEnv(config: Record<string, any>) {
  const required = [
    'DB_HOST',
    'DB_PORT',
    'DB_USER',
    'DB_PASS',
    'DB_NAME',
  ] as const;

  const missing = required.filter((k) => !config[k]);
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }

  // Helpful defaults
  config.APP_PORT = config.APP_PORT ?? '3000';
  config.NODE_ENV = config.NODE_ENV ?? 'development';

  return config;
}
