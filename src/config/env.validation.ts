import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'staging', 'production').default('development'),
  APP_PORT: Joi.number().default(3000),

  FRONTEND_ORIGIN: Joi.string().required(),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USER: Joi.string().required(),
  DB_PASS: Joi.string().allow('').required(),
  DB_NAME: Joi.string().required(),
  DB_SSL: Joi.boolean().truthy('true').falsy('false').default(false),

  DB_SYNCHRONIZE: Joi.boolean().truthy('true').falsy('false').default(false),
  DB_LOGGING: Joi.boolean().truthy('true').falsy('false').default(false),
});

