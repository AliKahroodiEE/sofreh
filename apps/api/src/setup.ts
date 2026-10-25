import { BadRequestException, ValidationPipe, type ValidationError } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { UPLOAD_DIR } from './admin/admin.module.js';
import type { Env } from './config/env.js';

/** First validation message (in Persian where we defined one), plus the full list. */
function validationErrors(errors: ValidationError[]) {
  const messages = errors.flatMap(function collect(e: ValidationError): string[] {
    return [...Object.values(e.constraints ?? {}), ...(e.children ?? []).flatMap(collect)];
  });
  return new BadRequestException({ statusCode: 400, message: messages[0] ?? 'اطلاعات ارسالی نامعتبر است.', errors: messages });
}

/**
 * Middleware, validation, static files and Swagger. Shared by main.ts and the
 * e2e tests so both run the exact same configuration.
 */
export function configureApp(app: NestExpressApplication) {
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  app.set('trust proxy', 1); // behind Nginx: use the client IP for rate limits
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: false }));
  app.enableCors({
    origin: config
      .get('CORS_ORIGINS', { infer: true })
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
  });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true, exceptionFactory: validationErrors }),
  );
  app.useStaticAssets(UPLOAD_DIR, { prefix: '/uploads/', maxAge: '30d', immutable: true });
  app.enableShutdownHooks();

  const swagger = new DocumentBuilder()
    .setTitle('Sofreh API')
    .setDescription(
      'REST API for the Sofreh food-delivery platform. Authenticate with POST /auth/otp/request and ' +
        '/auth/otp/verify, then send `Authorization: Bearer <accessToken>`. Money values are integer toman; ' +
        'image fields are paths relative to the API origin (e.g. /uploads/abc.webp). See docs/API.md for examples.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, () => SwaggerModule.createDocument(app, swagger), {
    jsonDocumentUrl: 'api/docs-json',
  });
}
