import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Role } from '@prisma/client';
import type { Request } from 'express';

/** Payload stored in access tokens. */
export interface AuthUser {
  sub: number;
  role: Role;
}

const IS_PUBLIC = 'isPublic';
const ROLES = 'roles';

/** Mark a route as reachable without a token. */
export const Public = () => SetMetadata(IS_PUBLIC, true);

/** Restrict a route or controller to the given roles. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES, roles);

/** Inject the authenticated user (from the access token) into a handler. */
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthUser => {
  return ctx.switchToHttp().getRequest<Request & { user: AuthUser }>().user;
});

/**
 * Global guard: every route needs a valid `Authorization: Bearer <token>`
 * unless it is marked @Public(). Role checks run after authentication.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(ctx: ExecutionContext): boolean {
    const targets = [ctx.getHandler(), ctx.getClass()];
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, targets);
    const request = ctx.switchToHttp().getRequest<Request & { user?: AuthUser }>();

    const token = request.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    if (token) {
      try {
        request.user = this.jwt.verify<AuthUser>(token);
      } catch {
        if (!isPublic) throw new UnauthorizedException('نشست شما منقضی شده است؛ دوباره وارد شوید.');
      }
    }
    if (isPublic) return true;
    if (!request.user) throw new UnauthorizedException('ابتدا وارد حساب کاربری شوید.');

    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES, targets);
    if (roles && !roles.includes(request.user.role)) {
      throw new ForbiddenException('دسترسی به این بخش مجاز نیست.');
    }
    return true;
  }
}
