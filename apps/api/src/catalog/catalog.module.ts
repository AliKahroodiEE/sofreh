import { Controller, Get, Injectable, Module, NotFoundException, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import type { Prisma } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { Public } from '../common/auth.js';
import { PaginationQuery, paginated } from '../common/pagination.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';

/** Every catalog cache key starts with this prefix; admin edits clear them all. */
export const CATALOG_CACHE = 'catalog:';

export class RestaurantQuery extends PaginationQuery {
  @ApiPropertyOptional({ description: 'Search restaurant and dish names' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  search?: string;

  @ApiPropertyOptional({ description: 'Cuisine slug, e.g. pizza' })
  @IsOptional()
  @IsString()
  cuisine?: string;

  @ApiPropertyOptional({ enum: ['recommended', 'rating', 'delivery_time', 'delivery_fee'] })
  @IsOptional()
  @IsIn(['recommended', 'rating', 'delivery_time', 'delivery_fee'])
  sort: 'recommended' | 'rating' | 'delivery_time' | 'delivery_fee' = 'recommended';

  @ApiPropertyOptional({ description: 'Only restaurants that are open now' })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  openNow?: boolean;

  @ApiPropertyOptional({ description: 'Only restaurants with discounted dishes' })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  hasDiscount?: boolean;
}

const listSelect = {
  id: true,
  name: true,
  slug: true,
  logo: true,
  cover: true,
  rating: true,
  ratingCount: true,
  deliveryFee: true,
  minOrder: true,
  deliveryTimeMin: true,
  deliveryTimeMax: true,
  isOpen: true,
  cuisines: { select: { id: true, name: true, slug: true } },
  items: { where: { discountPercent: { gt: 0 }, isAvailable: true }, select: { discountPercent: true } },
} satisfies Prisma.RestaurantSelect;

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  cuisines() {
    return this.redis.remember(`${CATALOG_CACHE}cuisines`, 300, () =>
      this.prisma.cuisine.findMany({ orderBy: { sortOrder: 'asc' } }),
    );
  }

  restaurants(q: RestaurantQuery) {
    const key = `${CATALOG_CACHE}restaurants:${JSON.stringify(q)}`;
    return this.redis.remember(key, 60, async () => {
      const search = q.search?.trim();
      const where: Prisma.RestaurantWhereInput = {
        isActive: true,
        ...(q.openNow ? { isOpen: true } : {}),
        ...(q.cuisine ? { cuisines: { some: { slug: q.cuisine } } } : {}),
        ...(q.hasDiscount ? { items: { some: { discountPercent: { gt: 0 }, isAvailable: true } } } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { items: { some: { name: { contains: search, mode: 'insensitive' } } } },
              ],
            }
          : {}),
      };
      const orderBy: Prisma.RestaurantOrderByWithRelationInput[] = {
        recommended: [{ isOpen: 'desc' as const }, { rating: 'desc' as const }],
        rating: [{ rating: 'desc' as const }],
        delivery_time: [{ deliveryTimeMin: 'asc' as const }],
        delivery_fee: [{ deliveryFee: 'asc' as const }],
      }[q.sort];

      const [rows, total] = await Promise.all([
        this.prisma.restaurant.findMany({ where, orderBy, skip: q.skip, take: q.limit, select: listSelect }),
        this.prisma.restaurant.count({ where }),
      ]);
      const items = rows.map(({ items, ...r }) => ({
        ...r,
        maxDiscountPercent: items.reduce((max, i) => Math.max(max, i.discountPercent), 0),
      }));
      return paginated(items, total, q);
    });
  }

  async restaurant(slug: string) {
    const restaurant = await this.redis.remember(`${CATALOG_CACHE}restaurant:${slug}`, 60, () =>
      this.prisma.restaurant.findFirst({
        where: { slug, isActive: true },
        include: {
          cuisines: { select: { id: true, name: true, slug: true } },
          sections: {
            orderBy: { sortOrder: 'asc' },
            include: { items: { orderBy: { sortOrder: 'asc' } } },
          },
        },
      }),
    );
    if (!restaurant) throw new NotFoundException('رستوران پیدا نشد.');
    return restaurant;
  }

  async reviews(restaurantId: number, q: PaginationQuery) {
    const where = { restaurantId };
    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: q.skip,
        take: q.limit,
        select: { id: true, rating: true, comment: true, createdAt: true, user: { select: { name: true } } },
      }),
      this.prisma.review.count({ where }),
    ]);
    return paginated(items, total, q);
  }
}

@ApiTags('catalog')
@Public()
@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('cuisines')
  cuisines() {
    return this.catalog.cuisines();
  }

  @Get('restaurants')
  @ApiOperation({ summary: 'Search and filter restaurants (paginated, cached 60s)' })
  restaurants(@Query() q: RestaurantQuery) {
    return this.catalog.restaurants(q);
  }

  @Get('restaurants/:slug')
  @ApiOperation({ summary: 'Restaurant details with its full menu' })
  restaurant(@Param('slug') slug: string) {
    return this.catalog.restaurant(slug);
  }

  @Get('restaurants/:id/reviews')
  reviews(@Param('id', ParseIntPipe) id: number, @Query() q: PaginationQuery) {
    return this.catalog.reviews(id, q);
  }
}

@Module({
  controllers: [CatalogController],
  providers: [CatalogService],
})
export class CatalogModule {}
