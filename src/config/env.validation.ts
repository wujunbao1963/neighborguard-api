import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  
  PORT: Joi.number().default(3000),
  APP_PORT: Joi.number().optional(),
  
  // Frontend
  FRONTEND_ORIGIN: Joi.string().required(),
  
  // Database - Railway provides DATABASE_URL
  // Individual DB_* variables are optional (for local development only)
  DATABASE_URL: Joi.string().optional(),
  
  DB_HOST: Joi.string().optional(),
  DB_PORT: Joi.string().optional(),
  DB_USER: Joi.string().optional(),
  DB_PASS: Joi.string().optional(),
  DB_NAME: Joi.string().optional(),
  DB_SSL: Joi.boolean().optional(),
  DB_SYNCHRONIZE: Joi.boolean().optional(),
  DB_LOGGING: Joi.boolean().optional(),
  DB_POOL_MAX: Joi.number().optional(),
  DB_POOL_MIN: Joi.number().optional(),
})
  // Custom validation: Must have either DATABASE_URL OR all individual DB_* vars
  .custom((value, helpers) => {
    const hasDatabaseUrl = !!value.DATABASE_URL;
    const hasIndividualVars = !!(
      value.DB_HOST &&
      value.DB_USER &&
      value.DB_PASS &&
      value.DB_NAME
    );
    
    if (!hasDatabaseUrl && !hasIndividualVars) {
      return helpers.error('any.custom', {
        message: 'Either DATABASE_URL or all DB_* variables (DB_HOST, DB_USER, DB_PASS, DB_NAME) must be provided',
      });
    }
    
    return value;
  });

