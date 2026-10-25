import { BadRequestException, HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import { randomBytes, randomInt } from 'node:crypto';
import type { Env } from '../config/env.js';
import { normalizeIranMobile, toLatinDigits } from '../common/utils/phone.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import { SmsService } from './sms.service.js';

const OTP_TTL = 120; // seconds a code stays valid
const OTP_COOLDOWN = 60; // seconds before a new code can be requested
const OTP_MAX_ATTEMPTS = 5;

/**
 * Phone-number login:
 * 1. requestOtp stores a 5-digit code in Redis and sends it by SMS.
 * 2. verifyOtp checks it, creates the user on first login, and issues tokens.
 * Access tokens are short-lived JWTs; refresh tokens are random strings kept
 * in Redis so they can be rotated and revoked.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly jwt: JwtService,
    private readonly sms: SmsService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async requestOtp(rawPhone: string) {
    const phone = this.parsePhone(rawPhone);
    const r = this.redis.client;

    const cooldown = await r.ttl(`otp:cooldown:${phone}`);
    if (cooldown > 0) {
      throw new HttpException(`لطفاً ${cooldown} ثانیه‌ی دیگر دوباره تلاش کنید.`, HttpStatus.TOO_MANY_REQUESTS);
    }

    const code = String(randomInt(10000, 100000));
    await r
      .multi()
      .set(`otp:code:${phone}`, code, 'EX', OTP_TTL)
      .del(`otp:attempts:${phone}`)
      .set(`otp:cooldown:${phone}`, '1', 'EX', OTP_COOLDOWN)
      .exec();
    await this.sms.send(phone, `سفره | کد ورود شما: ${code}`);

    const devMode = this.config.get('OTP_DEV_MODE', { infer: true });
    return { phone, expiresIn: OTP_TTL, ...(devMode ? { devCode: code } : {}) };
  }

  async verifyOtp(rawPhone: string, rawCode: string) {
    const phone = this.parsePhone(rawPhone);
    const code = toLatinDigits(rawCode);
    const r = this.redis.client;

    const attempts = await r.incr(`otp:attempts:${phone}`);
    await r.expire(`otp:attempts:${phone}`, OTP_TTL);
    if (attempts > OTP_MAX_ATTEMPTS) {
      throw new HttpException('تعداد تلاش‌ها زیاد بود؛ کد جدید دریافت کنید.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const expected = await r.get(`otp:code:${phone}`);
    if (!expected || expected !== code) {
      throw new BadRequestException('کد تأیید نادرست است یا منقضی شده است.');
    }
    await r.del(`otp:code:${phone}`, `otp:attempts:${phone}`);

    const adminPhones = this.config.get('ADMIN_PHONES', { infer: true }).split(',').map((p) => p.trim());
    const user = await this.prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone, role: adminPhones.includes(phone) ? 'ADMIN' : 'CUSTOMER' },
    });
    if (!user.isActive) throw new UnauthorizedException('حساب کاربری شما غیرفعال شده است.');

    return { ...(await this.issueTokens(user)), user: this.publicUser(user), isNewUser: !user.name };
  }

  /** Exchange a refresh token for a new token pair (the old one is revoked). */
  async refresh(refreshToken: string) {
    const key = `refresh:${refreshToken}`;
    const userId = await this.redis.client.getdel(key);
    if (!userId) throw new UnauthorizedException('نشست شما منقضی شده است؛ دوباره وارد شوید.');

    const user = await this.prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!user?.isActive) throw new UnauthorizedException('حساب کاربری یافت نشد.');
    return this.issueTokens(user);
  }

  async logout(refreshToken: string) {
    await this.redis.client.del(`refresh:${refreshToken}`);
    return { ok: true };
  }

  async me(userId: number) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return this.publicUser(user);
  }

  private async issueTokens(user: User) {
    const accessToken = this.jwt.sign({ sub: user.id, role: user.role });
    const refreshToken = randomBytes(32).toString('base64url');
    const ttlDays = this.config.get('REFRESH_TOKEN_TTL_DAYS', { infer: true });
    await this.redis.client.set(`refresh:${refreshToken}`, String(user.id), 'EX', ttlDays * 86400);
    return { accessToken, refreshToken };
  }

  private parsePhone(raw: string) {
    const phone = normalizeIranMobile(raw);
    if (!phone) throw new BadRequestException('شماره‌ی موبایل معتبر نیست؛ مثلاً ۰۹۱۲۱۲۳۴۵۶۷');
    return phone;
  }

  private publicUser(user: User) {
    return { id: user.id, phone: user.phone, name: user.name, role: user.role };
  }
}
