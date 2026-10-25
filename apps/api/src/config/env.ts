import { plainToInstance, Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsString, Min, validateSync } from 'class-validator';

/**
 * Environment variables the API needs. Validated once at startup so a
 * missing or malformed value fails fast with a clear message.
 */
export class Env {
  @IsIn(['development', 'production', 'test'])
  NODE_ENV: 'development' | 'production' | 'test' = 'development';

  @Transform(({ value }) => Number(value))
  @IsInt()
  PORT = 4100;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  REDIS_URL: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET: string;

  @IsString()
  JWT_ACCESS_TTL = '15m';

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  REFRESH_TOKEN_TTL_DAYS = 30;

  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  OTP_DEV_MODE = false;

  @IsString()
  CORS_ORIGINS = '';

  @IsString()
  PUBLIC_URL = 'http://localhost:4100';

  @IsString()
  ADMIN_PHONES = '';
}

export function validateEnv(raw: Record<string, unknown>): Env {
  const env = plainToInstance(Env, raw, { exposeDefaultValues: true });
  const errors = validateSync(env, { skipMissingProperties: false });
  if (errors.length) {
    const list = errors.map((e) => `  - ${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`);
    throw new Error(`Invalid environment configuration:\n${list.join('\n')}`);
  }
  if (env.NODE_ENV === 'production' && env.OTP_DEV_MODE) {
    throw new Error('OTP_DEV_MODE must be false in production.');
  }
  return env;
}
