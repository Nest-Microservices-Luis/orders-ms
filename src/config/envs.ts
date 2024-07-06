import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  PORT: number;
  MICROSERVICE_PRODUCTS_HOST: string;
  MICROSERVICE_PRODUCTS_PORT: number;
}

const envsScheme = joi
  .object({
    PORT: joi.number().required(),
    MICROSERVICE_PRODUCTS_HOST: joi.string().required(),
    MICROSERVICE_PRODUCTS_PORT: joi.number().required(),
  })
  .unknown(true);

const { error, value } = envsScheme.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
  port: envVars.PORT,
  microservice_products_host: envVars.MICROSERVICE_PRODUCTS_HOST,
  microservice_products_port: envVars.MICROSERVICE_PRODUCTS_PORT,
};
