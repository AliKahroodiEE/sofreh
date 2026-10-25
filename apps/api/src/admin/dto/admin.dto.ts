import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { DiscountType, OrderStatus, Role } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQuery } from '../../common/pagination.js';

const UPLOAD_PATH = /^\/uploads\/[\w.-]+$/;

export class AdminOrdersQuery extends PaginationQuery {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ description: 'Order code or customer phone' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  search?: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}

export class SearchQuery extends PaginationQuery {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  search?: string;
}

export class RestaurantDto {
  @ApiProperty({ example: 'پیتزا پارسی' })
  @IsString()
  @Length(2, 60)
  name: string;

  @ApiProperty({ example: 'pizza-parsi', description: 'URL name: lowercase letters, digits and dashes' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'نامک فقط می‌تواند حروف کوچک انگلیسی، عدد و خط تیره باشد.' })
  @MaxLength(60)
  slug: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(400)
  description?: string;

  @ApiPropertyOptional({ example: '/uploads/logo.webp' })
  @IsOptional()
  @Matches(UPLOAD_PATH)
  logo?: string | null;

  @ApiPropertyOptional({ example: '/uploads/cover.webp' })
  @IsOptional()
  @Matches(UPLOAD_PATH)
  cover?: string | null;

  @ApiProperty()
  @IsString()
  @Length(5, 200)
  address: string;

  @ApiProperty({ example: 25000 })
  @IsInt()
  @Min(0)
  deliveryFee: number;

  @ApiProperty({ example: 150000 })
  @IsInt()
  @Min(0)
  minOrder: number;

  @ApiProperty({ example: 25 })
  @IsInt()
  @Min(5)
  @Max(180)
  deliveryTimeMin: number;

  @ApiProperty({ example: 40 })
  @IsInt()
  @Min(5)
  @Max(240)
  deliveryTimeMax: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isOpen?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [Number], description: 'Cuisine IDs' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsInt({ each: true })
  cuisineIds?: number[];
}

export class UpdateRestaurantDto extends PartialType(RestaurantDto) {}

export class SectionDto {
  @ApiProperty({ example: 'پیتزاها' })
  @IsString()
  @Length(1, 40)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class MenuItemDto {
  @ApiProperty()
  @IsInt()
  sectionId: number;

  @ApiProperty({ example: 'پیتزا پپرونی' })
  @IsString()
  @Length(1, 80)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string | null;

  @ApiProperty({ example: 320000 })
  @IsInt()
  @Min(0)
  @Max(1_000_000_000)
  price: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 90 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(90)
  discountPercent?: number;

  @ApiPropertyOptional({ example: '/uploads/pizza.webp' })
  @IsOptional()
  @Matches(UPLOAD_PATH)
  image?: string | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateMenuItemDto extends PartialType(MenuItemDto) {}

export class DiscountDto {
  @ApiProperty({ example: 'WELCOME' })
  @Matches(/^[A-Za-z0-9_-]{3,30}$/, { message: 'کد تخفیف ۳ تا ۳۰ حرف انگلیسی یا عدد باشد.' })
  code: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  description?: string;

  @ApiProperty({ enum: DiscountType })
  @IsEnum(DiscountType)
  type: DiscountType;

  @ApiProperty({ example: 20 })
  @IsInt()
  @Min(1)
  value: number;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxDiscount?: number | null;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit?: number | null;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateDiscountDto extends PartialType(DiscountDto) {}

export class UpdateUserDto {
  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class StatsQuery {
  @ApiPropertyOptional({ default: 7, minimum: 1, maximum: 90 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  days = 7;
}
