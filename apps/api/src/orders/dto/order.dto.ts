import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class OrderLineDto {
  @ApiProperty({ example: 12 })
  @IsInt()
  menuItemId: number;

  @ApiProperty({ example: 2, minimum: 1, maximum: 20 })
  @IsInt()
  @Min(1)
  @Max(20, { message: 'حداکثر ۲۰ عدد از هر غذا قابل سفارش است.' })
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  restaurantId: number;

  @ApiProperty({ type: [OrderLineDto] })
  @ValidateNested({ each: true })
  @Type(() => OrderLineDto)
  @ArrayMinSize(1, { message: 'سبد خرید خالی است.' })
  @ArrayMaxSize(30)
  items: OrderLineDto[];

  @ApiPropertyOptional({ description: 'One of the user\'s saved addresses (or send addressText)' })
  @IsOptional()
  @IsInt()
  addressId?: number;

  @ApiPropertyOptional({ example: 'تهران، ونک، خیابان ملاصدرا، پلاک ۸' })
  @IsOptional()
  @IsString()
  @Length(5, 250)
  addressText?: string;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ example: 'WELCOME' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  discountCode?: string;

  @ApiPropertyOptional({ example: 'زنگ واحد ۴ خراب است' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}

export class ReviewDto {
  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}

export class ValidateDiscountDto {
  @ApiProperty({ example: 'WELCOME' })
  @IsString()
  @MaxLength(30)
  code: string;

  @ApiProperty({ description: 'Food total after item discounts, before delivery', example: 450000 })
  @IsInt()
  @Min(0)
  amount: number;
}
