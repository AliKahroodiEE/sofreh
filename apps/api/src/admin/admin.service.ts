import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { CATALOG_CACHE } from '../catalog/catalog.module.js';
import { paginated } from '../common/pagination.js';
import { normalizeIranMobile } from '../common/utils/phone.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import type {
  AdminOrdersQuery,
  DiscountDto,
  MenuItemDto,
  RestaurantDto,
  SearchQuery,
  SectionDto,
  UpdateDiscountDto,
  UpdateMenuItemDto,
  UpdateRestaurantDto,
  UpdateUserDto,
} from './dto/admin.dto.js';

/** Tehran is UTC+3:30 (no DST); dashboard days follow the local calendar. */
const TEHRAN_OFFSET_MS = 3.5 * 60 * 60 * 1000;
const localDay = (d: Date) => new Date(d.getTime() + TEHRAN_OFFSET_MS).toISOString().slice(0, 10);

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /** Clear cached menus/restaurant lists after any catalog change. */
  private clearCatalogCache() {
    return this.redis.deleteByPattern(`${CATALOG_CACHE}*`);
  }

  // ------------------------------------------------------------ dashboard

  async stats(days: number) {
    const now = new Date();
    const startOfToday = new Date(`${localDay(now)}T00:00:00+03:30`);
    const since = new Date(startOfToday.getTime() - (days - 1) * 86_400_000);
    const notCancelled = { status: { not: 'CANCELLED' as const } };

    const [recent, statusGroups, totals, topGroups] = await Promise.all([
      this.prisma.order.findMany({
        where: { createdAt: { gte: since }, ...notCancelled },
        select: { createdAt: true, total: true },
      }),
      this.prisma.order.groupBy({ by: ['status'], _count: true }),
      Promise.all([
        this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
        this.prisma.restaurant.count({ where: { isActive: true } }),
        this.prisma.order.count(),
        this.prisma.order.aggregate({ where: notCancelled, _sum: { total: true } }),
      ]),
      this.prisma.order.groupBy({
        by: ['restaurantId'],
        where: { createdAt: { gte: since }, ...notCancelled },
        _count: true,
        _sum: { total: true },
        orderBy: { _sum: { total: 'desc' } },
        take: 5,
      }),
    ]);

    // One bucket per day, including days without orders.
    const buckets = new Map<string, { date: string; orders: number; revenue: number }>();
    for (let i = 0; i < days; i++) {
      const date = localDay(new Date(since.getTime() + i * 86_400_000));
      buckets.set(date, { date, orders: 0, revenue: 0 });
    }
    for (const o of recent) {
      const bucket = buckets.get(localDay(o.createdAt));
      if (bucket) {
        bucket.orders += 1;
        bucket.revenue += o.total;
      }
    }
    const series = [...buckets.values()];
    const today = series.at(-1)!;

    const names = await this.prisma.restaurant.findMany({
      where: { id: { in: topGroups.map((g) => g.restaurantId) } },
      select: { id: true, name: true },
    });
    const [customers, restaurants, orders, revenue] = totals;

    return {
      today: { orders: today.orders, revenue: today.revenue },
      totals: { customers, restaurants, orders, revenue: revenue._sum.total ?? 0 },
      series,
      statusCounts: Object.fromEntries(statusGroups.map((g) => [g.status, g._count])),
      topRestaurants: topGroups.map((g) => ({
        id: g.restaurantId,
        name: names.find((n) => n.id === g.restaurantId)?.name ?? '—',
        orders: g._count,
        revenue: g._sum.total ?? 0,
      })),
    };
  }

  // --------------------------------------------------------------- orders

  async orders(q: AdminOrdersQuery) {
    const search = q.search?.trim();
    const phone = search ? normalizeIranMobile(search) : null;
    const where: Prisma.OrderWhereInput = {
      ...(q.status ? { status: q.status } : {}),
      ...(search
        ? phone
          ? { user: { phone } }
          : { code: { contains: search.toUpperCase() } }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: q.skip,
        take: q.limit,
        include: {
          restaurant: { select: { id: true, name: true } },
          user: { select: { id: true, phone: true, name: true } },
          items: { select: { name: true, quantity: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);
    return paginated(items, total, q);
  }

  // ---------------------------------------------------------- restaurants

  async restaurants(q: SearchQuery) {
    const where: Prisma.RestaurantWhereInput = q.search
      ? { name: { contains: q.search.trim(), mode: 'insensitive' } }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.restaurant.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: q.skip,
        take: q.limit,
        include: {
          cuisines: { select: { id: true, name: true } },
          _count: { select: { items: true, orders: true } },
        },
      }),
      this.prisma.restaurant.count({ where }),
    ]);
    return paginated(items, total, q);
  }

  async restaurant(id: number) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: {
        cuisines: { select: { id: true, name: true } },
        sections: { orderBy: { sortOrder: 'asc' }, include: { items: { orderBy: { sortOrder: 'asc' } } } },
      },
    });
    if (!restaurant) throw new NotFoundException('رستوران پیدا نشد.');
    return restaurant;
  }

  async createRestaurant({ cuisineIds, ...data }: RestaurantDto) {
    this.checkDeliveryTime(data.deliveryTimeMin, data.deliveryTimeMax);
    const restaurant = await this.prisma.restaurant.create({
      data: { ...data, cuisines: { connect: (cuisineIds ?? []).map((id) => ({ id })) } },
    });
    await this.clearCatalogCache();
    return restaurant;
  }

  async updateRestaurant(id: number, { cuisineIds, ...data }: UpdateRestaurantDto) {
    const current = await this.restaurant(id);
    this.checkDeliveryTime(data.deliveryTimeMin ?? current.deliveryTimeMin, data.deliveryTimeMax ?? current.deliveryTimeMax);
    const restaurant = await this.prisma.restaurant.update({
      where: { id },
      data: { ...data, ...(cuisineIds ? { cuisines: { set: cuisineIds.map((cid) => ({ id: cid })) } } : {}) },
    });
    await this.clearCatalogCache();
    return restaurant;
  }

  async deleteRestaurant(id: number) {
    const orders = await this.prisma.order.count({ where: { restaurantId: id } });
    if (orders > 0) {
      throw new ConflictException('این رستوران سفارش ثبت‌شده دارد؛ به‌جای حذف، آن را غیرفعال کنید.');
    }
    await this.prisma.restaurant.delete({ where: { id } });
    await this.clearCatalogCache();
    return { ok: true };
  }

  // ------------------------------------------------------ sections & items

  async createSection(restaurantId: number, dto: SectionDto) {
    await this.restaurant(restaurantId);
    const section = await this.prisma.menuSection.create({ data: { ...dto, restaurantId } });
    await this.clearCatalogCache();
    return section;
  }

  async updateSection(id: number, dto: Partial<SectionDto>) {
    const section = await this.prisma.menuSection.update({ where: { id }, data: dto });
    await this.clearCatalogCache();
    return section;
  }

  async deleteSection(id: number) {
    await this.prisma.menuSection.delete({ where: { id } });
    await this.clearCatalogCache();
    return { ok: true };
  }

  async createMenuItem(dto: MenuItemDto) {
    const section = await this.prisma.menuSection.findUnique({ where: { id: dto.sectionId } });
    if (!section) throw new BadRequestException('بخش منو پیدا نشد.');
    const item = await this.prisma.menuItem.create({ data: { ...dto, restaurantId: section.restaurantId } });
    await this.clearCatalogCache();
    return item;
  }

  async updateMenuItem(id: number, dto: UpdateMenuItemDto) {
    let restaurantId: number | undefined;
    if (dto.sectionId) {
      const section = await this.prisma.menuSection.findUnique({ where: { id: dto.sectionId } });
      if (!section) throw new BadRequestException('بخش منو پیدا نشد.');
      restaurantId = section.restaurantId;
    }
    const item = await this.prisma.menuItem.update({ where: { id }, data: { ...dto, ...(restaurantId ? { restaurantId } : {}) } });
    await this.clearCatalogCache();
    return item;
  }

  async deleteMenuItem(id: number) {
    await this.prisma.menuItem.delete({ where: { id } });
    await this.clearCatalogCache();
    return { ok: true };
  }

  // ------------------------------------------------------------ discounts

  discounts() {
    return this.prisma.discountCode.findMany({ orderBy: { createdAt: 'desc' } });
  }

  createDiscount(dto: DiscountDto) {
    this.checkDiscount(dto.type, dto.value);
    return this.prisma.discountCode.create({ data: { ...dto, code: dto.code.toUpperCase() } });
  }

  async updateDiscount(id: number, dto: UpdateDiscountDto) {
    const current = await this.prisma.discountCode.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('کد تخفیف پیدا نشد.');
    this.checkDiscount(dto.type ?? current.type, dto.value ?? current.value);
    return this.prisma.discountCode.update({
      where: { id },
      data: { ...dto, ...(dto.code ? { code: dto.code.toUpperCase() } : {}) },
    });
  }

  async deleteDiscount(id: number) {
    const used = await this.prisma.order.count({ where: { discountCodeId: id } });
    if (used > 0) throw new ConflictException('این کد در سفارش‌ها استفاده شده است؛ آن را غیرفعال کنید.');
    await this.prisma.discountCode.delete({ where: { id } });
    return { ok: true };
  }

  // ---------------------------------------------------------------- users

  async users(q: SearchQuery) {
    const search = q.search?.trim();
    const where: Prisma.UserWhereInput = search
      ? { OR: [{ phone: { contains: normalizeIranMobile(search) ?? search } }, { name: { contains: search, mode: 'insensitive' } }] }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: q.skip,
        take: q.limit,
        select: { id: true, phone: true, name: true, role: true, isActive: true, createdAt: true, _count: { select: { orders: true } } },
      }),
      this.prisma.user.count({ where }),
    ]);
    return paginated(items, total, q);
  }

  updateUser(id: number, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: { id: true, phone: true, name: true, role: true, isActive: true },
    });
  }

  // -------------------------------------------------------------- helpers

  private checkDeliveryTime(min: number, max: number) {
    if (min > max) throw new BadRequestException('حداقل زمان ارسال نباید از حداکثر بیشتر باشد.');
  }

  private checkDiscount(type: string, value: number) {
    if (type === 'PERCENT' && value > 100) throw new BadRequestException('درصد تخفیف نمی‌تواند بیش از ۱۰۰ باشد.');
  }
}
