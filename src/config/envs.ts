import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
    PORT: number;
    PRODUCTS_SERVICE_HOST: string;
    PRODUCTS_SERVICE_PORT: number;
}

const envsSchema = joi.object({
    PORT: joi.number().required(),
    PRODUCTS_SERVICE_HOST: joi.string().required(),
    PRODUCTS_SERVICE_PORT: joi.number().required(),
}).unknown(true);

const {error, value} = envsSchema.validate(process.env);

if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
    PORT: envVars.PORT,
    PRODUCTS_SERVICE_HOST: envVars.PRODUCTS_SERVICE_HOST,
    PRODUCTS_SERVICE_PORT: envVars.PRODUCTS_SERVICE_PORT,
}