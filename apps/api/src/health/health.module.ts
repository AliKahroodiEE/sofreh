import { Controller, Get, Module, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../common/auth.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';

/** Used by Docker health checks and uptime monitors. */
@ApiTags('health')
@Public()
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  async check() {
    const [db, redis] = await Promise.all([
      this.prisma.$queryRaw`SELECT 1`.then(() => 'up').catch(() => 'down'),
      this.redis.client.ping().then(() => 'up').catch(() => 'down'),
    ]);
    const result = { status: db === 'up' && redis === 'up' ? 'ok' : 'error', db, redis };
    if (result.status !== 'ok') throw new ServiceUnavailableException(result);
    return result;
  }
}

@Module({ controllers: [HealthController] })
export class HealthModule {}
