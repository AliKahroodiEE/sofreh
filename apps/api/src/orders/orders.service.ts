import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type OrderStatus } from '@prisma/client';
import { randomBytes, randomInt } from 'node:crypto';
import type { AuthUser } from '../common/auth.js';
import { PaginationQuery, paginated } from '../common/pagination.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RealtimeService } from '../realtime/realtime.module.js';
import { RedisService } from '../redis/redis.service.js';
import { CATALOG_CACHE } from '../catalog/catalog.module.js';
import type { CreateOrderDto, ReviewDto } from './dto/order.dto.js';
import { canTransition, computeTotals, evaluateDiscount, priceLines } from './order-rules.js';

const orderDetail = {
  items: true,
  statusLogs: { orderBy: { createdAt: 'asc' } },
  restaurant: { select: { id: true, name: true, slug: true, logo: true, address: true } },
  user: { select: { id: true, phone: true, name: true } },
  review: true,
} satisfies Prisma.OrderInclude;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
    private readonly redis: RedisService,
  ) {}

  /** Check a discount code against an amount without using it. */
  async validateDiscount(rawCode: string, amount: number) {
    const code = await this.prisma.discountCode.findUnique({ where: { code: rawCode.trim().toUpperCase() } });
    if (!code) throw new BadRequestException('کد تخفیف معتبر نیست.');
    const result = evaluateDiscount(code, amount);
    if (!result.ok) throw new BadRequestException(result.reason);
    return { code: code.code, description: code.description, discount: result.amount };
  }

  async create(userId: number, dto: CreateOrderDto) {
    const restaurant = await this.prisma.restaurant.findFirst({ where: { id: dto.restaurantId, isActive: true } });
    if (!restaurant) throw new NotFoundException('رستوران پیدا نشد.');
    if (!restaurant.isOpen) throw new BadRequestException('این رستوران در حال حاضر سفارش نمی‌پذیرد.');

    // Merge duplicate lines and load the dishes; prices always come from the database.
    const quantities = new Map<number, number>();
    for (const line of dto.items) quantities.set(line.menuItemId, (quantities.get(line.menuItemId) ?? 0) + line.quantity);
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: [...quantities.keys()] }, restaurantId: restaurant.id },
    });
    if (menuItems.length !== quantities.size) throw new BadRequestException('بعضی از غذاها در منوی این رستوران نیستند.');
    const unavailable = menuItems.filter((i) => !i.isAvailable);
    if (unavailable.length) {
      throw new BadRequestException(`«${unavailable.map((i) => i.name).join('، ')}» در حال حاضر موجود نیست.`);
    }

    const lines = priceLines(menuItems.map((menuItem) => ({ menuItem, quantity: quantities.get(menuItem.id)! })));
    const food = computeTotals(lines, 0);
    const foodAfterItemDiscounts = food.subtotal - food.itemsDiscount;
    if (foodAfterItemDiscounts < restaurant.minOrder) {
      throw new BadRequestException(`حداقل سفارش از این رستوران ${restaurant.minOrder.toLocaleString('fa-IR')} تومان است.`);
    }

    let discount: { id: number; amount: number } | null = null;
    if (dto.discountCode) {
      const code = await this.prisma.discountCode.findUnique({ where: { code: dto.discountCode.trim().toUpperCase() } });
      if (!code) throw new BadRequestException('کد تخفیف معتبر نیست.');
      const result = evaluateDiscount(code, foodAfterItemDiscounts);
      if (!result.ok) throw new BadRequestException(result.reason);
      discount = { id: code.id, amount: result.amount };
    }

    const addressText = await this.resolveAddress(userId, dto);
    const totals = computeTotals(lines, restaurant.deliveryFee, discount?.amount ?? 0);

    const order = await this.prisma.$transaction(async (tx) => {
      if (discount) {
        // Atomic check-and-increment so two orders can't both take the last use.
        const used = await tx.$executeRaw`
          UPDATE "DiscountCode" SET "usedCount" = "usedCount" + 1
          WHERE id = ${discount.id} AND ("usageLimit" IS NULL OR "usedCount" < "usageLimit")`;
        if (used === 0) throw new BadRequestException('ظرفیت استفاده از این کد تکمیل شده است.');
      }
      return tx.order.create({
        data: {
          code: await this.uniqueCode(tx),
          userId,
          restaurantId: restaurant.id,
          paymentMethod: dto.paymentMethod,
          ...totals,
          discountCodeId: discount?.id,
          addressText,
          note: dto.note?.trim() || null,
          items: {
            create: lines.map((l) => ({ menuItemId: l.menuItemId, name: l.name, unitPrice: l.unitPrice, quantity: l.quantity })),
          },
          statusLogs: { create: { status: 'PENDING' } },
        },
        include: orderDetail,
      });
    });

    this.realtime.orderCreated(order);
    return order;
  }

  async listMine(userId: number, q: PaginationQuery) {
    const where = { userId };
    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: q.skip,
        take: q.limit,
        include: {
          restaurant: { select: { id: true, name: true, slug: true, logo: true } },
          items: { select: { name: true, quantity: true } },
          review: { select: { rating: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);
    return paginated(items, total, q);
  }

  /** Owners see their own orders; admins see all. Others get 404 (not 403) to avoid leaking IDs. */
  async findForUser(user: AuthUser, id: number) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: orderDetail });
    if (!order || (order.userId !== user.sub && user.role !== 'ADMIN')) throw new NotFoundException('سفارش پیدا نشد.');
    return order;
  }

  /**
   * Simulated payment gateway: marks an online order as paid.
   * In production this is replaced by a redirect to a real gateway (ZarinPal,
   * IDPay, …) and a verify callback that calls the same update.
   */
  async pay(user: AuthUser, id: number) {
    const order = await this.findForUser(user, id);
    if (order.paymentMethod !== 'ONLINE') throw new BadRequestException('این سفارش پرداخت در محل است.');
    if (order.isPaid) throw new ConflictException('این سفارش قبلاً پرداخت شده است.');
    if (order.status === 'CANCELLED') throw new BadRequestException('سفارش لغو شده قابل پرداخت نیست.');

    const updated = await this.prisma.order.update({
      where: { id },
      data: { isPaid: true, paymentRef: `DEMO-${randomBytes(4).toString('hex').toUpperCase()}` },
      include: orderDetail,
    });
    this.realtime.orderUpdated(updated);
    return updated;
  }

  async cancelByCustomer(user: AuthUser, id: number) {
    const order = await this.findForUser(user, id);
    if (order.userId !== user.sub) throw new NotFoundException('سفارش پیدا نشد.');
    if (order.status !== 'PENDING') {
      throw new BadRequestException('بعد از تأیید رستوران، لغو سفارش فقط از طریق پشتیبانی ممکن است.');
    }
    return this.changeStatus(id, 'CANCELLED');
  }

  /** Move an order to the next status (admin panel or customer cancel). */
  async changeStatus(id: number, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('سفارش پیدا نشد.');
    if (!canTransition(order.status, status)) {
      throw new BadRequestException(`تغییر وضعیت از ${order.status} به ${status} مجاز نیست.`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // A cancelled order gives its discount-code use back.
      if (status === 'CANCELLED' && order.discountCodeId) {
        await tx.discountCode.update({ where: { id: order.discountCodeId }, data: { usedCount: { decrement: 1 } } });
      }
      return tx.order.update({
        where: { id },
        data: {
          status,
          // Cash orders are paid when the courier delivers them.
          ...(status === 'DELIVERED' && order.paymentMethod === 'CASH' ? { isPaid: true } : {}),
          statusLogs: { create: { status } },
        },
        include: orderDetail,
      });
    });
    this.realtime.orderUpdated(updated);
    return updated;
  }

  async review(user: AuthUser, id: number, dto: ReviewDto) {
    const order = await this.findForUser(user, id);
    if (order.userId !== user.sub) throw new NotFoundException('سفارش پیدا نشد.');
    if (order.status !== 'DELIVERED') throw new BadRequestException('فقط سفارش‌های تحویل‌شده را می‌توان امتیاز داد.');
    if (order.review) throw new ConflictException('برای این سفارش قبلاً نظر ثبت کرده‌اید.');

    const review = await this.prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: { orderId: id, userId: user.sub, restaurantId: order.restaurantId, rating: dto.rating, comment: dto.comment?.trim() || null },
      });
      const stats = await tx.review.aggregate({ where: { restaurantId: order.restaurantId }, _avg: { rating: true }, _count: true });
      await tx.restaurant.update({
        where: { id: order.restaurantId },
        data: { rating: Math.round((stats._avg.rating ?? 0) * 10) / 10, ratingCount: stats._count },
      });
      return created;
    });
    await this.redis.deleteByPattern(`${CATALOG_CACHE}*`);
    return review;
  }

  private async resolveAddress(userId: number, dto: CreateOrderDto) {
    if (dto.addressId) {
      const address = await this.prisma.address.findFirst({ where: { id: dto.addressId, userId } });
      if (!address) throw new BadRequestException('آدرس انتخاب‌شده پیدا نشد.');
      return `${address.title} — ${address.details}`;
    }
    if (dto.addressText?.trim()) return dto.addressText.trim();
    throw new BadRequestException('آدرس تحویل را وارد کنید.');
  }

  private async uniqueCode(tx: Prisma.TransactionClient) {
    for (let i = 0; i < 5; i++) {
      const code = `SF-${randomInt(100000, 1000000)}`;
      if (!(await tx.order.findUnique({ where: { code }, select: { id: true } }))) return code;
    }
    throw new ConflictException('ساخت کد سفارش ناموفق بود؛ دوباره تلاش کنید.');
  }
}
